import { z } from "zod";

import {
  emailField,
  honeypotField,
  nameField,
  optionalText,
  passwordField,
  phoneField,
  shortText,
  stateField,
} from "./fields";

export const MAX_LINE_QUANTITY = 10;
export const MAX_CART_LINES = 30;

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Please enter your password").max(128),
});

export const registerSchema = z
  .object({
    name: nameField,
    email: emailField,
    phone: phoneField,
    password: passwordField,
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, "Please accept the terms to continue"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({ email: emailField });

export const profileSchema = z.object({ name: nameField, phone: phoneField });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: passwordField,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: "Choose a password you haven't used here",
    path: ["newPassword"],
  });

export const addressSchema = z.object({
  label: shortText("a label", 30),
  recipient: nameField,
  phone: phoneField,
  state: stateField,
  city: shortText("a city or area", 60),
  address: shortText("a street address", 200),
  isDefault: z.boolean().default(false),
});

export const contactSchema = z.object({
  name: nameField,
  email: emailField,
  topic: z.enum(["order", "recommendation", "wholesale", "press", "other"], "Choose a topic"),
  message: z.string().trim().min(10, "Tell us a little more (10+ characters)").max(2000, "Message is too long"),
  website: honeypotField,
});

export const newsletterSchema = z.object({ email: emailField, website: honeypotField });

export const cartLineSchema = z.object({
  productId: z.string().min(1).max(64),
  variantId: z.string().min(1).max(96),
  quantity: z.number().int().min(1).max(MAX_LINE_QUANTITY),
});

const deliverySchema = z.object({
  method: z.literal("delivery"),
  state: stateField,
  city: shortText("a city or area", 60),
  address: shortText("a street address", 200),
  notes: optionalText(300),
});

const pickupSchema = z.object({ method: z.literal("pickup") });

export const fulfilmentSchema = z.discriminatedUnion("method", [deliverySchema, pickupSchema]);

export const checkoutSchema = z.object({
  name: nameField,
  email: emailField,
  phone: phoneField,
  fulfilment: fulfilmentSchema,
  provider: z.enum(["paystack", "flutterwave"], "Choose how you'd like to pay"),
  lines: z.array(cartLineSchema).min(1, "Your bag is empty").max(MAX_CART_LINES),
});

export const quoteSchema = z.object({
  lines: z.array(cartLineSchema).max(MAX_CART_LINES),
  fulfilment: z.discriminatedUnion("method", [
    z.object({ method: z.literal("pickup") }),
    z.object({ method: z.literal("delivery"), state: z.string().max(40).optional() }),
  ]),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CartLineInput = z.infer<typeof cartLineSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type QuoteInput = z.infer<typeof quoteSchema>;
