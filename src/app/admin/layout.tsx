import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { DynamicMarker } from "@/components/providers/dynamic-marker";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · Perferm" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Private, per-user area: rendered at request time, never prerendered or cached.
  return (
    <>
      <AdminShell>{children}</AdminShell>
      <DynamicMarker />
    </>
  );
}
