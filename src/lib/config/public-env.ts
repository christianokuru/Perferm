/**
 * Public (browser-safe) configuration. Only `NEXT_PUBLIC_*` values belong here;
 * they're inlined into the client bundle at build time.
 */
export const publicEnv = {
  supabaseUrl: (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, ""),
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  paystackPublicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "",
  flutterwavePublicKey: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY ?? "",
  /** Shows "Continue with Google" once the provider is enabled in Supabase. */
  googleAuth: process.env.NEXT_PUBLIC_AUTH_GOOGLE === "true",
} as const;

export function assertSupabaseConfigured(): void {
  if (!publicEnv.supabaseUrl || !publicEnv.supabaseKey) {
    throw new Error("Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  }
}

/** Public URL prefix of uploaded product images. */
export const productImagePrefix = `${publicEnv.supabaseUrl}/storage/v1/object/public/product-images/`;
