import { NextResponse, type NextRequest } from "next/server";

import { collections } from "@/lib/data/collections";
import { products } from "@/lib/data/products";

/**
 * Edge-fast slug check. Product and collection pages stream a prerendered
 * shell, which fixes the status at 200 before `notFound()` can run — so unknown
 * slugs are rejected here, before rendering, to return a real 404 (good for SEO
 * and analytics). Swap the sets for a cached slug lookup when on Supabase.
 */
const productSlugs = new Set(products.map((p) => p.slug));
const collectionSlugs = new Set(collections.map((c) => c.slug));

export function proxy(request: NextRequest) {
  const [, section, slug] = request.nextUrl.pathname.split("/");
  const known = section === "product" ? productSlugs : collectionSlugs;

  if (slug && !known.has(decodeURIComponent(slug))) {
    // Rewriting to a path with no route renders app/not-found.tsx with status 404.
    return NextResponse.rewrite(new URL("/__not-found", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/product/:slug", "/collections/:slug"],
};
