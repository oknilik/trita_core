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

function scoreZone(score: number | null, isHu: boolean): { label: string; textClass: string } {
  if (score == null) return { label: "–", textClass: "text-gray-400" };
  if (score >= 70) return { label: isHu ? "Magas" : "High", textClass: "text-gray-800" };
  if (score >= 40) return { label: isHu ? "Közép" : "Mid", textClass: "text-gray-700" };
  return { label: isHu ? "Alacsony" : "Low", textClass: "text-gray-700" };
}

const DIM_DESCRIPTIONS: Record<string, { hu: string; en: string }> = {
  H: {
    hu: "Becsületesség, igazságosság, szerénység — mennyire kerüli a manipulációt és az önérdek-érvényesítést",
    en: "Honesty, fairness, modesty — tendency to avoid manipulation and self-promotion",
  },
  E: {
    hu: "Érzelmi érzékenység, szorongásra való hajlam, empátia mások iránt",
    en: "Emotional sensitivity, tendency toward anxiety, empathy for others",
  },
  X: {
    hu: "Szociabilitás, magabiztosság, energikusság — mennyire tölt fel a társas közeg",
    en: "Sociability, confidence, energy — degree to which social settings are energizing",
  },
  A: {
    hu: "Türelem, együttműködés, megbocsátás — mennyire kerüli a konfliktust és törekszik harmóniára",
    en: "Patience, cooperation, forgiveness — tendency to avoid conflict and seek harmony",
  },
  C: {
    hu: "Szervezettség, kitartás, fegyelmezettség — mennyire megbízható és célirányos a munkavégzés",
    en: "Organization, diligence, self-discipline — reliability and goal-directedness at work",
  },
  O: {
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
  const locale = isHu ? "hu" : "en";

  return (
    <div className="flex flex-col gap-8">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="pb-4 pr-6 text-left text-xs font-semibold text-gray-400 min-w-[130px]">
                {isHu ? "Csapattag" : "Member"}
              </th>
              {dims.map((dim) => (
                <th key={dim.code} className="pb-4 px-2 text-center min-w-[80px]">
                  <div className="flex flex-col items-center gap-1.5">
                    <span
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-sm"
                      style={{ backgroundColor: dim.color }}
                    >
                      {dim.code}
                    </span>
                    <span className="text-[10px] font-semibold text-gray-500 max-w-[72px] leading-tight text-center">
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
                className={rowIdx === 0 ? "border-t border-gray-100" : "border-t border-gray-100"}
              >
                <td className="py-2.5 pr-6">
                  <span
                    className="text-sm font-semibold text-gray-800"
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
                  const { textClass } = scoreZone(score, isHu);

                  return (
                    <td key={dim.code} className="px-2 py-2">
                      <div
                        className="relative mx-auto flex h-12 w-[72px] flex-col items-center justify-center rounded-xl border border-transparent transition-all"
                        style={
                          score != null
                            ? {
                                backgroundColor: hexToRgba(dim.color, alpha),
                                borderColor: hexToRgba(dim.color, Math.min(alpha + 0.15, 0.4)),
                              }
                            : { backgroundColor: "#f9fafb", borderColor: "#f3f4f6" }
                        }
                        title={
                          score != null
                            ? `${dim.label}: ${score}%`
                            : isHu
                            ? "Nincs kitöltve"
                            : "Not completed"
                        }
                      >
                        {score != null ? (
                          <>
                            <span className={`text-sm font-bold tabular-nums ${textClass}`}>
                              {score}
                              <span className="text-[10px] font-semibold opacity-70">%</span>
                            </span>
                            <span className={`text-[9px] font-semibold uppercase tracking-wide ${textClass} opacity-70`}>
                              {scoreZone(score, isHu).label}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-300">–</span>
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
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="h-4 w-10 rounded-md bg-indigo-100" />
            <div className="h-4 w-10 rounded-md bg-indigo-300" />
            <div className="h-4 w-10 rounded-md bg-indigo-500" />
          </div>
          <span>{isHu ? "Alacsony → Magas pontszám" : "Low → High score"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-10 rounded-md border border-gray-200 bg-gray-50" />
          <span>{isHu ? "Nincs kitöltött teszt" : "No assessment yet"}</span>
        </div>
      </div>

      {/* Dimension descriptions */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
          {isHu ? "Dimenziók magyarázata" : "Dimension guide"}
        </p>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {dims.map((dim) => {
            const desc = DIM_DESCRIPTIONS[dim.code];
            return (
              <div
                key={dim.code}
                className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3"
              >
                <span
                  className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: dim.color }}
                >
                  {dim.code}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-700">{dim.label}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
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
