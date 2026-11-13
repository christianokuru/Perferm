"use client";

import { usePathname } from "next/navigation";

import { Breadcrumbs } from "@/components/ui/misc";
import type { Crumb } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Breadcrumb trails for the admin and account areas, derived from the URL so
 * every page (including new ones) gets one without wiring it up per page.
 * To label a new page, add its URL segment to the area's `labels` map.
 */

interface Area {
  /** Crumbs shown before the area's own root, e.g. Home. */
  lead: Crumb[];
  root: { href: string; label: string };
  labels: Record<string, string>;
  /** Label for a dynamic segment (an id or reference), given its parent segment. */
  dynamic: (parent: string, segment: string) => string;
}

const areas = {
  admin: {
    lead: [],
    root: { href: "/admin", label: "Dashboard" },
    labels: {
      products: "Products",
      new: "New product",
      orders: "Orders",
      customers: "Customers",
      reviews: "Reviews",
      messages: "Messages",
      delivery: "Delivery",
      settings: "Settings",
      profile: "Your profile",
      subscribers: "Subscribers",
    },
    dynamic: (parent, segment) => (parent === "products" ? "Edit product" : segment.toUpperCase()),
  },
  account: {
    lead: [{ label: "Home", href: "/" }],
    root: { href: "/account", label: "Account" },
    labels: { orders: "Orders", addresses: "Addresses", settings: "Settings" },
    dynamic: (_parent, segment) => segment.toUpperCase(),
  },
} satisfies Record<string, Area>;

function decode(segment: string) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function buildCrumbs(area: Area, pathname: string): Crumb[] {
  const { root } = area;
  if (pathname !== root.href && !pathname.startsWith(`${root.href}/`)) return [];
  const segments = pathname.slice(root.href.length).split("/").filter(Boolean).map(decode);
  const crumbs: Crumb[] = [...area.lead, { label: root.label, href: root.href }];
  let href = root.href;
  segments.forEach((segment, i) => {
    href += `/${encodeURIComponent(segment)}`;
    const label = area.labels[segment] ?? area.dynamic(segments[i - 1] ?? "", segment);
    crumbs.push({ label, href });
  });
  return crumbs;
}

export function AreaBreadcrumbs({ area, className }: { area: keyof typeof areas; className?: string }) {
  const pathname = usePathname();
  const config = areas[area];
  const crumbs = buildCrumbs(config, pathname);
  // On the area's home page the trail would only repeat the page title.
  if (crumbs.length - config.lead.length < 2) return null;
  return <Breadcrumbs items={crumbs} className={cn("mb-5", className)} />;
}
