/** Money is always stored as integer kobo (₦1 = 100 kobo) to avoid float errors. */
export type Kobo = number;

export type Gender = "her" | "him" | "unisex";

export type Concentration = "extrait" | "edp" | "edt" | "attar" | "bakhoor" | "gift-set";

export type ScentFamily = "woody" | "oriental" | "floral" | "fresh" | "gourmand" | "musky" | "citrus";

export interface ProductImage {
  src: string;
  alt: string;
  /** Set for images uploaded to Supabase Storage (lets admins delete the file). */
  storagePath?: string;
}

export interface ProductVariant {
  id: string;
  label: string;
  price: Kobo;
  compareAtPrice?: Kobo;
  stock: number;
}

export interface ScentNotes {
  top: string[];
  heart: string[];
  base: string[];
}

export interface Review {
  id: string;
  author: string;
  city: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  verified?: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  house: string;
  tagline: string;
  description: string;
  gender: Gender;
  concentration: Concentration;
  families: ScentFamily[];
  collections: string[];
  notes: ScentNotes;
  images: ProductImage[];
  variants: ProductVariant[];
  longevity: string;
  sillage: string;
  rating: number;
  reviewCount: number;
  isNew?: boolean;
  isBestseller?: boolean;
  createdAt: string;
  archived?: boolean;
}

export interface Collection {
  slug: string;
  title: string;
  /** Word rendered in the italic serif accent inside the heading. */
  accent: string;
  eyebrow: string;
  description: string;
  image: ProductImage;
}

export interface DeliveryZone {
  state: string;
  fee: Kobo;
  eta: string;
}

export type FulfilmentMethod = "delivery" | "pickup";

export type PaymentProvider = "paystack" | "flutterwave";

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "ready_for_pickup"
  | "delivered"
  | "cancelled";

export interface OrderLine {
  productId: string | null;
  variantId: string | null;
  slug?: string;
  name: string;
  house: string;
  variantLabel: string;
  image: string;
  unitPrice: Kobo;
  quantity: number;
}

export interface OrderTotals {
  subtotal: Kobo;
  deliveryFee: Kobo;
  total: Kobo;
}

export interface OrderEvent {
  kind: "created" | "status" | "payment" | "note" | "stock";
  status: OrderStatus | null;
  message: string | null;
  internal: boolean;
  createdAt: string;
}

export interface Order {
  id: string;
  reference: string;
  createdAt: string;
  status: OrderStatus;
  customer: { name: string; email: string; phone: string };
  fulfilment:
    | { method: "pickup"; location?: string }
    | { method: "delivery"; state: string; city: string; address: string; notes?: string };
  payment: { provider: PaymentProvider; mode: "live" | "demo"; transactionId?: string; paidAt?: string };
  lines: OrderLine[];
  totals: OrderTotals;
  cancelReason?: string;
  stockIssue?: boolean;
  userId?: string | null;
  events: OrderEvent[];
}

export interface Crumb {
  label: string;
  href?: string;
}
