import Link from "next/link";

import { OrderDetails, OrderHistory, OrderStatusBadge, OrderTimeline } from "@/components/orders/order-details";
import { ButtonLink } from "@/components/ui/button";
import { Badge, EmptyState } from "@/components/ui/misc";
import { formatNaira } from "@/lib/money";
import { ADMIN_PAGE_SIZE, type AdminOrderListItem } from "@/lib/orders/repository";
import type { Order, OrderStatus } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import { formatPhone } from "@/lib/validation/fields";

import { AdminCard, AdminHeading } from "./admin-shell";
import { OrderNoteForm, OrderStatusControl } from "./order-controls";
import { Pagination } from "./pagination";
import { SearchBox } from "./search-box";

const tabs: Array<{ value: OrderStatus | null; label: string }> = [
  { value: null, label: "All" },
  { value: "paid", label: "To fulfil" },
  { value: "processing", label: "Preparing" },
  { value: "shipped", label: "Shipped" },
  { value: "ready_for_pickup", label: "Pickup" },
  { value: "delivered", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "pending", label: "Awaiting payment" },
];

export function OrdersAdmin({
  items,
  total,
  counts,
  status,
  q,
  page,
}: {
  items: AdminOrderListItem[];
  total: number;
  counts: Record<OrderStatus | "all", number>;
  status: OrderStatus | null;
  q: string;
  page: number;
}) {
  const tabHref = (value: OrderStatus | null) => {
    const params = new URLSearchParams();
    if (value) params.set("status", value);
    if (q) params.set("q", q);
    const qs = params.toString();
    return qs ? `/admin/orders?${qs}` : "/admin/orders";
  };

  return (
    <>
      <AdminHeading title="Orders" description={`${counts.all} orders in total`} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchBox placeholder="Reference, email or name" defaultValue={q} />
      </div>
      <nav aria-label="Filter orders by status" className="no-scrollbar -mx-4 mb-4 flex gap-1 overflow-x-auto px-4">
        {tabs.map((t) => (
          <Link
            key={t.label}
            href={tabHref(t.value)}
            aria-current={status === t.value ? "page" : undefined}
            className={cn(
              "flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-body-sm",
              status === t.value ? "bg-ink text-white" : "bg-white text-ink hover:bg-mist",
            )}
          >
            {t.label}
            <span className="text-caption opacity-60">{t.value ? counts[t.value] : counts.all}</span>
          </Link>
        ))}
      </nav>

      <AdminCard className="overflow-hidden">
        {items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-left text-body-sm">
              <thead className="border-b border-mist bg-pearl/60 text-caption text-smoke">
                <tr>
                  {["Reference", "Customer", "Date", "Fulfilment", "Status", "Total"].map((h) => (
                    <th key={h} scope="col" className={cn("px-4 py-3 font-normal", h === "Total" && "text-right")}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-mist">
                {items.map((o) => (
                  <tr key={o.id} className="hover:bg-pearl/40">
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${o.reference}`} className="font-mono text-ink underline-offset-4 hover:underline">
                        {o.reference}
                      </Link>
                      {o.mode === "demo" ? <span className="ml-2 text-caption text-smoke">test</span> : null}
                      {o.stockIssue ? <span className="ml-2 text-caption text-danger">oversold</span> : null}
                    </td>
                    <td className="px-4 py-3">
                      <span className="block text-ink">{o.customerName}</span>
                      <span className="block text-caption text-smoke">{o.email}</span>
                    </td>
                    <td className="px-4 py-3 text-graphite">{formatDate(o.createdAt)}</td>
                    <td className="px-4 py-3 text-graphite">{o.fulfilment === "pickup" ? "Pickup" : o.state}</td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatNaira(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No orders here" description={q ? "No orders match your search." : "Orders placed on the storefront appear here instantly."} />
        )}
      </AdminCard>
      <Pagination page={page} total={total} pageSize={ADMIN_PAGE_SIZE} basePath="/admin/orders" params={{ status: status ?? undefined, q: q || undefined }} />
    </>
  );
}

export function AdminOrderView({ order }: { order: Order | null }) {
  if (!order) {
    return <EmptyState title="Order not found" action={<ButtonLink href="/admin/orders">Back to orders</ButtonLink>} />;
  }

  return (
    <>
      <AdminHeading
        title={order.reference}
        description={`${order.customer.name} · ${order.customer.email}`}
        actions={
          <div className="flex items-center gap-2">
            {order.payment.mode === "demo" ? <Badge tone="outline">Test payment</Badge> : null}
            <OrderStatusBadge status={order.status} />
          </div>
        }
      />
      {order.stockIssue ? (
        <p className="mb-6 rounded-[var(--radius-card)] border border-danger/30 bg-danger/5 px-4 py-3 text-body-sm text-danger">
          Some items in this order were oversold. Check the history below and confirm stock before dispatching.
        </p>
      ) : null}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <AdminCard className="p-5 md:p-6">
            <OrderTimeline order={order} />
            <div className="mt-8">
              <OrderDetails order={order} />
            </div>
          </AdminCard>
          <AdminCard className="p-5 md:p-6">
            <OrderHistory order={order} />
          </AdminCard>
        </div>
        <div className="space-y-6 self-start">
          <AdminCard className="space-y-5 p-5 md:p-6">
            <OrderStatusControl key={order.status} orderId={order.id} status={order.status} fulfilment={order.fulfilment.method} />
            <dl className="space-y-3 border-t border-mist pt-5 text-body-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-smoke">Phone</dt>
                <dd>
                  <a href={`tel:${order.customer.phone}`} className="text-ink underline underline-offset-4">
                    {formatPhone(order.customer.phone)}
                  </a>
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-smoke">Gateway ref</dt>
                <dd className="max-w-[12rem] truncate font-mono text-caption">{order.payment.transactionId ?? "—"}</dd>
              </div>
              {order.payment.paidAt ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-smoke">Paid</dt>
                  <dd>{formatDate(order.payment.paidAt, { dateStyle: "medium", timeStyle: "short" })}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-3">
                <dt className="text-smoke">Account</dt>
                <dd>{order.userId ? "Registered customer" : "Guest checkout"}</dd>
              </div>
              {order.fulfilment.method === "delivery" && order.fulfilment.notes ? (
                <div>
                  <dt className="text-smoke">Delivery notes</dt>
                  <dd className="mt-1 text-ink">{order.fulfilment.notes}</dd>
                </div>
              ) : null}
            </dl>
          </AdminCard>
          <AdminCard className="p-5 md:p-6">
            <OrderNoteForm orderId={order.id} />
          </AdminCard>
        </div>
      </div>
    </>
  );
}
