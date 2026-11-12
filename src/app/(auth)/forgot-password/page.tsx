import type { Metadata } from "next";
import { Suspense } from "react";

import { ForgotPasswordForm } from "@/components/auth/auth-forms";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Reset password",
  description: "Reset your Perferm account password.",
  path: "/forgot-password",
  noIndex: true,
});

export default function Page() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  );
}
