import type { Metadata } from "next";
import { Suspense } from "react";

import { OrderDetailView } from "@/components/account/account-pages";
import { PageSkeleton } from "@/components/providers/hydration-gate";
import { withViewer } from "@/lib/auth/session";
import { getMyOrder } from "@/lib/orders/repository";

export const metadata: Metadata = { title: "Order details" };

export default function OrderDetailPage(props: PageProps<"/account/orders/[reference]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <OrderDetailContent {...props} />
    </Suspense>
  );
}

async function OrderDetailContent({ params }: PageProps<"/account/orders/[reference]">) {
  const { reference } = await params;
  const [, order] = await withViewer(`/account/orders/${encodeURIComponent(reference)}`, () => getMyOrder(reference));
  return <OrderDetailView order={order} />;
}
