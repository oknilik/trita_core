import { CandidateMeasurementNote } from "./CandidateMeasurementNote";
import { HEXACO_DIMENSIONS, HEXACO_ORDER } from "@/lib/hexaco";
import { t, type Locale } from "@/lib/i18n";
export function CandidateProfileChart({
  dimensions,
  baseline,
  locale,
}: {
  dimensions: Record<string, number>;
  baseline?: Record<string, number> | null;
  locale: Locale;
}) {
  const presentDims = HEXACO_ORDER.filter(
    (dim) =>
      Number.isFinite(dimensions[dim]) &&
      dimensions[dim] >= 0 &&
      dimensions[dim] <= 100,
  );
  return (
    <section className="rounded-2xl border border-sand bg-surface-card p-5 sm:p-6">
      <h2 className="font-fraunces text-heading text-ink">
        {t("candidateProgram.self", locale)}
      </h2>
      <p className="mt-2 text-caption text-muted">
        {t("candidateProgram.reportNote", locale)}
      </p>
      <CandidateMeasurementNote locale={locale} />
      <div className="mt-4 flex flex-wrap gap-4 text-note text-muted">
        <span>● {t("candidateProgram.self", locale)}</span>
        {baseline && <span>│ {t("candidateProgram.team", locale)}</span>}
      </div>
      <div className="mt-6 space-y-5">
        {presentDims.map((dim) => (
          <div
            key={dim}
            className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 sm:grid-cols-[180px_1fr_auto]"
          >
            <span className="col-span-2 text-caption text-ink sm:col-span-1">
              {HEXACO_DIMENSIONS[dim].letter} · {HEXACO_DIMENSIONS[dim][locale]}
            </span>
            <div
              className="relative mx-2 h-1 rounded-full bg-sand"
              role="img"
              aria-label={`${HEXACO_DIMENSIONS[dim].letter} · {HEXACO_DIMENSIONS[dim][locale]}: ${dimensions[dim]} / 100${baseline ? `; ${t("candidateProgram.team", locale)}: ${baseline[dim] ?? "–"}` : ""}`}
            >
              <span
                className="absolute -top-1 h-3 w-3 -translate-x-1/2 rounded-full bg-sage"
                style={{ left: `${dimensions[dim]}%` }}
              />
              {baseline && typeof baseline[dim] === "number" && (
                <span
                  className="absolute -top-2 h-5 w-0.5 bg-bronze"
                  style={{ left: `${baseline[dim]}%` }}
                />
              )}
            </div>
            <span className="text-caption tabular-nums text-ink">
              {Math.round(dimensions[dim])}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-5 flex justify-between text-note text-muted sm:ml-[180px]">
        <span>0</span>
        <span>50</span>
        <span>100</span>
      </div>
    </section>
  );
}
