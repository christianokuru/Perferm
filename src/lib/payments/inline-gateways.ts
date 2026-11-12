"use client";

import { siteConfig } from "@/lib/config/site";
import { koboToNaira } from "@/lib/money";

import type { PaymentOutcome, PaymentRequest } from "./types";

/**
 * Live inline checkouts for Paystack and Flutterwave. Only PUBLIC keys are
 * used in the browser. The order must still be verified server-side (webhook
 * + verify endpoint) before it is fulfilled — the client callback alone is
 * never trusted.
 */

const SCRIPTS = {
  paystack: "https://js.paystack.co/v2/inline.js",
  flutterwave: "https://checkout.flutterwave.com/v3.js",
} as const;

export const publicKeys = {
  paystack: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "",
  flutterwave: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY ?? "",
};

export function isLive(provider: keyof typeof publicKeys): boolean {
  const key = publicKeys[provider];
  return provider === "paystack" ? /^pk_(test|live)_/.test(key) : /^FLWPUBK(_TEST)?-/.test(key);
}

const loading = new Map<string, Promise<void>>();

function loadScript(src: string): Promise<void> {
  const existing = loading.get(src);
  if (existing) return existing;
  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading.delete(src);
      reject(new Error(`Failed to load ${src}`));
    };
    document.head.appendChild(script);
  });
  loading.set(src, promise);
  return promise;
}

interface PaystackPopInstance {
  newTransaction(options: {
    key: string;
    email: string;
    amount: number;
    currency: string;
    reference: string;
    metadata?: Record<string, unknown>;
    onSuccess: (tx: { reference: string; trans?: string; transaction?: string }) => void;
    onCancel: () => void;
    onError?: (error: { message: string }) => void;
  }): void;
}

declare global {
  interface Window {
    PaystackPop?: new () => PaystackPopInstance;
    FlutterwaveCheckout?: (options: Record<string, unknown>) => { close: () => void };
  }
}

export async function payWithPaystack(request: PaymentRequest): Promise<PaymentOutcome> {
  await loadScript(SCRIPTS.paystack);
  if (!window.PaystackPop) return { status: "failed", message: "Paystack could not be loaded." };
  const Pop = window.PaystackPop;
  return new Promise((resolve) => {
    new Pop().newTransaction({
      key: publicKeys.paystack,
      email: request.email,
      amount: request.amount, // Paystack expects kobo
      currency: "NGN",
      reference: request.reference,
      metadata: { customer_name: request.name, phone: request.phone },
      onSuccess: (tx) => resolve({ status: "success", mode: "live", transactionId: tx.transaction ?? tx.trans ?? tx.reference }),
      onCancel: () => resolve({ status: "cancelled" }),
      onError: (error) => resolve({ status: "failed", message: error.message }),
    });
  });
}

export async function payWithFlutterwave(request: PaymentRequest): Promise<PaymentOutcome> {
  await loadScript(SCRIPTS.flutterwave);
  if (!window.FlutterwaveCheckout) return { status: "failed", message: "Flutterwave could not be loaded." };
  const checkout = window.FlutterwaveCheckout;
  return new Promise((resolve) => {
    let settled = false;
    const modal = checkout({
      public_key: publicKeys.flutterwave,
      tx_ref: request.reference,
      amount: koboToNaira(request.amount), // Flutterwave expects naira
      currency: "NGN",
      payment_options: "card,banktransfer,ussd",
      customer: { email: request.email, phone_number: request.phone, name: request.name },
      customizations: { title: siteConfig.name, description: `Order ${request.reference}` },
      callback: (data: { status?: string; transaction_id?: number | string }) => {
        settled = true;
        modal.close();
        resolve(
          data.status === "successful" || data.status === "completed"
            ? { status: "success", mode: "live", transactionId: String(data.transaction_id ?? request.reference) }
            : { status: "failed", message: "The payment was not completed." },
        );
      },
      onclose: () => {
        if (!settled) resolve({ status: "cancelled" });
      },
    });
  });
}
