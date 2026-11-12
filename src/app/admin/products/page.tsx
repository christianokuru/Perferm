import type { Metadata } from "next";
import { Suspense } from "react";

import { ProductsAdmin } from "@/components/admin/products-admin";
import { PageSkeleton } from "@/components/providers/hydration-gate";
import { listProductsForAdmin } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Products" };

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ProductsContent />
    </Suspense>
  );
}

async function ProductsContent() {
  await requireAdmin("/admin/products");
  return <ProductsAdmin products={await listProductsForAdmin()} />;
}
