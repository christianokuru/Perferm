import type { Metadata } from "next";
import { Suspense } from "react";

import { OrdersAdmin } from "@/components/admin/orders-admin";
import { PageSkeleton } from "@/components/providers/hydration-gate";
import { parsePage, parseSearch } from "@/lib/admin/queries";
import { withAdmin } from "@/lib/auth/session";
import { orderStatusLabels } from "@/lib/catalog/labels";
import { listOrdersForAdmin } from "@/lib/orders/repository";
import type { OrderStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Orders" };

export default function AdminOrdersPage(props: PageProps<"/admin/orders">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <OrdersContent {...props} />
    </Suspense>
  );
}

async function OrdersContent({ searchParams }: PageProps<"/admin/orders">) {
  const params = await searchParams;
  const raw = typeof params.status === "string" ? params.status : "";
  const status = raw in orderStatusLabels ? (raw as OrderStatus) : null;
  const q = parseSearch(params.q);
  const page = parsePage(params.page);
  const [, result] = await withAdmin("/admin/orders", () => listOrdersForAdmin({ status, q, page }));
  return <OrdersAdmin {...result} status={status} q={q} page={page} />;
}
