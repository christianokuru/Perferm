import type { Metadata } from "next";

import { CustomersAdmin } from "@/components/admin/store-admin";
import { listCustomers, parsePage, parseSearch } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Customers" };

export default async function Page({ searchParams }: PageProps<"/admin/customers">) {
  const admin = await requireAdmin("/admin/customers");
  const params = await searchParams;
  const q = parseSearch(params.q);
  const page = parsePage(params.page);
  const result = await listCustomers(q, page);
  return <CustomersAdmin {...result} q={q} page={page} currentUserId={admin.id} />;
}
