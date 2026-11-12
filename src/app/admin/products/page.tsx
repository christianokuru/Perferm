import type { Metadata } from "next";

import { ProductsAdmin } from "@/components/admin/products-admin";
import { listProductsForAdmin } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Products" };

export default async function AdminProductsPage() {
  await requireAdmin("/admin/products");
  return <ProductsAdmin products={await listProductsForAdmin()} />;
}
