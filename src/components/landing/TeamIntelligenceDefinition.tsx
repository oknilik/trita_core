"use client";

import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n/public";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { TEAM_TERM_INDEXES } from "@/lib/team-dynamics-pillar";

const OUTCOMES = [1, 2, 3] as const;

/**
 * A /team-dynamics pillar kategória-definíciója és fogalomtára.
 *
 * Látható szöveg: a keresőnek és az első látogatónak is kimondja, mit ért a
 * trita csapatintelligencia alatt, és mit jelentenek a csapatkép szavai. A
 * `page.tsx` ugyanezekből az i18n-kulcsokból építi a DefinedTermSet JSON-LD-t
 * — a strukturált adat csak a lapon látható szöveget ismételheti.
 *
 * Szándékosan NEM a főoldalon él: az a funnel egyéni belépője, a kategória
 * gazdája ez a lap.
 */
export function TeamIntelligenceDefinition() {
  const { locale } = useLocale();

  return (
    <section data-team-intelligence-definition className="px-7 py-16 md:py-20">
      <div className="mx-auto max-w-[1120px]">
        <div className="grid gap-8 rounded-[28px] border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-7 shadow-[var(--ui-shadow-sm)] md:grid-cols-[0.8fr_1.2fr] md:items-start md:gap-12 md:p-10">
          <div>
            <SectionEyebrow tone="team">{t("teamDynamics.definitionEyebrow", locale)}</SectionEyebrow>
            <h2 className="mt-4 max-w-[14ch] font-fraunces text-fluid-title font-medium tracking-tight text-ink">
              {t("teamDynamics.definitionTitle", locale)}
            </h2>
          </div>
          <div>
            <p className="max-w-[68ch] text-base leading-relaxed text-ink-body">
              {t("teamDynamics.definitionBody", locale)}
            </p>
            <ul className="mt-7 grid gap-3 sm:grid-cols-3">
              {OUTCOMES.map((outcome) => (
                <li
                  key={outcome}
                  className="flex min-h-12 items-center rounded-xl bg-[var(--color-layer-team-soft)] px-4 text-caption font-semibold text-[var(--color-layer-team-accent)]"
                >
                  {t(`teamDynamics.definitionOutcome${outcome}`, locale)}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div data-team-glossary className="mt-12 md:mt-16">
          <div className="max-w-2xl">
            <SectionEyebrow tone="team">{t("teamDynamics.glossaryEyebrow", locale)}</SectionEyebrow>
            <h2 className="mt-4 font-fraunces text-fluid-title font-medium tracking-tight text-ink">
              {t("teamDynamics.glossaryTitle", locale)}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-ink-body">
              {t("teamDynamics.glossaryIntro", locale)}
            </p>
          </div>
          <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TEAM_TERM_INDEXES.map((i) => (
              <div
                key={i}
                className="rounded-[22px] border border-[var(--color-border-default)] bg-surface-card p-6"
              >
                <dt className="font-fraunces text-heading text-ink">{t(`teamDynamics.term${i}Name`, locale)}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-ink-body">
                  {t(`teamDynamics.term${i}Desc`, locale)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
