"use client";

import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";
import { getDimensionTier, tierColors } from "@/lib/dimension-utils";

interface AltruismCardProps {
  value: number;
  description: string;
}

export function AltruismCard({ value, description }: AltruismCardProps) {
  const { locale } = useLocale();
  const tier = getDimensionTier(value);
  const colors = tierColors[tier];

  return (
    <div className="mt-6">
      {/* Info banner */}
      <div className="mb-3 flex items-start gap-2.5 rounded-xl border-[1.5px] border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] p-4">
        <span className="mt-0.5 shrink-0 text-sm text-[var(--color-text-muted)]">ℹ</span>
        <div>
          <p className="text-xs font-semibold text-[var(--color-text-primary)]">
            {t("content.altruismName", locale)} ({t("content.altruismTitle", locale)})
          </p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--color-text-muted)]">
            {t("content.altruismInfo", locale)}
          </p>
        </div>
      </div>

      {/* Altruism card */}
      <div className={`overflow-hidden rounded-xl border-[1.5px] p-4 px-[18px] ${colors.border} ${colors.cardBg}`}>
        <div className="flex items-center gap-3">
          <div className={`h-2 w-2 shrink-0 rounded-full ${colors.dot}`} />
          <span className="flex-1 text-sm font-medium text-[var(--color-text-primary)]">
            {t("content.altruismName", locale)}
          </span>
          <div className="h-1 w-[120px] shrink-0 overflow-hidden rounded-sm bg-[var(--color-border-default)]">
            <div className={`h-full rounded-sm ${colors.fill}`} style={{ width: `${value}%` }} />
          </div>
          <span className={`w-10 shrink-0 text-right font-fraunces text-base ${colors.text}`}>
            {value}%
          </span>
        </div>
        <p className="mt-2.5 text-[13px] leading-[1.7] text-[var(--color-text-secondary)]">{description}</p>
      </div>
    </div>
  );
}
