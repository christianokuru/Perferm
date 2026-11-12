import type { Metadata } from "next";

import { OrderDetailView } from "@/components/account/account-pages";
import { requireViewer } from "@/lib/auth/session";
import { getMyOrder } from "@/lib/orders/repository";

export const metadata: Metadata = { title: "Order details" };

export default async function OrderDetailPage({ params }: PageProps<"/account/orders/[reference]">) {
  const { reference } = await params;
  await requireViewer(`/account/orders/${encodeURIComponent(reference)}`);
  return <OrderDetailView order={await getMyOrder(reference)} />;
}
