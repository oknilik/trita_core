import { t, tf } from "@/lib/i18n";
import { TRITAN_DIM_ABBR, type TritanDimCode } from "@/lib/tritan";
import type { Locale } from "@/lib/i18n";
import { RadarChart } from "@/components/dashboard/RadarChart";
import Link from "next/link";

interface DimCompareEntry {
  code: string;
  label: string;
  color: string;
  selfScore: number;
  observerScore?: number;
}

interface ObserverComparisonProps {
  dimensions: DimCompareEntry[];
  observerCount: number;
  hasObserverData: boolean;
  locale: Locale;
}

export function ObserverComparison({
  dimensions,
  observerCount,
  hasObserverData,
  locale,
}: ObserverComparisonProps) {
  const isHu = locale === "hu";

  if (!hasObserverData) {
    // Access is unlocked but no observer data yet — show invite CTA
    return (
      <div className="rounded-2xl border border-sand bg-white p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-sand bg-cream">
          <svg
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            stroke="var(--color-accent-primary)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="8" r="3" />
            <path d="M5 19c0-3.314 2.686-6 6-6s6 2.686 6 6" />
            <path d="M16 3v6M13 6h6" />
          </svg>
        </div>
        <h3 className="font-fraunces text-xl text-ink">
          {t("content.observerInviteTitle", locale)}
        </h3>
        <p className="mt-2 mx-auto max-w-sm text-sm text-ink-body">
          {t("content.observerInviteBody", locale)}
        </p>
        <Link
          href="/profile/results?tab=invites"
          className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-lg border border-sage px-6 text-sm font-semibold text-bronze transition hover:bg-sage-ghost"
        >
          {t("content.observerManageInvites", locale)}
        </Link>
      </div>
    );
  }

  // Observer data available — show overlay radar + gap list
  const radarDimensions = dimensions.map((d) => ({
    code: d.code,
    color: d.color,
    score: d.selfScore,
    observerScore: d.observerScore,
  }));

  const gaps = dimensions
    .filter((d) => d.observerScore != null && Math.abs(d.selfScore - (d.observerScore ?? 0)) >= 8)
    .sort(
      (a, b) =>
        Math.abs(b.selfScore - (b.observerScore ?? 0)) -
        Math.abs(a.selfScore - (a.observerScore ?? 0)),
    );

  return (
    <div className="space-y-6">
      {/* Count badge */}
      <p className="text-sm text-ink-body">
        {tf("content.observerCountBasis", locale, { count: observerCount })}
      </p>

      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        {/* Overlay radar */}
        <div className="w-full max-w-[300px] shrink-0 md:w-[260px]">
          <RadarChart
            dimensions={radarDimensions}
            showObserver
            uid="observer-comparison"
          />
        </div>

        {/* Gap list */}
        <div className="flex-1 space-y-3">
          {gaps.length === 0 ? (
            <div className="rounded-xl border border-sand bg-cream px-5 py-4">
              <p className="text-sm text-ink-body">
                {t("content.observerGoodAlignment", locale)}
              </p>
            </div>
          ) : (
            gaps.map((dim) => {
              const delta = (dim.observerScore ?? 0) - dim.selfScore;
              const higherSelf = delta < 0;
              return (
                <div
                  key={dim.code}
                  className="rounded-xl border border-sand bg-white p-4"
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-md font-mono text-[10px] font-semibold text-white"
                        style={{ backgroundColor: dim.color }}
                      >
                        {TRITAN_DIM_ABBR[dim.code as TritanDimCode]?.[isHu ? "hu" : "en"] ?? dim.code}
                      </div>
                      <span className="text-sm font-semibold text-ink">{dim.label}</span>
                    </div>
                    <span
                      className={`font-mono text-xs font-semibold ${
                        higherSelf ? "text-bronze" : "text-sage"
                      }`}
                    >
                      {delta > 0 ? "+" : ""}
                      {delta}%
                    </span>
                  </div>
                  <p className="text-xs text-ink-body">
                    {higherSelf
                      ? t("content.observerSelfHigher", locale)
                      : t("content.observerObsHigher", locale)}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
