"use client";

import { useEffect, useRef, useState } from "react";

import { BagIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/misc";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { toast } from "@/components/ui/toast";
import type { ProductSummary } from "@/lib/catalog/summary";
import { formatNaira } from "@/lib/money";
import type { ProductVariant } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MAX_LINE_QUANTITY } from "@/lib/validation/schemas";
import { useCartStore } from "@/stores/cart-store";
import { useUiStore } from "@/stores/ui-store";

import { WishlistButton } from "./wishlist-button";

/**
 * Size selector, quantity and add-to-bag. A compact sticky bar takes over on
 * mobile once the main button scrolls out of view.
 */
export function ProductPurchase({ summary, variants }: { summary: ProductSummary; variants: ProductVariant[] }) {
  const firstAvailable = variants.find((v) => v.stock > 0) ?? variants[0];
  const [variantId, setVariantId] = useState(firstAvailable.id);
  const [quantity, setQuantity] = useState(1);
  const [showSticky, setShowSticky] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  const add = useCartStore((s) => s.add);
  const openPanel = useUiStore((s) => s.open);
  const variant = variants.find((v) => v.id === variantId) ?? firstAvailable;
  const soldOut = variant.stock <= 0;
  const maxQuantity = Math.max(1, Math.min(variant.stock, MAX_LINE_QUANTITY));

  useEffect(() => {
    const el = buttonRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setShowSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0), {
      threshold: 0,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const addToBag = () => {
    if (soldOut) return;
    add(
      {
        productId: summary.id,
        variantId: variant.id,
        slug: summary.slug,
        name: summary.name,
        house: summary.house,
        variantLabel: variant.label,
        image: summary.image.src,
        unitPrice: variant.price,
      },
      quantity,
    );
    openPanel("cart");
  };

  const selectVariant = (next: ProductVariant) => {
    setVariantId(next.id);
    setQuantity((q) => Math.min(q, Math.max(1, Math.min(next.stock, MAX_LINE_QUANTITY))));
  };

  return (
    <div>
      <Price amount={variant.price} compareAt={variant.compareAtPrice} className="text-subheading font-light text-ink" />
      <p className="mt-1 text-caption text-smoke">Tax included. Delivery calculated at checkout.</p>

      <fieldset className="mt-8">
        <legend className="mb-3 flex w-full justify-between text-body-sm text-ink">
          <span>Size</span>
          <span className="text-smoke">{variant.label}</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {variants.map((v) => {
            const selected = v.id === variant.id;
            const unavailable = v.stock <= 0;
            return (
              <label
                key={v.id}
                className={cn(
                  "relative flex min-w-24 cursor-pointer flex-col items-start rounded-[var(--radius-card)] border px-4 py-3 transition-colors duration-200",
                  selected ? "border-ink" : "border-mist hover:border-graphite/40",
                  unavailable && "cursor-not-allowed opacity-50",
                )}
              >
                <input
                  type="radio"
                  name="variant"
                  value={v.id}
                  checked={selected}
                  disabled={unavailable}
                  onChange={() => selectVariant(v)}
                  className="peer sr-only"
                />
                <span className="text-body text-ink">{v.label}</span>
                <span className="text-caption text-smoke tabular-nums">{unavailable ? "Sold out" : formatNaira(v.price)}</span>
                <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[var(--radius-card)] peer-focus-visible:outline peer-focus-visible:outline-[1.5px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-saffron" />
              </label>
            );
          })}
        </div>
        {!soldOut && variant.stock <= 5 ? (
          <p className="mt-3 text-caption text-saffron">Only {variant.stock} left in this size</p>
        ) : null}
      </fieldset>

      <div ref={buttonRef} className="mt-8 flex flex-wrap items-center gap-2">
        <QuantityStepper value={quantity} onChange={setQuantity} max={maxQuantity} />
        <Button variant="accent" size="lg" className="min-w-0 flex-1" onClick={addToBag} disabled={soldOut} icon={<BagIcon size={18} />}>
          {soldOut ? "Sold out" : `Add to bag · ${formatNaira(variant.price * quantity)}`}
        </Button>
        <WishlistButton product={summary} variant="outline" className="size-12 md:size-14" />
      </div>

      <button
        type="button"
        onClick={() => {
          if (typeof navigator !== "undefined" && navigator.share) {
            navigator.share({ title: summary.name, url: window.location.href }).catch(() => undefined);
          } else {
            navigator.clipboard?.writeText(window.location.href).then(() => toast.show("Link copied"));
          }
        }}
        className="mt-4 text-caption text-smoke underline underline-offset-4 hover:text-ink"
      >
        Share this fragrance
      </button>

      {/* Mobile sticky bar */}
      <div
        aria-hidden={!showSticky}
        className={cn(
          "safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-mist bg-white/95 px-4 pt-3 backdrop-blur-xl transition-transform duration-500 ease-[var(--ease-silk)] md:hidden",
          showSticky ? "translate-y-0" : "pointer-events-none translate-y-full",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-body-sm text-ink">{summary.name}</p>
            <p className="text-caption text-smoke">
              {variant.label} · {formatNaira(variant.price)}
            </p>
          </div>
          <Button variant="accent" onClick={addToBag} disabled={soldOut} tabIndex={showSticky ? 0 : -1}>
            {soldOut ? "Sold out" : "Add to bag"}
          </Button>
        </div>
      </div>
    </div>
  );
}
