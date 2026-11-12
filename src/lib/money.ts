import type { Kobo } from "./types";

const formatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  currencyDisplay: "narrowSymbol",
  maximumFractionDigits: 0,
});

/** Formats integer kobo as Naira, e.g. 12500000 → "₦125,000". */
export function formatNaira(kobo: Kobo): string {
  return formatter.format(Math.round(kobo) / 100);
}

export function naira(amount: number): Kobo {
  return Math.round(amount * 100);
}

export function koboToNaira(kobo: Kobo): number {
  return Math.round(kobo) / 100;
}
