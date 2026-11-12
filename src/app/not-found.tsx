import Link from "next/link";

import { Logo } from "@/components/layout/logo";
import { ButtonLink } from "@/components/ui/button";
import { Accent } from "@/components/ui/typography";

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-dvh flex-col px-5 py-6">
      <div className="flex justify-center">
        <Logo />
      </div>
      <div className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center text-center">
        <p className="text-display leading-[0.85] font-extralight text-ink">404</p>
        <h1 className="mt-6 text-heading-sm font-light text-ink">
          this scent has <Accent>evaporated</Accent>
        </h1>
        <p className="mt-4 text-body-sm text-smoke">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          <ButtonLink href="/">Return home</ButtonLink>
          <ButtonLink href="/shop" variant="outline">
            Shop all
          </ButtonLink>
        </div>
        <Link href="/contact" className="mt-6 text-caption text-smoke underline underline-offset-4 hover:text-ink">
          Need help? Contact the concierge
        </Link>
      </div>
    </main>
  );
}
