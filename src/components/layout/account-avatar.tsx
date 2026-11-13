"use client";

import Link from "next/link";

import { UserIcon } from "@/components/icons";
import { homePath } from "@/lib/auth/redirect";
import { cn, initials } from "@/lib/utils";
import { useSessionStore } from "@/stores/session-store";

/** Initials in a filled circle, e.g. "Christian Okuru" → "CO". Falls back to the email's first letter. */
export function Initials({ name, email, className }: { name: string; email?: string; className?: string }) {
  const letters = initials(name) || (email?.[0] ?? "").toUpperCase() || "?";
  return (
    <span
      aria-hidden="true"
      className={cn("flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-[0.75rem] font-medium tracking-[0.02em] text-white", className)}
    >
      {letters}
    </span>
  );
}

/**
 * The header's account control. Signed out: a person icon that opens sign-in.
 * Signed in: the person's initials, linking to their dashboard (admin or account).
 * The label always says where it goes and for whom.
 */
export function AccountAvatar({ className }: { className?: string }) {
  const user = useSessionStore((s) => s.user);
  const signedIn = Boolean(user);
  const href = signedIn ? homePath(user?.role) : "/login";
  const label = !user ? "Sign in" : `${user.role === "admin" ? "Admin dashboard" : "Account"}, ${user.name || user.email}`;

  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      data-testid="account-avatar"
      className={cn("inline-flex size-11 items-center justify-center rounded-full text-ink hover:bg-pearl", className)}
    >
      {user ? <Initials name={user.name} email={user.email} /> : <UserIcon />}
    </Link>
  );
}
