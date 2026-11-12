import type { Metadata } from "next";
import { Suspense } from "react";

import { SettingsAdmin } from "@/components/admin/store-admin";
import { PageSkeleton } from "@/components/providers/hydration-gate";
import { getSettingsForAdmin } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { getCheckoutConfig } from "@/lib/checkout/config";

export const metadata: Metadata = { title: "Settings" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}

async function SettingsContent() {
  await requireAdmin("/admin/settings");
  const [settings, checkout] = await Promise.all([getSettingsForAdmin(), getCheckoutConfig()]);
  return <SettingsAdmin settings={settings} gateways={checkout.gateways} />;
}
