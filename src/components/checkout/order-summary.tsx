"use client";

import { ProductImage } from "@/components/product/product-image";
import { Skeleton } from "@/components/ui/misc";
import type { Quote } from "@/lib/checkout/pricing";
import { formatNaira } from "@/lib/money";
import type { FulfilmentMethod } from "@/lib/types";
import { cn, pluralize } from "@/lib/utils";

/**
 * Renders the server's authoritative quote — the figures here are exactly
 * what the customer will be charged.
 */
export function OrderSummary({
  quote,
  loading,
  method,
  stateChosen,
  className,
}: {
  quote: Quote | null;
  loading: boolean;
  method: FulfilmentMethod;
  stateChosen: boolean;
  className?: string;
}) {
  const count = quote?.lines.reduce((n, l) => n + l.quantity, 0) ?? 0;

  return (
    <section aria-labelledby="summary-title" className={cn("rounded-[var(--radius-card)] bg-pearl p-5 md:p-6", className)}>
      <div className="flex items-baseline justify-between">
        <h2 id="summary-title" className="text-subheading font-light text-ink">
          Order summary
        </h2>
        {quote ? <span className="text-caption text-smoke">{pluralize(count, "item")}</span> : null}
      </div>

      {!quote ? (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-16 bg-mist" />
          <Skeleton className="h-16 bg-mist" />
        </div>
      ) : (
        <>
          <ul className="mt-5 divide-y divide-mist">
            {quote.lines.map((line) => (
              <li key={line.variantId} className="flex items-center gap-3 py-3">
                <div className="relative shrink-0">
                  <ProductImage src={line.image} alt="" sizes="56px" className="aspect-[4/5] w-14 rounded-[10px] bg-white" />
                  <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-ink text-[10px] text-white tabular-nums">
                    {line.quantity}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-sm text-ink">{line.name}</p>
                  <p className="text-caption text-smoke">{line.variantLabel}</p>
                </div>
                <p className="text-body-sm text-ink tabular-nums">{formatNaira(line.unitPrice * line.quantity)}</p>
              </li>
            ))}
          </ul>

          <dl className={cn("mt-4 space-y-2 border-t border-mist pt-4 text-body-sm transition-opacity", loading && "opacity-50")}>
            <div className="flex justify-between">
              <dt className="text-graphite">Subtotal</dt>
              <dd className="text-ink tabular-nums">{formatNaira(quote.totals.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-graphite">{method === "pickup" ? "Boutique pickup" : "Delivery"}</dt>
              <dd className="text-ink tabular-nums">
                {method === "pickup" ? "Free" : stateChosen ? formatNaira(quote.totals.deliveryFee) : "Select a state"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-graphite">Gift wrapping</dt>
              <dd className="text-ink">Complimentary</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-mist pt-3">
              <dt className="text-body text-ink">Total</dt>
              <dd className="text-heading-sm font-light text-ink tabular-nums" aria-live="polite">
                {formatNaira(quote.totals.total)}
              </dd>
            </div>
          </dl>
        </>
      )}
    </section>
  );
}
