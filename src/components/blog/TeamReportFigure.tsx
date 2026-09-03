import { dimColorsCss } from "@/lib/color-system";

interface AggregateDimension {
  code: string;
  label: string;
  average: number;
  spread: number;
}

/**
 * `variant="case"` — az anonimizált csapattörténet módosított, valós
 * eredetű adatai. `variant="reference"` — kitalált tanító példa a
 * profil-olvasásról szóló cikkhez. A kettő SZÁNDÉKOSAN nem ugyanaz: a
 * történet képaláírása valós csapat módosított adataira hivatkozik, és
 * ez az állítás elveszne, ha ugyanaz a sor jelenne meg máshol
 * illusztrációként.
 *
 * A variánst string prop viszi, nem objektum: a next-mdx-remote v6
 * kiszűri a JS-kifejezéseket az MDX-ből (ld.
 * tests/unit/blog/mdx-expression-guard.test.ts).
 */
interface TeamReportFigureProps {
  locale: "hu" | "en";
  variant?: "case" | "reference";
  dimensions?: AggregateDimension[];
}

const LABELS = {
  hu: {
    title: "Aggregált csapatprofil",
    subtitle: "Csapatátlag és belső sokféleség - egyéni eredmények nélkül",
    average: "Csapatátlag",
    diversity: "Belső sokféleség",
    narrow: "szűk",
    moderate: "mérsékelt",
    wide: "széles",
    caption:
      "A teljes csapatriport aggregált személyiségképet bemutató részének egyszerűsített ábrája. A közös nézet csak aggregált csapatadatot mutat; más csapattag egyéni értéke nem látható.",
    captionReference:
      "Kitalált példa a riport aggregált szeletének olvasásához, nem valós csapat adata. Figyeld a sáv szélességét: a Barátságosság szűk sávja hasonló munkamódot jelez, a Lelkiismeretesség széles sávja többfélét. A közös nézet itt sem mutatja, ki hol áll.",
  },
  en: {
    title: "Aggregate team profile",
    subtitle: "Team average and internal diversity - without individual results",
    average: "Team average",
    diversity: "Internal diversity",
    narrow: "narrow",
    moderate: "moderate",
    wide: "wide",
    caption:
      "A simplified illustration of the part of the full team report that presents the aggregate personality picture. The shared view contains aggregate team data only; no other team member's individual values are visible.",
    captionReference:
      "An invented example for reading the aggregate slice of the report, not the data of a real team. Watch the width of the band: the narrow band on Agreeableness signals a similar way of working, the wide band on Conscientiousness signals several. Here too, the shared view does not show where anyone stands.",
  },
} as const;

const CASE_DIMENSIONS: Record<TeamReportFigureProps["locale"], AggregateDimension[]> = {
  hu: [
    { code: "H", label: "Becsületesség-Alázat", average: 62, spread: 20 },
    { code: "E", label: "Emocionalitás", average: 50, spread: 15 },
    { code: "X", label: "Extraverzió", average: 55, spread: 19 },
    { code: "A", label: "Barátságosság", average: 68, spread: 8 },
    { code: "C", label: "Lelkiismeretesség", average: 69, spread: 16 },
    { code: "O", label: "Nyitottság", average: 63, spread: 15 },
  ],
  en: [
    { code: "H", label: "Honesty-Humility", average: 62, spread: 20 },
    { code: "E", label: "Emotionality", average: 50, spread: 15 },
    { code: "X", label: "Extraversion", average: 55, spread: 19 },
    { code: "A", label: "Agreeableness", average: 68, spread: 8 },
    { code: "C", label: "Conscientiousness", average: 69, spread: 16 },
    { code: "O", label: "Openness", average: 63, spread: 15 },
  ],
};

/** Tanító példa: két szélső sáv (szűk A, széles C), hogy az olvasás tanulható legyen. */
const REFERENCE_DIMENSIONS: Record<TeamReportFigureProps["locale"], AggregateDimension[]> = {
  hu: [
    { code: "H", label: "Becsületesség-Alázat", average: 58, spread: 12 },
    { code: "E", label: "Emocionalitás", average: 47, spread: 14 },
    { code: "X", label: "Extraverzió", average: 61, spread: 17 },
    { code: "A", label: "Barátságosság", average: 72, spread: 6 },
    { code: "C", label: "Lelkiismeretesség", average: 54, spread: 24 },
    { code: "O", label: "Nyitottság", average: 66, spread: 13 },
  ],
  en: [
    { code: "H", label: "Honesty-Humility", average: 58, spread: 12 },
    { code: "E", label: "Emotionality", average: 47, spread: 14 },
    { code: "X", label: "Extraversion", average: 61, spread: 17 },
    { code: "A", label: "Agreeableness", average: 72, spread: 6 },
    { code: "C", label: "Conscientiousness", average: 54, spread: 24 },
    { code: "O", label: "Openness", average: 66, spread: 13 },
  ],
};

const DIMENSION_SETS = { case: CASE_DIMENSIONS, reference: REFERENCE_DIMENSIONS };

function diversityLabel(
  spread: number,
  copy: (typeof LABELS)[TeamReportFigureProps["locale"]],
): string {
  if (spread >= 18) return copy.wide;
  if (spread >= 10) return copy.moderate;
  return copy.narrow;
}

export function TeamReportFigure({
  locale,
  variant = "case",
  dimensions = DIMENSION_SETS[variant][locale],
}: TeamReportFigureProps) {
  const copy = LABELS[locale];
  const caption = variant === "reference" ? copy.captionReference : copy.caption;

  return (
    <figure className="my-8 rounded-2xl border border-sand bg-surface-card p-4 md:p-6">
      <div className="mb-5">
        <p className="font-fraunces text-lg font-semibold text-ink">{copy.title}</p>
        <p className="mt-1 text-xs text-muted">{copy.subtitle}</p>
      </div>

      <div className="space-y-4">
        {dimensions.map((dimension) => {
          const bandStart = Math.max(0, dimension.average - dimension.spread);
          const bandEnd = Math.min(100, dimension.average + dimension.spread);
          const colors = dimColorsCss(dimension.code);

          return (
            <div key={dimension.code} className="grid gap-2 md:grid-cols-[160px_1fr_150px] md:items-center">
              <span className="text-xs font-semibold text-ink-body">{dimension.label}</span>
              <div
                className="relative h-4 overflow-hidden rounded-full bg-sand"
                aria-label={`${dimension.label}: ${copy.average} ${dimension.average}, ${copy.diversity} ${diversityLabel(dimension.spread, copy)}`}
              >
                <div
                  className="absolute inset-y-0 rounded-full opacity-30"
                  style={{
                    left: `${bandStart}%`,
                    width: `${bandEnd - bandStart}%`,
                    backgroundColor: colors.base,
                  }}
                />
                <div
                  className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm"
                  style={{ left: `${dimension.average}%`, backgroundColor: colors.strong }}
                />
              </div>
              <div className="flex gap-3 text-micro text-muted md:justify-end">
                <span>
                  {copy.average}: <strong className="text-ink-body">{dimension.average}</strong>
                </span>
                <span>
                  {copy.diversity}: {diversityLabel(dimension.spread, copy)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <figcaption className="mt-5 border-t border-sand pt-3 text-micro leading-relaxed text-muted">
        {caption}
      </figcaption>
    </figure>
  );
}
