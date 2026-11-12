"use client";

import { useEffect, useState } from "react";

import { siteConfig } from "@/lib/config/site";

/** Slim black cap that gently cycles the store's service promises. */
export function AnnouncementBar() {
  const [index, setIndex] = useState(0);
  const messages = siteConfig.announcements;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % messages.length), 4500);
    return () => window.clearInterval(id);
  }, [messages.length]);

  return (
    <div className="bg-graphite text-white">
      <div className="container-page flex h-8 items-center justify-center overflow-hidden">
        <p key={index} className="animate-fade-in truncate text-[11px] tracking-[0.06em]" aria-live="off">
          {messages[index]}
        </p>
      </div>
    </div>
  );
}
