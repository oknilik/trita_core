"use client";

import { useLocale } from "@/components/LocaleProvider";
import { t, type Locale } from "@/lib/i18n";

interface HighlightDimension {
  label: string;
  labelByLocale?: Partial<Record<Locale, string>>;
  score: number;
}

interface DimensionHighlightsProps {
  strongest: HighlightDimension;
  weakest: HighlightDimension;
}

export function DimensionHighlights({
  strongest,
  weakest,
}: DimensionHighlightsProps) {
  const { locale } = useLocale();

  const strongLabel = strongest.labelByLocale?.[locale] ?? strongest.label;
  const weakLabel = weakest.labelByLocale?.[locale] ?? weakest.label;

  return (
    <div className="flex flex-row gap-3 md:flex-col">
      <div className="flex-1 rounded-xl border border-sage-ring bg-gradient-to-br from-sage-soft to-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-bronze-dark">
          {t("dashboard.spectrumHigh", locale)}
        </p>
        <p className="mt-2 text-sm font-bold text-gray-900">{strongLabel}</p>
        <p className="text-3xl font-bold text-bronze">{strongest.score}%</p>
      </div>
      <div className="flex-1 rounded-xl border border-[#cfe2d6] bg-gradient-to-br from-[#edf4ef] to-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-sage">
          {t("dashboard.spectrumLow", locale)}
        </p>
        <p className="mt-2 text-sm font-bold text-gray-900">{weakLabel}</p>
        <p className="text-3xl font-bold text-sage">{weakest.score}%</p>
      </div>
    </div>
  );
}
