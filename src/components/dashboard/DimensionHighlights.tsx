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
      <div className="flex-1 rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
          {t("dashboard.strongest", locale)}
        </p>
        <p className="mt-2 text-sm font-bold text-gray-900">{strongLabel}</p>
        <p className="text-3xl font-bold text-emerald-600">{strongest.score}%</p>
      </div>
      <div className="flex-1 rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
          {t("dashboard.weakest", locale)}
        </p>
        <p className="mt-2 text-sm font-bold text-gray-900">{weakLabel}</p>
        <p className="text-3xl font-bold text-amber-600">{weakest.score}%</p>
      </div>
    </div>
  );
}
