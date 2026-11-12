import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/auth-forms";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Sign in",
  description: "Sign in to your Perferm account.",
  path: "/login",
  noIndex: true,
});

export default function Page() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
