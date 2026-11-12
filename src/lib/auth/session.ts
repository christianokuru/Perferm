import "server-only";

import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

/**
 * Data Access Layer for identity. Every protected read or mutation goes
 * through these helpers, which verify the JWT signature (getClaims) rather
 * than trusting cookie contents.
 */

export type Role = Tables<"profiles">["role"];

export interface SessionUser {
  id: string;
  email: string;
  /** Sign-in methods on the account, e.g. ["email"], ["google"]. */
  providers: string[];
}

export interface Viewer extends SessionUser {
  name: string;
  phone: string;
  role: Role;
  createdAt: string;
  /** Has an email + password identity (OAuth-only accounts don't). */
  hasPassword: boolean;
}

/** Verified identity for this request, or null. Deduped per request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  // Session checks compare token expiry with the clock, so they always run at request time.
  await connection();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  const providers = (data.claims.app_metadata as { providers?: string[] } | undefined)?.providers ?? ["email"];
  return { id: data.claims.sub, email: String(data.claims.email ?? ""), providers };
});

/** Signed-in user with profile, or null. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const session = await getSessionUser();
  if (!session) return null;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, role, created_at, email")
    .eq("id", session.id)
    .maybeSingle();
  if (!profile) return null;
  return {
    ...session,
    email: profile.email || session.email,
    name: profile.full_name,
    phone: profile.phone ?? "",
    role: profile.role,
    createdAt: profile.created_at,
    hasPassword: session.providers.includes("email"),
  };
});

/** For protected pages: sends anonymous visitors to sign-in and back. */
export async function requireViewer(returnTo: string): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return viewer;
}

/** For admin pages: anonymous → sign-in, signed-in non-admins → 404 (the area isn't advertised). */
export async function requireAdmin(returnTo = "/admin"): Promise<Viewer> {
  const viewer = await requireViewer(returnTo);
  if (viewer.role !== "admin") notFound();
  return viewer;
}

export class AuthError extends Error {
  constructor(public readonly code: "unauthenticated" | "forbidden") {
    super(code);
  }
}

/** For Server Actions: throws instead of redirecting so the caller returns a typed error. */
export async function assertViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) throw new AuthError("unauthenticated");
  return viewer;
}

export async function assertAdmin(): Promise<Viewer> {
  const viewer = await assertViewer();
  if (viewer.role !== "admin") throw new AuthError("forbidden");
  return viewer;
}
