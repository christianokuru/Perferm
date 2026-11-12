import type { Metadata } from "next";
import { Suspense } from "react";

import { OrderConfirmation } from "@/components/checkout/order-confirmation";
import { PageSkeleton } from "@/components/providers/hydration-gate";
import { getSessionUser } from "@/lib/auth/session";
import { getOrderWithAccessKey } from "@/lib/orders/repository";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Order confirmed",
  description: "Thank you for your order.",
  path: "/checkout/success",
  noIndex: true,
});

async function Confirmation({ searchParams }: { searchParams: PageProps<"/checkout/success">["searchParams"] }) {
  const params = await searchParams;
  const ref = typeof params.ref === "string" ? params.ref : "";
  const key = typeof params.key === "string" ? params.key : "";
  // The secret key in the URL proves this visitor placed the order.
  const [order, user] = await Promise.all([getOrderWithAccessKey(ref, key), getSessionUser()]);
  return <OrderConfirmation order={order} signedIn={Boolean(user)} />;
}

export default function CheckoutSuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  return (
    <div className="container-page max-w-5xl pt-10 pb-24 md:pt-16">
      <Suspense fallback={<PageSkeleton />}>
        <Confirmation searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
