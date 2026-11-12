import { AccountOverview } from "@/components/account/account-pages";
import { requireViewer } from "@/lib/auth/session";
import { listMyOrders } from "@/lib/orders/repository";
import { createClient } from "@/lib/supabase/server";

export default async function AccountPage() {
  const viewer = await requireViewer("/account");
  const supabase = await createClient();
  const [orders, wishlist, addresses] = await Promise.all([
    listMyOrders(50),
    supabase.from("wishlist_items").select("product_id", { count: "exact", head: true }).eq("user_id", viewer.id),
    supabase.from("addresses").select("id", { count: "exact", head: true }).eq("user_id", viewer.id),
  ]);
  return (
    <AccountOverview
      name={viewer.name}
      memberSince={viewer.createdAt}
      orders={orders.slice(0, 3)}
      orderCount={orders.length}
      wishlistCount={wishlist.count ?? 0}
      addressCount={addresses.count ?? 0}
    />
  );
}
