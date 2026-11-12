import "server-only";

/**
 * Server-only secrets. Importing this from a Client Component fails the build
 * (`server-only`), so a secret can never be bundled for the browser.
 */
const read = (name: string) => process.env[name]?.trim() ?? "";

export const serverEnv = {
  supabaseSecretKey: read("SUPABASE_SECRET_KEY"),
  paystackSecretKey: read("PAYSTACK_SECRET_KEY"),
  flutterwaveSecretKey: read("FLUTTERWAVE_SECRET_KEY"),
  flutterwaveWebhookHash: read("FLUTTERWAVE_WEBHOOK_HASH"),
  resendApiKey: read("RESEND_API_KEY"),
  emailFrom: read("EMAIL_FROM") || "Perferm <onboarding@resend.dev>",
  storeInbox: read("STORE_INBOX_EMAIL"),
  /**
   * The simulated payment screen. On by default in development; in production
   * it must be switched on explicitly (e.g. on a staging deploy) and is never
   * used for a gateway whose live keys are configured.
   */
  demoPayments: read("PAYMENTS_DEMO_MODE") ? read("PAYMENTS_DEMO_MODE") === "true" : process.env.NODE_ENV !== "production",
} as const;
