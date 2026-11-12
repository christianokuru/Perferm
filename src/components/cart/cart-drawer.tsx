"use client";

import { BagIcon, GiftIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { Sheet } from "@/components/ui/sheet";
import { formatNaira } from "@/lib/money";
import { pluralize } from "@/lib/utils";
import { selectItemCount, selectSubtotal, useCartStore } from "@/stores/cart-store";
import { useUiStore } from "@/stores/ui-store";

import { CartLineItem } from "./cart-line-item";

export function CartDrawer() {
  const isOpen = useUiStore((s) => s.panel === "cart");
  const close = useUiStore((s) => s.close);
  const lines = useCartStore((s) => s.lines);
  const count = useCartStore(selectItemCount);
  const subtotal = useCartStore(selectSubtotal);

  const footer = lines.length ? (
    <div className="space-y-4 pb-1">
      <div className="flex items-baseline justify-between">
        <span className="text-body-sm text-graphite">Subtotal</span>
        <span className="text-subheading font-light text-ink tabular-nums">{formatNaira(subtotal)}</span>
      </div>
      <p className="text-caption text-smoke">Delivery is calculated by state at checkout. Boutique pickup is free.</p>
      <div className="grid gap-2">
        <ButtonLink href="/checkout" onClick={close} variant="accent" size="lg" block>
          Checkout
        </ButtonLink>
        <ButtonLink href="/cart" onClick={close} variant="ghost" block>
          View bag
        </ButtonLink>
      </div>
    </div>
  ) : null;

  return (
    <Sheet open={isOpen} onClose={close} title={`Your bag${count ? ` · ${pluralize(count, "item")}` : ""}`} footer={footer}>
      {lines.length ? (
        <div className="px-5 md:px-6">
          <div className="mt-4 flex items-center gap-3 rounded-[var(--radius-card)] bg-pearl px-4 py-3 text-caption text-graphite">
            <GiftIcon size={18} className="shrink-0 text-saffron" />
            Every order is hand-wrapped in our signature box — complimentary.
          </div>
          <ul className="divide-y divide-mist">
            {lines.map((line) => (
              <CartLineItem key={line.variantId} line={line} onNavigate={close} />
            ))}
          </ul>
        </div>
      ) : (
        <EmptyState
          icon={<BagIcon size={26} />}
          title="Your bag is empty"
          description="Discover ouds, attars and niche signatures chosen for the Lagos climate."
          action={
            <ButtonLink href="/shop" onClick={close}>
              Explore the house
            </ButtonLink>
          }
        />
      )}
    </Sheet>
  );
}
