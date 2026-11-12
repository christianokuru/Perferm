import { ImageResponse } from "next/og";

import { BrandMark } from "@/lib/brand-mark";

/** PWA manifest icons, generated at build time. */
const icons = {
  "icon-192.png": { size: 192, padded: false },
  "icon-512.png": { size: 512, padded: false },
  "maskable-512.png": { size: 512, padded: true },
} as const;

type IconFile = keyof typeof icons;

export function generateStaticParams() {
  return Object.keys(icons).map((file) => ({ file }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const icon = icons[file as IconFile];
  if (!icon) return new Response("Not found", { status: 404 });
  return new ImageResponse(<BrandMark size={icon.size} padded={icon.padded} />, {
    width: icon.size,
    height: icon.size,
    headers: { "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
