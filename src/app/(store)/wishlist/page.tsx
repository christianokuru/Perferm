import type { Metadata } from "next";

import { PageIntro } from "@/components/shop/page-intro";
import { Accent } from "@/components/ui/typography";
import { WishlistView } from "@/components/wishlist/wishlist-view";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Wishlist",
  description: "The fragrances you've saved for later.",
  path: "/wishlist",
  noIndex: true,
});

export default function WishlistPage() {
  return (
    <>
      <PageIntro
        crumbs={[{ label: "Home", href: "/" }, { label: "Wishlist" }]}
        title={
          <>
            saved for <Accent>later</Accent>
          </>
        }
      />
      <div className="container-page pb-20">
        <WishlistView />
      </div>
    </>
  );
}
