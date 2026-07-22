"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";
import { getAvatarGradient, getAvatarMonogram } from "@/lib/ui/avatar";
import { Button } from "@/components/ui/primitives/Button";
import { SurfaceHero, SURFACE_HERO_THEME } from "@/components/ui/patterns/SurfaceHero";
import { ShareIcon, DocumentIcon } from "@/components/ui/icons";
import { SELF_PAYWALL_ENABLED } from "@/lib/operating-mode";

type AccessLevel = "start" | "plus";

const LEVEL_CONFIG: Record<AccessLevel, { label: string; bg: string; color: string }> = {
  start: { label: "Free",  bg: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" },
  plus:  { label: "Plus",  bg: "rgba(193,127,74,0.2)",   color: "var(--color-accent-primary-soft)" },
};

const SELF_TOP_DIM_BG = "rgba(61,107,94,0.3)";
const SELF_TOP_DIM_TEXT = "var(--color-surface-self-accent-soft)";

interface ProfileHeroProps {
  userName: string;
  completedAt: string;
  personalityType: string;
  percentile: string;
  insight: string;
  accessLevel?: AccessLevel;
  onDownloadPdf?: () => void;
  pdfLoading?: boolean;
  onShare?: () => void;
  shareLoading?: boolean;
  topDimensions?: string[];
  watchDimensions?: string[];
}

export function ProfileHero({
  userName,
  completedAt,
  personalityType,
  percentile,
  insight,
  accessLevel = "start",
  onDownloadPdf,
  pdfLoading,
  onShare,
  shareLoading,
  topDimensions = [],
  watchDimensions = [],
}: ProfileHeroProps) {
  const { locale } = useLocale();

  // PDF-gomb finom visszajelzése: generálás alatt pörgő progress,
  // siker után zöld pipa, ami pár másodperc múlva magától eltűnik.
  const [pdfDone, setPdfDone] = useState(false);
  const wasPdfLoading = useRef(false);
  useEffect(() => {
    const was = wasPdfLoading.current;
    wasPdfLoading.current = Boolean(pdfLoading);
    if (was && !pdfLoading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPdfDone(true);
      const id = setTimeout(() => setPdfDone(false), 2600);
      return () => clearTimeout(id);
    }
  }, [pdfLoading]);

  const level = LEVEL_CONFIG[accessLevel];
  const initial = getAvatarMonogram(userName, { length: 1 });
  const [avatarFrom, avatarTo] = getAvatarGradient(userName);
  const selfTheme = SURFACE_HERO_THEME.self;

  return (
    <SurfaceHero
      variant="self"
      contentClassName="mx-auto max-w-4xl px-5 pb-7 pt-8 md:px-9 md:pb-8 md:pt-10"
      eyebrow={
        // Kikapcsolt paywallnál az „A te profilod" badge-ként jelenik meg,
        // eyebrow nincs.
        SELF_PAYWALL_ENABLED ? (
          <p className="text-[10px] uppercase tracking-[2px] text-white/[0.28]">
            {t("results.heroEyebrow", locale)}
          </p>
        ) : undefined
      }
      badge={
        SELF_PAYWALL_ENABLED ? (
          <span
            className="rounded-md px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            style={{ backgroundColor: level.bg, color: level.color }}
          >
            {level.label}
          </span>
        ) : (
          <span
            className="rounded-md px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            style={{
              backgroundColor: "rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.45)",
            }}
          >
            {t("results.heroEyebrow", locale)}
          </span>
        )
      }
      title={(
        <div className="mb-0.5 flex items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${avatarFrom}, ${avatarTo})` }}
          >
            {initial}
          </div>
          <h1 className="break-words font-fraunces text-[26px] tracking-tight text-white md:text-[34px]">
            {userName}
          </h1>
        </div>
      )}
      meta={(
        <p className="text-[11px] text-white/[0.25]">
          {t("results.heroAssessment", locale)} {completedAt}
        </p>
      )}
      body={(
        <div>
          <div className="flex items-start justify-between gap-3">
            <span className="font-fraunces text-[18px] italic text-[var(--color-accent-primary-soft)] md:text-[22px]">
              {personalityType}
            </span>
            {percentile ? (
              <span className="shrink-0 rounded-md bg-white/10 px-2.5 py-1 text-[10px] text-white/[0.45]">
                {percentile}
              </span>
            ) : null}
          </div>
          {percentile ? (
            <p className="mt-1 text-right text-[10px] text-white/[0.28]">
              {t("results.percentileNote", locale)}
            </p>
          ) : null}
        </div>
      )}
      summary={insight}
      summaryClassName="max-w-[480px] text-white/[0.42]"
      chips={(
        <>
          {(topDimensions.length > 0 || watchDimensions.length > 0) ? (
            <div className="flex flex-wrap items-center gap-2">
              {topDimensions.length > 0 ? (
                <>
                  <span className="text-[10px] uppercase tracking-wide text-white/[0.25]">
                    {t("content.heroTopDims", locale)}:
                  </span>
                  {topDimensions.map((d) => (
                    <span
                      key={d}
                      className="rounded px-2 py-0.5 text-[10px] font-medium"
                      style={{ backgroundColor: SELF_TOP_DIM_BG, color: SELF_TOP_DIM_TEXT }}
                    >
                      {d}
                    </span>
                  ))}
                </>
              ) : null}
              {watchDimensions.length > 0 ? (
                <>
                  <span className="ml-2 text-[10px] uppercase tracking-wide text-white/[0.25]">
                    {t("content.heroWatchDims", locale)}:
                  </span>
                  {watchDimensions.map((d) => (
                    <span
                      key={d}
                      className="rounded px-2 py-0.5 text-[10px] font-medium"
                      style={{ backgroundColor: selfTheme.badgeBg, color: "var(--color-accent-primary-soft)" }}
                    >
                      {d}
                    </span>
                  ))}
                </>
              ) : null}
            </div>
          ) : null}
        </>
      )}
      actions={(
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={onShare}
            disabled={shareLoading}
            variant="ghost"
            className="rounded-[9px] bg-white/[0.07] px-[18px] text-[11px] font-medium text-white/[0.55] hover:bg-white/[0.12] hover:text-white/70"
          >
            <span className="inline-flex items-center gap-2">
              <ShareIcon />
              {shareLoading ? "..." : t("results.heroShare", locale)}
            </span>
          </Button>
          <Button
            type="button"
            onClick={onDownloadPdf}
            disabled={pdfLoading}
            variant="primary"
            className="rounded-[9px] px-[18px] text-[11px] font-medium text-white transition-all duration-300 hover:brightness-110"
            style={{ backgroundColor: selfTheme.primary }}
          >
            {pdfLoading ? (
              <span className="inline-flex items-center gap-2">
                <span
                  aria-hidden
                  className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/25 border-t-white"
                />
                {t("results.heroPdf", locale)}
              </span>
            ) : pdfDone ? (
              <span className="inline-flex items-center gap-2">
                <span
                  aria-hidden
                  className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-400 text-[10px] font-bold leading-none text-white"
                >
                  ✓
                </span>
                {t("results.heroPdf", locale)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <DocumentIcon />
                {t("results.heroPdf", locale)}
              </span>
            )}
          </Button>
        </div>
      )}
    />
  );
}
