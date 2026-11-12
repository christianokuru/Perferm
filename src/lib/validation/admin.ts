import { z } from "zod";

import { concentrationLabels, familyLabels, genderLabels } from "@/lib/catalog/labels";
import { productImagePrefix } from "@/lib/config/public-env";

const ALLOWED_IMAGE_HOSTS = ["images.pexels.com"];

/** Accepts our own Storage uploads, or https links on allow-listed hosts (no data: URLs, no arbitrary hosts). */
export const imageSourceField = z
  .string()
  .trim()
  .max(1000)
  .refine((value) => {
    if (value.startsWith(productImagePrefix)) return /^[\w./-]+$/.test(value.slice(productImagePrefix.length));
    try {
      const url = new URL(value);
      return url.protocol === "https:" && ALLOWED_IMAGE_HOSTS.includes(url.hostname) && !url.username && !url.password;
    } catch {
      return false;
    }
  }, `Upload an image, or paste an https link from ${ALLOWED_IMAGE_HOSTS.join(", ")}`);

export const productImageSchema = z.object({
  src: imageSourceField,
  storagePath: z
    .string()
    .regex(/^products\/[\w-]+\.(png|jpe?g|webp|avif)$/)
    .optional(),
});

const keys = <T extends Record<string, unknown>>(record: T) => Object.keys(record) as [keyof T & string, ...Array<keyof T & string>];

const notesField = z
  .string()
  .trim()
  .max(200)
  .transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean))
  .pipe(z.array(z.string().max(40)).min(1, "Add at least one note").max(8, "Up to 8 notes"));

export const variantFormSchema = z.object({
  id: z.uuid().optional(),
  label: z.string().trim().min(1, "Size label required").max(20),
  price: z.coerce.number<string | number>().int("Whole naira only").min(100, "Minimum ₦100").max(50_000_000),
  compareAtPrice: z.coerce.number<string | number>().int().min(0).max(50_000_000).optional().or(z.literal("")),
  stock: z.coerce.number<string | number>().int("Whole number").min(0).max(100_000),
}).refine((v) => !v.compareAtPrice || Number(v.compareAtPrice) === 0 || Number(v.compareAtPrice) > v.price, {
  message: "Must be higher than the price",
  path: ["compareAtPrice"],
});

export const productFormSchema = z.object({
  name: z.string().trim().min(2, "Name required").max(80),
  house: z.string().trim().min(2, "House required").max(60),
  tagline: z.string().trim().min(4, "Tagline required").max(120),
  description: z.string().trim().min(20, "Write at least a sentence").max(2000),
  gender: z.enum(keys(genderLabels)),
  concentration: z.enum(keys(concentrationLabels)),
  families: z.array(z.enum(keys(familyLabels))).min(1, "Choose at least one family"),
  // Checked against the collections table when saving.
  collections: z.array(z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(60)).max(10),
  top: notesField,
  heart: notesField,
  base: notesField,
  longevity: z.string().trim().min(2).max(30),
  sillage: z.string().trim().min(2).max(30),
  images: z.array(productImageSchema).min(1, "Add at least one image").max(6),
  variants: z.array(variantFormSchema).min(1, "Add at least one size").max(6),
  isNew: z.boolean(),
  isBestseller: z.boolean(),
});

export type ProductFormInput = z.input<typeof productFormSchema>;

export const zoneFormSchema = z.object({
  fee: z.coerce.number<string | number>().int("Whole naira only").min(0).max(1_000_000),
  eta: z.string().trim().min(2, "Add an estimate").max(40),
  active: z.boolean().default(true),
});

export const settingsFormSchema = z.object({
  storeName: z.string().trim().min(2).max(60),
  supportEmail: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")),
  supportPhone: z.string().trim().min(7).max(20),
  announcement: z.string().trim().max(120),
  pickupEnabled: z.boolean(),
  pickupAddress: z.string().trim().min(5).max(200),
  pickupHours: z.string().trim().min(3).max(80),
  paystackEnabled: z.boolean(),
  flutterwaveEnabled: z.boolean(),
}).refine((s) => s.paystackEnabled || s.flutterwaveEnabled, {
  message: "Keep at least one payment gateway enabled",
  path: ["paystackEnabled"],
});
