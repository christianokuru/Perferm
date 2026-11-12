"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { BagIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from "@/components/icons";
import { CountBadge, IconButton } from "@/components/ui/icon-button";
import { mainNav } from "@/lib/config/site";
import { cn } from "@/lib/utils";
import { selectItemCount, useCartStore } from "@/stores/cart-store";
import { useHydrated } from "@/stores/storage";
import { useUiStore } from "@/stores/ui-store";
import { useWishlistStore } from "@/stores/wishlist-store";

import { Logo } from "./logo";

/**
 * Floating header. Transparent at the top of the page, condenses into a
 * frosted pill once the visitor scrolls — the gallery-wall feel of the system.
 */
function NavList({ pathname }: { pathname: string | null }) {
  return (
    <ul className="flex items-center gap-1">
      {mainNav.map((item) => {
        const active = pathname !== null && (pathname === item.href || (item.href !== "/shop" && pathname.startsWith(item.href)));
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn("rounded-full px-4 py-2 text-body-sm text-ink transition-colors hover:bg-pearl", active && "bg-pearl")}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Reads the URL, so it lives in its own Suspense island (keeps the header prerenderable). */
function ActiveNavList() {
  return <NavList pathname={usePathname()} />;
}

export function Header() {
  const open = useUiStore((s) => s.open);
  const [scrolled, setScrolled] = useState(false);

  const cartReady = useHydrated(useCartStore);
  const wishReady = useHydrated(useWishlistStore);
  const cartCount = useCartStore(selectItemCount);
  const wishCount = useWishlistStore((s) => s.items.length);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 px-2 pt-2 md:px-4">
      <div
        className={cn(
          "mx-auto flex h-14 max-w-[80rem] items-center gap-1 rounded-full px-1.5 transition-[background-color,border-color,backdrop-filter] duration-500 md:h-16 md:px-3",
          scrolled ? "border border-mist/80 bg-white/85 backdrop-blur-xl" : "border border-transparent bg-white/0",
        )}
      >
        {/* Left: menu + search on mobile, logo on desktop */}
        <div className="flex flex-1 items-center gap-0.5 lg:flex-none">
          <IconButton label="Open menu" onClick={() => open("menu")} className="lg:hidden">
            <MenuIcon />
          </IconButton>
          <IconButton label="Search" onClick={() => open("search")} className="lg:hidden">
            <SearchIcon />
          </IconButton>
          <Logo className="hidden pl-3 lg:inline-flex" />
        </div>

        <Logo className="lg:hidden" />

        <nav aria-label="Main" className="hidden flex-1 justify-center lg:flex">
          <Suspense fallback={<NavList pathname={null} />}>
            <ActiveNavList />
          </Suspense>
        </nav>

        <div className="flex flex-1 items-center justify-end gap-0.5 lg:flex-none">
          <IconButton label="Search" onClick={() => open("search")} className="hidden lg:inline-flex">
            <SearchIcon />
          </IconButton>
          <Link
            href="/account"
            aria-label="Account"
            title="Account"
            className="hidden size-11 items-center justify-center rounded-full text-ink hover:bg-pearl sm:inline-flex"
          >
            <UserIcon />
          </Link>
          <Link
            href="/wishlist"
            aria-label={`Wishlist${wishReady && wishCount ? `, ${wishCount} saved` : ""}`}
            title="Wishlist"
            className="relative inline-flex size-11 items-center justify-center rounded-full text-ink hover:bg-pearl"
          >
            <HeartIcon />
            {wishReady ? <CountBadge count={wishCount} /> : null}
          </Link>
          <IconButton
            label={`Shopping bag${cartReady && cartCount ? `, ${cartCount} items` : ""}`}
            onClick={() => open("cart")}
            badge={cartReady ? <CountBadge count={cartCount} /> : null}
          >
            <BagIcon />
          </IconButton>
        </div>
      </div>
    </header>
  );
}
