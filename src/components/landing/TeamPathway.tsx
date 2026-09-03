"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n/public";
import { TeamPanel } from "@/components/landing/panels";
import { track } from "@/lib/analytics/client";
import { ChevronRightIcon } from "@/components/ui/icons";
import { FOCUS_RING_CLASS } from "@/lib/ui/focus";

/**
 * A főoldal csapatos átvezetője. A látogató itt találkozik először a
 * tanácsadóval kísért csapatprogrammal — miután az egyéni ígéretet és a
 * három lépést már megértette. Egyetlen blokkban hordozza mindazt, ami a
 * korábbi csapat-módú landing Features-, StatsBar- és HowItWorks-szekcióiból
 * a döntéshez kell: a három mérési réteg, az idő- és átfutási ígéret, a
 * tanácsadói értelmezés. Az elsődleges út a pilot, a részletek a
 * /team-dynamics mélyoldalon.
 */
export function TeamPathway() {
  const { locale } = useLocale();

  const layers = [
    t("landing.teamFeat1Title", locale),
    t("landing.teamFeat2Title", locale),
    t("landing.teamFeat3Title", locale),
  ];

  const facts = [
    `${t("landing.statTeamMinValue", locale)}${t("landing.statMinSuffix", locale)} ${t("landing.statTeamMinLabel", locale)}`,
    t("landing.teamMetaTiming", locale),
    t("landing.proofTeam3Title", locale),
  ];

  return (
    <section data-landing-team-pathway className="px-7 pb-16 md:pb-24">
      <div className="relative mx-auto grid max-w-[1120px] overflow-hidden rounded-[30px] bg-gradient-to-br from-[var(--color-layer-team-hero-from)] via-[var(--color-layer-team-hero-mid)] to-[var(--color-layer-team-hero-to)] p-7 text-[var(--color-text-on-inverse)] sm:p-10 md:grid-cols-[0.95fr_1.05fr] md:items-center md:gap-12 lg:p-12">
        <svg
          aria-hidden
          viewBox="0 0 600 180"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-32 w-full opacity-20"
        >
          <path d="M-20 105C90 35 150 160 265 88S460 30 625 100" fill="none" stroke="var(--color-layer-team-glow)" />
          <path d="M-20 125C85 55 160 180 280 108S475 50 625 120" fill="none" stroke="var(--color-layer-team-glow)" />
        </svg>

        <div className="relative z-10">
          <span className="inline-flex rounded-md bg-white/12 px-3 py-1.5 text-micro font-semibold uppercase tracking-wide text-white/80">
            {t("landing.focusedTeamEyebrow", locale)}
          </span>
          <h2 className="mt-5 max-w-[14ch] font-fraunces text-fluid-title font-medium tracking-tight text-white">
            {t("landing.focusedTeamTitle", locale)}
          </h2>
          <p className="mt-4 max-w-[560px] text-base leading-relaxed text-white/75">
            {t("landing.focusedTeamSub", locale)}
          </p>

          <ul className="mt-6 space-y-2" aria-label={t("landing.focusedTeamLayersLabel", locale)}>
            {layers.map((layer) => (
              <li key={layer} className="flex items-start gap-3 text-sm text-white/90">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-layer-team-glow)]" />
                {layer}
              </li>
            ))}
          </ul>

          <p className="mt-5 text-note text-white/60">{facts.join(" · ")}</p>

          {/* A két út egy sorban, amíg elfér; szűk oszlopban a másodlagos
              link a gomb ALÁ kerül, a gomb felirata nem törik két sorba. */}
          <div className="mt-7 flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href="/pilot"
              onClick={() => track("cta.click", { cta_id: "team_pathway", surface: "landing", mode: "team" })}
              className={`inline-flex min-h-[52px] items-center justify-center whitespace-nowrap rounded-xl bg-[var(--color-accent-primary-soft)] px-6 text-sm font-semibold text-[var(--color-layer-team-hero-from)] shadow-md transition-all hover:-translate-y-px hover:brightness-105 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-layer-team-hero-from)]`}
            >
              {t("landing.teamCta", locale)}
              <ChevronRightIcon className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/team-dynamics"
              onClick={() => track("cta.click", { cta_id: "team_pathway_details", surface: "landing", mode: "team" })}
              className={`group inline-flex min-h-[44px] items-center justify-center rounded-lg px-3 text-sm font-semibold text-white/85 transition-colors hover:text-white ${FOCUS_RING_CLASS}`}
            >
              {t("landing.focusedTeamCta", locale)}
              <ChevronRightIcon className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        <div className="relative z-10 mx-auto mt-9 w-full max-w-[460px] md:mt-0">
          <TeamPanel />
        </div>
      </div>
    </section>
  );
}
