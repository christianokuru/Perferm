import { createHmac, timingSafeEqual } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { serverEnv } from "@/lib/config/server-env";
import { confirmPayment } from "@/lib/payments/server/confirm";
import { verifyPaystack } from "@/lib/payments/server/gateways";
import { forgetPaymentEvent, recordPaymentEvent, redactPayload, setPaymentEventOutcome } from "@/lib/payments/server/webhook-log";

const MAX_BODY = 64 * 1024;

/**
 * Paystack webhook. Authenticated by the HMAC-SHA512 signature of the raw
 * body (keyed with our secret key). The transaction is then re-verified via the
 * API before the order is marked paid. Always answers fast with 200 once the
 * signature is valid so Paystack doesn't retry forever.
 */
export async function POST(request: NextRequest) {
  if (!serverEnv.paystackSecretKey) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const raw = await request.text();
  if (raw.length > MAX_BODY) return NextResponse.json({ error: "Payload too large" }, { status: 413 });

  const signature = request.headers.get("x-paystack-signature") ?? "";
  const expected = createHmac("sha512", serverEnv.paystackSecretKey).update(raw).digest("hex");
  const valid = signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  let event: { event?: string; data?: Record<string, unknown> };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data = event.data ?? {};
  const reference = typeof data.reference === "string" ? data.reference : null;
  const key = `${event.event ?? "unknown"}:${String(data.id ?? reference ?? "")}`;
  const fresh = await recordPaymentEvent({ provider: "paystack", key, type: event.event ?? "unknown", reference, payload: redactPayload(data) });
  if (!fresh) return NextResponse.json({ received: true, duplicate: true });

  if (event.event !== "charge.success" || !reference || !/^PF-[A-Z0-9]{8}$/.test(reference)) {
    await setPaymentEventOutcome("paystack", key, "ignored");
    return NextResponse.json({ received: true });
  }

  try {
    const payment = await verifyPaystack(reference);
    const result = await confirmPayment("paystack", "live", reference, payment);
    await setPaymentEventOutcome("paystack", key, result.ok ? (result.already ? "already_paid" : "confirmed") : `rejected:${result.reason}`);
  } catch (error) {
    console.error("[webhook:paystack] processing failed", reference, error);
    await forgetPaymentEvent("paystack", key);
    // 500 → the gateway retries later; the event row was removed so the retry is processed.
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
