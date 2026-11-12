"use client";

import { BagIcon, GiftIcon, LockIcon, TruckIcon } from "@/components/icons";
import { HydrationGate } from "@/components/providers/hydration-gate";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { deliveryZones } from "@/lib/data/delivery-zones";
import { formatNaira } from "@/lib/money";
import { selectItemCount, selectSubtotal, useCartStore } from "@/stores/cart-store";

import { CartLineItem } from "./cart-line-item";

const lowestFee = Math.min(...deliveryZones.map((z) => z.fee));

function CartContent() {
  const lines = useCartStore((s) => s.lines);
  const count = useCartStore(selectItemCount);
  const subtotal = useCartStore(selectSubtotal);

  if (!lines.length) {
    return (
      <EmptyState
        icon={<BagIcon size={26} />}
        title="Your bag is empty"
        description="Discover ouds, attars and niche signatures chosen for the Lagos climate."
        action={<ButtonLink href="/shop">Explore the house</ButtonLink>}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_24rem] lg:gap-14">
      <ul className="divide-y divide-mist border-y border-mist" aria-label={`${count} items in your bag`}>
        {lines.map((line) => (
          <CartLineItem key={line.variantId} line={line} size="lg" />
        ))}
      </ul>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-[var(--radius-card)] bg-pearl p-5 md:p-6">
          <h2 className="text-subheading font-light text-ink">Summary</h2>
          <dl className="mt-5 space-y-2 text-body-sm">
            <div className="flex justify-between">
              <dt className="text-graphite">Subtotal</dt>
              <dd className="tabular-nums">{formatNaira(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-graphite">Delivery</dt>
              <dd className="text-right text-smoke">from {formatNaira(lowestFee)} · or free pickup</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-mist pt-3">
              <dt className="text-body text-ink">Estimated total</dt>
              <dd className="text-heading-sm font-light tabular-nums">{formatNaira(subtotal)}</dd>
            </div>
          </dl>
          <ButtonLink href="/checkout" variant="accent" size="lg" block className="mt-6" icon={<LockIcon size={16} />}>
            Secure checkout
          </ButtonLink>
          <ButtonLink href="/shop" variant="ghost" block className="mt-2">
            Continue shopping
          </ButtonLink>
        </div>
        <ul className="mt-6 space-y-3 px-1 text-caption text-graphite">
          <li className="flex items-center gap-3">
            <GiftIcon size={18} /> Complimentary signature gift wrapping
          </li>
          <li className="flex items-center gap-3">
            <TruckIcon size={18} /> Lagos same / next day · nationwide in 1–6 days
          </li>
          <li className="flex items-center gap-3">
            <LockIcon size={18} /> Pay securely with Paystack or Flutterwave
          </li>
        </ul>
      </aside>
    </div>
  );
}

export function CartView() {
  return (
    <HydrationGate stores={["cart"]}>
      <CartContent />
    </HydrationGate>
  );
}
