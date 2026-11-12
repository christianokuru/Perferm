import { Suspense } from "react";

import { AccountOverview } from "@/components/account/account-pages";
import { PageSkeleton } from "@/components/providers/hydration-gate";
import { getSessionUser, withViewer } from "@/lib/auth/session";
import { listMyOrders } from "@/lib/orders/repository";
import { createClient } from "@/lib/supabase/server";

export default function AccountPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AccountContent />
    </Suspense>
  );
}

async function countMine(table: "wishlist_items" | "addresses") {
  const [user, supabase] = await Promise.all([getSessionUser(), createClient()]);
  if (!user) return 0;
  const { count } = await supabase.from(table).select("user_id", { count: "exact", head: true }).eq("user_id", user.id);
  return count ?? 0;
}

async function AccountContent() {
  const [viewer, [orders, wishlistCount, addressCount]] = await withViewer("/account", () =>
    Promise.all([listMyOrders(50), countMine("wishlist_items"), countMine("addresses")]),
  );
  return (
    <AccountOverview
      name={viewer.name}
      memberSince={viewer.createdAt}
      orders={orders.slice(0, 3)}
      orderCount={orders.length}
      wishlistCount={wishlistCount}
      addressCount={addressCount}
    />
  );
}
