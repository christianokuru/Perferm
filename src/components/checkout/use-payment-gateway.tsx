"use client";

import { useCallback, useRef, useState } from "react";

import { ShieldIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { formatNaira } from "@/lib/money";
import { payWithFlutterwave, payWithPaystack } from "@/lib/payments/inline-gateways";
import { providerInfo, type PaymentOutcome, type PaymentRequest } from "@/lib/payments/types";

/**
 * Single entry point for taking payment. Uses the real inline checkout when a
 * public key is configured, otherwise a clearly-labelled demo gateway so the
 * full flow can be exercised before keys are added.
 */
export function usePaymentGateway() {
  const [demoRequest, setDemoRequest] = useState<PaymentRequest | null>(null);
  const resolver = useRef<((outcome: PaymentOutcome) => void) | null>(null);

  const pay = useCallback(async (request: PaymentRequest): Promise<PaymentOutcome> => {
    try {
      if (request.mode === "live") {
        return request.provider === "paystack" ? await payWithPaystack(request) : await payWithFlutterwave(request);
      }
    } catch {
      return { status: "failed", message: "We couldn't reach the payment provider. Check your connection and try again." };
    }
    return new Promise<PaymentOutcome>((resolve) => {
      resolver.current = resolve;
      setDemoRequest(request);
    });
  }, []);

  const settle = (outcome: PaymentOutcome) => {
    resolver.current?.(outcome);
    resolver.current = null;
    setDemoRequest(null);
  };

  const dialog = (
    <Sheet open={Boolean(demoRequest)} onClose={() => settle({ status: "cancelled" })} title="Demo payment" side="center">
      {demoRequest ? (
        <div className="p-6">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-full bg-pearl text-ink">
              <ShieldIcon />
            </span>
            <div>
              <p className="text-body text-ink">{providerInfo[demoRequest.provider].name} · test mode</p>
              <p className="text-caption text-smoke">No real money will move</p>
            </div>
          </div>
          <dl className="mt-6 space-y-2 rounded-[var(--radius-card)] border border-mist p-4 text-body-sm">
            <div className="flex justify-between">
              <dt className="text-smoke">Reference</dt>
              <dd className="font-mono text-caption text-ink">{demoRequest.reference}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-smoke">Customer</dt>
              <dd className="truncate pl-4 text-ink">{demoRequest.email}</dd>
            </div>
            <div className="flex justify-between border-t border-mist pt-2">
              <dt className="text-ink">Amount</dt>
              <dd className="text-subheading font-light text-ink tabular-nums">{formatNaira(demoRequest.amount)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-caption text-smoke">
            This store is in test mode for {providerInfo[demoRequest.provider].name}. The order is still created and confirmed on the
            server, exactly as a real payment would be.
          </p>
          <div className="mt-6 grid gap-2">
            <Button
              variant="accent"
              size="lg"
              data-autofocus
              onClick={() => settle({ status: "success", mode: "demo", transactionId: `demo_${Date.now()}` })}
            >
              Approve payment
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => settle({ status: "failed", message: "Your bank declined the payment (demo)." })}>
                Simulate decline
              </Button>
              <Button variant="ghost" onClick={() => settle({ status: "cancelled" })}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </Sheet>
  );

  return { pay, dialog };
}
