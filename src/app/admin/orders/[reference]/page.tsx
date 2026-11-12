import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminOrderView } from "@/components/admin/orders-admin";
import { PageSkeleton } from "@/components/providers/hydration-gate";

export const metadata: Metadata = { title: "Order" };

export default function AdminOrderPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AdminOrderView />
    </Suspense>
  );
}
