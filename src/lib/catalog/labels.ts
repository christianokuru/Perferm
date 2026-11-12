import type { Concentration, Gender, OrderStatus, ScentFamily } from "@/lib/types";

export const genderLabels: Record<Gender, string> = {
  her: "For her",
  him: "For him",
  unisex: "Unisex",
};

export const concentrationLabels: Record<Concentration, string> = {
  extrait: "Extrait de Parfum",
  edp: "Eau de Parfum",
  edt: "Eau de Toilette",
  attar: "Attar oil",
  bakhoor: "Bakhoor",
  "gift-set": "Gift set",
};

export const familyLabels: Record<ScentFamily, string> = {
  woody: "Woody",
  oriental: "Amber & oriental",
  floral: "Floral",
  fresh: "Fresh",
  gourmand: "Gourmand",
  musky: "Musk",
  citrus: "Citrus",
};

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  processing: "Being prepared",
  shipped: "On its way",
  ready_for_pickup: "Ready for pickup",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most loved" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
] as const;

export type SortValue = (typeof sortOptions)[number]["value"];

export const priceBands = [
  { value: "under-75k", label: "Under ₦75,000", min: 0, max: 7_500_000 },
  { value: "75k-150k", label: "₦75,000 – ₦150,000", min: 7_500_000, max: 15_000_000 },
  { value: "150k-300k", label: "₦150,000 – ₦300,000", min: 15_000_000, max: 30_000_000 },
  { value: "over-300k", label: "Over ₦300,000", min: 30_000_000, max: Number.POSITIVE_INFINITY },
] as const;

export type PriceBandValue = (typeof priceBands)[number]["value"];
