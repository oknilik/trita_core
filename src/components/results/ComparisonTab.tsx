"use client";

import { useLocale } from "@/components/LocaleProvider";
import { t, tf } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import type { SerializedDimension } from "@/components/profile/ProfileTabs";

interface ComparisonTabProps {
  dimensions: SerializedDimension[];
  hasObserverData: boolean;
  observerCount: number;
}

// ─── Insight texts for gaps ──────────────────────────────────────────────────

const GAP_INSIGHTS: Record<string, { hu: string; en: string }> = {
  H_higher: { hu: "Mások őszintébbnek és alázatosabbnak látnak, mint ahogyan magad érzed.", en: "Others see you as more honest and humble than you feel yourself." },
  H_lower: { hu: "Az értékrended erősebb lehet, mint amennyire azt kifelé kommunikálod.", en: "Your value system may be stronger than what you communicate outwardly." },
  E_higher: { hu: "Mások érzékenyebbnek látnak, mint ahogyan te érzed magad. Ez stresszes helyzetben válhat láthatóvá.", en: "Others see you as more sensitive than you feel. This may become visible under stress." },
  E_lower: { hu: "Stabilabbnak tűnsz kifelé, mint amennyire azt belülről érzed.", en: "You appear more stable outwardly than you feel internally." },
  X_higher: { hu: "Mások energikusabbnak és társaságibbnak látnak.", en: "Others see you as more energetic and sociable." },
  X_lower: { hu: "Kifelé visszafogottabbnak tűnsz, mint amennyire belül energikus vagy.", en: "You appear more reserved outwardly than you feel inside." },
  A_higher: { hu: "Mások barátságosabbnak értékelnek, mint ahogy magad látod. Lehet, hogy a belső feszültséged kevésbé látszik kifelé.", en: "Others rate you as more agreeable than you see yourself. Your internal tension may be less visible." },
  A_lower: { hu: "Az egyenességed erősebben jön át kifelé, mint amennyire azt érzékeled.", en: "Your directness comes across more strongly than you realize." },
  C_higher: { hu: "Mások szervezettebbnek és megbízhatóbbnak látnak.", en: "Others see you as more organized and reliable." },
  C_lower: { hu: "A belső rendszered kevésbé látszik kifelé — lehet, hogy többet is kommunikálhatnál a módszertanodból.", en: "Your internal structure is less visible — you could communicate more about your methods." },
  O_higher: { hu: "Mások nyitottabbnak látnak az új ötletekre és tapasztalatokra.", en: "Others see you as more open to new ideas and experiences." },
  O_lower: { hu: "A belső kíváncsiságod kevésbé nyilvánvaló kifelé.", en: "Your inner curiosity is less obvious to others." },
};

// ─── Summary generation ──────────────────────────────────────────────────────

function getSummaryPoints(
  dims: { name: string; self: number; observer: number }[],
  locale: Locale,
): string[] {
  const points: string[] = [];
  const matching = dims.filter((d) => Math.abs(d.self - d.observer) < 10);
  const differing = dims.filter((d) => Math.abs(d.self - d.observer) >= 10);

  if (matching.length >= 4) {
    points.push(
      tf("comparison.summaryMatchMany", locale, { count: matching.length }),
    );
  }

  for (const d of differing) {
    const key = d.observer > d.self ? "comparison.summaryDiffStronger" : "comparison.summaryDiffWeaker";
    points.push(
      tf(key, locale, { name: d.name, gap: Math.abs(d.self - d.observer) }),
    );
  }

  if (differing.length === 0) {
    points.push(t("comparison.summaryPerfectMatch", locale));
  }

  return points;
}

// ─── Main component ──────────────────────────────────────────────────────────

export function ComparisonTab({
  dimensions,
  hasObserverData,
  observerCount,
}: ComparisonTabProps) {
  const { locale } = useLocale();

  const mainDims = dimensions.filter((d) => d.code !== "I");

  const dimData = mainDims.map((d) => ({
    code: d.code,
    name: d.label,
    self: d.score,
    observer: d.observerScore ?? d.score,
  }));

  const matchingCount = dimData.filter((d) => Math.abs(d.self - d.observer) < 10).length;
  const differingCount = dimData.length - matchingCount;
  const avgGapPct = Math.round(
    dimData.reduce((sum, d) => sum + Math.abs(d.self - d.observer), 0) / (dimData.length || 1),
  );
  const isGoodMatch = differingCount <= 2;

  const blindspots = dimData.filter((d) => Math.abs(d.self - d.observer) >= 10);
  const noBlindspotDims = dimData.filter((d) => Math.abs(d.self - d.observer) < 10).map((d) => d.name);

  const summaryPoints = getSummaryPoints(dimData, locale);

  const getInsight = (code: string, self: number, observer: number): string | null => {
    const gap = Math.abs(self - observer);
    if (gap < 10) return null;
    const dir = observer > self ? "higher" : "lower";
    const key = `${code}_${dir}`;
    const lang = locale === "hu" ? "hu" : "en";
    return GAP_INSIGHTS[key]?.[lang] ?? null;
  };

  if (!hasObserverData) {
    return (
      <div className="rounded-2xl border-[1.5px] border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] p-8 text-center">
        <span className="mb-2.5 inline-block text-[32px] opacity-20">📊</span>
        <h3 className="mb-1.5 font-fraunces text-[18px] text-[var(--color-text-primary)]">
          {t("comparison.noDataTitle", locale)}
        </h3>
        <p className="mx-auto max-w-[380px] text-caption leading-relaxed text-[var(--color-text-muted)]">
          {t("comparison.noDataBody", locale)}
        </p>
        <p className="mx-auto mt-2 max-w-[380px] text-[12px] leading-relaxed text-[var(--color-ink-warm)]">
          {locale === "hu"
            ? "Következő lépés: kérj observer visszajelzést, vagy kapcsolódj csapathoz a közös kép felépítéséhez."
            : "Next step: request observer feedback or connect to a team to build a shared picture."}
        </p>
        <div className="mt-4 flex justify-center">
          {/* UX-B15: a meghívó-blokk ugyanezen a tabon, lejjebb van — link
              helyett görgetünk, nem navigálunk önmagunkra. */}
          <button
            type="button"
            onClick={() =>
              document
                .getElementById("invitations")
                ?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
            className="inline-flex min-h-[42px] items-center rounded-[10px] bg-[var(--color-action-primary-bg)] px-5 text-[12px] font-semibold text-[var(--color-action-primary-fg)] transition hover:brightness-110"
          >
            {locale === "hu" ? "Observer meghívása" : "Invite observers"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header */}
      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: "var(--color-action-primary-bg)" }} />
          <span className="text-micro uppercase tracking-widest text-[var(--color-text-muted)]">
            {t("comparison.headerEyebrow", locale)}
          </span>
        </div>
        <h2 className="font-fraunces text-[22px] tracking-tight text-[var(--color-text-primary)]">
          {t("comparison.headerTitle", locale)}
        </h2>
        <p className="mt-1 text-caption leading-relaxed text-[var(--color-text-muted)]">
          {t("comparison.headerBody", locale)}
        </p>
        <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-[var(--color-surface-self-accent-soft)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--color-accent-self-deep)]">
          {tf("comparison.observerBadge", locale, { count: observerCount })}
        </span>
      </div>

      {/* 2. Overview card */}
      <div className="rounded-xl border-[1.5px] border-[var(--color-border-soft)] bg-surface-card p-5">
        <div className="mb-4 flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
            style={{
              backgroundColor: isGoodMatch ? "var(--color-surface-self-accent-soft)" : "var(--color-surface-highlight-warm)",
              color: isGoodMatch ? "var(--color-action-primary-bg)" : "var(--color-accent-primary)",
            }}
          >
            {isGoodMatch ? "✓" : "⚠"}
          </div>
          <div>
            <p className="font-fraunces text-base text-[var(--color-text-primary)]">
              {isGoodMatch
                ? t("comparison.overviewGoodMatch", locale)
                : t("comparison.overviewMixed", locale)}
            </p>
            <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">
              {isGoodMatch
                ? t("comparison.overviewGoodMatchBody", locale)
                : t("comparison.overviewMixedBody", locale)}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-[10px] bg-[var(--color-surface-subtle)] p-3 text-center">
            <p className="font-fraunces text-[22px] leading-none" style={{ color: "var(--color-action-primary-bg)" }}>{matchingCount}</p>
            <p className="mt-1 text-micro text-[var(--color-text-muted)]">{t("comparison.matchingDims", locale)}</p>
          </div>
          <div className="rounded-[10px] bg-[var(--color-surface-subtle)] p-3 text-center">
            <p className="font-fraunces text-[22px] leading-none" style={{ color: "var(--color-accent-primary)" }}>{differingCount}</p>
            <p className="mt-1 text-micro text-[var(--color-text-muted)]">{t("comparison.differingDims", locale)}</p>
          </div>
          <div className="rounded-[10px] bg-[var(--color-surface-subtle)] p-3 text-center">
            <p className="font-fraunces text-[22px] leading-none text-[var(--color-text-primary)]">{avgGapPct}%</p>
            <p className="mt-1 text-micro text-[var(--color-text-muted)]">{t("comparison.avgGap", locale)}</p>
          </div>
        </div>
      </div>

      {/* 3. Dimension comparison cards */}
      <div>
        <div className="mb-4 flex gap-4">
          <span className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "var(--color-action-primary-bg)" }} />
            {t("comparison.legendSelf", locale)}
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "var(--color-accent-primary-soft)" }} />
            {t("comparison.legendObserver", locale)}
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {dimData.map((dim) => {
            const gap = Math.abs(dim.self - dim.observer);
            const hasGap = gap >= 10;
            const insight = getInsight(dim.code, dim.self, dim.observer);

            return (
              <div
                key={dim.code}
                className={`rounded-xl border-[1.5px] p-4 px-[18px] ${
                  hasGap ? "border-[var(--color-accent-primary)]/30 bg-[var(--color-surface-highlight-warm)]" : "border-[var(--color-action-primary-bg)]/20 bg-surface-card"
                }`}
              >
                <div className="mb-2.5 flex flex-wrap items-center justify-between gap-1.5">
                  <span className="text-caption font-semibold text-[var(--color-text-primary)]">{dim.name}</span>
                  <span
                    className="rounded px-2 py-0.5 text-[11px] font-medium"
                    style={{
                      backgroundColor: gap < 10 ? "var(--color-surface-self-accent-soft)" : gap < 15 ? "var(--color-surface-highlight-warm)" : "var(--color-state-error-soft)",
                      color: gap < 10 ? "var(--color-accent-self-deep)" : gap < 15 ? "var(--color-accent-primary-strong)" : "var(--color-text-error-strong)",
                    }}
                  >
                    ±{gap} {t("comparison.pointsUnitShort", locale)} — {gap < 10 ? t("comparison.gapMatch", locale) : t("comparison.gapDiff", locale)}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-[50px] shrink-0 text-micro text-[var(--color-text-muted)]">{t("comparison.self", locale)}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-[var(--color-border-default)]">
                      <div className="h-full rounded-sm" style={{ width: `${dim.self}%`, backgroundColor: "var(--color-action-primary-bg)" }} />
                    </div>
                    <span className="w-7 shrink-0 text-right text-micro font-semibold" style={{ color: "var(--color-action-primary-bg)" }}>{dim.self}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-[50px] shrink-0 text-micro text-[var(--color-text-muted)]">{t("comparison.others", locale)}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-[var(--color-border-default)]">
                      <div className="h-full rounded-sm" style={{ width: `${dim.observer}%`, backgroundColor: "var(--color-accent-primary-soft)" }} />
                    </div>
                    <span className="w-7 shrink-0 text-right text-micro font-semibold" style={{ color: "var(--color-accent-primary)" }}>{dim.observer}</span>
                  </div>
                </div>

                {hasGap && insight && (
                  <div className="mt-2.5 flex items-start gap-2 rounded-lg bg-[var(--color-surface-subtle)] p-2.5 px-3">
                    <span className="mt-px shrink-0 text-xs" style={{ color: "var(--color-accent-primary)" }}>💡</span>
                    <span className="text-xs leading-relaxed text-[var(--color-text-secondary)]">{insight}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Blind spot analysis */}
      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: "var(--color-action-primary-bg)" }} />
          <span className="text-micro uppercase tracking-widest text-[var(--color-text-muted)]">
            {t("comparison.blindSpotEyebrow", locale)}
          </span>
        </div>
        <h3 className="font-fraunces text-lg text-[var(--color-text-primary)]">
          {t("comparison.blindSpotTitle", locale)}
        </h3>
        <p className="mb-3 mt-1 text-caption leading-relaxed text-[var(--color-text-muted)]">
          {t("comparison.blindSpotBody", locale)}
        </p>

        <div className="flex flex-col gap-2.5">
          {blindspots.map((bs) => {
            const dir = bs.observer > bs.self;
            const insight = getInsight(bs.code, bs.self, bs.observer);
            return (
              <div key={bs.code} className="rounded-xl border-l-4 bg-[var(--color-surface-highlight-warm)] p-4 px-[18px]" style={{ borderLeftColor: "var(--color-accent-primary)" }}>
                <p className="mb-1 text-micro font-bold uppercase tracking-wide text-[var(--color-accent-primary-strong)]">
                  {t("comparison.possibleBlindSpot", locale)}
                </p>
                <p className="font-fraunces text-body text-[var(--color-text-primary)]">
                  {bs.name} — {dir
                    ? t("comparison.blindSpotStronger", locale)
                    : t("comparison.blindSpotWeaker", locale)}
                </p>
                {insight && (
                  <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">{insight}</p>
                )}
                <div className="mt-2 flex gap-3">
                  <span className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
                    <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--color-action-primary-bg)" }} />
                    {t("comparison.selfAssessment", locale)}: {bs.self}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
                    <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--color-accent-primary-soft)" }} />
                    Observer: {bs.observer}
                  </span>
                </div>
              </div>
            );
          })}

          {noBlindspotDims.length > 0 && (
            <div className="rounded-xl border-l-4 bg-[var(--color-surface-self-accent-soft)] p-4 px-[18px]" style={{ borderLeftColor: "var(--color-action-primary-bg)" }}>
              <p className="mb-1 text-micro font-bold uppercase tracking-wide text-[var(--color-accent-self-deep)]">
                {t("comparison.noBlindSpot", locale)}
              </p>
              <p className="font-fraunces text-body text-[var(--color-text-primary)]">
                {noBlindspotDims.join(", ")}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--color-accent-self-deep)]">
                {t("comparison.noBlindSpotBody", locale)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 5. Dark summary card */}
      <div
        className="rounded-2xl p-6 px-7"
        style={{ background: "linear-gradient(135deg, var(--color-surface-inverse), var(--color-surface-inverse-soft))" }}
      >
        <p className="mb-2 text-micro uppercase tracking-widest" style={{ color: "var(--color-accent-primary-soft)" }}>
          {t("comparison.summaryEyebrow", locale)}
        </p>
        <p className="mb-3 font-fraunces text-lg text-white">
          {t("comparison.summaryTitle", locale)}
        </p>
        <div className="flex flex-col gap-2">
          {summaryPoints.map((point, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: "var(--color-accent-self)" }} />
              <p className="text-caption leading-[1.6] text-white/[0.55]">{point}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
