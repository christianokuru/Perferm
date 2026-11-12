"use server";

import { headers } from "next/headers";

import { ORDER_SELECT, mapOrder } from "@/lib/orders/repository";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Order } from "@/lib/types";
import { validate, type FieldErrors } from "@/lib/validation/fields";
import { trackOrderSchema } from "@/lib/validation/schemas";

export type TrackResult = { ok: true; order: Order } | { ok: false; error?: string; fieldErrors?: FieldErrors };

const NOT_FOUND = "We couldn't find an order with that reference and email.";

/**
 * Guest order tracking. Requires both the reference and the email on the
 * order; tightly rate limited so references can't be brute-forced.
 */
export async function trackOrder(input: unknown): Promise<TrackResult> {
  const limit = await rateLimit(clientKey(await headers(), "track"), 10, 15 * 60_000);
  if (!limit.ok) return { ok: false, error: "Too many lookups. Please wait a few minutes and try again." };

  const parsed = validate(trackOrderSchema, input);
  if (!parsed.ok) return { ok: false, fieldErrors: parsed.errors };

  const { data } = await createAdminClient()
    .from("orders")
    .select(ORDER_SELECT)
    .eq("reference", parsed.data.reference)
    .eq("email", parsed.data.email)
    .maybeSingle();
  if (!data) return { ok: false, error: NOT_FOUND };

  const order = mapOrder(data);
  // Hide the full street address and phone from a lookup that only proves reference + email.
  const masked: Order = {
    ...order,
    userId: null,
    customer: { ...order.customer, phone: `•••• ${order.customer.phone.slice(-4)}` },
    fulfilment: order.fulfilment.method === "delivery" ? { ...order.fulfilment, address: "•••", notes: undefined } : order.fulfilment,
    payment: { provider: order.payment.provider, mode: order.payment.mode },
  };
  return { ok: true, order: masked };
}
