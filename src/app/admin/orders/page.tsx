import type { Metadata } from "next";
import { Suspense } from "react";

import { OrdersAdmin } from "@/components/admin/orders-admin";
import { PageSkeleton } from "@/components/providers/hydration-gate";

export const metadata: Metadata = { title: "Orders" };

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <OrdersAdmin />
    </Suspense>
  );
}
