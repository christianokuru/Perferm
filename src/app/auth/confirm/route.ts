import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/utils";

const TYPES: EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

/**
 * Token-hash email links (works across devices/browsers). Used when the
 * Supabase email templates point at `/auth/confirm?token_hash=…&type=…`.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const fallback = type === "recovery" ? "/reset-password" : type === "email_change" ? "/account/settings" : "/account";
  const next = safeRedirectPath(url.searchParams.get("next"), fallback);

  if (!tokenHash || tokenHash.length > 512 || !type || !TYPES.includes(type)) {
    return NextResponse.redirect(new URL("/login?error=link", url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error) {
    return NextResponse.redirect(new URL(type === "recovery" ? "/reset-password" : "/login?error=link", url.origin));
  }
  return NextResponse.redirect(new URL(next, url.origin));
}
