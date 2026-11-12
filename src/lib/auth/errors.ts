/**
 * Maps Supabase Auth errors to customer-friendly copy. Sign-in failures are
 * deliberately generic so the form can't be used to discover accounts.
 */
export function authErrorMessage(error: { code?: string; message?: string; status?: number } | null | undefined): string {
  if (!error) return "Something went wrong. Please try again.";
  const code = error.code ?? "";
  const message = (error.message ?? "").toLowerCase();

  if (code === "invalid_credentials" || message.includes("invalid login credentials")) {
    return "That email and password combination doesn't match our records.";
  }
  if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
    return "Please confirm your email first — we've sent you a link.";
  }
  if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit" || error.status === 429) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }
  if (code === "weak_password" || message.includes("password should")) {
    return "Choose a stronger password: 8+ characters with upper and lowercase letters and a number.";
  }
  if (code === "same_password") return "Your new password must be different from your current one.";
  if (code === "email_address_invalid") return "Please enter a valid email address.";
  if (code === "signup_disabled") return "New registrations are paused. Please try again later.";
  if (code === "user_banned") return "This account has been suspended. Please contact our concierge.";
  if (code === "session_not_found" || code === "refresh_token_not_found") return "Your session has expired. Please sign in again.";
  if (message.includes("fetch") || message.includes("network")) return "We couldn't reach the server. Check your connection and try again.";
  return "Something went wrong. Please try again.";
}

export function isEmailNotConfirmed(error: { code?: string; message?: string } | null | undefined): boolean {
  return error?.code === "email_not_confirmed" || (error?.message ?? "").toLowerCase().includes("email not confirmed");
}
