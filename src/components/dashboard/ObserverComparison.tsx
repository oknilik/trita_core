"use client";

import { useMemo, useState } from "react";
import { t, tf } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";
import type { SerializedFacetDivergence } from "@/components/dashboard/DashboardTabs";

interface ObserverComparisonProps {
  observerCount: number;
  avgConfidence: number | null;
  facetDivergences: SerializedFacetDivergence[];
}

function getChipStyle(delta: number): string {
  if (Math.abs(delta) <= 5) return "bg-gray-50 text-gray-700 border-gray-200";
  if (delta > 0) return "bg-[#fef3ec] text-[#8b2f09] border-[#f3d4c8]";
  return "bg-[#edf4ef] text-[#1a5c3a] border-[#cfe2d6]";
}

export function ObserverComparison({
  observerCount,
  avgConfidence,
  facetDivergences,
}: ObserverComparisonProps) {
  const { locale } = useLocale();
  const [showAll, setShowAll] = useState(false);
  const pointsUnit = t("comparison.pointsUnitShort", locale);

  const sortedEntries = useMemo(
    () => [...facetDivergences].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)),
    [facetDivergences],
  );
  const hasMore = sortedEntries.length > 5;
  const entriesToShow = showAll ? sortedEntries : sortedEntries.slice(0, 5);

  return (
    <section className="rounded-2xl border border-gray-100/50 bg-white p-8 md:p-12 shadow-lg">
      {/* Modern header with decorative bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-1 w-12 bg-gradient-to-r from-[#c8410a] to-[#8b2f09] rounded-full" />
        <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          {t("comparison.title", locale)}
        </h2>
      </div>

      <p className="text-sm text-gray-600">
        {tf("comparison.body", locale, { count: observerCount })}
      </p>

      {/* Stat badges */}
      <div className="mt-6 flex flex-wrap gap-3">
        <div className="rounded-xl bg-gradient-to-br from-[#fef3ec] to-[#f3eee4] px-5 py-3 border border-[#f3d4c8]/50">
          <p className="text-xs font-semibold text-[#c8410a] uppercase tracking-wider">
            {t("comparison.observersLabel", locale) || "Értékelők"}
          </p>
          <p className="mt-1 text-2xl font-bold bg-gradient-to-r from-[#c8410a] to-[#8b2f09] bg-clip-text text-transparent">
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
      {sortedEntries.length > 0 && (
        <div className="mt-10">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c8410a]">
              {t("comparison.facetMapTitle", locale)}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {t("comparison.facetMapSubtitle", locale)}
            </p>
          </div>

          {/* Legend */}
          <div className="mb-5 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
              <span className="h-2 w-2 rounded-full bg-gray-400" />
              {t("comparison.heatmapMatch", locale)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f3d4c8] bg-[#fef3ec] px-3 py-1 text-xs font-medium text-[#8b2f09]">
              <span className="h-2 w-2 rounded-full bg-[#c8410a]" />
              {t("comparison.heatmapObsHigher", locale)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#cfe2d6] bg-[#edf4ef] px-3 py-1 text-xs font-medium text-[#1a5c3a]">
              <span className="h-2 w-2 rounded-full bg-[#1a5c3a]" />
              {t("comparison.heatmapSelfHigher", locale)}
            </span>
          </div>

          {/* Ordered list (largest absolute divergences first) */}
          <div className="flex flex-col gap-3">
            {entriesToShow.map((item) => {
              const absDelta = Math.abs(item.delta);
              const signedDelta = item.delta > 0 ? `+${item.delta} ${pointsUnit}` : item.delta < 0 ? `${item.delta} ${pointsUnit}` : `±0 ${pointsUnit}`;
              const directionText =
                absDelta <= 5
                  ? t("comparison.deltaDirectionMatch", locale)
                  : item.delta > 0
                    ? t("comparison.deltaDirectionHigher", locale)
                    : t("comparison.deltaDirectionLower", locale);

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
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold tabular-nums ${getChipStyle(item.delta)}`}>
                      {signedDelta}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-12 text-xs text-gray-500">{t("comparison.self", locale)}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${item.selfScore}%`, backgroundColor: item.dimColor, opacity: 0.55 }}
                        />
                      </div>
                      <span className="w-10 text-right text-xs font-semibold text-gray-600">{item.selfScore}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-12 text-xs text-gray-700">{t("comparison.others", locale)}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${item.observerScore}%`, backgroundColor: item.dimColor }}
                        />
                      </div>
                      <span className="w-10 text-right text-xs font-semibold text-gray-700">{item.observerScore}</span>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-gray-600">{directionText}</p>
                </div>
              );
            })}
          </div>

          {hasMore && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowAll((prev) => !prev)}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#f3d4c8] bg-white px-6 text-sm font-semibold text-[#8b2f09] shadow-sm transition-all duration-300 hover:bg-[#fef3ec] hover:shadow-md"
              >
                {showAll ? t("comparison.showLess", locale) : t("comparison.showAll", locale)}
              </button>
            </div>
          )}

          <div className="mt-8 rounded-2xl border border-gray-100 bg-gray-50/60 p-5">
            <p className="text-sm font-semibold text-gray-900">{t("comparison.nextActionTitle", locale)}</p>
            <p className="mt-1 text-sm text-gray-600">
              {t("comparison.nextActionBodyNoSurvey", locale)}
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <a
                href="/dashboard?tab=invites#invite"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-[#c8410a] to-[#8b2f09] px-5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
              >
                {t("comparison.nextActionInvite", locale)}
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
