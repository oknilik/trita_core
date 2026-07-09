"use client";

import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";
import { getAvatarGradient, getAvatarMonogram } from "@/lib/ui/avatar";
import { Button } from "@/components/ui/primitives/Button";
import { SurfaceHero, SURFACE_HERO_THEME } from "@/components/ui/patterns/SurfaceHero";

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
  const level = LEVEL_CONFIG[accessLevel];
  const initial = getAvatarMonogram(userName, { length: 1 });
  const [avatarFrom, avatarTo] = getAvatarGradient(userName);
  const selfTheme = SURFACE_HERO_THEME.self;

  return (
    <SurfaceHero
      variant="self"
      contentClassName="mx-auto max-w-4xl px-9 pb-8 pt-10"
      eyebrow={
        <p className="text-[9px] uppercase tracking-[2px] text-white/[0.28]">
          {t("results.heroEyebrow", locale)}
        </p>
      }
      badge={
        <span
          className="rounded-md px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
          style={{ backgroundColor: level.bg, color: level.color }}
        >
          {level.label}
        </span>
      }
      title={(
        <div className="mb-0.5 flex items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${avatarFrom}, ${avatarTo})` }}
          >
            {initial}
          </div>
          <h1 className="font-fraunces text-[34px] tracking-tight text-white">
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
        <div className="flex items-start justify-between gap-3">
          <span className="font-fraunces text-[22px] italic text-[var(--color-accent-primary-soft)]">
            {personalityType}
          </span>
          {percentile ? (
            <span className="shrink-0 rounded-md bg-white/10 px-2.5 py-1 text-[9px] text-white/[0.45]">
              {percentile}
            </span>
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
                  <span className="text-[9px] uppercase tracking-wide text-white/[0.25]">
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
                  <span className="ml-2 text-[9px] uppercase tracking-wide text-white/[0.25]">
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
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={onShare}
            disabled={shareLoading}
            variant="ghost"
            className="rounded-[9px] bg-white/[0.07] px-[18px] text-[11px] font-medium text-white/[0.55] hover:bg-white/[0.12] hover:text-white/70"
          >
            📤 {shareLoading ? "..." : t("results.heroShare", locale)}
          </Button>
          <Button
            type="button"
            onClick={onDownloadPdf}
            disabled={pdfLoading}
            variant="primary"
            className="rounded-[9px] px-[18px] text-[11px] font-medium text-white hover:brightness-110"
            style={{ backgroundColor: selfTheme.primary }}
          >
            📄 {pdfLoading ? "..." : t("results.heroPdf", locale)}
          </Button>
        </div>
      )}
    />
  );
}
