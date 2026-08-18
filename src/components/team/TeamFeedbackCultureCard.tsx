import { t, tf, type Locale } from "@/lib/i18n";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import type { TeamFeedbackCulture } from "@/lib/team-observer";

// Visszajelzési kultúra kártya — a csapat egyetlen observer-forrású blokkja.
//
// AMIT NEM MUTAT (szándékosan): dimenziónkénti csapat-observer átlagot,
// tag-szintű értéket, eltérés-nagyságot, nevet. Csak bucketelt darabszám —
// az indoklás a team-observer.ts fejkommentjében.
//
// HANGNEM: az eltérés NEM hiba. A magas „eltérés" szám nem azt jelenti, hogy
// a csapat téveszmés, hanem hogy a visszajelzés kevésbé áramlik — ez
// beszélgetés-indító, nem verdikt. Ugyanaz az elv, ami miatt az értékelő
// színrámpa lekerült a dimenziókról.

export function TeamFeedbackCultureCard({
  culture,
  locale,
}: {
  culture: TeamFeedbackCulture;
  locale: Locale;
}) {
  const { memberCount, coveredCount, alignedCount, gapCount } = culture;

  return (
    <section className="rounded-[22px] border border-sand bg-surface-card p-5 shadow-[0_12px_28px_rgba(26,26,46,0.05)] md:p-6">
      {/* Kanonikus eyebrow-primitív (nem kézi bekezdés) — a csapat-felület
          tónusával, ahogy a szomszédos FeedbackTabView is hívja. */}
      <SectionEyebrow tone="team">
        {t("teamComp.feedbackCultureEyebrow", locale)}
      </SectionEyebrow>
      <h2 className="mt-1.5 font-fraunces text-heading leading-tight text-ink">
        {t("teamComp.feedbackCultureTitle", locale)}
      </h2>
      <p className="mt-2 max-w-2xl text-caption leading-relaxed text-ink-body">
        {tf("teamComp.feedbackCultureLead", locale, {
          covered: coveredCount,
          total: memberCount,
        })}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div className="rounded-[14px] border border-sand bg-cream px-4 py-3.5">
          <p className="font-fraunces text-title leading-none text-ink tabular-nums">
            {alignedCount}
          </p>
          <p className="mt-1.5 text-xs font-medium text-ink">
            {t("teamComp.feedbackCultureAligned", locale)}
          </p>
          <p className="mt-1 text-note leading-relaxed text-ink-body">
            {t("teamComp.feedbackCultureAlignedHint", locale)}
          </p>
        </div>
        <div className="rounded-[14px] border border-sand bg-cream px-4 py-3.5">
          <p className="font-fraunces text-title leading-none text-ink tabular-nums">
            {gapCount}
          </p>
          <p className="mt-1.5 text-xs font-medium text-ink">
            {t("teamComp.feedbackCultureGap", locale)}
          </p>
          <p className="mt-1 text-note leading-relaxed text-ink-body">
            {t("teamComp.feedbackCultureGapHint", locale)}
          </p>
        </div>
      </div>

      {/* Forrás- és módszertani jegyzet — kötelező minden intelligence-
          kimeneten (termék-alapelv), itt az anonimitás-korlátot is kimondja. */}
      <p className="mt-4 border-t border-sand pt-3 text-note leading-relaxed text-muted">
        {t("teamComp.feedbackCultureNote", locale)}
      </p>
    </section>
  );
}
