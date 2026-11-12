import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminOrderView } from "@/components/admin/orders-admin";
import { PageSkeleton } from "@/components/providers/hydration-gate";
import { withAdmin } from "@/lib/auth/session";
import { getOrderForAdmin } from "@/lib/orders/repository";

export const metadata: Metadata = { title: "Order" };

export default function AdminOrderPage(props: PageProps<"/admin/orders/[reference]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <OrderContent {...props} />
    </Suspense>
  );
}

async function OrderContent({ params }: PageProps<"/admin/orders/[reference]">) {
  const { reference } = await params;
  const [, order] = await withAdmin(`/admin/orders/${encodeURIComponent(reference)}`, () => getOrderForAdmin(reference));
  return <AdminOrderView order={order} />;
}
