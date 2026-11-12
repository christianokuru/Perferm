import type { Metadata } from "next";

import { SettingsAdmin } from "@/components/admin/store-admin";
import { getSettingsForAdmin } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { getCheckoutConfig } from "@/lib/checkout/config";

export const metadata: Metadata = { title: "Settings" };

export default async function Page() {
  await requireAdmin("/admin/settings");
  const [settings, checkout] = await Promise.all([getSettingsForAdmin(), getCheckoutConfig()]);
  return <SettingsAdmin settings={settings} gateways={checkout.gateways} />;
}
