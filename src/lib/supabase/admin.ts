import "server-only";

import { createClient } from "@supabase/supabase-js";

import { publicEnv } from "@/lib/config/public-env";
import { serverEnv } from "@/lib/config/server-env";

import type { Database } from "./database.types";

let client: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Service-role client — BYPASSES RLS. Only for trusted server code paths that
 * have already authorised the request (checkout, payment confirmation,
 * webhooks, rate limiting, public form intake). Never pass user input as a filter
 * without validating it first.
 */
export function createAdminClient() {
  if (!serverEnv.supabaseSecretKey) throw new Error("SUPABASE_SECRET_KEY is not set.");
  client ??= createClient<Database>(publicEnv.supabaseUrl, serverEnv.supabaseSecretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}
