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
      <div className="flex-1 rounded-xl border border-violet-200 bg-gradient-to-br from-violet-100 to-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
          {t("dashboard.spectrumHigh", locale)}
        </p>
        <p className="mt-2 text-sm font-bold text-gray-900">{strongLabel}</p>
        <p className="text-3xl font-bold text-violet-700">{strongest.score}%</p>
      </div>
      <div className="flex-1 rounded-xl border border-sky-200 bg-gradient-to-br from-sky-100 to-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-sky-600">
          {t("dashboard.spectrumLow", locale)}
        </p>
        <p className="mt-2 text-sm font-bold text-gray-900">{weakLabel}</p>
        <p className="text-3xl font-bold text-sky-600">{weakest.score}%</p>
      </div>
    </div>
  );
}
