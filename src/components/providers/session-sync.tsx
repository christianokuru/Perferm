"use client";

import { useEffect } from "react";

import { syncWishlist } from "@/app/actions/wishlist";
import { formatPhone } from "@/lib/validation/fields";
import { createClient } from "@/lib/supabase/client";
import { useSessionStore, type SessionUser } from "@/stores/session-store";
import { useWishlistStore } from "@/stores/wishlist-store";

async function loadProfile(userId: string, email: string): Promise<SessionUser | null> {
  const { data } = await createClient()
    .from("profiles")
    .select("id, email, full_name, phone, role, created_at")
    .eq("id", userId)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    email: data.email || email,
    name: data.full_name,
    phone: data.phone ? formatPhone(data.phone) : "",
    role: data.role,
    createdAt: data.created_at,
  };
}

/** Merges the guest wishlist into the account and adopts the account's list. */
async function mergeWishlist() {
  const store = useWishlistStore.getState();
  if (!useWishlistStore.persist.hasHydrated()) await useWishlistStore.persist.rehydrate();
  const result = await syncWishlist(store.items.map((i) => i.id));
  if (result.ok) useWishlistStore.getState().replace(result.items);
}

/**
 * Keeps the client session mirror in step with Supabase auth (sign-in,
 * sign-out, token refresh, other tabs). Mounted once in the root layout.
 */
export function SessionSync() {
  useEffect(() => {
    const supabase = createClient();
    let currentId: string | null = null;

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user;
      if (!user) {
        const wasSignedIn = currentId !== null;
        currentId = null;
        useSessionStore.getState().setUser(null);
        // Private data never lingers on a shared device after sign-out.
        if (event === "SIGNED_OUT" && wasSignedIn) useWishlistStore.getState().clear();
        return;
      }
      const changedUser = user.id !== currentId;
      currentId = user.id;
      if (changedUser || event === "USER_UPDATED") {
        // Defer: supabase-js forbids awaiting other auth calls inside this callback.
        setTimeout(async () => {
          const profile = await loadProfile(user.id, user.email ?? "");
          useSessionStore.getState().setUser(profile);
          if (changedUser && profile) await mergeWishlist();
        }, 0);
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  return null;
}
