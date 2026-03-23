import type { Locale } from "@/lib/i18n";

interface FacetEntry {
  code: string;
  label: string;
  score: number;
  dimCode: string;
  dimLabel: string;
  dimColor: string;
}

interface GrowthFocusProps {
  /** Top 3 lowest-scored facets (pre-computed in page) */
  items: FacetEntry[];
  locale: Locale;
}

// Generic growth suggestion per dimension
const GROWTH_HINT: Record<string, Record<"hu" | "en", string>> = {
  H: {
    hu: "Tudatos értékek mentén való döntéshozatal és átlátható kommunikáció.",
    en: "Value-aligned decision-making and transparent communication.",
  },
  E: {
    hu: "Stresszkezelési technikák és érzelmi önszabályozás erősítése.",
    en: "Strengthening stress management and emotional self-regulation.",
  },
  X: {
    hu: "Társas jelenlét és láthatóság tudatos növelése.",
    en: "Consciously building social presence and visibility.",
  },
  A: {
    hu: "Együttműködési és konfliktuskezelési készségek fejlesztése.",
    en: "Developing collaboration and conflict resolution skills.",
  },
  C: {
    hu: "Szervezettség, tervezés és következetes végrehajtás fejlesztése.",
    en: "Building organization, planning, and consistent execution.",
  },
  O: {
    hu: "Kíváncsiság, tanulási kedv és kreatív gondolkodás ösztönzése.",
    en: "Encouraging curiosity, a learning mindset, and creative thinking.",
  },
  I: {
    hu: "Mások iránt való figyelem és altruista viselkedés erősítése.",
    en: "Strengthening attention to others and altruistic behavior.",
  },
};

export function GrowthFocus({ items, locale }: GrowthFocusProps) {
  const isHu = locale === "hu";

  if (items.length === 0) {
    return (
      <p className="text-sm text-ink-body">
        {isHu
          ? "Kiváló eredmények — nincs kiemelt fejlődési terület."
          : "Excellent results — no highlighted growth areas."}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item, idx) => {
        const hint = GROWTH_HINT[item.dimCode]?.[locale] ?? GROWTH_HINT[item.dimCode]?.hu ?? "";
        return (
          <div
            key={item.code}
            className="flex gap-4 rounded-2xl border border-sand bg-white p-5"
          >
            {/* Number badge */}
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-fraunces text-lg font-semibold text-white"
              style={{ backgroundColor: item.dimColor }}
            >
              {idx + 1}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-ink">{item.label}</span>
                <span
                  className="rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest"
                  style={{
                    backgroundColor: `${item.dimColor}18`,
                    color: item.dimColor,
                  }}
                >
                  {item.dimLabel}
                </span>
              </div>

              {/* Score bar */}
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-sand">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${item.score}%`, backgroundColor: item.dimColor }}
                  />
                </div>
                <span className="shrink-0 font-mono text-xs text-ink-body">
                  {item.score}%
                </span>
              </div>

              {/* Growth hint */}
              <p className="mt-2 text-sm leading-relaxed text-ink-body">{hint}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
