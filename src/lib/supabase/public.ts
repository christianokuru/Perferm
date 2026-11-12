import "server-only";

import { createClient } from "@supabase/supabase-js";

import { assertSupabaseConfigured, publicEnv } from "@/lib/config/public-env";

import type { Database } from "./database.types";

let client: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Anonymous, cookie-free client for public catalogue reads inside `"use cache"`
 * scopes (which can't touch request cookies). RLS limits it to public data.
 */
export function createPublicClient() {
  assertSupabaseConfigured();
  client ??= createClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}
