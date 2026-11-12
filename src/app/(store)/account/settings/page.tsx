import type { Metadata } from "next";

import { AccountSettings } from "@/components/account/account-settings";
import { requireViewer } from "@/lib/auth/session";
import { formatPhone } from "@/lib/validation/fields";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const viewer = await requireViewer("/account/settings");
  return (
    <AccountSettings
      profile={{ id: viewer.id, name: viewer.name, email: viewer.email, phone: formatPhone(viewer.phone), hasPassword: viewer.hasPassword }}
    />
  );
}
