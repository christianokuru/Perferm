import "server-only";

import { after } from "next/server";

import { sendOrderPaidEmails } from "@/lib/email/notifications";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PaymentProvider } from "@/lib/types";

import type { VerifiedPayment } from "./gateways";

export type ConfirmOutcome =
  | { ok: true; already: boolean; orderId: string }
  | { ok: false; reason: "not_found" | "provider_mismatch" | "amount_mismatch" | "not_successful" | "currency_mismatch" };

/**
 * Single funnel for marking an order paid — used by the checkout verify
 * action and both webhooks. The database function is idempotent and locks
 * the order row, so concurrent confirmations are safe.
 */
export async function confirmPayment(
  provider: PaymentProvider,
  mode: "live" | "demo",
  reference: string,
  payment: Pick<VerifiedPayment, "status" | "amountKobo" | "currency" | "transactionId">,
): Promise<ConfirmOutcome> {
  if (payment.status !== "success") return { ok: false, reason: "not_successful" };
  if (payment.currency !== "NGN") return { ok: false, reason: "currency_mismatch" };

  const { data, error } = await createAdminClient().rpc("confirm_order_payment", {
    p_reference: reference,
    p_provider: provider,
    p_mode: mode,
    p_amount_kobo: payment.amountKobo,
    p_transaction_id: payment.transactionId,
  });
  if (error) throw new Error(`confirm_order_payment failed: ${error.message}`);

  const result = data as { ok: boolean; already?: boolean; order_id?: string; reason?: string };
  if (!result.ok) return { ok: false, reason: (result.reason as "not_found") ?? "not_found" };

  if (!result.already && result.order_id) {
    const orderId = result.order_id;
    // Emails never block (or fail) the payment confirmation.
    after(() => sendOrderPaidEmails(orderId));
  }
  return { ok: true, already: Boolean(result.already), orderId: result.order_id ?? "" };
}
