import type { Metadata } from "next";

import { OrdersAdmin } from "@/components/admin/orders-admin";
import { parsePage, parseSearch } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { orderStatusLabels } from "@/lib/catalog/labels";
import { listOrdersForAdmin } from "@/lib/orders/repository";
import type { OrderStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Orders" };

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdmin("/admin/orders");
  const params = await searchParams;
  const raw = typeof params.status === "string" ? params.status : "";
  const status = raw in orderStatusLabels ? (raw as OrderStatus) : null;
  const q = parseSearch(params.q);
  const page = parsePage(params.page);
  const result = await listOrdersForAdmin({ status, q, page });
  return <OrdersAdmin {...result} status={status} q={q} page={page} />;
}
