import Link from "next/link";

import { ArrowRightIcon, HeartIcon, PinIcon, ReceiptIcon } from "@/components/icons";
import { OrderDetails, OrderHistory, OrderStatusBadge, OrderTimeline } from "@/components/orders/order-details";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { Accent } from "@/components/ui/typography";
import { formatNaira } from "@/lib/money";
import type { Order } from "@/lib/types";
import { formatDate, pluralize } from "@/lib/utils";

export function AccountHeading({ title, accent, lead }: { title: string; accent?: string; lead?: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h1 className="text-[2.75rem] leading-[0.95] font-extralight tracking-[-0.07em] text-ink md:text-[3.75rem]">
        {title} {accent ? <Accent>{accent}</Accent> : null}
      </h1>
      {lead ? <p className="mt-3 text-body-sm text-smoke">{lead}</p> : null}
    </div>
  );
}

function OrderRow({ order }: { order: Order }) {
  const count = order.lines.reduce((n, l) => n + l.quantity, 0);
  return (
    <li>
      <Link
        href={`/account/orders/${order.reference}`}
        className="group flex flex-col gap-3 rounded-[var(--radius-card)] border border-mist p-4 transition-colors hover:border-ink sm:flex-row sm:items-center sm:justify-between md:p-5"
      >
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-body-sm text-ink">{order.reference}</span>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-caption text-smoke">
            {formatDate(order.createdAt)} · {pluralize(count, "item")} · {order.fulfilment.method === "pickup" ? "Pickup" : order.fulfilment.state}
          </p>
        </div>
        <span className="flex items-center gap-3 text-body text-ink tabular-nums">
          {formatNaira(order.totals.total)}
          <ArrowRightIcon size={16} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
    </li>
  );
}

export function AccountOverview({
  name,
  memberSince,
  orders,
  orderCount,
  wishlistCount,
  addressCount,
}: {
  name: string;
  memberSince: string;
  orders: Order[];
  orderCount: number;
  wishlistCount: number;
  addressCount: number;
}) {
  const tiles = [
    { href: "/account/orders", icon: ReceiptIcon, value: orderCount, label: "Orders" },
    { href: "/wishlist", icon: HeartIcon, value: wishlistCount, label: "Saved" },
    { href: "/account/addresses", icon: PinIcon, value: addressCount, label: "Addresses" },
  ];

  return (
    <>
      <AccountHeading
        title="hello,"
        accent={name.split(" ")[0] || "there"}
        lead={`Member since ${formatDate(memberSince, { month: "long", year: "numeric" })}`}
      />
      <ul className="grid grid-cols-3 gap-2 md:gap-3">
        {tiles.map(({ href, icon: Icon, value, label }) => (
          <li key={label}>
            <Link href={href} className="flex flex-col rounded-[var(--radius-card)] border border-mist p-4 transition-colors hover:border-ink md:p-5">
              <Icon size={20} />
              <span className="mt-6 text-[2.25rem] leading-none font-extralight tracking-[-0.06em] text-ink">{value}</span>
              <span className="mt-1 text-caption text-smoke">{label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-12" aria-labelledby="recent-orders">
        <div className="mb-5 flex items-center justify-between">
          <h2 id="recent-orders" className="text-subheading font-light text-ink">
            Recent orders
          </h2>
          {orders.length ? (
            <Link href="/account/orders" className="text-body-sm text-ink underline underline-offset-4">
              View all
            </Link>
          ) : null}
        </div>
        {orders.length ? (
          <ul className="space-y-2">
            {orders.map((o) => (
              <OrderRow key={o.reference} order={o} />
            ))}
          </ul>
        ) : (
          <div className="rounded-[var(--radius-card)] bg-pearl p-6">
            <p className="text-body-sm text-graphite">You haven&apos;t placed an order yet.</p>
            <ButtonLink href="/shop" size="sm" className="mt-4">
              Start exploring
            </ButtonLink>
          </div>
        )}
      </section>
    </>
  );
}

export function OrdersList({ orders }: { orders: Order[] }) {
  return (
    <>
      <AccountHeading title="your" accent="orders" lead="Track deliveries and revisit past purchases." />
      {orders.length ? (
        <ul className="space-y-2">
          {orders.map((o) => (
            <OrderRow key={o.reference} order={o} />
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={<ReceiptIcon size={24} />}
          title="No orders yet"
          description="When you place an order it will appear here with live tracking."
          action={<ButtonLink href="/shop">Shop the house</ButtonLink>}
        />
      )}
    </>
  );
}

export function OrderDetailView({ order }: { order: Order | null }) {
  if (!order) {
    return (
      <EmptyState
        title="Order not found"
        description="This order doesn't exist or belongs to another account."
        action={<ButtonLink href="/account/orders">Back to orders</ButtonLink>}
      />
    );
  }

  const reviewable =
    order.status === "delivered" ? order.lines.filter((l, i, all) => l.slug && all.findIndex((x) => x.slug === l.slug) === i) : [];

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-[1.75rem] tracking-tight text-ink">{order.reference}</h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <div className="rounded-[var(--radius-card)] border border-mist p-5 md:p-8">
        <OrderTimeline order={order} />
        <div className="mt-8">
          <OrderDetails order={order} />
        </div>
      </div>

      {reviewable.length ? (
        <section className="mt-6 rounded-[var(--radius-card)] bg-pearl p-5 md:p-6" aria-labelledby="review-prompt">
          <h2 id="review-prompt" className="text-body text-ink">
            How was it?
          </h2>
          <p className="mt-1 text-body-sm text-smoke">Your review helps other clients choose — verified purchases are marked as such.</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {reviewable.map((line) => (
              <li key={line.slug}>
                <ButtonLink href={`/product/${line.slug}#write-review`} size="sm" variant="outline">
                  Review {line.name}
                </ButtonLink>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <OrderHistory order={order} className="mt-8" />

      <p className="mt-6 text-body-sm text-smoke">
        Need help with this order?{" "}
        <Link href="/contact" className="text-ink underline underline-offset-4">
          Contact the concierge
        </Link>{" "}
        quoting your reference.
      </p>
    </>
  );
}
