/**
 * Editorial photography (Pexels licence — free for commercial use).
 * Replace with the house's own product shots when the catalogue moves to Supabase Storage.
 */
export function pexels(id: number, width = 1600): string {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;
}

/**
 * Asks the image CDN for a server-side crop that matches the frame it will
 * fill. Without it, a landscape photo in a portrait frame is scaled up by
 * `object-cover` and looks soft on high-density phones. Sources without a
 * crop API (e.g. our own Storage uploads) are returned unchanged.
 */
export function cropTo(src: string, width: number, height: number): string {
  try {
    const url = new URL(src);
    if (url.hostname !== "images.pexels.com") return src;
    url.searchParams.set("fit", "crop");
    url.searchParams.set("w", String(width));
    url.searchParams.set("h", String(height));
    return url.toString();
  } catch {
    return src;
  }
}

/** 4:5 portrait crop — the shape of every product and collection frame. */
export const portrait = (src: string, width = 1400) => cropTo(src, width, Math.round(width * 1.25));

export const imagery = {
  heroModel: pexels(3774940, 2000),
  heroProduct: pexels(37127787, 1800),
  oudDark: pexels(30981935, 2000),
  smoke: pexels(11230057, 1800),
  incense: pexels(40382309, 1600),
  brassBurner: pexels(40403138, 1600),
  coffee: pexels(32148345, 1600),
  modelBeige: pexels(6954639, 1600),
  trio: pexels(34051691, 1600),
  attarShelf: pexels(17155311, 1600),
  giftHands: pexels(34144749, 1600),
  giftSilk: pexels(34144825, 1600),
  reflective: pexels(35930230, 1600),
  orientalWhite: pexels(36389336, 1400),
  orientalMirror: pexels(36389331, 1400),
  orientalTall: pexels(36389344, 1400),
  orientalBlue: pexels(36389341, 1400),
  orientalPurple: pexels(36389334, 1400),
  goldBlack: pexels(7702669, 1400),
  darkBottle: pexels(16239693, 1400),
  frosted: pexels(34089130, 1400),
  shell: pexels(16266295, 1400),
  warmBox: pexels(7005940, 1400),
  geometric: pexels(13875783, 1400),
  goldAccent: pexels(11711808, 1400),
  goldCaps: pexels(12402366, 1400),
  marble: pexels(12456276, 1400),
  blush: pexels(15007560, 1400),
  amberShelf: pexels(15097440, 1400),
} as const;
