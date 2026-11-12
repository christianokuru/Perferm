"use server";

import { headers } from "next/headers";

import { buildQuote, type Quote } from "@/lib/checkout/pricing";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";
import { validate, type FieldErrors } from "@/lib/validation/fields";
import { checkoutSchema, quoteSchema, type CheckoutInput } from "@/lib/validation/schemas";

/** Re-prices the bag against the catalogue for the live order summary. */
export async function quoteBag(input: unknown): Promise<{ ok: true; quote: Quote } | { ok: false; error: string }> {
  const parsed = validate(quoteSchema, input);
  if (!parsed.ok) return { ok: false, error: "We couldn't read your bag. Please refresh and try again." };
  const { lines, fulfilment } = parsed.data;
  return {
    ok: true,
    quote: buildQuote(lines, fulfilment.method === "pickup" ? { method: "pickup" } : { method: "delivery", state: fulfilment.state }),
  };
}

export type PrepareCheckoutResult =
  | { ok: true; quote: Quote; customer: Pick<CheckoutInput, "name" | "email" | "phone">; fulfilment: CheckoutInput["fulfilment"] }
  | { ok: false; error?: string; fieldErrors?: FieldErrors; quote?: Quote };

/**
 * Validates the full checkout payload and returns the authoritative amount to
 * charge. In production this also inserts a `pending` order row and the
 * payment is confirmed by verifying the gateway webhook server-side.
 */
export async function prepareCheckout(input: unknown): Promise<PrepareCheckoutResult> {
  const limit = rateLimit(clientKey(await headers(), "checkout"), 20, 10 * 60_000);
  if (!limit.ok) return { ok: false, error: "Too many checkout attempts. Please wait a moment and try again." };

  const parsed = validate(checkoutSchema, input);
  if (!parsed.ok) return { ok: false, fieldErrors: parsed.errors };

  const { lines, fulfilment, name, email, phone } = parsed.data;
  const quote = buildQuote(lines, fulfilment.method === "pickup" ? { method: "pickup" } : { method: "delivery", state: fulfilment.state });

  if (!quote.lines.length) return { ok: false, error: "Every item in your bag is unavailable.", quote };
  if (!quote.deliveryAvailable) return { ok: false, fieldErrors: { "fulfilment.state": "We don't deliver to this state yet" }, quote };
  if (quote.issues.length) return { ok: false, error: quote.issues.map((i) => i.message).join(" "), quote };

  return { ok: true, quote, customer: { name, email, phone }, fulfilment };
}
