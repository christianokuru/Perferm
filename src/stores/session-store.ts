"use client";

import { create } from "zustand";

/**
 * Client mirror of the signed-in user, for UI only (greetings, prefill, nav).
 * Authorisation never depends on it — the server re-verifies every request.
 */
export type Role = "customer" | "admin";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: Role;
  createdAt: string;
}

interface SessionState {
  status: "loading" | "authenticated" | "anonymous";
  user: SessionUser | null;
  /** Set right after a deliberate sign-out so guards send people home, not to sign-in. */
  signedOut: boolean;
  setUser: (user: SessionUser | null) => void;
  markSignedOut: () => void;
  patchUser: (patch: Partial<SessionUser>) => void;
}

export const useSessionStore = create<SessionState>()((set) => ({
  status: "loading",
  user: null,
  signedOut: false,
  setUser: (user) => set({ user, status: user ? "authenticated" : "anonymous", ...(user ? { signedOut: false } : {}) }),
  markSignedOut: () => set({ user: null, status: "anonymous", signedOut: true }),
  patchUser: (patch) => set((s) => (s.user ? { user: { ...s.user, ...patch } } : s)),
}));

export const useViewer = () => useSessionStore((s) => s.user);
export const useSessionStatus = () => useSessionStore((s) => s.status);
