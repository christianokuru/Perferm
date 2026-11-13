"use client";

import Link from "next/link";

import { ArrowUpRightIcon, CloseIcon, InstagramIcon, LogoutIcon, TikTokIcon, WhatsAppIcon } from "@/components/icons";
import { IconButton } from "@/components/ui/icon-button";
import { Sheet } from "@/components/ui/sheet";
import { Accent } from "@/components/ui/typography";
import { mainNav, siteConfig } from "@/lib/config/site";
import { useSignOut } from "@/components/auth/use-sign-out";
import { ButtonLink } from "@/components/ui/button";
import { homePath } from "@/lib/auth/redirect";
import { useSessionStore } from "@/stores/session-store";
import { useHydrated } from "@/stores/storage";
import { useUiStore } from "@/stores/ui-store";
import { useWishlistStore } from "@/stores/wishlist-store";

import { Initials } from "./account-avatar";
import { Logo } from "./logo";

/** Top of the menu: sign in / create account, or who is signed in with their dashboard and sign out. */
function AccountPanel({ onNavigate }: { onNavigate: () => void }) {
  const status = useSessionStore((s) => s.status);
  const user = useSessionStore((s) => s.user);
  const signOut = useSignOut();

  if (status === "loading") return <div className="mt-6 h-[4.5rem] animate-pulse rounded-[var(--radius-card)] bg-pearl" aria-hidden="true" />;

  if (!user) {
    return (
      <div className="mt-6 grid grid-cols-2 gap-2">
        <ButtonLink href="/login" onClick={onNavigate} variant="primary" block>
          Sign in
        </ButtonLink>
        <ButtonLink href="/register" onClick={onNavigate} variant="outline" block>
          Create account
        </ButtonLink>
      </div>
    );
  }

  const isAdmin = user.role === "admin";
  return (
    <div className="mt-6 flex items-center gap-3 rounded-[var(--radius-card)] bg-pearl p-3">
      <Initials name={user.name} email={user.email} className="size-11 text-body-sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-body-sm text-ink">{user.name || user.email}</p>
        <Link href={homePath(user.role)} onClick={onNavigate} className="text-caption text-smoke underline underline-offset-4 hover:text-ink">
          {isAdmin ? "Admin dashboard" : "My account"}
        </Link>
      </div>
      <button
        type="button"
        onClick={() => {
          onNavigate();
          void signOut();
        }}
        className="flex h-11 items-center gap-1.5 rounded-full px-3 text-caption text-smoke hover:bg-white hover:text-ink"
      >
        <LogoutIcon size={16} />
        Sign out
      </button>
    </div>
  );
}

const secondary = [
  { label: "Wishlist", href: "/wishlist" },
  { label: "Our story", href: "/about" },
  { label: "Delivery", href: "/delivery" },
  { label: "Contact", href: "/contact" },
];

export function MobileMenu() {
  const isOpen = useUiStore((s) => s.panel === "menu");
  const close = useUiStore((s) => s.close);
  const wishReady = useHydrated(useWishlistStore);
  const wishCount = useWishlistStore((s) => s.items.length);

  return (
    <Sheet open={isOpen} onClose={close} title="Menu" side="full" hideHeader>
      <div className="flex min-h-full flex-col px-5 pt-3 pb-8">
        <div className="flex items-center justify-between">
          <span className="w-11" />
          <Logo />
          <IconButton label="Close menu" onClick={close}>
            <CloseIcon />
          </IconButton>
        </div>

        <AccountPanel onNavigate={close} />

        <nav aria-label="Mobile" className="mt-8">
          <ul className="space-y-1">
            {mainNav.map((item, i) => (
              <li key={item.href} className="animate-fade-up" style={{ animationDelay: `${i * 45}ms` }}>
                <Link
                  href={item.href}
                  onClick={close}
                  className="flex items-baseline justify-between border-b border-mist py-3 text-[2.4rem] leading-none font-extralight tracking-[-0.06em] text-ink"
                >
                  {i === 1 ? <Accent>{item.label.toLowerCase()}</Accent> : item.label.toLowerCase()}
                  <span className="text-caption tracking-normal text-smoke">0{i + 1}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-3">
          {secondary.map((item) => (
            <li key={item.href}>
              <Link href={item.href} onClick={close} className="text-body-sm text-graphite hover:text-ink">
                {item.label}
                {item.href === "/wishlist" && wishReady && wishCount ? <span className="ml-1.5 text-caption text-smoke">({wishCount})</span> : null}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-auto space-y-5 pt-10">
          <a
            href={siteConfig.contact.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-[var(--radius-card)] bg-pearl p-4"
          >
            <span className="flex items-center gap-3">
              <WhatsAppIcon />
              <span>
                <span className="block text-body-sm text-ink">Speak to a fragrance concierge</span>
                <span className="block text-caption text-smoke">Replies within minutes, 9am – 9pm</span>
              </span>
            </span>
            <ArrowUpRightIcon size={18} />
          </a>
          <div className="flex gap-2">
            <a href={siteConfig.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex size-11 items-center justify-center rounded-full border border-mist">
              <InstagramIcon size={18} />
            </a>
            <a href={siteConfig.social.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="flex size-11 items-center justify-center rounded-full border border-mist">
              <TikTokIcon size={18} />
            </a>
          </div>
        </div>
      </div>
    </Sheet>
  );
}
