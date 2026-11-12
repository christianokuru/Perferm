import type { Metadata } from "next";
import { Suspense } from "react";

import { ProductGrid } from "@/components/product/product-rail";
import { PageIntro } from "@/components/shop/page-intro";
import { ShopView } from "@/components/shop/shop-view";
import { JsonLd } from "@/components/seo/json-ld";
import { Accent } from "@/components/ui/typography";
import { getCollections, getProductSummaries } from "@/lib/catalog/repository";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Shop all fragrances",
  description:
    "Browse every Arabian oud, attar, bakhoor and niche perfume in the Perferm house. Filter by scent family, type and price — delivered across Nigeria.",
  path: "/shop",
});

const crumbs = [{ label: "Home", href: "/" }, { label: "Shop" }];

export default async function ShopPage() {
  const [products, collections] = await Promise.all([getProductSummaries(), getCollections()]);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <PageIntro
        crumbs={crumbs}
        title={
          <>
            the <Accent>house</Accent>
          </>
        }
        lead="Every fragrance we carry — Arabian heritage, rare ouds, concentrated attars and independent niche ateliers. Refine by family, type or budget."
      />
      <div className="container-page pb-20">
        {/* The fallback is the full, crawlable catalogue; filters hydrate on top. */}
        <Suspense fallback={<ProductGrid products={products} />}>
          <ShopView products={products} collections={collections} />
        </Suspense>
      </div>
    </>
  );
}
