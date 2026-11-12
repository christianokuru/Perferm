import type { Metadata } from "next";

import { OrdersList } from "@/components/account/account-pages";
import { requireViewer } from "@/lib/auth/session";
import { listMyOrders } from "@/lib/orders/repository";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage() {
  await requireViewer("/account/orders");
  return <OrdersList orders={await listMyOrders(100)} />;
}
