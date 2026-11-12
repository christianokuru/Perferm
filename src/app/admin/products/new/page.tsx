import type { Metadata } from "next";
import { Suspense } from "react";

import { ProductForm } from "@/components/admin/product-form";
import { PageSkeleton } from "@/components/providers/hydration-gate";
import { listCollectionsForAdmin } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "New product" };

export default function NewProductPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <NewProductContent />
    </Suspense>
  );
}

async function NewProductContent() {
  await requireAdmin("/admin/products/new");
  return <ProductForm collections={await listCollectionsForAdmin()} />;
}
