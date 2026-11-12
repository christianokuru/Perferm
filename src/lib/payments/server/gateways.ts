import "server-only";

import { publicEnv } from "@/lib/config/public-env";
import { serverEnv } from "@/lib/config/server-env";
import type { PaymentProvider } from "@/lib/types";

/** Result of asking a gateway, server-to-server, what really happened to a payment. */
export interface VerifiedPayment {
  status: "success" | "failed" | "pending" | "not_found";
  reference: string;
  amountKobo: number;
  currency: string;
  transactionId: string;
}

const TIMEOUT_MS = 10_000;

async function getJson(url: string, secret: string): Promise<{ ok: boolean; status: number; body: unknown }> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${secret}`, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* non-JSON error page */
  }
  return { ok: res.ok, status: res.status, body };
}

/** Live mode needs BOTH keys: the public key opens the popup, the secret key verifies. */
export function isLiveGateway(provider: PaymentProvider): boolean {
  if (provider === "paystack") {
    return /^pk_(test|live)_/.test(publicEnv.paystackPublicKey) && /^sk_(test|live)_/.test(serverEnv.paystackSecretKey);
  }
  return /^FLWPUBK(_TEST)?-/.test(publicEnv.flutterwavePublicKey) && /^FLWSECK(_TEST)?-/.test(serverEnv.flutterwaveSecretKey);
}

/** Which mode a new order for this gateway would use, or null if it can't take payments here. */
export function gatewayMode(provider: PaymentProvider): "live" | "demo" | null {
  if (isLiveGateway(provider)) return "live";
  return serverEnv.demoPayments ? "demo" : null;
}

export async function verifyPaystack(reference: string): Promise<VerifiedPayment> {
  const { ok, status, body } = await getJson(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    serverEnv.paystackSecretKey,
  );
  if (status === 404 || (body as { status?: boolean })?.status === false) {
    return { status: "not_found", reference, amountKobo: 0, currency: "", transactionId: "" };
  }
  if (!ok) throw new Error(`Paystack verify failed (${status})`);
  const data = (body as { data?: Record<string, unknown> }).data ?? {};
  const state = String(data.status ?? "");
  return {
    status: state === "success" ? "success" : ["failed", "abandoned", "reversed"].includes(state) ? "failed" : "pending",
    reference: String(data.reference ?? ""),
    amountKobo: Number(data.amount ?? 0),
    currency: String(data.currency ?? ""),
    transactionId: String(data.id ?? ""),
  };
}

function mapFlutterwave(data: Record<string, unknown>, fallbackRef: string): VerifiedPayment {
  const state = String(data.status ?? "");
  return {
    status: state === "successful" ? "success" : state === "failed" ? "failed" : "pending",
    reference: String(data.tx_ref ?? fallbackRef),
    // Flutterwave reports naira; convert exactly to kobo.
    amountKobo: Math.round(Number(data.amount ?? 0) * 100),
    currency: String(data.currency ?? ""),
    transactionId: String(data.id ?? ""),
  };
}

export async function verifyFlutterwaveByReference(reference: string): Promise<VerifiedPayment> {
  const { ok, status, body } = await getJson(
    `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
    serverEnv.flutterwaveSecretKey,
  );
  if (status === 404 || (body as { status?: string })?.status === "error") {
    return { status: "not_found", reference, amountKobo: 0, currency: "", transactionId: "" };
  }
  if (!ok) throw new Error(`Flutterwave verify failed (${status})`);
  return mapFlutterwave((body as { data?: Record<string, unknown> }).data ?? {}, reference);
}

export async function verifyFlutterwaveById(transactionId: string): Promise<VerifiedPayment> {
  if (!/^\d{1,20}$/.test(transactionId)) throw new Error("Invalid Flutterwave transaction id");
  const { ok, status, body } = await getJson(
    `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
    serverEnv.flutterwaveSecretKey,
  );
  // 4xx: the transaction doesn't exist for our account (e.g. a forged webhook) — final, don't retry.
  if (status >= 400 && status < 500) return { status: "not_found", reference: "", amountKobo: 0, currency: "", transactionId };
  if (!ok) throw new Error(`Flutterwave verify failed (${status})`);
  return mapFlutterwave((body as { data?: Record<string, unknown> }).data ?? {}, "");
}

export function verifyWithGateway(provider: PaymentProvider, reference: string): Promise<VerifiedPayment> {
  return provider === "paystack" ? verifyPaystack(reference) : verifyFlutterwaveByReference(reference);
}
