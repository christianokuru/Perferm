import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/auth/auth-forms";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Choose a new password",
  description: "Set a new password for your Perferm account.",
  path: "/reset-password",
  noIndex: true,
});

export default function Page() {
  return <ResetPasswordForm />;
}
