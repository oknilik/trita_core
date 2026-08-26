import { dimColorsCss } from "@/lib/color-system";

/**
 * Szerkesztői hőtérkép-ábra a bloghoz — a termék csapat-hőtérképének
 * (src/components/manager/TeamHeatmap.tsx) egyszerűsített mása, cikkben
 * deklarált, kitalált demó-adatokkal. A cellageometria és a szín-rámpa
 * azonos: dimenzió-hue, a pontszám a telítettségben (a TeamHeatmap
 * `scoreToAlpha` képlete: 0,1 + pont/100 × 0,78). A színek a CSS-változós
 * dim-palettáról jönnek, így az ábra a színsémával együtt vált; az érték
 * minden cellában közvetlenül olvasható, tehát az ábra egyben a saját
 * táblázat-nézete is.
 */

interface HeatmapDim {
  code: string;
  label: string;
}

interface HeatmapFigureRow {
  name: string;
  /** A `dims` sorrendjében; null = nincs kitöltés. */
  scores: (number | null)[];
}

interface TeamHeatmapFigureProps {
  locale: "hu" | "en";
  /** Teszt-segéd: a publikált ábra mindig a lenti, jelölten kitalált adatot használja. */
  rows?: HeatmapFigureRow[];
}

const DEMO_ROWS: HeatmapFigureRow[] = [
  { name: "Anna", scores: [62, 55, 81, 74, 78, 58] },
  { name: "Bence", scores: [78, 38, 26, 66, 84, 62] },
  { name: "Csilla", scores: [45, 70, 58, 72, 71, 82] },
  { name: "Dávid", scores: [70, 44, 49, 61, 38, 79] },
  { name: "Eszter", scores: [83, 62, 44, 78, 75, 45] },
  { name: "Feri", scores: [31, 30, 72, 58, 69, 51] },
];

const COPY: Record<
  TeamHeatmapFigureProps["locale"],
  {
    memberLabel: string;
    dims: HeatmapDim[];
    zoneLabels: { high: string; mid: string; low: string };
    legendLabel: string;
    caption: string;
  }
> = {
  hu: {
    memberLabel: "Csapattag",
    legendLabel: "0 → 100 pont: halványtól telítettig",
    zoneLabels: { high: "magas", mid: "közepes", low: "alacsony" },
    caption:
      "Kitalált csapat, kézzel választott demó-pontszámok — a megjelenítés a trita csapat-hőtérképének egyszerűsített mása. A 0–100-as érték megjelenítési skála, nem percentilis.",
    dims: [
      { code: "H", label: "Becsületesség–Alázat" },
      { code: "E", label: "Emocionalitás" },
      { code: "X", label: "Extraverzió" },
      { code: "A", label: "Barátságosság" },
      { code: "C", label: "Lelkiismeretesség" },
      { code: "O", label: "Nyitottság" },
    ],
  },
  en: {
    memberLabel: "Team member",
    legendLabel: "0 → 100 points: pale to saturated",
    zoneLabels: { high: "high", mid: "medium", low: "low" },
    caption:
      "A fictional team with hand-picked demo scores — the display is a simplified replica of trita's team heatmap. The 0–100 value is a display scale, not a percentile.",
    dims: [
      { code: "H", label: "Honesty–Humility" },
      { code: "E", label: "Emotionality" },
      { code: "X", label: "Extraversion" },
      { code: "A", label: "Agreeableness" },
      { code: "C", label: "Conscientiousness" },
      { code: "O", label: "Openness" },
    ],
  },
};

function mixTint(code: string, ratio: number): string {
  const pct = Math.round(Math.min(Math.max(ratio, 0), 1) * 100);
  return `color-mix(in srgb, ${dimColorsCss(code).base} ${pct}%, transparent)`;
}

/** A TeamHeatmap cella-rámpája: 0,1 + pont/100 × 0,78. */
function cellTint(code: string, score: number): string {
  return mixTint(code, 0.1 + (score / 100) * 0.78);
}

/** A TeamHeatmap cellakerete: a rámpa + 0,15, legfeljebb 0,4. */
function cellBorderTint(code: string, score: number): string {
  return mixTint(code, Math.min(0.1 + (score / 100) * 0.78 + 0.15, 0.4));
}

export function TeamHeatmapFigure({
  locale,
  rows = DEMO_ROWS,
}: TeamHeatmapFigureProps) {
  // A komplex tömböket nem az MDX-forráson át adjuk át. Így a dinamikusan
  // fordított MDX és az importált RSC-komponens határán csak egy primitív
  // locale prop utazik, a statikus prerender pedig nem kaphat hiányzó
  // `dims`/`rows` értéket (Vercel build, 2026-08-26).
  const { memberLabel, dims, zoneLabels, legendLabel, caption } = COPY[locale];
  const zone = (score: number) =>
    score >= 70
      ? { label: zoneLabels.high, cls: "text-ink" }
      : score >= 40
        ? { label: zoneLabels.mid, cls: "text-ink-body" }
        : { label: zoneLabels.low, cls: "text-ink-body" };

  return (
    <figure className="my-8 rounded-2xl border border-sand bg-surface-card p-4 md:p-6">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="min-w-[96px] pb-4 pr-4 text-left text-xs font-semibold text-muted">
                {memberLabel}
              </th>
              {dims.map((dim) => (
                <th key={dim.code} className="min-w-[76px] px-1.5 pb-4 text-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className="inline-flex h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: dimColorsCss(dim.code).strong }}
                    />
                    <span className="max-w-[76px] text-center text-micro font-semibold leading-tight text-muted">
                      {dim.label}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name} className="border-t border-sand/70">
                <td className="py-2 pr-4">
                  <span className="text-sm font-semibold text-ink">{row.name}</span>
                </td>
                {row.scores.map((score, i) => {
                  const dim = dims[i];
                  if (!dim) return null;
                  return (
                    <td key={dim.code} className="px-1.5 py-2">
                      <div
                        className="mx-auto flex h-12 w-[72px] flex-col items-center justify-center rounded-xl border"
                        style={
                          score != null
                            ? {
                                backgroundColor: cellTint(dim.code, score),
                                borderColor: cellBorderTint(dim.code, score),
                              }
                            : {
                                backgroundColor: "var(--color-surface-subtle)",
                                borderColor: "var(--color-sand)",
                              }
                        }
                      >
                        {score != null ? (
                          <>
                            <span className={`text-sm font-bold tabular-nums ${zone(score).cls}`}>
                              {score}
                            </span>
                            <span
                              className={`text-micro font-semibold uppercase tracking-wide opacity-70 ${zone(score).cls}`}
                            >
                              {zone(score).label}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-muted/60">–</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
        <div className="flex items-center gap-1">
          {[30, 60, 95].map((v) => (
            <div
              key={v}
              className="h-4 w-10 rounded-md"
              style={{ backgroundColor: cellTint(dims[0]?.code ?? "H", v) }}
            />
          ))}
        </div>
        <span>{legendLabel}</span>
      </div>

      {caption ? (
        <figcaption className="mt-3 text-micro leading-relaxed text-muted">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
