import Image from "next/image";
import Link from "next/link";

import { Logo } from "@/components/layout/logo";
import { Accent } from "@/components/ui/typography";
import { imagery } from "@/lib/images";

/** Split editorial shell for sign-in flows: portrait left, form right. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid grid-cols-1 min-h-dvh lg:grid-cols-2">
      <div className="relative hidden p-4 lg:block">
        <div className="relative h-full overflow-hidden rounded-[var(--radius-image)] bg-ink">
          <Image src={imagery.modelBeige} alt="" fill sizes="50vw" preload loading="eager" className="object-cover" />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
          <p className="absolute right-10 bottom-10 left-10 text-[3.5rem] leading-[0.95] font-extralight tracking-[-0.07em] text-white">
            a scent is the most
            <br />
            intimate <Accent>signature</Accent>
          </p>
        </div>
      </div>
      <main id="main" className="flex flex-col px-5 py-6 md:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <Link href="/shop" className="text-body-sm text-smoke hover:text-ink">
            Back to shop
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">{children}</div>
      </main>
    </div>
  );
}
