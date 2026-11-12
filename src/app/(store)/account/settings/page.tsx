import type { Metadata } from "next";
import { Suspense } from "react";

import { AccountSettings } from "@/components/account/account-settings";
import { PageSkeleton } from "@/components/providers/hydration-gate";
import { requireViewer } from "@/lib/auth/session";
import { formatPhone } from "@/lib/validation/fields";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}

async function SettingsContent() {
  const viewer = await requireViewer("/account/settings");
  return (
    <AccountSettings
      profile={{ id: viewer.id, name: viewer.name, email: viewer.email, phone: formatPhone(viewer.phone), hasPassword: viewer.hasPassword }}
    />
  );
}
