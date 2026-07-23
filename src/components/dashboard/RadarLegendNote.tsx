"use client";

import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";

// Radar-összehasonlítás szín-jegyzete az ábra ALATT, HTML-ként.
// A korábbi SVG-belső legend fix koordinátákkal dolgozott, hosszabb
// feliratnál (pl. jelölt-név, csapatnév) elcsúszott — ez a komponens
// természetesen tördel. A pont-színek a RadarChart polygon-színeivel
// vannak szinkronban.
const SELF_DOT = "var(--color-visual-gradient-violet)";
const OBSERVER_DOT = "var(--color-state-success-strong)";

export function RadarLegendNote({
  selfLabel,
  observerLabel,
}: {
  selfLabel?: string;
  observerLabel?: string;
}) {
  const { locale } = useLocale();
  const resolvedSelf = selfLabel ?? t("comparison.self", locale);
  const resolvedObserver = observerLabel ?? t("comparison.others", locale);

  return (
    <p className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-[var(--color-text-muted)]">
      <span className="inline-flex items-center gap-1.5">
        <span
          aria-hidden
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: SELF_DOT }}
        />
        {resolvedSelf}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span
          aria-hidden
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: OBSERVER_DOT }}
        />
        {resolvedObserver}
      </span>
    </p>
  );
}
