import { z } from "zod";

import { nigerianStates } from "@/lib/data/delivery-zones";

/** Shared field primitives. Every user input passes through one of these. */

export const nameField = z
  .string()
  .trim()
  .min(2, "Please enter your full name")
  .max(80, "Name is too long")
  .regex(/^[\p{L}\p{M}' .-]+$/u, "Name can only contain letters, spaces, apostrophes and hyphens");

export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "Email is too long")
  .pipe(z.email("Please enter a valid email address"));

/** Nigerian mobile numbers: 080…, +23480…, 23480… (spaces and dashes allowed). */
export const phoneField = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s()-]/g, ""))
  .pipe(z.string().regex(/^(\+?234|0)[789][01]\d{8}$/, "Enter a valid Nigerian phone number, e.g. 0801 234 5678"));

export const passwordField = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(128, "Password is too long")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/\d/, "Include a number");

export const stateField = z
  .string()
  .refine((value) => nigerianStates.includes(value), "Please choose a state");

export const shortText = (label: string, max = 120) =>
  z.string().trim().min(2, `Please enter ${label}`).max(max, `${label[0].toUpperCase()}${label.slice(1)} is too long`);

export const optionalText = (max = 300) => z.string().trim().max(max, "This is too long").optional().or(z.literal(""));

/** Honeypot: real users never see or fill this field. */
export const honeypotField = z.string().max(0, "Spam detected").optional().or(z.literal(""));

export type FieldErrors = Record<string, string>;

/** Flattens a Zod error into `{ "path.to.field": "first message" }`. */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export type ValidationResult<T> = { ok: true; data: T } | { ok: false; errors: FieldErrors };

export function validate<T>(schema: z.ZodType<T>, input: unknown): ValidationResult<T> {
  const result = schema.safeParse(input);
  return result.success ? { ok: true, data: result.data } : { ok: false, errors: toFieldErrors(result.error) };
}
