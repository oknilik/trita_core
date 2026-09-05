"use client";

import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n/public";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";

const OUTCOMES = [1, 2, 3] as const;

/** Látható kategória-definíció: a keresőnek és az első látogatónak is kimondja,
 * mit ért a trita csapatintelligencia alatt. */
export function TeamIntelligenceDefinition() {
  const { locale } = useLocale();

  return (
    <section data-team-intelligence-definition className="px-7 py-16 md:py-20">
      <div className="mx-auto grid max-w-[1120px] gap-8 rounded-[28px] border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-7 shadow-[var(--ui-shadow-sm)] md:grid-cols-[0.8fr_1.2fr] md:items-start md:gap-12 md:p-10">
        <div>
          <SectionEyebrow tone="team">
            {t("landing.teamIntelligenceEyebrow", locale)}
          </SectionEyebrow>
          <h2 className="mt-4 max-w-[14ch] font-fraunces text-fluid-title font-medium tracking-tight text-ink">
            {t("landing.teamIntelligenceTitle", locale)}
          </h2>
        </div>
        <div>
          <p className="max-w-[68ch] text-base leading-relaxed text-ink-body">
            {t("landing.teamIntelligenceBody", locale)}
          </p>
          <ul className="mt-7 grid gap-3 sm:grid-cols-3">
            {OUTCOMES.map((outcome) => (
              <li
                key={outcome}
                className="flex min-h-12 items-center rounded-xl bg-[var(--color-layer-team-soft)] px-4 text-caption font-semibold text-[var(--color-layer-team-accent)]"
              >
                {t(`landing.teamIntelligenceOutcome${outcome}`, locale)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
