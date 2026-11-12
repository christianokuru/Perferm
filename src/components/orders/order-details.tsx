import { ProductImage } from "@/components/product/product-image";
import { orderStatusLabels } from "@/lib/catalog/labels";
import { siteConfig } from "@/lib/config/site";
import { formatNaira } from "@/lib/money";
import { providerInfo } from "@/lib/payments/types";
import type { Order, OrderStatus } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

const deliverySteps: OrderStatus[] = ["paid", "processing", "shipped", "delivered"];
const pickupSteps: OrderStatus[] = ["paid", "processing", "ready_for_pickup", "delivered"];

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-[30px] px-2.5 text-[11px] font-medium",
        status === "cancelled" ? "bg-danger/10 text-danger" : status === "delivered" ? "bg-success/10 text-success" : "bg-saffron/15 text-ink",
      )}
    >
      {orderStatusLabels[status]}
    </span>
  );
}

export function OrderTimeline({ order }: { order: Order }) {
  if (order.status === "cancelled") return null;
  const steps = order.fulfilment.method === "pickup" ? pickupSteps : deliverySteps;
  const current = steps.indexOf(order.status);
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Order progress">
      {steps.map((step, i) => (
        <li key={step} className="space-y-2">
          <span className={cn("block h-1 rounded-full", i <= current ? "bg-saffron" : "bg-mist")} />
          <span className={cn("block text-caption", i <= current ? "text-ink" : "text-smoke")}>
            {step === "delivered" && order.fulfilment.method === "pickup" ? "Collected" : orderStatusLabels[step]}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Shared order breakdown for the confirmation page, account and admin. */
export function OrderDetails({ order }: { order: Order }) {
  const f = order.fulfilment;
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.4fr_1fr]">
      <div>
        <ul className="divide-y divide-mist border-y border-mist">
          {order.lines.map((line) => (
            <li key={line.variantId} className="flex items-center gap-4 py-4">
              <ProductImage src={line.image} alt="" sizes="64px" className="aspect-[4/5] w-16 shrink-0 rounded-[10px]" />
              <div className="min-w-0 flex-1">
                <p className="text-caption text-smoke">{line.house}</p>
                <p className="truncate text-body text-ink">{line.name}</p>
                <p className="text-caption text-smoke">
                  {line.variantLabel} · Qty {line.quantity}
                </p>
              </div>
              <p className="text-body-sm text-ink tabular-nums">{formatNaira(line.unitPrice * line.quantity)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 text-body-sm">
          <div className="flex justify-between">
            <dt className="text-graphite">Subtotal</dt>
            <dd className="tabular-nums">{formatNaira(order.totals.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-graphite">{f.method === "pickup" ? "Boutique pickup" : `Delivery · ${f.state}`}</dt>
            <dd className="tabular-nums">{order.totals.deliveryFee ? formatNaira(order.totals.deliveryFee) : "Free"}</dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-mist pt-3">
            <dt className="text-body text-ink">Total paid</dt>
            <dd className="text-subheading font-light tabular-nums">{formatNaira(order.totals.total)}</dd>
          </div>
        </dl>
      </div>

      <dl className="space-y-6 text-body-sm">
        <div>
          <dt className="text-caption tracking-[0.14em] text-smoke uppercase">Placed</dt>
          <dd className="mt-1 text-ink">{formatDate(order.createdAt, { dateStyle: "long", timeStyle: "short" })}</dd>
        </div>
        <div>
          <dt className="text-caption tracking-[0.14em] text-smoke uppercase">{f.method === "pickup" ? "Pickup" : "Deliver to"}</dt>
          <dd className="mt-1 leading-relaxed text-ink">
            {order.customer.name}
            <br />
            {f.method === "pickup" ? (
              <>
                {siteConfig.boutique.name}
                <br />
                {siteConfig.boutique.street}, {siteConfig.boutique.area}
              </>
            ) : (
              <>
                {f.address}
                <br />
                {f.city}, {f.state}
              </>
            )}
            <br />
            {order.customer.phone}
          </dd>
        </div>
        <div>
          <dt className="text-caption tracking-[0.14em] text-smoke uppercase">Payment</dt>
          <dd className="mt-1 text-ink">
            {providerInfo[order.payment.provider].name}
            {order.payment.mode === "demo" ? <span className="text-smoke"> · test mode</span> : null}
          </dd>
        </div>
      </dl>
    </div>
  );
}
