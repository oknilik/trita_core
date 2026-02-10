import type { Locale } from "@/lib/i18n";
import { t, tf } from "@/lib/i18n";

interface ComparisonDimension {
  code: string;
  label: string;
  color: string;
  selfScore: number;
  observerScore: number;
}

interface ObserverComparisonProps {
  dimensions: ComparisonDimension[];
  observerCount: number;
  avgConfidence: number | null;
  locale: Locale;
}

export function ObserverComparison({
  dimensions,
  observerCount,
  avgConfidence,
  locale,
}: ObserverComparisonProps) {
  return (
    <section className="rounded-xl border border-gray-100 bg-white p-6 md:p-8">
      <h2 className="text-2xl font-semibold text-gray-900">
        {t("comparison.title", locale)}
      </h2>
      <p className="mt-2 text-sm text-gray-600">
        {tf("comparison.body", locale, { count: observerCount })}
        {avgConfidence != null && (
          <span className="ml-2 text-gray-400">
            ({tf("comparison.avgConfidence", locale, { value: avgConfidence })})
          </span>
        )}
      </p>

      <div className="mt-6 flex flex-col gap-4">
        {dimensions.map((dim) => {
          const diff = dim.observerScore - dim.selfScore;
          const diffLabel =
            Math.abs(diff) < 5
              ? t("comparison.similar", locale)
              : diff > 0
                ? tf("comparison.diffHigher", locale, { diff })
                : tf("comparison.diffLower", locale, { diff });

          return (
            <div
              key={dim.code}
              className="rounded-lg border border-gray-100 p-4"
              style={{ borderLeftWidth: "4px", borderLeftColor: dim.color }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-xs font-bold text-white"
                    style={{ backgroundColor: dim.color }}
                  >
                    {dim.code}
                  </span>
                  <p className="text-sm font-semibold text-gray-900">
                    {dim.label}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-2">
                {/* Self bar */}
                <div className="flex items-center gap-3">
                  <span className="w-20 text-xs text-gray-500">{t("comparison.self", locale)}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${dim.selfScore}%`,
                        backgroundColor: dim.color,
                      }}
                    />
                  </div>
                  <span className="w-10 text-right text-sm font-semibold text-gray-700">
                    {dim.selfScore}%
                  </span>
                </div>

                {/* Observer bar */}
                <div className="flex items-center gap-3">
                  <span className="w-20 text-xs text-gray-500">{tf("comparison.othersCount", locale, { count: observerCount })}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full opacity-60"
                      style={{
                        width: `${dim.observerScore}%`,
                        backgroundColor: dim.color,
                      }}
                    />
                  </div>
                  <span className="w-10 text-right text-sm font-semibold text-gray-700">
                    {dim.observerScore}%
                  </span>
                </div>
              </div>

              <p className="mt-2 text-xs text-gray-400">{diffLabel}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
