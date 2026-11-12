import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import type { PaymentProvider } from "@/lib/types";

/**
 * Records an inbound gateway event. Returns false when the same event was
 * already processed (gateways retry deliveries), so handlers stay idempotent.
 */
export async function recordPaymentEvent(event: {
  provider: PaymentProvider;
  key: string;
  type: string;
  reference: string | null;
  payload: Json;
}): Promise<boolean> {
  const { error } = await createAdminClient().from("payment_events").insert({
    provider: event.provider,
    event_key: event.key.slice(0, 200),
    event_type: event.type.slice(0, 80),
    reference: event.reference?.slice(0, 120) ?? null,
    payload: event.payload,
  });
  if (error?.code === "23505") return false;
  if (error) throw new Error(`Failed to record payment event: ${error.message}`);
  return true;
}

export async function setPaymentEventOutcome(provider: PaymentProvider, key: string, outcome: string) {
  await createAdminClient().from("payment_events").update({ outcome: outcome.slice(0, 200) }).eq("provider", provider).eq("event_key", key.slice(0, 200));
}

/** Forgets a failed event so the gateway's retry is processed instead of skipped as a duplicate. */
export async function forgetPaymentEvent(provider: PaymentProvider, key: string) {
  await createAdminClient().from("payment_events").delete().eq("provider", provider).eq("event_key", key.slice(0, 200));
}

/** Keeps only non-sensitive fields of a gateway payload for the audit trail. */
export function redactPayload(data: Record<string, unknown>): Json {
  const keep = ["id", "reference", "tx_ref", "flw_ref", "status", "amount", "currency", "channel", "paid_at", "created_at", "gateway_response"];
  return Object.fromEntries(Object.entries(data).filter(([k]) => keep.includes(k)).map(([k, v]) => [k, typeof v === "object" ? null : (v as Json)]));
}
