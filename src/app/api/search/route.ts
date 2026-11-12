import { NextResponse, type NextRequest } from "next/server";

import { searchProducts } from "@/lib/catalog/repository";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";

export async function GET(request: NextRequest) {
  const limit = await rateLimit(clientKey(request.headers, "search"), 60, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  const query = (request.nextUrl.searchParams.get("q") ?? "").slice(0, 80);
  const results = await searchProducts(query, 6);

  return NextResponse.json({ results }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
}
