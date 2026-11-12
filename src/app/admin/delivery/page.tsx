import type { Metadata } from "next";
import { Suspense } from "react";

import { DeliveryAdmin } from "@/components/admin/store-admin";
import { PageSkeleton } from "@/components/providers/hydration-gate";
import { listZonesForAdmin } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Delivery" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DeliveryContent />
    </Suspense>
  );
}

async function DeliveryContent() {
  await requireAdmin("/admin/delivery");
  return <DeliveryAdmin zones={await listZonesForAdmin()} />;
}
