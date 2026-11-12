import { extendTailwindMerge } from "tailwind-merge";

type ClassValue = string | number | false | null | undefined | ClassValue[];

/** tailwind-merge taught our custom type scale so `text-body` vs `text-ink` aren't treated as conflicts. */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["caption", "body-sm", "body", "subheading", "heading-sm", "heading", "display"] }],
    },
  },
});

function flatten(values: ClassValue[], out: string[] = []): string[] {
  for (const value of values) {
    if (!value) continue;
    if (Array.isArray(value)) flatten(value, out);
    else out.push(String(value));
  }
  return out;
}

/**
 * Joins truthy class names and resolves Tailwind conflicts so a caller's
 * `className` reliably overrides a component's defaults (e.g. `hidden` vs `inline-flex`).
 */
export function cn(...values: ClassValue[]): string {
  return twMerge(flatten(values).join(" "));
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/**
 * Only allow same-origin relative paths for post-login redirects.
 * Blocks `//evil.com`, `/\evil.com`, absolute URLs and javascript: URIs.
 */
export function safeRedirectPath(value: string | null | undefined, fallback = "/account"): string {
  if (!value || typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(value)) return fallback;
  return value;
}

/** Cryptographically random, human-friendly order reference, e.g. PF-7K3Q9X2M. */
export function createReference(prefix = "PF"): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let id = "";
  for (const byte of bytes) id += alphabet[byte % alphabet.length];
  return `${prefix}-${id}`;
}

export function formatDate(iso: string, options: Intl.DateTimeFormatOptions = { dateStyle: "medium" }): string {
  return new Intl.DateTimeFormat("en-NG", options).format(new Date(iso));
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
