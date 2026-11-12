import type { Metadata } from "next";
import { Suspense } from "react";

import { TrackOrder } from "@/components/orders/track-order";
import { PageIntro } from "@/components/shop/page-intro";
import { Accent } from "@/components/ui/typography";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Track your order",
  description: "Check the status of your Perferm order with your reference and email.",
  path: "/track",
});

export default function TrackPage() {
  return (
    <>
      <PageIntro
        crumbs={[{ label: "Home", href: "/" }, { label: "Track an order" }]}
        title={
          <>
            track your <Accent>order</Accent>
          </>
        }
        lead="Enter the reference from your receipt and the email you used at checkout."
      />
      <div className="container-page pb-24">
        <Suspense>
          <TrackOrder />
        </Suspense>
      </div>
    </>
  );
}
