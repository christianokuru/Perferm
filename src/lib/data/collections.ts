import { imagery } from "@/lib/images";
import type { Collection } from "@/lib/types";

export const collections: Collection[] = [
  {
    slug: "arabian",
    title: "Arabian perfumery",
    accent: "Arabian",
    eyebrow: "The heritage",
    description:
      "Saffron, Taif rose, amber and resin — the grand tradition of the Gulf's perfume houses, composed for skin that lives in the Lagos heat.",
    image: { src: imagery.trio, alt: "Three ornate Arabian perfume bottles resting on white linen" },
  },
  {
    slug: "oud",
    title: "The oud edit",
    accent: "oud",
    eyebrow: "Liquid gold",
    description:
      "Aged agarwood from Cambodia, Assam and Hindi oud, from smoky bakhoor to the most refined extraits. Deep, resinous, unforgettable.",
    image: { src: imagery.oudDark, alt: "A dark perfume bottle on a carved agarwood base in warm light" },
  },
  {
    slug: "niche",
    title: "Niche houses",
    accent: "niche",
    eyebrow: "Rare & independent",
    description:
      "Small-batch perfumery from independent ateliers in Paris and Grasse — signatures you will not smell on anyone else in the room.",
    image: { src: imagery.reflective, alt: "Niche perfume bottles lined up on a reflective black surface" },
  },
  {
    slug: "attars",
    title: "Attar oils",
    accent: "attars",
    eyebrow: "Concentrated",
    description:
      "Alcohol-free perfume oils, hand-poured in crystal flacons. A single drop on the pulse lasts from morning majlis to midnight.",
    image: { src: imagery.attarShelf, alt: "Crystal attar oil bottles arranged on a wooden shelf" },
  },
  {
    slug: "gift-sets",
    title: "Gift sets",
    accent: "gifting",
    eyebrow: "To be given",
    description:
      "Coffrets and discovery wardrobes, wrapped by hand in our signature box — for weddings, Eid, birthdays and every reason in between.",
    image: { src: imagery.giftSilk, alt: "A luxury perfume gift box resting on folds of silk" },
  },
];
