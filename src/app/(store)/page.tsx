import type { Metadata } from "next";

import { CollectionsRail } from "@/components/home/collections-rail";
import { Hero } from "@/components/home/hero";
import { NewsletterBand } from "@/components/home/newsletter-band";
import { NotesMarquee } from "@/components/home/notes-marquee";
import { OudSpotlight } from "@/components/home/oud-spotlight";
import { ProductTabs } from "@/components/home/product-tabs";
import { StatsAndFamilies } from "@/components/home/stats";
import { Story } from "@/components/home/story";
import { Testimonials } from "@/components/home/testimonials";
import { ProductRail } from "@/components/product/product-rail";
import { Accent } from "@/components/ui/typography";
import { getCollections, getHomeSelections } from "@/lib/catalog/repository";
import { reviews } from "@/lib/data/reviews";
import { imagery } from "@/lib/images";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Perferm — Arabian & Niche Luxury Perfume in Nigeria",
  description:
    "Shop authentic Arabian ouds, attars, bakhoor and niche luxury perfumes in Lagos. Hand gift-wrapped and delivered across all 36 states of Nigeria.",
  path: "/",
  absoluteTitle: true,
  image: { url: imagery.heroProduct, alt: "A gilded perfume flacon against golden light" },
});

export default async function HomePage() {
  const [collections, selections] = await Promise.all([getCollections(), getHomeSelections()]);

  return (
    <>
      <Hero />
      <NotesMarquee />
      <CollectionsRail collections={collections} />

      <section aria-label="Featured fragrances" className="py-6 md:py-10">
        <div className="container-page">
          <ProductTabs
            title={
              <>
                most <Accent>coveted</Accent>
              </>
            }
            tabs={[
              {
                id: "bestsellers",
                label: "Bestsellers",
                href: "/shop?sort=popular",
                content: <ProductRail label="Bestsellers" products={selections.bestsellers} />,
              },
              {
                id: "new",
                label: "New",
                href: "/shop?sort=newest",
                content: <ProductRail label="New arrivals" products={selections.newArrivals} />,
              },
              {
                id: "arabian",
                label: "Arabian",
                href: "/collections/arabian",
                content: <ProductRail label="Arabian perfumery" products={selections.arabian} />,
              },
            ]}
          />
        </div>
      </section>

      <div className="py-14 md:py-20">
        <OudSpotlight product={selections.spotlight} />
      </div>

      <StatsAndFamilies />
      <Story />
      <Testimonials reviews={reviews} />
      <NewsletterBand />
    </>
  );
}
