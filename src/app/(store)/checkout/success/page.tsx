import type { Metadata } from "next";
import { Suspense } from "react";

import { OrderConfirmation } from "@/components/checkout/order-confirmation";
import { PageSkeleton } from "@/components/providers/hydration-gate";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Order confirmed",
  description: "Thank you for your order.",
  path: "/checkout/success",
  noIndex: true,
});

export default function CheckoutSuccessPage() {
  return (
    <div className="container-page max-w-5xl pt-10 pb-24 md:pt-16">
      <Suspense fallback={<PageSkeleton />}>
        <OrderConfirmation />
      </Suspense>
    </div>
  );
}
