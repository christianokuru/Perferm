import type { Metadata } from "next";
import { Suspense } from "react";

import { EditProductView } from "@/components/admin/product-form";
import { PageSkeleton } from "@/components/providers/hydration-gate";

export const metadata: Metadata = { title: "Edit product" };

export default function EditProductPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <EditProductView />
    </Suspense>
  );
}
