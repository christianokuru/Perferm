import type { Metadata } from "next";

import { DeliveryAdmin } from "@/components/admin/store-admin";

export const metadata: Metadata = { title: "Delivery" };

export default function Page() {
  return <DeliveryAdmin />;
}
