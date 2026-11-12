import { CheckIcon } from "@/components/icons";
import { OrderDetails, OrderTimeline } from "@/components/orders/order-details";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { Accent } from "@/components/ui/typography";
import type { Order } from "@/lib/types";
import { formatPhone } from "@/lib/validation/fields";

import { ClearBagOnMount } from "./clear-bag";

export function OrderConfirmation({ order, signedIn }: { order: Order | null; signedIn: boolean }) {
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
  const paid = order.status !== "pending" && order.status !== "cancelled";

  return (
    <div className="animate-fade-up">
      {paid ? <ClearBagOnMount /> : null}
      <span className="flex size-14 items-center justify-center rounded-full bg-saffron text-ink">
        <CheckIcon size={26} />
      </span>
      <h1 className="mt-8 text-[3rem] leading-[0.92] font-extralight tracking-[-0.075em] text-ink md:text-[5rem]">
        thank you, <Accent>{firstName}</Accent>
      </h1>
      {paid ? (
        <p className="mt-5 max-w-lg text-body text-graphite/80">
          Your order <span className="font-mono text-body-sm text-ink">{order.reference}</span> is confirmed. A receipt is on its way to{" "}
          <span className="text-ink">{order.customer.email}</span>, and we&apos;ll message you on {formatPhone(order.customer.phone)} as
          it&apos;s wrapped and dispatched.
        </p>
      ) : (
        <p className="mt-5 max-w-lg text-body text-graphite/80">
          We&apos;re waiting for {order.payment.provider === "paystack" ? "Paystack" : "Flutterwave"} to confirm your payment for{" "}
          <span className="font-mono text-body-sm text-ink">{order.reference}</span>. This usually takes a minute — you&apos;ll get an
          email at <span className="text-ink">{order.customer.email}</span> as soon as it&apos;s confirmed.
        </p>
      )}

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
        {signedIn && order.userId ? (
          <ButtonLink href={`/account/orders/${order.reference}`} variant="outline">
            View in my account
          </ButtonLink>
        ) : (
          <ButtonLink href={`/track?ref=${order.reference}`} variant="outline">
            Track this order
          </ButtonLink>
        )}
      </div>
    </div>
  );
}
