"use client";

import { Button, ButtonLink } from "@/components/ui/button";
import { Accent } from "@/components/ui/typography";

/** Route-level error boundary. Never renders error details to visitors. */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="flex min-h-[70dvh] items-center justify-center px-5 text-center">
      <div className="max-w-md">
        <h1 className="text-heading font-light text-ink">
          something went <Accent>astray</Accent>
        </h1>
        <p className="mt-4 text-body-sm text-smoke">We couldn&apos;t load this page. Please try again — your bag is safe.</p>
        <div className="mt-8 flex justify-center gap-2">
          <Button onClick={reset}>Try again</Button>
          <ButtonLink href="/" variant="outline">
            Go home
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
