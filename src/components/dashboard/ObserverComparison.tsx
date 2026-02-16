"use client";

import { t, tf, type Locale } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";

interface ComparisonDimension {
  code: string;
  label: string;
  labelByLocale?: Partial<Record<Locale, string>>;
  color: string;
  selfScore: number;
  observerScore: number;
}

interface ObserverComparisonProps {
  dimensions: ComparisonDimension[];
  observerCount: number;
  avgConfidence: number | null;
}

function getDiffColor(diff: number): string {
  const absDiff = Math.abs(diff);
  if (absDiff < 5) return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (absDiff < 15) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-rose-600 bg-rose-50 border-rose-200";
}

function getDiffIcon(diff: number) {
  if (Math.abs(diff) < 5) {
    return (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    );
  }
  if (diff > 0) {
    return (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
      </svg>
    );
  }
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

export function ObserverComparison({
  dimensions,
  observerCount,
  avgConfidence,
}: ObserverComparisonProps) {
  const { locale } = useLocale();

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

      {/* Dimension comparison cards */}
      <div className="mt-8 flex flex-col gap-6">
        {dimensions.map((dim) => {
          const resolvedLabel = dim.labelByLocale?.[locale] ?? dim.label;
          const diff = dim.observerScore - dim.selfScore;
          const absDiff = Math.abs(diff);
          const diffLabel =
            absDiff < 5
              ? t("comparison.similar", locale)
              : diff > 0
                ? tf("comparison.diffHigher", locale, { diff: absDiff })
                : tf("comparison.diffLower", locale, { diff: absDiff });

          return (
            <div
              key={dim.code}
              className="group rounded-2xl border border-gray-100/50 bg-gradient-to-br from-white to-gray-50/30 p-6 shadow-sm transition-all duration-300 hover:shadow-md"
              style={{ borderLeftWidth: "4px", borderLeftColor: dim.color }}
            >
              {/* Header with badge and difference indicator */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm"
                    style={{ backgroundColor: dim.color }}
                  >
                    {dim.code}
                  </span>
                  <p className="text-base font-bold text-gray-900">
                    {resolvedLabel}
                  </p>
                </div>

                {/* Difference badge */}
                <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${getDiffColor(diff)}`}>
                  {getDiffIcon(diff)}
                  <span>{absDiff < 5 ? diffLabel : `${absDiff}%`}</span>
                </div>
              </div>

              {/* Bar comparison */}
              <div className="space-y-3">
                {/* Self score bar */}
                <div className="flex items-center gap-3">
                  <span className="w-16 text-xs font-medium text-gray-600">
                    {t("comparison.self", locale)}
                  </span>
                  <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden shadow-inner">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${dim.selfScore}%`,
                        backgroundColor: dim.color,
                        opacity: 0.6,
                      }}
                    />
                  </div>
                  <span className="w-12 text-right text-sm font-bold text-gray-700">
                    {dim.selfScore}%
                  </span>
                </div>

                {/* Observer score bar */}
                <div className="flex items-center gap-3">
                  <span className="w-16 text-xs font-medium text-gray-900">
                    {observerCount > 1 ? `${observerCount}×` : "1×"}
                  </span>
                  <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden shadow-inner">
                    <div
                      className="h-full rounded-full shadow-sm transition-all duration-500"
                      style={{
                        width: `${dim.observerScore}%`,
                        backgroundColor: dim.color,
                      }}
                    />
                  </div>
                  <span className="w-12 text-right text-sm font-bold" style={{ color: dim.color }}>
                    {dim.observerScore}%
                  </span>
                </div>
              </div>

              {/* Insight for large differences */}
              {absDiff >= 15 && (
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 p-3">
                  <svg className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    {diff > 0
                      ? (t("comparison.insightHigher", locale) || "Mások magasabbra értékelnek ebben a dimenzióban, mint te magad.")
                      : (t("comparison.insightLower", locale) || "Te magasabbra értékeled magad ebben a dimenzióban, mint ahogy mások látnak.")
                    }
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
