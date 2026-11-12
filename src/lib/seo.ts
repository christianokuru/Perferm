import type { Metadata } from "next";

import { siteConfig } from "@/lib/config/site";
import { koboToNaira } from "@/lib/money";
import type { Crumb, Product, Review } from "@/lib/types";

export function absoluteUrl(path = "/"): string {
  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Consistent per-page metadata: canonical, Open Graph and Twitter cards. */
export function pageMetadata({
  title,
  description,
  path,
  image,
  noIndex,
  absoluteTitle,
}: {
  title: string;
  /** Skip the "· Perferm" suffix template (home page). */
  absoluteTitle?: boolean;
  description: string;
  path: string;
  image?: { url: string; alt: string };
  noIndex?: boolean;
}): Metadata {
  const images = image ? [{ url: image.url, alt: image.alt, width: 1200, height: 630 }] : undefined;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, type: "website", images },
    twitter: { card: "summary_large_image", title, description, images: image ? [image.url] : undefined },
    robots: noIndex ? { index: false, follow: false } : undefined,
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "Store"],
    "@id": absoluteUrl("/#organization"),
    name: siteConfig.name,
    legalName: siteConfig.legalName,
    url: siteConfig.url,
    logo: absoluteUrl("/icons/icon-512.png"),
    description: siteConfig.description,
    email: siteConfig.contact.email,
    telephone: siteConfig.contact.phone,
    currenciesAccepted: "NGN",
    paymentAccepted: "Card, Bank transfer, USSD",
    openingHours: "Mo-Sa 10:00-19:00",
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.boutique.street,
      addressLocality: `${siteConfig.boutique.area}, ${siteConfig.boutique.city}`,
      addressRegion: siteConfig.boutique.region,
      addressCountry: siteConfig.boutique.country,
    },
    sameAs: Object.values(siteConfig.social),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    name: siteConfig.name,
    url: siteConfig.url,
    publisher: { "@id": absoluteUrl("/#organization") },
    creator: {
      "@type": "Person",
      "@id": `${siteConfig.developer.url}#person`,
      name: siteConfig.developer.name,
      url: siteConfig.developer.url,
      sameAs: [siteConfig.developer.url],
      jobTitle: "Web designer & developer",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: absoluteUrl("/shop?q={search_term_string}") },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: item.href ? absoluteUrl(item.href) : undefined,
    })),
  };
}

export function productJsonLd(product: Product, reviews: Review[]) {
  const url = absoluteUrl(`/product/${product.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    description: product.description,
    image: product.images.map((i) => i.src),
    sku: product.variants[0]?.id,
    brand: { "@type": "Brand", name: product.house },
    category: "Health & Beauty > Personal Care > Cosmetics > Perfume & Cologne",
    // Only real, approved reviews are described — Google rejects empty ratings.
    ...(product.reviewCount
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount } }
      : {}),
    review: reviews.map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.author },
      datePublished: r.date,
      name: r.title,
      reviewBody: r.body,
      reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
    })),
    offers: product.variants.map((v) => ({
      "@type": "Offer",
      sku: v.id,
      name: `${product.name} ${v.label}`,
      url,
      priceCurrency: "NGN",
      price: koboToNaira(v.price),
      availability: v.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": absoluteUrl("/#organization") },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "NG" },
      },
    })),
  };
}

export function faqJsonLd(items: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
