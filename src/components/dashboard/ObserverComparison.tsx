"use client";

import { t, tf } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";
import type { SerializedFacetDivergence } from "@/components/dashboard/DashboardTabs";

interface ObserverComparisonProps {
  observerCount: number;
  avgConfidence: number | null;
  facetDivergences: SerializedFacetDivergence[];
}

function getChipStyle(delta: number): string {
  if (Math.abs(delta) <= 5) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (delta > 0) return "bg-sky-50 text-sky-700 border-sky-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

export function ObserverComparison({
  observerCount,
  avgConfidence,
  facetDivergences,
}: ObserverComparisonProps) {
  const { locale } = useLocale();

  // Group facetDivergences by dimension, preserving natural order
  const dimGroups = facetDivergences.reduce<
    { dimCode: string; dimLabel: string; dimColor: string; subs: SerializedFacetDivergence[] }[]
  >((acc, item) => {
    const existing = acc.find((g) => g.dimCode === item.dimCode);
    if (existing) {
      existing.subs.push(item);
    } else {
      acc.push({ dimCode: item.dimCode, dimLabel: item.dimLabel, dimColor: item.dimColor, subs: [item] });
    }
    return acc;
  }, []);

  return (
    <section className="rounded-2xl border border-gray-100/50 bg-white p-8 md:p-12 shadow-lg">
      {/* Modern header with decorative bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-1 w-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
        <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          {t("comparison.title", locale)}
        </h2>
      </div>

      <p className="text-sm text-gray-600">
        {tf("comparison.body", locale, { count: observerCount })}
      </p>

      {/* Stat badges */}
      <div className="mt-6 flex flex-wrap gap-3">
        <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 px-5 py-3 border border-indigo-100/50">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
            {t("comparison.observersLabel", locale) || "Értékelők"}
          </p>
          <p className="mt-1 text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {observerCount}
          </p>
        </div>

        {avgConfidence != null && (
          <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 px-5 py-3 border border-emerald-100/50">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              {t("comparison.confidenceLabel", locale) || "Átl. bizonyosság"}
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">
              {avgConfidence}/5
            </p>
          </div>
        )}
      </div>

      {/* Facet heatmap */}
      {dimGroups.length > 0 && (
        <div className="mt-10">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
              {t("comparison.facetMapTitle", locale)}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {t("comparison.facetMapSubtitle", locale)}
            </p>
          </div>

          {/* Legend */}
          <div className="mb-5 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {t("comparison.heatmapMatch", locale)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              {t("comparison.heatmapObsHigher", locale)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              {t("comparison.heatmapSelfHigher", locale)}
            </span>
          </div>

          {/* Grid: one row per dimension */}
          <div className="flex flex-col gap-4">
            {dimGroups.map((group) => (
              <div key={group.dimCode} className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white shadow-sm"
                  style={{ backgroundColor: group.dimColor }}
                >
                  {group.dimCode}
                </span>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {group.subs.map((sub) => (
                    <span
                      key={sub.subCode}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${getChipStyle(sub.delta)}`}
                    >
                      {sub.subLabel}
                      <span className="font-bold tabular-nums">
                        {sub.delta > 0 ? `+${sub.delta}` : sub.delta === 0 ? "±0" : sub.delta}%
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
