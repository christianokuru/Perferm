"use client";

import { useRouter } from "next/navigation";

import { toast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { useSessionStore } from "@/stores/session-store";

/** Signs this device out and returns to the storefront. Shared by the account and admin menus. */
export function useSignOut() {
  const router = useRouter();
  return async () => {
    await createClient().auth.signOut({ scope: "local" });
    useSessionStore.getState().markSignedOut();
    toast.show("You've been signed out");
    router.replace("/");
    router.refresh();
  };
}
