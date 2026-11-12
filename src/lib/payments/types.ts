import type { Kobo, PaymentProvider } from "@/lib/types";

export interface PaymentRequest {
  provider: PaymentProvider;
  reference: string;
  amount: Kobo;
  email: string;
  name: string;
  phone: string;
}

export type PaymentOutcome =
  | { status: "success"; mode: "live" | "demo"; transactionId: string }
  | { status: "cancelled" }
  | { status: "failed"; message: string };

export const providerInfo: Record<PaymentProvider, { name: string; methods: string }> = {
  paystack: { name: "Paystack", methods: "Card, bank transfer, USSD & Apple Pay" },
  flutterwave: { name: "Flutterwave", methods: "Card, bank transfer, USSD & mobile money" },
};
