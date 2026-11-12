import type { Metadata } from "next";

import { ProductForm } from "@/components/admin/product-form";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { getProductForAdmin, listCollectionsForAdmin } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  await requireAdmin(`/admin/products/${encodeURIComponent(id)}`);
  const [product, collections] = await Promise.all([getProductForAdmin(id), listCollectionsForAdmin()]);
  if (!product) {
    return <EmptyState title="Product not found" description="It may have been deleted." action={<ButtonLink href="/admin/products">Back to products</ButtonLink>} />;
  }
  return <ProductForm key={product.id} product={product} collections={collections} />;
}
