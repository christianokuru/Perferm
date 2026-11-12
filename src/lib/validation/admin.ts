import { z } from "zod";

import { concentrationLabels, familyLabels, genderLabels } from "@/lib/catalog/labels";
import { collections } from "@/lib/data/collections";

const ALLOWED_IMAGE_HOSTS = ["images.pexels.com"];
const MAX_DATA_URL_LENGTH = 2_000_000; // ≈1.5 MB image

/** Accepts https URLs on allow-listed hosts, or an uploaded raster data URL. */
export const imageSourceField = z
  .string()
  .trim()
  .refine((value) => {
    if (value.startsWith("data:")) {
      return /^data:image\/(png|jpeg|webp|avif);base64,[A-Za-z0-9+/=]+$/.test(value) && value.length <= MAX_DATA_URL_LENGTH;
    }
    try {
      const url = new URL(value);
      return url.protocol === "https:" && ALLOWED_IMAGE_HOSTS.includes(url.hostname);
    } catch {
      return false;
    }
  }, `Use an image upload or an https link from ${ALLOWED_IMAGE_HOSTS.join(", ")}`);

const keys = <T extends Record<string, unknown>>(record: T) => Object.keys(record) as [keyof T & string, ...Array<keyof T & string>];

const notesField = z
  .string()
  .trim()
  .max(200)
  .transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean))
  .pipe(z.array(z.string().max(40)).min(1, "Add at least one note").max(8, "Up to 8 notes"));

export const variantFormSchema = z.object({
  id: z.string().max(96).optional(),
  label: z.string().trim().min(1, "Size label required").max(20),
  price: z.coerce.number<string | number>().int("Whole naira only").min(100, "Minimum ₦100").max(50_000_000),
  compareAtPrice: z.coerce.number<string | number>().int().min(0).max(50_000_000).optional().or(z.literal("")),
  stock: z.coerce.number<string | number>().int("Whole number").min(0).max(100_000),
});

export const productFormSchema = z.object({
  name: z.string().trim().min(2, "Name required").max(80),
  house: z.string().trim().min(2, "House required").max(60),
  tagline: z.string().trim().min(4, "Tagline required").max(120),
  description: z.string().trim().min(20, "Write at least a sentence").max(2000),
  gender: z.enum(keys(genderLabels)),
  concentration: z.enum(keys(concentrationLabels)),
  families: z.array(z.enum(keys(familyLabels))).min(1, "Choose at least one family"),
  collections: z.array(z.enum(collections.map((c) => c.slug) as [string, ...string[]])).max(5),
  top: notesField,
  heart: notesField,
  base: notesField,
  longevity: z.string().trim().min(2).max(30),
  sillage: z.string().trim().min(2).max(30),
  images: z.array(imageSourceField).min(1, "Add at least one image").max(6),
  variants: z.array(variantFormSchema).min(1, "Add at least one size").max(6),
  isNew: z.boolean(),
  isBestseller: z.boolean(),
});

export type ProductFormInput = z.input<typeof productFormSchema>;

export const zoneFormSchema = z.object({
  fee: z.coerce.number<string | number>().int("Whole naira only").min(0).max(1_000_000),
  eta: z.string().trim().min(2).max(40),
});

export const settingsFormSchema = z.object({
  storeName: z.string().trim().min(2).max(60),
  supportEmail: z.email("Enter a valid email"),
  supportPhone: z.string().trim().min(7).max(20),
  announcement: z.string().trim().max(120),
  pickupEnabled: z.boolean(),
  pickupAddress: z.string().trim().min(5).max(200),
  pickupHours: z.string().trim().min(3).max(80),
  paystackEnabled: z.boolean(),
  flutterwaveEnabled: z.boolean(),
});
