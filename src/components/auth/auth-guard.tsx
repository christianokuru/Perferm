"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { LockIcon } from "@/components/icons";
import { PageSkeleton } from "@/components/providers/hydration-gate";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { useAuthStore, useCurrentUser, type Role } from "@/stores/auth-store";
import { useHydrated } from "@/stores/storage";

/**
 * Client-side route guard (UX only). In production the same rule is enforced
 * server-side in proxy.ts + Supabase RLS — never rely on this alone.
 */
export function AuthGuard({ children, role }: { children: ReactNode; role?: Role }) {
  const router = useRouter();
  const hydrated = useHydrated(useAuthStore);
  const user = useCurrentUser();
  const signedOut = useAuthStore((s) => s.signedOut);

  useEffect(() => {
    if (!hydrated || user) return;
    // A deliberate sign-out goes home; an expired/missing session goes to sign-in and back.
    router.replace(signedOut ? "/" : `/login?next=${encodeURIComponent(window.location.pathname)}`);
  }, [hydrated, user, signedOut, router]);

  if (!hydrated || !user) return <PageSkeleton />;

  if (role && user.role !== role) {
    return (
      <EmptyState
        icon={<LockIcon size={24} />}
        title="This area is restricted"
        description="Your account doesn't have access to this page."
        action={<ButtonLink href="/">Return home</ButtonLink>}
      />
    );
  }

  return <>{children}</>;
}
