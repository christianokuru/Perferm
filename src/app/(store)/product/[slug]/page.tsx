import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { DropIcon, GiftIcon, ShieldIcon, TruckIcon } from "@/components/icons";
import { ReviewCard } from "@/components/reviews/review-card";
import { ReviewForm } from "@/components/reviews/review-form";
import { NotesPyramid } from "@/components/product/notes-pyramid";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPurchase } from "@/components/product/product-purchase";
import { ProductRail } from "@/components/product/product-rail";
import { JsonLd } from "@/components/seo/json-ld";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Badge, Breadcrumbs, Rating, Skeleton } from "@/components/ui/misc";
import { Accent, Eyebrow } from "@/components/ui/typography";
import { concentrationLabels, familyLabels, genderLabels } from "@/lib/catalog/labels";
import { getProductBySlug, getProductReviews, getProducts, getRelatedProducts } from "@/lib/catalog/repository";
import { toSummary } from "@/lib/catalog/summary";
import { siteConfig } from "@/lib/config/site";
import { breadcrumbJsonLd, pageMetadata, productJsonLd } from "@/lib/seo";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return pageMetadata({
    title: `${product.name} by ${product.house}`,
    description: `${product.tagline}. ${product.description.slice(0, 120)}…`,
    path: `/product/${slug}`,
    image: { url: product.images[0].src, alt: product.images[0].alt },
  });
}

async function ProductPageContent({ params }: Pick<PageProps<"/product/[slug]">, "params">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, reviews] = await Promise.all([getRelatedProducts(product), getProductReviews(product.id)]);
  const summary = toSummary(product);
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    { label: product.name },
  ];

  const facts = [
    { label: "Type", value: concentrationLabels[product.concentration] },
    { label: "For", value: genderLabels[product.gender] },
    { label: "Longevity", value: product.longevity },
    { label: "Sillage", value: product.sillage },
  ];

  return (
    <>
      <JsonLd data={[productJsonLd(product, reviews), breadcrumbJsonLd(crumbs)]} />

      <div className="container-page pt-4 md:pt-8">
        <Breadcrumbs items={crumbs} className="mb-5 md:mb-8" />

        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.15fr_1fr] md:gap-10 lg:gap-16">
          <ProductGallery images={product.images} name={product.name} />

          <div className="md:sticky md:top-24 md:self-start">
            <div className="flex flex-wrap items-center gap-2">
              <Eyebrow>{product.house}</Eyebrow>
              {product.isNew ? <Badge tone="saffron">New</Badge> : null}
              {product.isBestseller ? <Badge tone="outline">Bestseller</Badge> : null}
            </div>
            <h1 className="mt-3 text-[2.75rem] leading-[0.95] font-extralight tracking-[-0.07em] text-ink md:text-[3.75rem]">
              {product.name}
            </h1>
            <p className="mt-3 font-serif text-[1.35rem] text-graphite/80 italic">{product.tagline}</p>
            {product.reviewCount ? (
              <a href="#reviews" className="mt-4 inline-block">
                <Rating value={product.rating} count={product.reviewCount} />
              </a>
            ) : null}

            <div className="mt-8">
              <ProductPurchase summary={summary} variants={product.variants} />
            </div>

            <ul className="mt-8 grid grid-cols-2 gap-3 border-t border-mist pt-6 text-caption text-graphite">
              <li className="flex items-center gap-2">
                <TruckIcon size={18} /> Lagos same / next day
              </li>
              <li className="flex items-center gap-2">
                <GiftIcon size={18} /> Complimentary gift wrap
              </li>
              <li className="flex items-center gap-2">
                <ShieldIcon size={18} /> Authentic & sealed
              </li>
              <li className="flex items-center gap-2">
                <DropIcon size={18} /> Free sample with orders
              </li>
            </ul>

            <Accordion className="mt-8">
              <AccordionItem title="The story" defaultOpen>
                <p>{product.description}</p>
              </AccordionItem>
              <AccordionItem title="Details">
                <dl className="grid grid-cols-2 gap-4">
                  {facts.map((fact) => (
                    <div key={fact.label}>
                      <dt className="text-caption text-smoke">{fact.label}</dt>
                      <dd className="text-body-sm text-ink">{fact.value}</dd>
                    </div>
                  ))}
                  <div className="col-span-2">
                    <dt className="text-caption text-smoke">Scent family</dt>
                    <dd className="text-body-sm text-ink">{product.families.map((f) => familyLabels[f]).join(" · ")}</dd>
                  </div>
                </dl>
              </AccordionItem>
              <AccordionItem title="How to wear">
                {product.concentration === "attar" ? (
                  <p>Dab a single drop on the pulse points — wrists, behind the ears and the base of the throat. Do not rub; let the oil warm on the skin. Layer beneath any perfume for longevity.</p>
                ) : product.concentration === "bakhoor" ? (
                  <p>Heat a charcoal disc in a mabkhara until it glows white, place one piece of bakhoor on top and let the smoke perfume the room. Pass garments and hair through the smoke to scent them.</p>
                ) : (
                  <p>Spray on pulse points and clothing from 15 cm. In the Lagos heat, a mist on fabric lasts far longer than skin alone — and never rub your wrists together.</p>
                )}
              </AccordionItem>
              <AccordionItem title="Delivery & returns">
                <p>
                  Delivered across all 36 states and the FCT — Lagos same or next day. Free pickup from {siteConfig.boutique.name}.
                  Unopened, sealed bottles can be returned within 7 days. See our delivery and returns pages for full details.
                </p>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>

      <section aria-labelledby="notes-title" className="container-page py-16 md:py-24">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.4fr] md:gap-16">
          <div>
            <Eyebrow>Composition</Eyebrow>
            <h2 id="notes-title" className="mt-4 text-heading font-light text-ink">
              the <Accent>notes</Accent>
            </h2>
            <p className="mt-4 max-w-sm text-body-sm text-smoke">
              How {product.name} unfolds on the skin — from the first breath to the trail it leaves behind.
            </p>
          </div>
          <NotesPyramid notes={product.notes} />
        </div>
      </section>

      <section id="reviews" aria-labelledby="reviews-title" className="scroll-mt-24 bg-pearl py-16 md:py-24">
        <div className="container-page">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <h2 id="reviews-title" className="text-heading font-light text-ink">
              client <Accent>reviews</Accent>
            </h2>
            {product.reviewCount ? (
              <div className="flex items-baseline gap-3">
                <span className="text-[3.5rem] leading-none font-extralight tracking-[-0.08em] text-ink">{product.rating.toFixed(1)}</span>
                <Rating value={product.rating} count={product.reviewCount} />
              </div>
            ) : null}
          </div>
          {reviews.length ? (
            <ul className="mt-10 grid grid-cols-1 gap-3 md:grid-cols-3">
              {reviews.map((review) => (
                <li key={review.id} className="relative bg-white">
                  <ReviewCard review={review} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-body-sm text-smoke">No reviews yet — be the first to share your impressions.</p>
          )}
          <div className="mt-6 max-w-2xl">
            <ReviewForm productId={product.id} productSlug={product.slug} />
          </div>
        </div>
      </section>

      <section aria-labelledby="related-title" className="container-page py-16 md:py-24">
        <h2 id="related-title" className="mb-10 text-heading font-light text-ink">
          you may also <Accent>love</Accent>
        </h2>
        <ProductRail label="Related fragrances" products={related} />
      </section>
    </>
  );
}

/** Instant shell for slugs that weren't prerendered (e.g. products added after a deploy). */
function ProductPageSkeleton() {
  return (
    <div className="container-page grid grid-cols-1 gap-8 pt-8 pb-24 md:grid-cols-[1.15fr_1fr]" aria-busy="true" aria-label="Loading">
      <Skeleton className="aspect-[4/5]" />
      <div className="space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-14 w-2/3" />
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}

/**
 * The slug is read inside <Suspense>: prerendered slugs stay fully static, and
 * new ones get an instant shell, render on first visit, then cache (ISR).
 */
export default function ProductPage({ params }: PageProps<"/product/[slug]">) {
  return (
    <Suspense fallback={<ProductPageSkeleton />}>
      <ProductPageContent params={params} />
    </Suspense>
  );
}
