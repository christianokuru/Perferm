"use server";

import { randomBytes } from "node:crypto";

import { headers } from "next/headers";

import { getViewer } from "@/lib/auth/session";
import { buildQuote, type Quote } from "@/lib/checkout/pricing";
import { serverEnv } from "@/lib/config/server-env";
import { getOrderWithAccessKey, hashAccessKey } from "@/lib/orders/repository";
import { confirmPayment } from "@/lib/payments/server/confirm";
import { gatewayMode, isLiveGateway, verifyWithGateway } from "@/lib/payments/server/gateways";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PaymentProvider } from "@/lib/types";
import { createReference } from "@/lib/utils";
import { validate, type FieldErrors } from "@/lib/validation/fields";
import { checkoutSchema, quoteSchema } from "@/lib/validation/schemas";
import { z } from "zod";

type Fail = { ok: false; error?: string; fieldErrors?: FieldErrors; quote?: Quote };

const toFulfilment = (f: { method: "pickup" } | { method: "delivery"; state?: string }) =>
  f.method === "pickup" ? { method: "pickup" as const } : { method: "delivery" as const, state: f.state };

/** Live re-pricing of the bag for the order summary. */
export async function quoteBag(input: unknown): Promise<{ ok: true; quote: Quote } | { ok: false; error: string }> {
  const limit = await rateLimit(clientKey(await headers(), "quote"), 120, 60_000);
  if (!limit.ok) return { ok: false, error: "You're going a little fast — please wait a moment." };
  const parsed = validate(quoteSchema, input);
  if (!parsed.ok) return { ok: false, error: "We couldn't read your bag. Please refresh and try again." };
  try {
    return { ok: true, quote: await buildQuote(parsed.data.lines, toFulfilment(parsed.data.fulfilment)) };
  } catch (error) {
    console.error("[checkout] quote failed", error);
    return { ok: false, error: "We couldn't price your bag right now. Please try again." };
  }
}

export type StartCheckoutResult =
  | {
      ok: true;
      reference: string;
      accessKey: string;
      amount: number;
      mode: "live" | "demo";
      provider: PaymentProvider;
      customer: { name: string; email: string; phone: string };
    }
  | Fail;

const DB_ERRORS: Record<string, string> = {
  price_or_stock_changed: "Prices or availability changed while you were checking out. Please review your bag.",
  zone_unavailable: "We don't deliver to this state yet.",
  pickup_unavailable: "Boutique pickup is currently unavailable.",
  totals_mismatch: "Your total changed. Please review your bag and try again.",
};

/**
 * Validates the checkout, prices it on the server and records a `pending`
 * order. Nothing is charged here — the gateway popup opens next, and the
 * order only becomes `paid` after server-side verification.
 */
export async function startCheckout(input: unknown): Promise<StartCheckoutResult> {
  const limit = await rateLimit(clientKey(await headers(), "checkout"), 20, 10 * 60_000);
  if (!limit.ok) return { ok: false, error: "Too many checkout attempts. Please wait a few minutes and try again." };

  const parsed = validate(checkoutSchema, input);
  if (!parsed.ok) return { ok: false, fieldErrors: parsed.errors };
  const { lines, fulfilment, name, email, phone, provider } = parsed.data;

  const db = createAdminClient();
  const { data: settings } = await db.from("store_settings").select("paystack_enabled, flutterwave_enabled, pickup_address, pickup_hours").eq("id", 1).single();
  const enabled = provider === "paystack" ? settings?.paystack_enabled : settings?.flutterwave_enabled;
  const mode = gatewayMode(provider);
  if (!enabled || !mode) {
    return { ok: false, fieldErrors: { provider: "This payment option is unavailable right now — please choose another." } };
  }

  const quote = await buildQuote(lines, toFulfilment(fulfilment));
  if (!quote.lines.length) return { ok: false, error: "Every item in your bag is unavailable.", quote };
  if (!quote.deliveryAvailable) {
    return fulfilment.method === "pickup"
      ? { ok: false, error: "Boutique pickup is currently unavailable — please choose delivery.", quote }
      : { ok: false, fieldErrors: { "fulfilment.state": "We don't deliver to this state yet" }, quote };
  }
  if (quote.issues.length) return { ok: false, error: quote.issues.map((i) => i.message).join(" "), quote };

  const viewer = await getViewer();
  const accessKey = randomBytes(24).toString("base64url");

  for (let attempt = 0; attempt < 3; attempt++) {
    const reference = createReference();
    const { error } = await db.rpc("create_order", {
      p_order: {
        reference,
        user_id: viewer?.id ?? "",
        email,
        customer_name: name,
        phone,
        fulfilment: fulfilment.method,
        delivery_state: fulfilment.method === "delivery" ? fulfilment.state : "",
        delivery_city: fulfilment.method === "delivery" ? fulfilment.city : "",
        delivery_address: fulfilment.method === "delivery" ? fulfilment.address : "",
        delivery_notes: fulfilment.method === "delivery" ? (fulfilment.notes ?? "") : "",
        pickup_location: fulfilment.method === "pickup" && settings ? `${settings.pickup_address} · ${settings.pickup_hours}` : "",
        subtotal_kobo: quote.totals.subtotal,
        delivery_fee_kobo: quote.totals.deliveryFee,
        payment_provider: provider,
        payment_mode: mode,
        access_key_hash: hashAccessKey(accessKey),
      },
      p_items: quote.lines.map((l) => ({ variant_id: l.variantId, unit_price_kobo: l.unitPrice, quantity: l.quantity })),
    });

    if (!error) {
      return { ok: true, reference, accessKey, amount: quote.totals.total, mode, provider, customer: { name, email, phone } };
    }
    if (error.code === "23505") continue; // reference collision — vanishingly rare, retry
    const known = DB_ERRORS[error.message];
    if (known) {
      const fresh = await buildQuote(lines, toFulfilment(fulfilment));
      return { ok: false, error: known, quote: fresh };
    }
    console.error("[checkout] create_order failed", error);
    break;
  }
  return { ok: false, error: "Something went wrong on our side. You have not been charged — please try again." };
}

const verifySchema = z.object({
  reference: z.string().regex(/^PF-[A-Z0-9]{8}$/),
  accessKey: z.string().regex(/^[A-Za-z0-9_-]{32,64}$/),
});

export type VerifyCheckoutResult =
  | { ok: true; status: "paid" | "processing" }
  | { ok: false; error: string; retry?: boolean };

/**
 * Called after the gateway popup reports success. The popup's word is never
 * trusted: we ask the gateway directly (server-to-server, secret key) and
 * check amount, currency and reference before marking the order paid.
 */
export async function verifyCheckout(input: unknown): Promise<VerifyCheckoutResult> {
  const limit = await rateLimit(clientKey(await headers(), "verify"), 30, 10 * 60_000);
  if (!limit.ok) return { ok: false, error: "Too many attempts. Please wait a moment.", retry: true };

  const parsed = verifySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "We couldn't find that checkout." };
  const order = await getOrderWithAccessKey(parsed.data.reference, parsed.data.accessKey);
  if (!order) return { ok: false, error: "We couldn't find that checkout." };
  if (order.status !== "pending" && !(order.status === "cancelled" && order.cancelReason === "expired")) {
    return order.status === "cancelled" ? { ok: false, error: "This order was cancelled." } : { ok: true, status: "paid" };
  }

  try {
    if (order.payment.mode === "demo") {
      if (!serverEnv.demoPayments || isLiveGateway(order.payment.provider)) {
        return { ok: false, error: "Test payments are disabled on this store." };
      }
      const result = await confirmPayment(order.payment.provider, "demo", order.reference, {
        status: "success",
        amountKobo: order.totals.total,
        currency: "NGN",
        transactionId: `demo_${Date.now()}`,
      });
      return result.ok ? { ok: true, status: "paid" } : { ok: false, error: "We couldn't confirm this test payment." };
    }

    const payment = await verifyWithGateway(order.payment.provider, order.reference);
    if (payment.status === "pending") return { ok: true, status: "processing" };
    if (payment.status !== "success") {
      return { ok: false, error: "The payment wasn't completed. You have not been charged — please try again." };
    }
    if (payment.reference && payment.reference !== order.reference) {
      return { ok: false, error: "We couldn't match this payment to your order. Please contact our concierge." };
    }
    const result = await confirmPayment(order.payment.provider, "live", order.reference, payment);
    if (result.ok) return { ok: true, status: "paid" };
    console.error("[checkout] confirm rejected", order.reference, result.reason);
    return { ok: false, error: "We received your payment but couldn't match the amount. Our concierge will contact you shortly." };
  } catch (error) {
    console.error("[checkout] verify failed", order.reference, error);
    // The webhook will still confirm the order if the gateway took the money.
    return { ok: true, status: "processing" };
  }
}
