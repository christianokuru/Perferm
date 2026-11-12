import type { Metadata } from "next";

import { ProductForm } from "@/components/admin/product-form";
import { listCollectionsForAdmin } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireAdmin("/admin/products/new");
  return <ProductForm collections={await listCollectionsForAdmin()} />;
}
