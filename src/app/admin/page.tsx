import { Dashboard } from "@/components/admin/dashboard";
import { getDashboard, getRecentOrders } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";

export default async function AdminDashboardPage() {
  const admin = await requireAdmin("/admin");
  const [data, recent] = await Promise.all([getDashboard(), getRecentOrders()]);
  return <Dashboard data={data} recent={recent} name={admin.name} />;
}
