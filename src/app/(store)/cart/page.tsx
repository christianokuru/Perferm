import type { Metadata } from "next";

import { CartView } from "@/components/cart/cart-view";
import { getDeliveryZones } from "@/lib/catalog/repository";
import { PageIntro } from "@/components/shop/page-intro";
import { Accent } from "@/components/ui/typography";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Your bag",
  description: "Review the fragrances in your bag.",
  path: "/cart",
  noIndex: true,
});

export default async function CartPage() {
  const zones = await getDeliveryZones();
  const lowestFee = zones.length ? Math.min(...zones.map((z) => z.fee)) : 0;
  return (
    <>
      <PageIntro
        crumbs={[{ label: "Home", href: "/" }, { label: "Bag" }]}
        title={
          <>
            your <Accent>bag</Accent>
          </>
        }
      />
      <div className="container-page pb-20">
        <CartView lowestFee={lowestFee} />
      </div>
    </>
  );
}
