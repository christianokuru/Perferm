import type { Metadata } from "next";
import { Suspense } from "react";

import { AccountNav } from "@/components/account/account-nav";
import { AreaBreadcrumbs } from "@/components/layout/area-breadcrumbs";
import { PageSkeleton } from "@/components/providers/hydration-gate";

export const metadata: Metadata = {
  title: { default: "Account", template: "%s · Account · Perferm" },
  robots: { index: false, follow: false },
};

/**
 * Private, per-user area. The proxy redirects signed-out visitors, and every
 * page re-verifies the session on the server before reading any data.
 */
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-page pt-6 pb-20 md:pt-10">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[14rem_1fr] lg:gap-14">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Suspense>
            <AccountNav />
          </Suspense>
        </aside>
        <div className="min-w-0">
          <Suspense>
            <AreaBreadcrumbs area="account" />
          </Suspense>
          <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
        </div>
      </div>
    </div>
  );
}
