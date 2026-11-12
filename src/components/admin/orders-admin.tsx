"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { OrderDetails, OrderStatusBadge, OrderTimeline } from "@/components/orders/order-details";
import { ButtonLink } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/form";
import { Breadcrumbs, EmptyState } from "@/components/ui/misc";
import { toast } from "@/components/ui/toast";
import { orderStatusLabels } from "@/lib/catalog/labels";
import { formatNaira } from "@/lib/money";
import type { OrderStatus } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import { useOrderStore } from "@/stores/order-store";

import { AdminCard, AdminHeading } from "./admin-shell";

const statuses = Object.keys(orderStatusLabels) as OrderStatus[];

export function OrdersAdmin() {
  const router = useRouter();
  const params = useSearchParams();
  const raw = params.get("status");
  const filter = statuses.includes(raw as OrderStatus) ? (raw as OrderStatus) : null;
  const orders = useOrderStore((s) => s.orders);
  const visible = filter ? orders.filter((o) => o.status === filter) : orders;

  const tabs: Array<{ value: OrderStatus | null; label: string }> = [
    { value: null, label: "All" },
    { value: "paid", label: "To fulfil" },
    { value: "processing", label: "Preparing" },
    { value: "shipped", label: "Shipped" },
    { value: "ready_for_pickup", label: "Pickup" },
    { value: "delivered", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  return (
    <>
      <AdminHeading title="Orders" description={`${orders.length} orders in total`} />
      <div className="no-scrollbar -mx-4 mb-4 flex gap-1 overflow-x-auto px-4">
        {tabs.map((t) => {
          const count = t.value ? orders.filter((o) => o.status === t.value).length : orders.length;
          return (
            <button
              key={t.label}
              type="button"
              aria-pressed={filter === t.value}
              onClick={() => router.replace(t.value ? `/admin/orders?status=${t.value}` : "/admin/orders", { scroll: false })}
              className={cn(
                "flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-body-sm",
                filter === t.value ? "bg-ink text-white" : "bg-white text-ink hover:bg-mist",
              )}
            >
              {t.label}
              <span className="text-caption opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      <AdminCard className="overflow-hidden">
        {visible.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-left text-body-sm">
              <thead className="border-b border-mist bg-pearl/60 text-caption text-smoke">
                <tr>
                  {["Reference", "Customer", "Date", "Fulfilment", "Status", "Total"].map((h) => (
                    <th key={h} scope="col" className={cn("px-4 py-3 font-normal", h === "Total" && "text-right")}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-mist">
                {visible.map((o) => (
                  <tr key={o.reference} className="hover:bg-pearl/40">
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${o.reference}`} className="font-mono text-ink underline-offset-4 hover:underline">
                        {o.reference}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="block text-ink">{o.customer.name}</span>
                      <span className="block text-caption text-smoke">{o.customer.email}</span>
                    </td>
                    <td className="px-4 py-3 text-graphite">{formatDate(o.createdAt)}</td>
                    <td className="px-4 py-3 text-graphite">{o.fulfilment.method === "pickup" ? "Pickup" : o.fulfilment.state}</td>
                    <td className="px-4 py-3"><OrderStatusBadge status={o.status} /></td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatNaira(o.totals.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No orders here" description="Orders placed on the storefront appear here instantly." />
        )}
      </AdminCard>
    </>
  );
}

export function AdminOrderView() {
  const { reference } = useParams<{ reference: string }>();
  const order = useOrderStore((s) => s.orders.find((o) => o.reference === reference));
  const updateStatus = useOrderStore((s) => s.updateStatus);

  if (!order) {
    return <EmptyState title="Order not found" action={<ButtonLink href="/admin/orders">Back to orders</ButtonLink>} />;
  }

  return (
    <>
      <Breadcrumbs items={[{ label: "Orders", href: "/admin/orders" }, { label: order.reference }]} className="mb-6" />
      <AdminHeading
        title={order.reference}
        description={`${order.customer.name} · ${order.customer.email}`}
        actions={<OrderStatusBadge status={order.status} />}
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        <AdminCard className="p-5 md:p-6">
          <OrderTimeline order={order} />
          <div className="mt-8">
            <OrderDetails order={order} />
          </div>
        </AdminCard>
        <AdminCard className="space-y-5 self-start p-5 md:p-6">
          <Field label="Update status" hint="The customer is notified by SMS & email (once messaging is connected).">
            {(p) => (
              <Select
                {...p}
                value={order.status}
                onChange={(e) => {
                  updateStatus(order.reference, e.target.value as OrderStatus);
                  toast.success(`Order marked as ${orderStatusLabels[e.target.value as OrderStatus].toLowerCase()}`);
                }}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>{orderStatusLabels[s]}</option>
                ))}
              </Select>
            )}
          </Field>
          <dl className="space-y-3 border-t border-mist pt-5 text-body-sm">
            <div className="flex justify-between"><dt className="text-smoke">Phone</dt><dd><a href={`tel:${order.customer.phone}`} className="text-ink underline underline-offset-4">{order.customer.phone}</a></dd></div>
            <div className="flex justify-between"><dt className="text-smoke">Payment ref</dt><dd className="max-w-[12rem] truncate font-mono text-caption">{order.payment.transactionId ?? "—"}</dd></div>
            {order.fulfilment.method === "delivery" && order.fulfilment.notes ? (
              <div><dt className="text-smoke">Notes</dt><dd className="mt-1 text-ink">{order.fulfilment.notes}</dd></div>
            ) : null}
          </dl>
        </AdminCard>
      </div>
    </>
  );
}
