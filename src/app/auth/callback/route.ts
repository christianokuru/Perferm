import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/utils";

/**
 * Landing point for email links (sign-up confirmation, password reset, email
 * change) and OAuth. Exchanges the one-time PKCE code for a session cookie,
 * then sends the visitor on to a same-origin path only (no open redirects).
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = safeRedirectPath(url.searchParams.get("next"), "/account");
  const code = url.searchParams.get("code");
  const failed = url.searchParams.get("error") || url.searchParams.get("error_code");

  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, url.origin));

  if (failed || !code || code.length > 512) {
    return redirectTo(next === "/reset-password" ? "/reset-password" : "/login?error=link");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    // The email is already verified by Supabase before redirecting here; the exchange only fails
    // when the link is opened in a different browser. Ask them to sign in instead.
    return redirectTo(next === "/reset-password" ? "/reset-password" : "/login?confirmed=1");
  }
  return redirectTo(next);
}
