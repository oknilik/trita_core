"use client";

import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";

interface KeyTakeawaysSectionProps {
  paragraphs: string[];
  closingText: string;
  isUnlocked: boolean;
}

export function KeyTakeawaysSection({ paragraphs, closingText, isUnlocked }: KeyTakeawaysSectionProps) {
  const { locale } = useLocale();

  if (!isUnlocked || paragraphs.length === 0) return null;

  return (
    <div
      className="mt-6 rounded-2xl p-6 px-7"
      style={{ background: "linear-gradient(135deg, var(--color-text-primary), var(--color-text-strong-deep))" }}
    >
      <p className="mb-3 text-micro uppercase tracking-widest" style={{ color: "var(--color-accent-primary-soft)" }}>
        {t("results.takeawaysEyebrow", locale)}
      </p>
      <div className="flex flex-col gap-3">
        {paragraphs.map((para, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="mt-[6px] h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: "var(--color-action-primary-bg)" }} />
            <p className="text-caption leading-[1.7] text-white/[0.55]">{para}</p>
          </div>
        ))}
      </div>
      {closingText && (
        <p className="mt-4 border-t border-white/[0.06] pt-3.5 font-fraunces text-sm italic leading-relaxed text-white/[0.35]">
          {closingText}
        </p>
      )}
    </div>
  );
}
