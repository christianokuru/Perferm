import type { Metadata } from "next";

import { AdminOrderView } from "@/components/admin/orders-admin";
import { requireAdmin } from "@/lib/auth/session";
import { getOrderForAdmin } from "@/lib/orders/repository";

export const metadata: Metadata = { title: "Order" };

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[reference]">) {
  const { reference } = await params;
  await requireAdmin(`/admin/orders/${encodeURIComponent(reference)}`);
  return <AdminOrderView order={await getOrderForAdmin(reference)} />;
}
