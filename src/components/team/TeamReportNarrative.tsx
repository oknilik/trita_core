type NarrativeBlock =
  | { type: "bullets"; items: string[] }
  | { type: "para"; text: string };

function parseNarrativeBlocks(text: string): NarrativeBlock[] {
  const blocks: NarrativeBlock[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^[•\-*]\s+(.*)$/);
    if (m) {
      const last = blocks[blocks.length - 1];
      if (last?.type === "bullets") last.items.push(m[1]);
      else blocks.push({ type: "bullets", items: [m[1]] });
    } else {
      blocks.push({ type: "para", text: line });
    }
  }
  return blocks;
}

const NARRATIVE_TONES = {
  sage: {
    circle: "bg-sage/15 text-sage-dark",
    path: "M3 8h10M9 4l4 4-4 4",
  },
  sky: {
    circle: "bg-layer-org-soft text-layer-org-bright",
    path: "M4 13.5V3h7.5L10 5.5 11.5 8H4",
  },
  bronze: {
    circle: "bg-bronze-soft/60 text-bronze-dark",
    path: "M3 4h10v7H8.5L5.5 13.5V11H3z",
  },
  emerald: {
    circle: "bg-sage-soft text-state-success-fg",
    path: "M3 8.5l3 3 7-7",
  },
  amber: {
    circle: "bg-state-warning-bg text-state-warning-fg",
    path: "M8 3v6M8 12.5v.5",
  },
} as const;

export function NarrativeRich({
  label,
  text,
  tone,
  card = true,
}: {
  label?: string;
  text: string | null;
  tone: keyof typeof NARRATIVE_TONES;
  /** true → a bullet-sorok kártya-hátteret kapnak; false → könnyű ikonos sor. */
  card?: boolean;
}) {
  if (!text || text.trim().length === 0) return null;
  const blocks = parseNarrativeBlocks(text);
  const t = NARRATIVE_TONES[tone];
  return (
    <div>
      {label ? (
        <p className="mb-2 text-caption font-semibold text-ink">
          {label}
        </p>
      ) : null}
      <div className="flex flex-col gap-2">
        {blocks.map((block, i) =>
          block.type === "para" ? (
            <p key={i} className="text-sm leading-relaxed text-ink-body">
              {block.text}
            </p>
          ) : (
            <ul key={i} className="flex flex-col gap-2">
              {block.items.map((item, j) => (
                <li
                  key={j}
                  className={`flex items-start gap-2.5 ${
                    card
                      ? "rounded-[12px] border border-sand bg-cream/40 px-3.5 py-2.5"
                      : ""
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${t.circle}`}
                  >
                    <svg
                      viewBox="0 0 16 16"
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d={t.path} />
                    </svg>
                  </span>
                  <span className="text-sm leading-relaxed text-ink-body">{item}</span>
                </li>
              ))}
            </ul>
          ),
        )}
      </div>
    </div>
  );
}
