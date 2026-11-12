import { connection } from "next/server";
import { Suspense } from "react";

async function Connection() {
  await connection();
  return null;
}

/**
 * Tells Next.js a route is intentionally request-time (e.g. detail pages whose
 * data lives client-side, so their params can't be prerendered) while the rest
 * of the page shell still prerenders.
 */
export function DynamicMarker() {
  return (
    <Suspense>
      <Connection />
    </Suspense>
  );
}
