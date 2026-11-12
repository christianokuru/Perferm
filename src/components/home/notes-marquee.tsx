import { SparkleIcon } from "@/components/icons";

const notes = ["Saffron", "Taif rose", "Cambodian oud", "Ambergris", "Jasmine sambac", "White musk", "Frankincense", "Madagascan vanilla"];

/** Infinite CSS marquee of signature notes. Duplicated track = seamless loop. */
export function NotesMarquee() {
  const track = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center gap-8 pr-8">
      {notes.map((note) => (
        <li key={note} className="flex items-center gap-8 text-[13px] tracking-[0.16em] text-ink uppercase">
          {note}
          <SparkleIcon size={12} className="text-saffron" />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="overflow-hidden border-b border-mist py-4">
      <p className="sr-only">Signature notes: {notes.join(", ")}</p>
      <div aria-hidden="true" className="flex w-max animate-marquee hover:[animation-play-state:paused]">
        {track(false)}
        {track(true)}
      </div>
    </div>
  );
}
