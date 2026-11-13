import { safeRedirectPath } from "@/lib/utils";

export type HomeRole = "customer" | "admin" | null | undefined;

/** Each role's own dashboard: the store dashboard for admins, the customer dashboard for everyone else. */
export function homePath(role: HomeRole): string {
  return role === "admin" ? "/admin" : "/account";
}

/**
 * Where to go after signing in. A specific page someone was sent from (checkout,
 * wishlist, an order) wins. No page, or the generic "/account" that the account
 * icon and the sign-in guard use, means "my dashboard", which depends on the role.
 * This only picks the page; the server checks the role again before showing it.
 */
export function postSignInPath(next: string | null | undefined, role: HomeRole): string {
  const target = safeRedirectPath(next, "");
  if (!target || target === "/account") return homePath(role);
  return target;
}
