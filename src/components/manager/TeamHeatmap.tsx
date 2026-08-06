interface DimInfo {
  code: string;
  label: string;
  color: string;
}

interface HeatmapRow {
  memberId: string;
  displayName: string;
  scores: Record<string, number | null>;
  testType: string | null;
}

interface TeamHeatmapProps {
  rows: HeatmapRow[];
  dims: DimInfo[];
  isHu: boolean;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function scoreToAlpha(score: number | null): number {
  if (score == null) return 0;
  return 0.1 + (score / 100) * 0.78;
}

import { t, type Locale } from "@/lib/i18n";
import { TRITAN_DIMENSIONS, type TritanDimCode } from "@/lib/tritan";
import { dimColors } from "@/lib/color-system";

// A dimenzió-badge a HEXACO-betűt mutatja (H/E/X/A/C/O), nem a belső kódot.
function hexLetter(code: string): string {
  return TRITAN_DIMENSIONS[code as TritanDimCode]?.letter ?? code;
}


function scoreZone(score: number | null, locale: Locale): { label: string; textClass: string } {
  if (score == null) return { label: "–", textClass: "text-muted" };
  if (score >= 70) return { label: t("manager.teamHeatmap.scoreHigh", locale), textClass: "text-ink" };
  if (score >= 40) return { label: t("manager.teamHeatmap.scoreMid", locale), textClass: "text-ink-body" };
  return { label: t("manager.teamHeatmap.scoreLow", locale), textClass: "text-ink-body" };
}

const DIM_DESCRIPTIONS: Record<string, { hu: string; en: string }> = {
  INTE: {
    hu: "Becsületesség, igazságosság, szerénység — mennyire kerüli a manipulációt és az önérdek-érvényesítést",
    en: "Honesty, fairness, modesty — tendency to avoid manipulation and self-promotion",
  },
  RESO: {
    hu: "Érzelmi érzékenység, szorongásra való hajlam, empátia mások iránt",
    en: "Emotional sensitivity, tendency toward anxiety, empathy for others",
  },
  TEMP: {
    hu: "Szociabilitás, magabiztosság, energikusság — mennyire tölt fel a társas közeg",
    en: "Sociability, confidence, energy — degree to which social settings are energizing",
  },
  ADAP: {
    hu: "Türelem, együttműködés, megbocsátás — mennyire kerüli a konfliktust és törekszik harmóniára",
    en: "Patience, cooperation, forgiveness — tendency to avoid conflict and seek harmony",
  },
  THOR: {
    hu: "Szervezettség, kitartás, fegyelmezettség — mennyire megbízható és célirányos a munkavégzés",
    en: "Organization, diligence, self-discipline — reliability and goal-directedness at work",
  },
  OPEN: {
    hu: "Nyitottság, kreativitás, intellektuális kíváncsiság — mennyire keresi az újszerű megközelítéseket",
    en: "Openness, creativity, intellectual curiosity — tendency to seek novel ideas and approaches",
  },
  N: {
    hu: "Érzelmi instabilitás, stressz-érzékenység — reakció nyomáshelyzetre",
    en: "Emotional instability, stress sensitivity — response to pressure situations",
  },
};

export function TeamHeatmap({ rows, dims, isHu }: TeamHeatmapProps) {
  const maxNameLen = 16;
  const locale: Locale = isHu ? "hu" : "en";

  return (
    <div className="flex flex-col gap-8">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="pb-4 pr-6 text-left text-xs font-semibold text-muted min-w-[130px]">
                {t("manager.teamHeatmap.member", locale)}
              </th>
              {dims.map((dim) => (
                <th key={hexLetter(dim.code)} className="pb-4 px-2 text-center min-w-[80px]">
                  <div className="flex flex-col items-center gap-1.5">
                    <span
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-sm"
                      style={{ backgroundColor: dimColors(dim.code).strong }}
                    >
                      {hexLetter(dim.code)}
                    </span>
                    <span className="text-micro font-semibold text-muted max-w-[72px] leading-tight text-center">
                      {dim.label}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr
                key={row.memberId}
                className={rowIdx === 0 ? "border-t border-sand/70" : "border-t border-sand/70"}
              >
                <td className="py-2.5 pr-6">
                  <span
                    className="text-sm font-semibold text-ink"
                    title={row.displayName}
                  >
                    {row.displayName.length > maxNameLen
                      ? row.displayName.slice(0, maxNameLen) + "…"
                      : row.displayName}
                  </span>
                </td>
                {dims.map((dim) => {
                  const score = row.scores[dim.code];
                  const alpha = scoreToAlpha(score);
                  const { textClass } = scoreZone(score, locale);

                  return (
                    <td key={hexLetter(dim.code)} className="px-2 py-2">
                      <div
                        className="relative mx-auto flex h-12 w-[72px] flex-col items-center justify-center rounded-xl border border-transparent transition-all"
                        style={
                          score != null
                            ? {
                                backgroundColor: hexToRgba(dimColors(dim.code).base, alpha),
                                borderColor: hexToRgba(dimColors(dim.code).base, Math.min(alpha + 0.15, 0.4)),
                              }
                            : {
                                backgroundColor: "var(--color-warm-mid)",
                                borderColor: "var(--color-sand)",
                              }
                        }
                        title={
                          score != null
                            ? `${dim.label}: ${score}%`
                            : t("manager.teamHeatmap.notCompleted", locale)
                        }
                      >
                        {score != null ? (
                          <>
                            <span className={`text-sm font-bold tabular-nums ${textClass}`}>
                              {score}
                              <span className="text-micro font-semibold opacity-70">%</span>
                            </span>
                            <span className={`text-micro font-semibold uppercase tracking-wide ${textClass} opacity-70`}>
                              {scoreZone(score, locale).label}
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

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted">
        <div className="flex items-center gap-2">
          {/* A valódi cella-rámpából generált fokozatok (H-hue, alfa-lépcső) */}
          <div className="flex items-center gap-1">
            {[30, 60, 95].map((v) => (
              <div
                key={v}
                className="h-4 w-10 rounded-md"
                style={{
                  backgroundColor: hexToRgba(
                    dimColors(dims[0]?.code ?? "INTE").base,
                    scoreToAlpha(v),
                  ),
                }}
              />
            ))}
          </div>
          <span>{t("manager.teamHeatmap.legendRange", locale)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-10 rounded-md border border-sand bg-surface-subtle" />
          <span>{t("manager.teamHeatmap.legendNoAssessment", locale)}</span>
        </div>
      </div>

      {/* Dimension descriptions */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
          {t("manager.teamHeatmap.dimensionGuide", locale)}
        </p>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {dims.map((dim) => {
            const desc = DIM_DESCRIPTIONS[dim.code];
            return (
              <div
                key={hexLetter(dim.code)}
                className="flex items-start gap-3 rounded-xl border border-sand/70 bg-surface-subtle/60 p-3"
              >
                <span
                  className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-micro font-bold text-white"
                  style={{ backgroundColor: dimColors(dim.code).strong }}
                >
                  {hexLetter(dim.code)}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-ink-body">{dim.label}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">
                    {desc?.[locale] ?? desc?.en ?? ""}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
