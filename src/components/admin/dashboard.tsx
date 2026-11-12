"use client";

import Link from "next/link";

import { OrderStatusBadge } from "@/components/orders/order-details";
import { formatNaira } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { useAdminStore } from "@/stores/admin-store";
import { useAllUsers } from "@/stores/auth-store";
import { useOrderStore } from "@/stores/order-store";

import { AdminCard, AdminHeading } from "./admin-shell";

const LOW_STOCK = 5;

export function Dashboard() {
  const orders = useOrderStore((s) => s.orders);
  const products = useAdminStore((s) => s.products);
  const customers = useAllUsers();

  const paidOrders = orders.filter((o) => o.status !== "cancelled" && o.status !== "pending");
  const revenue = paidOrders.reduce((sum, o) => sum + o.totals.total, 0);
  const average = paidOrders.length ? Math.round(revenue / paidOrders.length) : 0;
  const toFulfil = orders.filter((o) => o.status === "paid" || o.status === "processing").length;

  const lowStock = products
    .flatMap((p) => p.variants.map((v) => ({ product: p, variant: v })))
    .filter(({ variant }) => variant.stock <= LOW_STOCK)
    .sort((a, b) => a.variant.stock - b.variant.stock)
    .slice(0, 6);

  const sold = new Map<string, { name: string; qty: number }>();
  for (const o of paidOrders) for (const l of o.lines) sold.set(l.productId, { name: l.name, qty: (sold.get(l.productId)?.qty ?? 0) + l.quantity });
  const top = [...sold.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);

  const stats = [
    { label: "Revenue", value: formatNaira(revenue) },
    { label: "Orders", value: String(paidOrders.length) },
    { label: "Average order", value: formatNaira(average) },
    { label: "To fulfil", value: String(toFulfil), href: "/admin/orders?status=paid" },
    { label: "Customers", value: String(customers.length), href: "/admin/customers" },
    { label: "Products", value: String(products.length), href: "/admin/products" },
  ];

  return (
    <>
      <AdminHeading title="Good day" description="Here's how the house is performing." />
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => {
          const body = (
            <>
              <span className="text-caption text-smoke">{s.label}</span>
              <span className="mt-3 block text-[1.6rem] leading-none font-extralight tracking-[-0.05em] text-ink tabular-nums">{s.value}</span>
            </>
          );
          return (
            <li key={s.label}>
              {s.href ? (
                <Link href={s.href} className="block rounded-[var(--radius-card)] border border-mist bg-white p-4 transition-colors hover:border-ink">
                  {body}
                </Link>
              ) : (
                <div className="rounded-[var(--radius-card)] border border-mist bg-white p-4">{body}</div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        <AdminCard>
          <div className="flex items-center justify-between border-b border-mist p-5">
            <h2 className="text-body text-ink">Recent orders</h2>
            <Link href="/admin/orders" className="text-caption text-smoke underline underline-offset-4 hover:text-ink">
              View all
            </Link>
          </div>
          {orders.length ? (
            <ul className="divide-y divide-mist">
              {orders.slice(0, 6).map((o) => (
                <li key={o.reference}>
                  <Link href={`/admin/orders/${o.reference}`} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-pearl/60">
                    <div className="min-w-0">
                      <p className="font-mono text-body-sm text-ink">{o.reference}</p>
                      <p className="truncate text-caption text-smoke">
                        {o.customer.name} · {formatDate(o.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <OrderStatusBadge status={o.status} />
                      <span className="text-body-sm tabular-nums">{formatNaira(o.totals.total)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-5 text-body-sm text-smoke">No orders yet. Place a test order from the storefront to see it here.</p>
          )}
        </AdminCard>

        <div className="space-y-6">
          <AdminCard className="p-5">
            <h2 className="text-body text-ink">Low stock</h2>
            {lowStock.length ? (
              <ul className="mt-4 space-y-3">
                {lowStock.map(({ product, variant }) => (
                  <li key={variant.id} className="flex items-center justify-between text-body-sm">
                    <Link href={`/admin/products/${product.id}`} className="truncate text-ink hover:underline">
                      {product.name} <span className="text-smoke">· {variant.label}</span>
                    </Link>
                    <span className={variant.stock === 0 ? "text-danger" : "text-saffron"}>{variant.stock} left</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-body-sm text-smoke">All variants are well stocked.</p>
            )}
          </AdminCard>
          <AdminCard className="p-5">
            <h2 className="text-body text-ink">Best sellers</h2>
            {top.length ? (
              <ol className="mt-4 space-y-3">
                {top.map((t, i) => (
                  <li key={t.name} className="flex justify-between text-body-sm">
                    <span className="text-ink">
                      <span className="mr-2 text-smoke">{i + 1}</span>
                      {t.name}
                    </span>
                    <span className="text-smoke">{t.qty} sold</span>
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
