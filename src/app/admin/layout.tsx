import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { PageSkeleton } from "@/components/providers/hydration-gate";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · Perferm" },
  robots: { index: false, follow: false },
};

/**
 * Blocks any admin page for non-admins (each page also re-checks). It sits
 * beside the page rather than around it, so the page's reads start at the same
 * time; the shared Suspense boundary reveals nothing until the check passes.
 */
async function AdminGate() {
  await requireAdmin();
  return null;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminShell>
      <Suspense fallback={<PageSkeleton />}>
        <AdminGate />
        {children}
      </Suspense>
    </AdminShell>
  );
}
