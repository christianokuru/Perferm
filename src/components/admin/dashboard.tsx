import Link from "next/link";

import { OrderStatusBadge } from "@/components/orders/order-details";
import type { DashboardData } from "@/lib/admin/queries";
import { formatNaira } from "@/lib/money";
import type { OrderStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";

import { AdminCard, AdminHeading } from "./admin-shell";

interface RecentOrder {
  id: string;
  reference: string;
  customer_name: string;
  created_at: string;
  status: OrderStatus;
  total_kobo: number;
}

function RevenueChart({ daily }: { daily: DashboardData["daily"] }) {
  const max = Math.max(1, ...daily.map((d) => d.revenue_kobo));
  return (
    <AdminCard className="p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-body text-ink">Last 14 days</h2>
        <span className="text-caption text-smoke">{formatNaira(daily.reduce((n, d) => n + d.revenue_kobo, 0))}</span>
      </div>
      <ol className="mt-6 flex h-32 items-end gap-1.5" aria-label="Revenue per day for the last 14 days">
        {daily.map((d) => (
          <li key={d.day} className="flex h-full flex-1 flex-col justify-end" title={`${formatDate(d.day)} · ${formatNaira(d.revenue_kobo)} · ${d.orders} orders`}>
            <span
              className="block rounded-t-[4px] bg-saffron/80"
              style={{ height: `${Math.max(d.revenue_kobo ? 4 : 1, (d.revenue_kobo / max) * 100)}%`, opacity: d.revenue_kobo ? 1 : 0.25 }}
            />
            <span className="sr-only">
              {formatDate(d.day)}: {formatNaira(d.revenue_kobo)}
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-2 flex justify-between text-caption text-smoke">
        <span>{daily[0] ? formatDate(daily[0].day) : ""}</span>
        <span>Today</span>
      </div>
    </AdminCard>
  );
}

export function Dashboard({ data, recent, name }: { data: DashboardData; recent: RecentOrder[]; name: string }) {
  const average = data.orders ? Math.round(data.revenue_kobo / data.orders) : 0;
  const stats = [
    { label: "Revenue", value: formatNaira(data.revenue_kobo), hint: `${formatNaira(data.revenue_30d_kobo)} in 30 days` },
    { label: "Orders", value: String(data.orders), hint: `${data.orders_30d} in 30 days` },
    { label: "Average order", value: formatNaira(average) },
    { label: "To fulfil", value: String(data.to_fulfil), href: "/admin/orders?status=paid" },
    { label: "Customers", value: String(data.customers), href: "/admin/customers" },
    { label: "Products", value: String(data.products), href: "/admin/products" },
  ];
  const alerts = [
    data.stock_issues ? { href: "/admin/orders", text: `${data.stock_issues} order${data.stock_issues === 1 ? "" : "s"} oversold — check stock before dispatch` } : null,
    data.new_messages ? { href: "/admin/messages", text: `${data.new_messages} new concierge message${data.new_messages === 1 ? "" : "s"}` } : null,
    data.pending_reviews ? { href: "/admin/reviews?status=pending", text: `${data.pending_reviews} review${data.pending_reviews === 1 ? "" : "s"} awaiting approval` } : null,
  ].filter(Boolean) as { href: string; text: string }[];

  return (
    <>
      <AdminHeading title={`Good day, ${name.split(" ")[0] || "there"}`} description="Here's how the house is performing." />
      {alerts.length ? (
        <ul className="mb-6 space-y-2">
          {alerts.map((a) => (
            <li key={a.href}>
              <Link href={a.href} className="block rounded-[var(--radius-card)] border border-saffron/40 bg-saffron/5 px-4 py-3 text-body-sm text-ink hover:border-saffron">
                {a.text} →
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => {
          const body = (
            <>
              <span className="text-caption text-smoke">{s.label}</span>
              <span className="mt-3 block text-[1.6rem] leading-none font-extralight tracking-[-0.05em] text-ink tabular-nums">{s.value}</span>
              {s.hint ? <span className="mt-2 block text-caption text-smoke">{s.hint}</span> : null}
            </>
          );
          return (
            <li key={s.label}>
              {s.href ? (
                <Link href={s.href} className="block h-full rounded-[var(--radius-card)] border border-mist bg-white p-4 transition-colors hover:border-ink">
                  {body}
                </Link>
              ) : (
                <div className="h-full rounded-[var(--radius-card)] border border-mist bg-white p-4">{body}</div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <RevenueChart daily={data.daily} />
          <AdminCard>
            <div className="flex items-center justify-between border-b border-mist p-5">
              <h2 className="text-body text-ink">Recent orders</h2>
              <Link href="/admin/orders" className="text-caption text-smoke underline underline-offset-4 hover:text-ink">
                View all
              </Link>
            </div>
            {recent.length ? (
              <ul className="divide-y divide-mist">
                {recent.map((o) => (
                  <li key={o.id}>
                    <Link href={`/admin/orders/${o.reference}`} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-pearl/60">
                      <div className="min-w-0">
                        <p className="font-mono text-body-sm text-ink">{o.reference}</p>
                        <p className="truncate text-caption text-smoke">
                          {o.customer_name} · {formatDate(o.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <OrderStatusBadge status={o.status} />
                        <span className="text-body-sm tabular-nums">{formatNaira(o.total_kobo)}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-5 text-body-sm text-smoke">No orders yet. Paid orders from the storefront appear here instantly.</p>
            )}
          </AdminCard>
        </div>

        <div className="space-y-6">
          <AdminCard className="p-5">
            <h2 className="text-body text-ink">Low stock</h2>
            {data.low_stock.length ? (
              <ul className="mt-4 space-y-3">
                {data.low_stock.map((item) => (
                  <li key={`${item.product_id}-${item.label}`} className="flex items-center justify-between gap-3 text-body-sm">
                    <Link href={`/admin/products/${item.product_id}`} className="truncate text-ink hover:underline">
                      {item.name} <span className="text-smoke">· {item.label}</span>
                    </Link>
                    <span className={item.stock === 0 ? "shrink-0 text-danger" : "shrink-0 text-saffron"}>{item.stock === 0 ? "Sold out" : `${item.stock} left`}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-body-sm text-smoke">All sizes are well stocked.</p>
            )}
          </AdminCard>
          <AdminCard className="p-5">
            <h2 className="text-body text-ink">Best sellers</h2>
            {data.top_sellers.length ? (
              <ol className="mt-4 space-y-3">
                {data.top_sellers.map((t, i) => (
                  <li key={t.name} className="flex justify-between gap-3 text-body-sm">
                    <span className="truncate text-ink">
                      <span className="mr-2 text-smoke">{i + 1}</span>
                      {t.name}
                    </span>
                    <span className="shrink-0 text-smoke">{t.quantity} sold</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-body-sm text-smoke">Sales will appear here.</p>
            )}
          </AdminCard>
        </div>
      </div>
    </>
  );
}
