"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { createSalt, hashPassword, verifyPassword } from "@/lib/auth/password";
import type { AddressInput } from "@/lib/validation/schemas";

import { persistOptions } from "./storage";

/**
 * DEMO AUTH ADAPTER — runs entirely in the browser so the storefront is fully
 * explorable before Supabase is connected. It mirrors the Supabase Auth surface
 * (register / login / logout / profile) so the swap is a drop-in change.
 * Not a security boundary: real authorisation must happen server-side.
 */

export type Role = "customer" | "admin";

export interface Address extends AddressInput {
  id: string;
}

interface StoredUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  createdAt: string;
  salt: string;
  passwordHash: string;
  addresses: Address[];
}

export type User = Omit<StoredUser, "salt" | "passwordHash">;

type Result = { ok: true } | { ok: false; error: string };

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;
const GENERIC_LOGIN_ERROR = "That email and password combination doesn't match our records.";

const adminEmails = (process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

interface AuthState {
  users: Record<string, StoredUser>;
  session: { userId: string; expiresAt: number } | null;
  attempts: Record<string, { count: number; lockedUntil: number }>;
  /** True right after a deliberate sign-out, so guards send people home instead of to sign-in. Not persisted. */
  signedOut: boolean;

  register: (input: { name: string; email: string; phone: string; password: string }) => Promise<Result>;
  login: (email: string, password: string) => Promise<Result>;
  logout: () => void;
  updateProfile: (input: { name: string; phone: string }) => Result;
  changePassword: (current: string, next: string) => Promise<Result>;
  saveAddress: (address: AddressInput, id?: string) => Result;
  deleteAddress: (id: string) => void;
  deleteAccount: () => void;
}

function stripSecrets(user: StoredUser): User {
  const { salt: _salt, passwordHash: _hash, ...safe } = user;
  return safe;
}

function findById(users: Record<string, StoredUser>, id: string | undefined) {
  return Object.values(users).find((u) => u.id === id);
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      const currentUser = () => {
        const { session, users } = get();
        if (!session || session.expiresAt < Date.now()) return undefined;
        return findById(users, session.userId);
      };

      const patchCurrentUser = (patch: (user: StoredUser) => StoredUser): Result => {
        const user = currentUser();
        if (!user) return { ok: false, error: "Your session has expired. Please sign in again." };
        set((state) => ({ users: { ...state.users, [user.email]: patch(user) } }));
        return { ok: true };
      };

      return {
        users: {},
        session: null,
        attempts: {},
        signedOut: false,

        register: async ({ name, email, phone, password }) => {
          if (get().users[email]) {
            return { ok: false, error: "An account with this email already exists. Try signing in instead." };
          }
          const salt = createSalt();
          const user: StoredUser = {
            id: crypto.randomUUID(),
            name,
            email,
            phone,
            role: adminEmails.includes(email) ? "admin" : "customer",
            createdAt: new Date().toISOString(),
            salt,
            passwordHash: await hashPassword(password, salt),
            addresses: [],
          };
          set((state) => ({
            users: { ...state.users, [email]: user },
            session: { userId: user.id, expiresAt: Date.now() + SESSION_TTL_MS },
            signedOut: false,
          }));
          return { ok: true };
        },

        login: async (email, password) => {
          const attempt = get().attempts[email];
          if (attempt && attempt.lockedUntil > Date.now()) {
            const minutes = Math.ceil((attempt.lockedUntil - Date.now()) / 60_000);
            return { ok: false, error: `Too many attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` };
          }

          const user = get().users[email];
          // Always run the hash so a missing account takes as long as a wrong password.
          const valid = user
            ? await verifyPassword(password, user.salt, user.passwordHash)
            : (await hashPassword(password, createSalt()), false);

          if (!valid || !user) {
            const count = (attempt?.count ?? 0) + 1;
            set((state) => ({
              attempts: {
                ...state.attempts,
                [email]: { count, lockedUntil: count >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : 0 },
              },
            }));
            return { ok: false, error: GENERIC_LOGIN_ERROR };
          }

          set((state) => {
            const { [email]: _cleared, ...attempts } = state.attempts;
            return { attempts, signedOut: false, session: { userId: user.id, expiresAt: Date.now() + SESSION_TTL_MS } };
          });
          return { ok: true };
        },

        logout: () => set({ session: null, signedOut: true }),

        updateProfile: ({ name, phone }) => patchCurrentUser((u) => ({ ...u, name, phone })),

        changePassword: async (current, next) => {
          const user = currentUser();
          if (!user) return { ok: false, error: "Your session has expired. Please sign in again." };
          if (!(await verifyPassword(current, user.salt, user.passwordHash))) {
            return { ok: false, error: "Your current password is incorrect." };
          }
          const salt = createSalt();
          const passwordHash = await hashPassword(next, salt);
          return patchCurrentUser((u) => ({ ...u, salt, passwordHash }));
        },

        saveAddress: (address, id) =>
          patchCurrentUser((u) => {
            const nextId = id ?? crypto.randomUUID();
            const isFirst = u.addresses.length === 0;
            const makeDefault = address.isDefault || isFirst;
            const others = u.addresses
              .filter((a) => a.id !== nextId)
              .map((a) => (makeDefault ? { ...a, isDefault: false } : a));
            return { ...u, addresses: [...others, { ...address, id: nextId, isDefault: makeDefault }] };
          }),

        deleteAddress: (id) => {
          patchCurrentUser((u) => {
            const remaining = u.addresses.filter((a) => a.id !== id);
            if (remaining.length && !remaining.some((a) => a.isDefault)) remaining[0] = { ...remaining[0], isDefault: true };
            return { ...u, addresses: remaining };
          });
        },

        deleteAccount: () => {
          const user = currentUser();
          if (!user) return;
          set((state) => {
            const { [user.email]: _removed, ...users } = state.users;
            return { users, session: null, signedOut: true };
          });
        },
      };
    },
    persistOptions<AuthState>("auth", 1, {
      partialize: (s) => ({ users: s.users, session: s.session, attempts: s.attempts }) as AuthState,
    }),
  ),
);

/** Current signed-in user without secrets, or null. */
export function useCurrentUser(): User | null {
  return useAuthStore((state) => {
    if (!state.session || state.session.expiresAt < Date.now()) return null;
    const user = findById(state.users, state.session.userId);
    return user ? stripSecretsMemo(user) : null;
  });
}

// Selector results must be referentially stable; cache the stripped object per stored user.
const strippedCache = new WeakMap<StoredUser, User>();
function stripSecretsMemo(user: StoredUser): User {
  let cached = strippedCache.get(user);
  if (!cached) {
    cached = stripSecrets(user);
    strippedCache.set(user, cached);
  }
  return cached;
}

/** All customers for the admin dashboard (demo only). */
export function useAllUsers(): User[] {
  const users = useAuthStore((s) => s.users);
  return Object.values(users).map(stripSecretsMemo);
}
