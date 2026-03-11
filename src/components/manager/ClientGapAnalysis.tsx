import type { Locale } from "@/lib/i18n";

export interface FacetDelta {
  dimCode: string;
  dimLabel: string;
  dimColor: string;
  subCode: string;
  subLabel: string;
  selfScore: number;
  observerScore: number;
  delta: number;
}

interface ClientGapAnalysisProps {
  facetDeltas: FacetDelta[];
  observerCount: number;
  avgConfidence: number | null;
  locale: Locale;
  isHu: boolean;
}

function chipStyle(delta: number): string {
  if (Math.abs(delta) <= 5) return "bg-gray-50 text-gray-700 border-gray-200";
  if (delta > 0) return "bg-indigo-50 text-indigo-700 border-indigo-200";
  return "bg-violet-50 text-violet-700 border-violet-200";
}

export function ClientGapAnalysis({
  facetDeltas,
  observerCount,
  avgConfidence,
  isHu,
}: ClientGapAnalysisProps) {
  const sorted = [...facetDeltas].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  return (
    <section className="rounded-xl border border-gray-100 bg-white p-6 md:p-8">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-1 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
        <h2 className="text-lg font-semibold text-gray-900">
          {isHu ? "Önismeret – Observer delta" : "Self vs Observer Gap"}
        </h2>
      </div>

      <p className="mb-5 text-sm text-gray-500">
        {isHu
          ? `Facet-szintű eltérés az önértékelés és az observer átlag között (${observerCount} observer).`
          : `Facet-level gap between self-assessment and observer average (${observerCount} observer${observerCount !== 1 ? "s" : ""}).`}
      </p>

      {/* Stat chips */}
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-2">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
            {isHu ? "Observerek" : "Observers"}
          </p>
          <p className="mt-0.5 text-xl font-bold text-indigo-700">{observerCount}</p>
        </div>
        {avgConfidence != null && (
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-2">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              {isHu ? "Átl. konfidencia" : "Avg confidence"}
            </p>
            <p className="mt-0.5 text-xl font-bold text-emerald-700">{avgConfidence}/5</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700">
          <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
          {isHu ? "±5 pont: illeszkedés" : "±5 pts: match"}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
          {isHu ? "Observer magasabb" : "Observer higher"}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
          {isHu ? "Önértékelés magasabb" : "Self higher"}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {sorted.map((item) => {
          const sign = item.delta > 0 ? "+" : "";
          return (
            <div
              key={`${item.dimCode}-${item.subCode}`}
              className="rounded-xl border border-gray-100 bg-gradient-to-br from-white to-gray-50/40 p-4 shadow-sm"
              style={{ borderLeftWidth: "4px", borderLeftColor: item.dimColor }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <span style={{ color: item.dimColor }}>{item.dimCode}</span>
                    <span className="mx-1 text-gray-300">/</span>
                    <span className="text-gray-500">{item.dimLabel}</span>
                  </p>
                  <p className="truncate text-sm font-semibold text-gray-900">{item.subLabel}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold tabular-nums ${chipStyle(item.delta)}`}
                >
                  {sign}{item.delta} {isHu ? "pt" : "pts"}
                </span>
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-12 text-xs text-gray-500">{isHu ? "Saját" : "Self"}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${item.selfScore}%`, backgroundColor: item.dimColor, opacity: 0.55 }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs font-semibold text-gray-600">{item.selfScore}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-12 text-xs text-gray-700">{isHu ? "Mások" : "Others"}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${item.observerScore}%`, backgroundColor: item.dimColor }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs font-semibold text-gray-700">{item.observerScore}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
