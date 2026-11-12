import { NextResponse, type NextRequest } from "next/server";

import { publicEnv } from "@/lib/config/public-env";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Runs before every page request:
 *  1. Refreshes the Supabase session cookie (keeps users signed in).
 *  2. Optimistically gates private areas — the pages themselves re-verify the
 *     session and role on the server (Data Access Layer), so this is UX only.
 *  3. Returns a real 404 status for unknown product / collection slugs (the
 *     prerendered shell would otherwise fix the status at 200).
 */

const PRIVATE_PREFIXES = ["/account", "/admin"];
const SLUG_TTL_MS = 60_000;
const slugCache = new Map<string, { exists: boolean; at: number }>();

async function slugExists(table: "products" | "collections", slug: string): Promise<boolean> {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 96) return false;
  const key = `${table}:${slug}`;
  const cached = slugCache.get(key);
  if (cached && Date.now() - cached.at < SLUG_TTL_MS) return cached.exists;

  const filter = table === "products" ? "&archived_at=is.null" : "";
  try {
    const res = await fetch(`${publicEnv.supabaseUrl}/rest/v1/${table}?select=slug&slug=eq.${slug}${filter}&limit=1`, {
      headers: { apikey: publicEnv.supabaseKey, Authorization: `Bearer ${publicEnv.supabaseKey}` },
      cache: "no-store",
    });
    // On an upstream error, let the page render (and decide) rather than 404 a real product.
    if (!res.ok) return true;
    const exists = ((await res.json()) as unknown[]).length > 0;
    if (slugCache.size > 2_000) slugCache.clear();
    slugCache.set(key, { exists, at: Date.now() });
    return exists;
  } catch {
    return true;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const [, section, slug, ...rest] = pathname.split("/");

  if ((section === "product" || section === "collections") && slug && rest.length === 0) {
    const exists = await slugExists(section === "product" ? "products" : "collections", decodeURIComponent(slug));
    // Rewriting to a path with no route renders app/not-found.tsx with status 404.
    if (!exists) return NextResponse.rewrite(new URL("/__not-found", request.url));
  }

  const { response, userId } = await updateSession(request);

  if (!userId && PRIVATE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    const redirect = NextResponse.redirect(login);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except static assets, images, the service worker, icons and webhooks.
    "/((?!_next/static|_next/image|api/webhooks|icons/|sw.js|manifest.webmanifest|robots.txt|sitemap.xml|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml)$).*)",
  ],
};
