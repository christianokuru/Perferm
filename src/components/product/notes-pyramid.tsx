import type { ScentNotes } from "@/lib/types";

const tiers: Array<{ key: keyof ScentNotes; label: string; hint: string }> = [
  { key: "top", label: "Top", hint: "The first impression · 0–30 min" },
  { key: "heart", label: "Heart", hint: "The character · 30 min – 4 h" },
  { key: "base", label: "Base", hint: "The memory · 4 h +" },
];

/** Olfactory pyramid rendered as three hairline-ruled tiers. */
export function NotesPyramid({ notes }: { notes: ScentNotes }) {
  return (
    <dl className="divide-y divide-mist border-y border-mist">
      {tiers.map((tier, i) => (
        <div key={tier.key} className="grid grid-cols-[5.5rem_1fr] gap-4 py-5 md:grid-cols-[8rem_1fr]">
          <dt>
            <span className="block text-[2rem] leading-none font-extralight tracking-[-0.06em] text-ink">0{i + 1}</span>
            <span className="mt-1 block text-caption text-smoke">{tier.label}</span>
          </dt>
          <dd>
            <ul className="flex flex-wrap gap-1.5">
              {notes[tier.key].map((note) => (
                <li key={note} className="rounded-[30px] border border-apricot/70 px-3 py-1.5 text-body-sm text-ink">
                  {note}
                </li>
              ))}
            </ul>
            <p className="mt-2.5 text-caption text-smoke">{tier.hint}</p>
          </dd>
        </div>
      ))}
    </dl>
  );
}
