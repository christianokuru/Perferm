import type { Metadata } from "next";

import { CheckoutView } from "@/components/checkout/checkout-view";
import { Breadcrumbs } from "@/components/ui/misc";
import { Accent } from "@/components/ui/typography";
import { getCheckoutConfig } from "@/lib/checkout/config";
import { getDeliveryZones } from "@/lib/catalog/repository";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Checkout",
  description: "Secure checkout with Paystack or Flutterwave.",
  path: "/checkout",
  noIndex: true,
});

export default async function CheckoutPage() {
  const [zones, config] = await Promise.all([getDeliveryZones(), getCheckoutConfig()]);
  return (
    <div className="container-page pt-6 pb-20 md:pt-10">
      <Breadcrumbs items={[{ label: "Bag", href: "/cart" }, { label: "Checkout" }]} />
      <h1 className="mt-8 mb-10 text-[3rem] leading-[0.92] font-extralight tracking-[-0.075em] text-ink md:text-[4.5rem]">
        secure <Accent>checkout</Accent>
      </h1>
      <CheckoutView zones={zones} config={config} />
    </div>
  );
}
