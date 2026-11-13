import type { Metadata } from "next";
import { Suspense } from "react";

import { AccountSettings } from "@/components/account/account-settings";
import { AdminHeading } from "@/components/admin/admin-shell";
import { PageSkeleton } from "@/components/providers/hydration-gate";
import { requireAdmin } from "@/lib/auth/session";
import { formatPhone } from "@/lib/validation/fields";

export const metadata: Metadata = { title: "Your profile" };

/** The admin's own name, sign-in email, password and sessions, without leaving the admin area. */
export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ProfileContent />
    </Suspense>
  );
}

async function ProfileContent() {
  const admin = await requireAdmin("/admin/profile");
  return (
    <AccountSettings
      heading={<AdminHeading title="Your profile" description="Your name, sign-in email and password." />}
      profile={{ id: admin.id, name: admin.name, email: admin.email, phone: formatPhone(admin.phone), hasPassword: admin.hasPassword }}
    />
  );
}
