"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { ArrowRightIcon, HeartIcon, PinIcon, ReceiptIcon } from "@/components/icons";
import { OrderDetails, OrderStatusBadge, OrderTimeline } from "@/components/orders/order-details";
import { ButtonLink } from "@/components/ui/button";
import { Breadcrumbs, EmptyState } from "@/components/ui/misc";
import { Accent } from "@/components/ui/typography";
import { formatNaira } from "@/lib/money";
import type { Order } from "@/lib/types";
import { formatDate, pluralize } from "@/lib/utils";
import { useCurrentUser } from "@/stores/auth-store";
import { useOrderStore } from "@/stores/order-store";
import { useWishlistStore } from "@/stores/wishlist-store";

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

/** Orders belonging to the signed-in customer (matched by email). */
function useMyOrders(): Order[] {
  const user = useCurrentUser();
  const orders = useOrderStore((s) => s.orders);
  return user ? orders.filter((o) => o.customer.email === user.email) : [];
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

export function AccountOverview() {
  const user = useCurrentUser();
  const orders = useMyOrders();
  const saved = useWishlistStore((s) => s.items.length);
  if (!user) return null;

  const tiles = [
    { href: "/account/orders", icon: ReceiptIcon, value: orders.length, label: "Orders" },
    { href: "/wishlist", icon: HeartIcon, value: saved, label: "Saved" },
    { href: "/account/addresses", icon: PinIcon, value: user.addresses.length, label: "Addresses" },
  ];

  return (
    <>
      <AccountHeading title="hello," accent={user.name.split(" ")[0]} lead={`Member since ${formatDate(user.createdAt, { month: "long", year: "numeric" })}`} />
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
            {orders.slice(0, 3).map((o) => (
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

export function OrdersList() {
  const orders = useMyOrders();
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

export function OrderDetailView() {
  const { reference } = useParams<{ reference: string }>();
  const order = useMyOrders().find((o) => o.reference === reference);

  if (!order) {
    return (
      <EmptyState
        title="Order not found"
        description="This order doesn't exist or belongs to another account."
        action={<ButtonLink href="/account/orders">Back to orders</ButtonLink>}
      />
    );
  }

  return (
    <>
      <Breadcrumbs items={[{ label: "Orders", href: "/account/orders" }, { label: order.reference }]} />
      <div className="mt-6 mb-8 flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-[1.75rem] tracking-tight text-ink">{order.reference}</h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <div className="rounded-[var(--radius-card)] border border-mist p-5 md:p-8">
        <OrderTimeline order={order} />
        <div className="mt-8">
          <OrderDetails order={order} />
        </div>
      </div>
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
