"use client";
import { useId } from "react";
import { RadarChart } from "@/components/dashboard/RadarChart";
import { dimColorsCss } from "@/lib/color-system";
import { CandidateMeasurementNote } from "./CandidateMeasurementNote";
import { HEXACO_DIMENSIONS, HEXACO_ORDER } from "@/lib/hexaco";
import { t, type Locale } from "@/lib/i18n";
export function CandidateRadar({
  dimensions,
  baseline,
  locale,
  compact = false,
  name,
  teamName,
}: {
  dimensions: Record<string, number>;
  baseline?: Record<string, number>;
  locale: Locale;
  compact?: boolean;
  name: string;
  teamName?: string;
}) {
  const uid = useId().replaceAll(":", "");
  const valid = (values: Record<string, number>) =>
    HEXACO_ORDER.every(
      (d) => Number.isFinite(values[d]) && values[d] >= 0 && values[d] <= 100,
    );
  if (!valid(dimensions) || (baseline && !valid(baseline)))
    return (
      <p className="text-caption text-muted">
        {t("candidateProgram.chartMissing", locale)}
      </p>
    );
  return (
    <div>
      <div className="mx-auto w-full max-w-md">
        <RadarChart
          uid={`candidate-comparison-${uid}`}
          ariaLabel={`${name}${teamName ? ` · ${teamName}` : ""}`}
          dimensions={HEXACO_ORDER.map((code) => ({
            code,
            score: dimensions[code],
            color: dimColorsCss(code).base,
            ...(baseline ? { observerScore: baseline[code] } : {}),
          }))}
          showObserver={Boolean(baseline)}
        />
      </div>
      {!compact && (
        <>
          <CandidateMeasurementNote locale={locale} />
          <div className="flex flex-wrap justify-center gap-5 text-caption">
            <span className="text-[var(--color-dim-h-base)]">● {name}</span>
            {baseline && <span className="text-bronze">┄ {teamName}</span>}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-2 text-note text-muted">
            {HEXACO_ORDER.map((d) => (
              <span key={d}>
                <strong className="text-ink">
                  {HEXACO_DIMENSIONS[d].letter}
                </strong>{" "}
                · {HEXACO_DIMENSIONS[d][locale]}
              </span>
            ))}
          </div>
          <details className="mt-5 text-caption">
            <summary className="min-h-11 cursor-pointer py-3 text-muted">
              {t("candidateProgram.exactValues", locale)}
            </summary>
            <table className="w-full text-left">
              <caption className="sr-only">
                {t("candidateProgram.radarTitle", locale)}
              </caption>
              <thead>
                <tr>
                  <th>{t("candidateProgram.dimension", locale)}</th>
                  <th>{name}</th>
                  {baseline && <th>{teamName}</th>}
                </tr>
              </thead>
              <tbody>
                {HEXACO_ORDER.map((d) => (
                  <tr key={d} className="border-t border-sand">
                    <th className="py-2 font-normal">
                      {HEXACO_DIMENSIONS[d].letter} ·{" "}
                      {HEXACO_DIMENSIONS[d][locale]}
                    </th>
                    <td>{Math.round(dimensions[d])}</td>
                    {baseline && <td>{Math.round(baseline[d])}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </div>
  );
}
