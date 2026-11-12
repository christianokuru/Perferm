"use client";

import { createBrowserClient } from "@supabase/ssr";

import { publicEnv } from "@/lib/config/public-env";

import type { Database } from "./database.types";

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Browser client (publishable key + the user's session cookie). Auth calls run
 * from the browser so Supabase's per-IP abuse protection sees the real visitor.
 */
export function createClient() {
  client ??= createBrowserClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseKey);
  return client;
}
