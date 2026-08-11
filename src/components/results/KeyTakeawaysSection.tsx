"use client";

import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";

interface KeyTakeawaysSectionProps {
  paragraphs: string[];
  isUnlocked: boolean;
}

export function KeyTakeawaysSection({ paragraphs, isUnlocked }: KeyTakeawaysSectionProps) {
  const { locale } = useLocale();

  if (!isUnlocked || paragraphs.length === 0) return null;

  return (
    <div
      className="mt-6 rounded-2xl p-6 px-7"
      style={{ background: "linear-gradient(135deg, var(--color-surface-inverse), var(--color-surface-inverse-soft))" }}
    >
      <p className="mb-3 text-micro uppercase tracking-widest" style={{ color: "var(--color-accent-primary-soft)" }}>
        {t("results.takeawaysEyebrow", locale)}
      </p>
      <div className="flex flex-col gap-3">
        {paragraphs.map((para, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="mt-[6px] h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: "var(--color-action-primary-bg)" }} />
            <p className="max-w-prose text-body text-white/[0.72]">{para}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
