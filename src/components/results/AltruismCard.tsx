"use client";

import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";
import { getDimensionTier, getDimensionLabel, tierColors } from "@/lib/dimension-utils";

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
          {/* Szöveges besorolás — 0 közeli értéknél a szám önmagában
              adathibának tűnne (design-akciólista #13). */}
          <span className={`shrink-0 rounded px-1.5 py-[2px] text-micro font-semibold ${colors.tagBg} ${colors.tagText}`}>
            {getDimensionLabel(value, locale)}
          </span>
          <div className="h-1 w-14 shrink-0 overflow-hidden rounded-sm bg-[var(--color-border-default)] md:w-[120px]">
            {/* Min. 2% sávszélesség, hogy a 0 is szándékos értéknek látsszon */}
            <div className={`h-full rounded-sm ${colors.fill}`} style={{ width: `${Math.max(value, 2)}%` }} />
          </div>
          <span className={`w-10 shrink-0 text-right font-fraunces text-base ${colors.text}`}>
            {value}%
          </span>
        </div>
        <p className="mt-2.5 max-w-prose text-body text-[var(--color-text-secondary)]">{description}</p>
      </div>
    </div>
  );
}
