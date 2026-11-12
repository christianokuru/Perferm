import Link from "next/link";

import { siteConfig } from "@/lib/config/site";
import { cn } from "@/lib/utils";

export function Logo({ className, tone = "ink" }: { className?: string; tone?: "ink" | "white" }) {
  return (
    <Link
      href="/"
      aria-label={`${siteConfig.name} — home`}
      className={cn(
        "inline-flex flex-col items-center leading-none select-none",
        tone === "white" ? "text-white" : "text-ink",
        className,
      )}
    >
      <span className="text-[15px] font-medium tracking-[0.42em] md:text-[17px]">PERFERM</span>
      <span className="mt-1 font-serif text-[11px] tracking-[0.02em] italic opacity-70">maison de parfum</span>
    </Link>
  );
}
