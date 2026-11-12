"use client";

import { useSearchParams } from "next/navigation";

import { CheckIcon } from "@/components/icons";
import { OrderDetails, OrderTimeline } from "@/components/orders/order-details";
import { HydrationGate } from "@/components/providers/hydration-gate";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { Accent } from "@/components/ui/typography";
import { useCurrentUser } from "@/stores/auth-store";
import { useOrderStore } from "@/stores/order-store";

function Confirmation() {
  const reference = useSearchParams().get("ref") ?? "";
  const order = useOrderStore((s) => s.orders.find((o) => o.reference === reference));
  const user = useCurrentUser();

  if (!order) {
    return (
      <EmptyState
        title="We couldn't find that order"
        description="If you've just paid, check your email for the confirmation — or contact our concierge with your payment reference."
        action={<ButtonLink href="/contact">Contact the concierge</ButtonLink>}
      />
    );
  }

  const firstName = order.customer.name.split(" ")[0];

  return (
    <div className="animate-fade-up">
      <span className="flex size-14 items-center justify-center rounded-full bg-saffron text-ink">
        <CheckIcon size={26} />
      </span>
      <h1 className="mt-8 text-[3rem] leading-[0.92] font-extralight tracking-[-0.075em] text-ink md:text-[5rem]">
        thank you, <Accent>{firstName}</Accent>
      </h1>
      <p className="mt-5 max-w-lg text-body text-graphite/80">
        Your order <span className="font-mono text-body-sm text-ink">{order.reference}</span> is confirmed. A receipt is on its way to{" "}
        <span className="text-ink">{order.customer.email}</span>, and we&apos;ll message you on {order.customer.phone} as it&apos;s
        wrapped and dispatched.
      </p>

      <div className="mt-10 rounded-[var(--radius-card)] border border-mist p-5 md:p-8">
        <OrderTimeline order={order} />
        <div className="mt-8">
          <OrderDetails order={order} />
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-2">
        <ButtonLink href="/shop" variant="primary">
          Continue shopping
        </ButtonLink>
        {user ? (
          <ButtonLink href={`/account/orders/${order.reference}`} variant="outline">
            View in my account
          </ButtonLink>
        ) : (
          <ButtonLink href="/register" variant="outline">
            Create an account to track orders
          </ButtonLink>
        )}
      </div>
    </div>
  );
}

export function OrderConfirmation() {
  return (
    <HydrationGate stores={["orders", "auth"]}>
      <Confirmation />
    </HydrationGate>
  );
}
