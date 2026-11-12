import { timingSafeEqual } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { serverEnv } from "@/lib/config/server-env";
import { confirmPayment } from "@/lib/payments/server/confirm";
import { verifyFlutterwaveById } from "@/lib/payments/server/gateways";
import { forgetPaymentEvent, recordPaymentEvent, redactPayload, setPaymentEventOutcome } from "@/lib/payments/server/webhook-log";

const MAX_BODY = 64 * 1024;

/**
 * Flutterwave webhook. Authenticated by the `verif-hash` header (the secret
 * hash set in the Flutterwave dashboard). The transaction is re-verified by id
 * via the API — the payload's own status/amount are never trusted.
 */
export async function POST(request: NextRequest) {
  if (!serverEnv.flutterwaveWebhookHash || !serverEnv.flutterwaveSecretKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const hash = request.headers.get("verif-hash") ?? "";
  const expected = serverEnv.flutterwaveWebhookHash;
  const valid = hash.length === expected.length && timingSafeEqual(Buffer.from(hash), Buffer.from(expected));
  if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  const raw = await request.text();
  if (raw.length > MAX_BODY) return NextResponse.json({ error: "Payload too large" }, { status: 413 });

  let event: { event?: string; type?: string; data?: Record<string, unknown> };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data = event.data ?? {};
  const type = event.event ?? event.type ?? "unknown";
  const transactionId = String(data.id ?? "");
  const reference = typeof data.tx_ref === "string" ? data.tx_ref : null;
  const key = `${type}:${transactionId || reference || ""}`;
  const fresh = await recordPaymentEvent({ provider: "flutterwave", key, type, reference, payload: redactPayload(data) });
  if (!fresh) return NextResponse.json({ received: true, duplicate: true });

  if (type !== "charge.completed" || !reference || !/^PF-[A-Z0-9]{8}$/.test(reference) || !/^\d+$/.test(transactionId)) {
    await setPaymentEventOutcome("flutterwave", key, "ignored");
    return NextResponse.json({ received: true });
  }

  try {
    const payment = await verifyFlutterwaveById(transactionId);
    if (payment.status === "not_found") {
      await setPaymentEventOutcome("flutterwave", key, "rejected:unknown_transaction");
      return NextResponse.json({ received: true });
    }
    if (payment.reference !== reference) {
      await setPaymentEventOutcome("flutterwave", key, "rejected:reference_mismatch");
      return NextResponse.json({ received: true });
    }
    const result = await confirmPayment("flutterwave", "live", reference, payment);
    await setPaymentEventOutcome("flutterwave", key, result.ok ? (result.already ? "already_paid" : "confirmed") : `rejected:${result.reason}`);
  } catch (error) {
    console.error("[webhook:flutterwave] processing failed", reference, error);
    await forgetPaymentEvent("flutterwave", key);
    // 500 → the gateway retries later; the event row was removed so the retry is processed.
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
