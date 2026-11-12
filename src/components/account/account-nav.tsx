"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { GridIcon, HomeIcon, LogoutIcon, PinIcon, ReceiptIcon, SettingsIcon } from "@/components/icons";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { useAuthStore, useCurrentUser } from "@/stores/auth-store";

const links = [
  { href: "/account", label: "Overview", icon: HomeIcon },
  { href: "/account/orders", label: "Orders", icon: ReceiptIcon },
  { href: "/account/addresses", label: "Addresses", icon: PinIcon },
  { href: "/account/settings", label: "Settings", icon: SettingsIcon },
];

export function AccountNav() {
  const pathname = usePathname();
  const logout = useAuthStore((s) => s.logout);
  const user = useCurrentUser();

  const signOut = () => {
    logout();
    toast.show("You've been signed out");
  };

  return (
    <nav aria-label="Account" className="no-scrollbar -mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
      <ul className="flex gap-1 lg:flex-col">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/account" ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-full px-4 text-body-sm whitespace-nowrap transition-colors",
                  active ? "bg-ink text-white" : "text-ink hover:bg-pearl",
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            </li>
          );
        })}
        {user?.role === "admin" ? (
          <li>
            <Link href="/admin" className="flex h-11 items-center gap-3 rounded-full px-4 text-body-sm whitespace-nowrap text-ink hover:bg-pearl">
              <GridIcon size={18} />
              Admin
            </Link>
          </li>
        ) : null}
        <li className="lg:mt-4 lg:border-t lg:border-mist lg:pt-4">
          <button
            type="button"
            onClick={signOut}
            className="flex h-11 w-full items-center gap-3 rounded-full px-4 text-body-sm whitespace-nowrap text-smoke hover:bg-pearl hover:text-ink"
          >
            <LogoutIcon size={18} />
            Sign out
          </button>
        </li>
      </ul>
    </nav>
  );
}
