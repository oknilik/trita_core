"use client";

import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";

interface LockedPreviewProps {
  isPlus?: boolean;
}

export function LockedPreview({ isPlus = false }: LockedPreviewProps) {
  const { locale } = useLocale();

  if (isPlus) return null;

  return (
    <div className="mt-[18px] flex flex-col gap-2">
      <div className="flex cursor-pointer items-center gap-3 rounded-xl border-[1.5px] border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] px-5 py-3.5 transition-colors hover:bg-[var(--color-border-default)]">
        <span className="shrink-0 text-body opacity-25">🔒</span>
        <span className="flex-1 text-xs leading-relaxed text-[var(--color-text-muted)]">
          {t("results.lockPreviewText", locale)}
        </span>
        <span className="shrink-0 rounded-md bg-[var(--color-surface-highlight-warm)] px-2.5 py-[3px] text-micro font-semibold text-[var(--color-accent-primary-strong)]">
          Plus · €9
        </span>
      </div>
    </div>
  );
}
