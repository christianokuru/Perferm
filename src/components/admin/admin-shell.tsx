"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";

import {
  ArrowUpRightIcon,
  BoxIcon,
  CloseIcon,
  GridIcon,
  LogoutIcon,
  MailIcon,
  MenuIcon,
  ReceiptIcon,
  SettingsIcon,
  StarIcon,
  TruckIcon,
  UserIcon,
  UsersIcon,
} from "@/components/icons";
import { useSignOut } from "@/components/auth/use-sign-out";
import { AreaBreadcrumbs } from "@/components/layout/area-breadcrumbs";
import { Logo } from "@/components/layout/logo";
import { IconButton } from "@/components/ui/icon-button";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin", label: "Dashboard", icon: GridIcon },
  { href: "/admin/products", label: "Products", icon: BoxIcon },
  { href: "/admin/orders", label: "Orders", icon: ReceiptIcon },
  { href: "/admin/customers", label: "Customers", icon: UsersIcon },
  { href: "/admin/reviews", label: "Reviews", icon: StarIcon },
  { href: "/admin/messages", label: "Messages", icon: MailIcon },
  { href: "/admin/delivery", label: "Delivery", icon: TruckIcon },
  { href: "/admin/settings", label: "Settings", icon: SettingsIcon },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-1">
      {nav.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-11 items-center gap-3 rounded-full px-4 text-body-sm transition-colors",
                active ? "bg-ink text-white" : "text-ink hover:bg-white",
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Profile, storefront and sign-out links shown under the main admin navigation. */
function AccountLinks({ onNavigate }: { onNavigate?: () => void }) {
  const signOut = useSignOut();
  const item = "flex h-11 w-full items-center gap-3 rounded-full px-4 text-body-sm text-smoke transition-colors hover:bg-white hover:text-ink";
  return (
    <ul className="space-y-1 border-t border-mist pt-4">
      <li>
        <Link href="/admin/profile" onClick={onNavigate} className={item}>
          <UserIcon size={18} />
          Your profile
        </Link>
      </li>
      <li>
        <Link href="/" onClick={onNavigate} className={item}>
          <ArrowUpRightIcon size={18} />
          View storefront
        </Link>
      </li>
      <li>
        <button type="button" onClick={signOut} className={item}>
          <LogoutIcon size={18} />
          Sign out
        </button>
      </li>
    </ul>
  );
}

/** Admin chrome: sidebar on desktop, top bar + sheet on mobile. Access is enforced on the server. */
export function AdminShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const signOut = useSignOut();

  return (
    <>
      <div className="min-h-dvh bg-pearl lg:grid lg:grid-cols-[16rem_1fr]">
        <aside className="hidden flex-col border-r border-mist p-5 lg:sticky lg:top-0 lg:flex lg:h-dvh">
          <Logo className="self-start" />
          <p className="mt-2 text-caption text-smoke">Admin</p>
          <nav aria-label="Admin" className="mt-10 flex-1">
            <Suspense>
              <NavLinks />
            </Suspense>
          </nav>
          <AccountLinks />
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-mist bg-pearl/90 px-4 py-2 backdrop-blur lg:px-8">
            <div className="flex items-center gap-2 lg:hidden">
              <IconButton label="Open admin menu" onClick={() => setMenuOpen(true)}>
                <MenuIcon />
              </IconButton>
              <Logo />
            </div>
            <span className="hidden text-caption text-smoke lg:block">Perferm · Store management</span>
            <div className="flex items-center gap-4">
              <Link href="/admin/profile" className="hidden text-caption text-smoke hover:text-ink sm:block">
                Your profile
              </Link>
              <button type="button" onClick={signOut} className="flex items-center gap-1.5 text-caption text-smoke hover:text-ink">
                <LogoutIcon size={14} />
                Sign out
              </button>
            </div>
          </header>
          <main id="main" className="px-4 py-8 lg:px-8 lg:py-10">
            <Suspense>
              <AreaBreadcrumbs area="admin" />
            </Suspense>
            {children}
          </main>
        </div>
      </div>

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Admin menu" side="left" hideHeader>
        <div className="flex h-full flex-col bg-pearl p-5">
          <div className="flex items-center justify-between">
            <Logo />
            <IconButton label="Close menu" onClick={() => setMenuOpen(false)}>
              <CloseIcon />
            </IconButton>
          </div>
          <nav aria-label="Admin mobile" className="mt-8 flex-1">
            <Suspense>
              <NavLinks onNavigate={() => setMenuOpen(false)} />
            </Suspense>
          </nav>
          <AccountLinks onNavigate={() => setMenuOpen(false)} />
        </div>
      </Sheet>
    </>
  );
}

export function AdminHeading({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-heading-sm font-light text-ink">{title}</h1>
        {description ? <p className="mt-1 text-body-sm text-smoke">{description}</p> : null}
      </div>
      {actions ? <div className="flex gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-[var(--radius-card)] border border-mist bg-white", className)}>{children}</div>;
}
