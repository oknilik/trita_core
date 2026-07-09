"use client";

import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";

interface InsightBullet {
  dimension?: string;
  text: string;
}

interface InsightPairProps {
  strengths: InsightBullet[];
  watchAreas: InsightBullet[];
}

export function InsightPair({ strengths, watchAreas }: InsightPairProps) {
  const { locale } = useLocale();

  return (
    <div className="grid grid-cols-1 gap-2.5 py-5 md:grid-cols-2">
      <div className="rounded-xl border-[1.5px] border-[var(--color-action-primary-bg)]/[0.18] bg-[var(--color-surface-self-accent-soft)] p-4 px-[18px]">
        <p className="mb-2 text-[9px] font-semibold uppercase tracking-widest text-[var(--color-accent-self-deep)]">
          {t("results.insightStrengths", locale)}
        </p>
        <div className="flex flex-col gap-1.5">
          {strengths.map((s, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-1 text-[10px] text-[var(--color-action-primary-bg)]">•</span>
              <span className="text-[13px] text-[var(--color-text-secondary)]">
                {s.dimension && (
                  <strong className="text-[var(--color-accent-self-deep)]">{s.dimension}</strong>
                )}
                {s.dimension && " — "}
                {s.text}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border-[1.5px] border-[var(--color-accent-primary)]/[0.18] bg-[var(--color-surface-highlight-warm)] p-4 px-[18px]">
        <p className="mb-2 text-[9px] font-semibold uppercase tracking-widest text-[var(--color-accent-primary-strong)]">
          {t("results.insightWatch", locale)}
        </p>
        <div className="flex flex-col gap-1.5">
          {watchAreas.map((w, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-1 text-[10px] text-[var(--color-accent-primary)]">•</span>
              <span className="text-[13px] text-[var(--color-text-secondary)]">
                {w.dimension && (
                  <strong className="text-[var(--color-accent-primary-strong)]">{w.dimension}</strong>
                )}
                {w.dimension && " — "}
                {w.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
