import type { Metadata } from "next";
import { Suspense } from "react";

import { CustomersAdmin } from "@/components/admin/store-admin";
import { PageSkeleton } from "@/components/providers/hydration-gate";
import { listCustomers, parsePage, parseSearch } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Customers" };

export default function Page(props: PageProps<"/admin/customers">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CustomersContent {...props} />
    </Suspense>
  );
}

async function CustomersContent({ searchParams }: PageProps<"/admin/customers">) {
  const admin = await requireAdmin("/admin/customers");
  const params = await searchParams;
  const q = parseSearch(params.q);
  const page = parsePage(params.page);
  const result = await listCustomers(q, page);
  return <CustomersAdmin {...result} q={q} page={page} currentUserId={admin.id} />;
}
