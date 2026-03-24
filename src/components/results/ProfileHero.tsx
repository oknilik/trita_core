"use client";

import { useLocale } from "@/components/LocaleProvider";

type AccessLevel = "start" | "plus" | "reflect";

const LEVEL_CONFIG: Record<AccessLevel, { label: string; bg: string; color: string }> = {
  start:   { label: "Self Start",   bg: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" },
  plus:    { label: "Self Plus",    bg: "rgba(193,127,74,0.2)",   color: "#e8a96a" },
  reflect: { label: "Self Reflect", bg: "rgba(90,143,127,0.2)",   color: "#8fd4be" },
};

interface ProfileHeroProps {
  userName: string;
  completedAt: string;
  personalityType: string;
  percentile: string;
  insight: string;
  accessLevel?: AccessLevel;
  onDownloadPdf?: () => void;
  pdfLoading?: boolean;
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
}: ProfileHeroProps) {
  const { locale } = useLocale();
  const isHu = locale === "hu";
  const level = LEVEL_CONFIG[accessLevel];

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        background:
          "linear-gradient(135deg, #2a5244 0%, #1e3d34 60%, #1a2e28 100%)",
      }}
    >
      <div className="mx-auto max-w-4xl px-9 pb-8 pt-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-[280px] w-[280px] rounded-full bg-white/[0.02]" />

        <div className="mb-2 flex items-center gap-2.5">
          <p className="text-[9px] uppercase tracking-[2px] text-white/[0.28]">
            {isHu ? "A te profilod" : "Your profile"}
          </p>
          <span
            className="rounded-md px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
            style={{ backgroundColor: level.bg, color: level.color }}
          >
            {level.label}
          </span>
        </div>
        <h1 className="mb-0.5 font-fraunces text-[34px] tracking-tight text-white">
          {userName}
        </h1>
        <p className="mb-4 text-[11px] text-white/[0.25]">
          {isHu ? "Felmérés:" : "Assessment:"} {completedAt}
        </p>

        <div className="mb-2.5 flex items-center gap-2.5">
          <span className="font-fraunces text-[22px] italic text-[#e8a96a]">
            {personalityType}
          </span>
          {percentile && (
            <span className="rounded-md bg-white/10 px-2.5 py-0.5 text-[9px] text-white/[0.45]">
              {percentile}
            </span>
          )}
        </div>

        {insight && (
          <p className="max-w-[480px] text-[14px] leading-relaxed text-white/[0.42]">
            {insight}
          </p>
        )}

        <div className="mt-[18px] flex gap-2">
          <button
            type="button"
            className="flex min-h-[44px] items-center gap-1.5 rounded-[9px] bg-white/[0.07] px-[18px] py-2 text-[11px] font-medium text-white/[0.55] transition hover:bg-white/[0.12]"
          >
            📤 {isHu ? "Megosztás" : "Share"}
          </button>
          <button
            type="button"
            onClick={onDownloadPdf}
            disabled={pdfLoading}
            className="flex min-h-[44px] items-center gap-1.5 rounded-[9px] bg-[#c17f4a] px-[18px] py-2 text-[11px] font-medium text-white transition hover:brightness-110 disabled:opacity-50"
          >
            📄 {pdfLoading ? "..." : isHu ? "PDF letöltés" : "Download PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}
