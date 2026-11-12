import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminOrderView } from "@/components/admin/orders-admin";
import { PageSkeleton } from "@/components/providers/hydration-gate";
import { requireAdmin } from "@/lib/auth/session";
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
  await requireAdmin(`/admin/orders/${encodeURIComponent(reference)}`);
  return <AdminOrderView order={await getOrderForAdmin(reference)} />;
}
