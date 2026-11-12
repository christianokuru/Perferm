import type { Metadata } from "next";
import { Suspense } from "react";

import { AccountNav } from "@/components/account/account-nav";
import { AuthGuard } from "@/components/auth/auth-guard";
import { DynamicMarker } from "@/components/providers/dynamic-marker";

export const metadata: Metadata = {
  title: { default: "Account", template: "%s · Account · Perferm" },
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-page pt-6 pb-20 md:pt-10">
      <AuthGuard>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[14rem_1fr] lg:gap-14">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Suspense>
              <AccountNav />
            </Suspense>
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </AuthGuard>
      {/* Private, per-user area: rendered at request time, never prerendered. */}
      <DynamicMarker />
    </div>
  );
}
