import type { Metadata } from "next";

import { DeliveryAdmin } from "@/components/admin/store-admin";
import { listZonesForAdmin } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Delivery" };

export default async function Page() {
  await requireAdmin("/admin/delivery");
  return <DeliveryAdmin zones={await listZonesForAdmin()} />;
}
