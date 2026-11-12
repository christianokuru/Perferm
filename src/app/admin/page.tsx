import { Suspense } from "react";

import { Dashboard } from "@/components/admin/dashboard";
import { PageSkeleton } from "@/components/providers/hydration-gate";
import { getDashboard, getRecentOrders } from "@/lib/admin/queries";
import { withAdmin } from "@/lib/auth/session";

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  const [admin, [data, recent]] = await withAdmin("/admin", () => Promise.all([getDashboard(), getRecentOrders()]));
  return <Dashboard data={data} recent={recent} name={admin.name} />;
}
