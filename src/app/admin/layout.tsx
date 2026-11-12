import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { PageSkeleton } from "@/components/providers/hydration-gate";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · Perferm" },
  robots: { index: false, follow: false },
};

/** Blocks rendering of any admin page for non-admins (each page also re-checks). */
async function AdminGate({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminShell>
      <Suspense fallback={<PageSkeleton />}>
        <AdminGate>{children}</AdminGate>
      </Suspense>
    </AdminShell>
  );
}
