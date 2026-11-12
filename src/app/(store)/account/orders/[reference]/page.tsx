import type { Metadata } from "next";
import { Suspense } from "react";

import { OrderDetailView } from "@/components/account/account-pages";
import { PageSkeleton } from "@/components/providers/hydration-gate";

export const metadata: Metadata = { title: "Order details" };

export default function OrderDetailPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <OrderDetailView />
    </Suspense>
  );
}
