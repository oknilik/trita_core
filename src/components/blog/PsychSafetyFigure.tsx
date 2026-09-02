import {
  PSYCH_SAFETY_ITEMS,
  PSYCH_SAFETY_MIN_RESPONSES,
  psychSafetyBand,
} from "@/lib/psych-safety";

/**
 * A pszichológiai biztonság pulse riport-szeletének egyszerűsített ábrája
 * blogcikkhez.
 *
 * A területcímkék és a sáv-küszöbök a TERMÉKBŐL jönnek
 * (src/lib/psych-safety.ts), hogy az ábra ne csússzon el a valódi
 * riporttól. Az ÉRTÉKEK illusztratívak.
 *
 * Anonimitás: egyéni válasz itt sem jelenik meg, és a küszöb alatti
 * állapotot is bemutatjuk — ez a mérés egyik legfontosabb szabálya.
 */
interface PsychSafetyFigureProps {
  locale: "hu" | "en";
}

const LABELS = {
  hu: {
    title: "Pszichológiai biztonság pulse",
    subtitle: "Csapatindex és területek – egyéni válaszok nélkül",
    index: "Csapatindex",
    respondents: "válasz",
    scale: "1–5 skálán",
    weakest: "leggyengébb",
    bands: { low: "alacsony", mid: "közepes", high: "magas" },
    threshold: `Az index csak ${PSYCH_SAFETY_MIN_RESPONSES} választól jelenik meg.`,
    caption:
      "A pszichológiai biztonság riport-szeletének egyszerűsített ábrája. A területcímkék és a sávhatárok a valódi mérésből valók, az értékeket illusztrációnak szántuk. Egyéni válasz sem a vezető, sem a csapat számára nem látható, és az index a küszöb alatt egyáltalán nem jelenik meg.",
  },
  en: {
    title: "Psychological safety pulse",
    subtitle: "Team index and areas – without individual answers",
    index: "Team index",
    respondents: "responses",
    scale: "on a 1–5 scale",
    weakest: "weakest",
    bands: { low: "low", mid: "moderate", high: "high" },
    threshold: `The index only appears from ${PSYCH_SAFETY_MIN_RESPONSES} responses.`,
    caption:
      "A simplified illustration of the psychological safety slice of the report. The area labels and band thresholds come from the real measurement; the values are illustrative. No individual answer is visible to the leader or the team, and below the threshold the index does not appear at all.",
  },
} as const;

/** Illusztratív értékek: index 0–100, területenkénti átlag 1–5. */
const DEMO_INDEX = 68;
const DEMO_RESPONSES = 7;
const DEMO_ITEM_MEANS: Record<string, number> = {
  PS1: 3.1,
  PS3: 4.2,
  PS5: 3.4,
  PS8: 4.0,
};

export function PsychSafetyFigure({ locale }: PsychSafetyFigureProps) {
  const copy = LABELS[locale];
  const band = psychSafetyBand(DEMO_INDEX);
  const shown = PSYCH_SAFETY_ITEMS.filter((item) => item.id in DEMO_ITEM_MEANS);
  const weakestId = shown.reduce((min, item) =>
    DEMO_ITEM_MEANS[item.id] < DEMO_ITEM_MEANS[min.id] ? item : min,
  ).id;

  return (
    <figure className="my-8 rounded-2xl border border-sand bg-surface-card p-4 md:p-6">
      <div className="mb-5">
        <p className="font-fraunces text-lg font-semibold text-ink">{copy.title}</p>
        <p className="mt-1 text-xs text-muted">{copy.subtitle}</p>
      </div>

      <div className="mb-6 rounded-xl border border-sand bg-surface-subtle p-4">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-micro uppercase tracking-wider text-muted">{copy.index}</span>
          <span className="font-fraunces text-title font-semibold text-ink">{DEMO_INDEX}</span>
          <span className="text-caption text-ink-body">/ 100 · {copy.bands[band]}</span>
        </div>
        <div
          className="relative mt-3 h-2.5 overflow-hidden rounded-full bg-sand"
          aria-label={`${copy.index}: ${DEMO_INDEX} / 100 – ${copy.bands[band]}`}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-[var(--color-accent-primary)]"
            style={{ width: `${DEMO_INDEX}%` }}
          />
        </div>
        <p className="mt-2 text-micro text-muted">
          {DEMO_RESPONSES} {copy.respondents} · {copy.threshold}
        </p>
      </div>

      <div className="space-y-3">
        {shown.map((item) => {
          const mean = DEMO_ITEM_MEANS[item.id];
          const isWeakest = item.id === weakestId;
          return (
            <div
              key={item.id}
              className="grid gap-1.5 md:grid-cols-[220px_1fr_92px] md:items-center md:gap-3"
            >
              <span className="text-xs font-semibold text-ink-body">
                {item.area[locale]}
              </span>
              <div
                className="relative h-3 overflow-hidden rounded-full bg-sand"
                aria-label={`${item.area[locale]}: ${mean} ${copy.scale}`}
              >
                <div
                  className={`absolute inset-y-0 left-0 rounded-full ${
                    isWeakest
                      ? "bg-[var(--color-accent-primary-strong)]"
                      : "bg-[var(--color-surface-inverse-soft)]"
                  }`}
                  style={{ width: `${((mean - 1) / 4) * 100}%` }}
                />
              </div>
              <span className="text-micro text-muted md:text-right">
                {mean.toFixed(1)}
                {isWeakest ? ` · ${copy.weakest}` : ""}
              </span>
            </div>
          );
        })}
      </div>

      <figcaption className="mt-5 border-t border-sand pt-3 text-micro leading-relaxed text-muted">
        {copy.caption}
      </figcaption>
    </figure>
  );
}
