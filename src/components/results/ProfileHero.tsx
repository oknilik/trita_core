"use client";

import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";

type AccessLevel = "start" | "plus";

const AVATAR_COLORS = [
  ["#2a5244", "#1e3d34"],
  ["#8a5530", "#6b3f22"],
  ["#4a4a5e", "#33334a"],
  ["#6366F1", "#4F46E5"],
  ["#0E7490", "#0C5E75"],
  ["#9333EA", "#7C22CB"],
] as const;

function getAvatarColor(name: string): readonly [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const LEVEL_CONFIG: Record<AccessLevel, { label: string; bg: string; color: string }> = {
  start: { label: "Free",  bg: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" },
  plus:  { label: "Plus",  bg: "rgba(193,127,74,0.2)",   color: "#e8a96a" },
};

const SELF_HERO_GRADIENT =
  "linear-gradient(135deg, #2a5244 0%, #1e3d34 60%, #1a2e28 100%)";
const SELF_HERO_PRIMARY = "#c17f4a";
const SELF_TOP_DIM_BG = "rgba(61,107,94,0.3)";
const SELF_TOP_DIM_TEXT = "#e8f2f0";

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
  const initial = userName[0]?.toUpperCase() ?? "?";
  const [avatarFrom, avatarTo] = getAvatarColor(userName);

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: SELF_HERO_GRADIENT,
      }}
    >
      <div className="mx-auto max-w-4xl px-9 pb-8 pt-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-[280px] w-[280px] rounded-full bg-white/[0.02]" />

        <div className="mb-2 flex items-center gap-2.5">
          <p className="text-[9px] uppercase tracking-[2px] text-white/[0.28]">
            {t("results.heroEyebrow", locale)}
          </p>
          <span
            className="rounded-md px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
            style={{ backgroundColor: level.bg, color: level.color }}
          >
            {level.label}
          </span>
        </div>
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
        <p className="mb-4 text-[11px] text-white/[0.25]">
          {t("results.heroAssessment", locale)} {completedAt}
        </p>

        <div className="mb-2.5 flex items-start justify-between gap-3">
          <span className="font-fraunces text-[22px] italic text-[#e8a96a]">
            {personalityType}
          </span>
          {percentile && (
            <span className="shrink-0 rounded-md bg-white/10 px-2.5 py-1 text-[9px] text-white/[0.45]">
              {percentile}
            </span>
          )}
        </div>

        {insight && (
          <p className="max-w-[480px] text-[14px] leading-relaxed text-white/[0.42]">
            {insight}
          </p>
        )}

        {/* Dimension chips */}
        {(topDimensions.length > 0 || watchDimensions.length > 0) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {topDimensions.length > 0 && (
              <>
                <span className="text-[9px] uppercase tracking-wide text-white/[0.25]">
                  {t("content.heroTopDims", locale)}:
                </span>
                {topDimensions.map((d) => (
                  <span key={d} className="rounded px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: SELF_TOP_DIM_BG, color: SELF_TOP_DIM_TEXT }}>
                    {d}
                  </span>
                ))}
              </>
            )}
            {watchDimensions.length > 0 && (
              <>
                <span className="ml-2 text-[9px] uppercase tracking-wide text-white/[0.25]">
                  {t("content.heroWatchDims", locale)}:
                </span>
                {watchDimensions.map((d) => (
                  <span key={d} className="rounded px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: "rgba(193,127,74,0.2)", color: "#e8a96a" }}>
                    {d}
                  </span>
                ))}
              </>
            )}
          </div>
        )}

        <div className="mt-[18px] flex gap-2">
          <button
            type="button"
            onClick={onShare}
            disabled={shareLoading}
            className="flex min-h-[44px] items-center gap-1.5 rounded-[9px] bg-white/[0.07] px-[18px] py-2 text-[11px] font-medium text-white/[0.55] transition hover:bg-white/[0.12] disabled:opacity-50"
          >
            📤 {shareLoading ? "..." : t("results.heroShare", locale)}
          </button>
          <button
            type="button"
            onClick={onDownloadPdf}
            disabled={pdfLoading}
            className="flex min-h-[44px] items-center gap-1.5 rounded-[9px] px-[18px] py-2 text-[11px] font-medium text-white transition hover:brightness-110 disabled:opacity-50"
            style={{ backgroundColor: SELF_HERO_PRIMARY }}
          >
            📄 {pdfLoading ? "..." : t("results.heroPdf", locale)}
          </button>
        </div>
      </div>
    </div>
  );
}
