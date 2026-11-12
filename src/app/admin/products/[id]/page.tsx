import type { Metadata } from "next";
import { Suspense } from "react";

import { ProductForm } from "@/components/admin/product-form";
import { PageSkeleton } from "@/components/providers/hydration-gate";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { getProductForAdmin, listCollectionsForAdmin } from "@/lib/admin/queries";
import { withAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Edit product" };

export default function EditProductPage(props: PageProps<"/admin/products/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <EditProductContent {...props} />
    </Suspense>
  );
}

async function EditProductContent({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const [, [product, collections]] = await withAdmin(`/admin/products/${encodeURIComponent(id)}`, () =>
    Promise.all([getProductForAdmin(id), listCollectionsForAdmin()]),
  );
  if (!product) {
    return <EmptyState title="Product not found" description="It may have been deleted." action={<ButtonLink href="/admin/products">Back to products</ButtonLink>} />;
  }
  return <ProductForm key={product.id} product={product} collections={collections} />;
}
