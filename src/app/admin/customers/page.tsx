import type { Metadata } from "next";

import { CustomersAdmin } from "@/components/admin/store-admin";

export const metadata: Metadata = { title: "Customers" };

export default function Page() {
  return <CustomersAdmin />;
}
