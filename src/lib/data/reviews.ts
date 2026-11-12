import type { Review } from "@/lib/types";

/** Testimonials shown on the home page and sampled for product pages. */
export const reviews: Review[] = [
  {
    id: "r1",
    author: "Adaeze O.",
    city: "Lekki, Lagos",
    rating: 5,
    title: "Compliments everywhere I go",
    body: "I wore Oud Al Layl to a wedding in Ikoyi and three different people stopped me to ask what it was. It lasted until I got home past midnight.",
    date: "2026-10-12",
  },
  {
    id: "r2",
    author: "Tunde B.",
    city: "Wuse II, Abuja",
    rating: 5,
    title: "Delivered in a day — beautifully wrapped",
    body: "Ordered on Tuesday, it was in Abuja on Wednesday. The box alone feels like a gift. Authentic, sealed, and the attar is incredible.",
    date: "2026-09-28",
  },
  {
    id: "r3",
    author: "Halima S.",
    city: "Kano",
    rating: 5,
    title: "Finally, real attar in Nigeria",
    body: "The Musk Tahara is exactly what I used to buy in Dubai. Clean, soft, and it stays on my abaya for days.",
    date: "2026-09-02",
  },
  {
    id: "r4",
    author: "Chiamaka E.",
    city: "GRA, Port Harcourt",
    rating: 4,
    title: "Rose de Taif is a dream",
    body: "Soft but present. I wish the 30 ml came in a travel atomiser, but the scent itself is perfect for the office.",
    date: "2026-08-19",
  },
  {
    id: "r5",
    author: "Ibrahim K.",
    city: "Victoria Island, Lagos",
    rating: 5,
    title: "The concierge helped me choose",
    body: "I sent a voice note describing my wife's taste and they recommended the Layali Gold. She hasn't worn anything else since.",
    date: "2026-07-30",
  },
  {
    id: "r6",
    author: "Funmi A.",
    city: "Ibadan",
    rating: 5,
    title: "Better than duty free",
    body: "Prices are honest, the bottles are authentic and the discovery set let me try before committing to a full bottle.",
    date: "2026-07-11",
  },
];

/** Deterministic sample so product pages are stable across renders. */
export function getProductReviews(productId: string, count = 3): Review[] {
  let seed = 0;
  for (const char of productId) seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
  const start = seed % reviews.length;
  return Array.from({ length: Math.min(count, reviews.length) }, (_, i) => reviews[(start + i) % reviews.length]);
}
