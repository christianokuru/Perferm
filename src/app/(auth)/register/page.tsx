import type { Metadata } from "next";
import { Suspense } from "react";

import { RegisterForm } from "@/components/auth/auth-forms";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Create an account",
  description: "Create a Perferm account for faster checkout, order tracking and your wishlist.",
  path: "/register",
  noIndex: true,
});

export default function Page() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
