import type { Metadata } from "next";

import { WifiOffIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button";
import { Accent } from "@/components/ui/typography";

export const metadata: Metadata = {
  title: "You're offline",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="container-page flex min-h-[60dvh] flex-col items-center justify-center py-20 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-pearl text-ink">
        <WifiOffIcon size={26} />
      </span>
      <h1 className="mt-8 text-heading font-light text-ink">
        you&apos;re <Accent>offline</Accent>
      </h1>
      <p className="mt-4 max-w-sm text-body-sm text-smoke">
        Your bag and wishlist are saved on this device. Reconnect to keep browsing — pages you&apos;ve visited are still available.
      </p>
      <ButtonLink href="/" className="mt-8">
        Try again
      </ButtonLink>
    </div>
  );
}
