import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ProductGrid } from "@/components/product/product-rail";
import { ShopView } from "@/components/shop/shop-view";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/ui/misc";
import { Accent, Eyebrow } from "@/components/ui/typography";
import { getCollectionBySlug, getCollections, getProductSummaries } from "@/lib/catalog/repository";
import { absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export async function generateStaticParams() {
  const collections = await getCollections();
  return collections.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) return {};
  return pageMetadata({
    title: collection.title,
    description: collection.description,
    path: `/collections/${slug}`,
    image: { url: collection.image.src, alt: collection.image.alt },
  });
}

/** Renders the headline with the collection's accent word in italic serif. */
function AccentTitle({ title, accent }: { title: string; accent: string }) {
  const index = title.toLowerCase().indexOf(accent.toLowerCase());
  if (index === -1) return <>{title.toLowerCase()}</>;
  return (
    <>
      {title.slice(0, index).toLowerCase()}
      <Accent>{title.slice(index, index + accent.length).toLowerCase()}</Accent>
      {title.slice(index + accent.length).toLowerCase()}
    </>
  );
}

export default async function CollectionPage({ params }: PageProps<"/collections/[slug]">) {
  const { slug } = await params;
  const [collection, collections, allProducts] = await Promise.all([
    getCollectionBySlug(slug),
    getCollections(),
    getProductSummaries(),
  ]);
  if (!collection) notFound();

  const products = allProducts.filter((p) => p.collections.includes(slug));
  const crumbs = [{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, { label: collection.title }];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: collection.title,
            description: collection.description,
            url: absoluteUrl(`/collections/${slug}`),
            mainEntity: {
              "@type": "ItemList",
              itemListElement: products.map((p, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: absoluteUrl(`/product/${p.slug}`),
                name: p.name,
              })),
            },
          },
        ]}
      />

      <section className="px-2 pt-2 md:px-4">
        <div className="relative mx-auto flex min-h-[26rem] max-w-[100rem] items-end overflow-hidden rounded-[var(--radius-image)] bg-ink md:min-h-[32rem]">
          <Image
            src={collection.image.src}
            alt={collection.image.alt}
            fill
            preload
            loading="eager"
            sizes="100vw"
            className="object-cover"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/25 to-ink/10" />
          <div className="relative w-full p-5 pb-8 text-white md:p-10 md:pb-12">
            <Breadcrumbs items={crumbs} className="text-white/70 [&_a:hover]:text-white [&_span]:text-white" />
            <Eyebrow className="mt-8 text-white/70">{collection.eyebrow}</Eyebrow>
            <h1 className="mt-3 text-[3.5rem] leading-[0.9] font-extralight tracking-[-0.075em] text-white md:text-[6.5rem]">
              <AccentTitle title={collection.title} accent={collection.accent} />
            </h1>
            <p className="mt-5 max-w-lg text-body text-white/80">{collection.description}</p>
          </div>
        </div>
      </section>

      <div className="container-page py-12 md:py-16">
        <Suspense fallback={<ProductGrid products={products} />}>
          <ShopView products={products} collections={collections} lockedCollection={slug} />
        </Suspense>
      </div>
    </>
  );
}
