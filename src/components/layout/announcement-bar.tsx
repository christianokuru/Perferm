"use client";

import { useEffect, useState } from "react";

/** Slim black cap that gently cycles the store's service promises. */
export function AnnouncementBar({ messages }: { messages: string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches || messages.length < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % messages.length), 4500);
    return () => window.clearInterval(id);
  }, [messages.length]);

  return (
    <div className="bg-graphite text-white">
      <div className="container-page flex h-8 items-center justify-center overflow-hidden">
        <p key={index} className="animate-fade-in truncate text-[11px] tracking-[0.06em]" aria-live="off">
          {messages[index % messages.length]}
        </p>
      </div>
    </div>
  );
}
