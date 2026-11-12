import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { assertSupabaseConfigured, publicEnv } from "@/lib/config/public-env";

import type { Database } from "./database.types";

/**
 * Per-request client that acts AS the signed-in user, so Postgres RLS is the
 * authorisation boundary. Use in Server Components, Server Actions and Route Handlers.
 */
export async function createClient() {
  assertSupabaseConfigured();
  const cookieStore = await cookies();
  return createServerClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component: cookies are read-only there. The proxy refreshes sessions.
        }
      },
    },
  });
}
