import type { Metadata } from "next";
import { Suspense } from "react";

import { OrdersList } from "@/components/account/account-pages";
import { PageSkeleton } from "@/components/providers/hydration-gate";
import { withViewer } from "@/lib/auth/session";
import { listMyOrders } from "@/lib/orders/repository";

export const metadata: Metadata = { title: "Orders" };

export default function OrdersPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <OrdersContent />
    </Suspense>
  );
}

async function OrdersContent() {
  const [, orders] = await withViewer("/account/orders", () => listMyOrders(100));
  return <OrdersList orders={orders} />;
}
