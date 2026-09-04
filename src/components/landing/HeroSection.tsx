"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n/public";
import type { SiteMode } from "@/components/landing/types";
import { SelfPanel, TeamPanel } from "@/components/landing/panels";
import { hasAssessmentDraftInStorage } from "@/lib/assessment-draft";
import { ClockIcon, FlaskIcon, BoltIcon, GiftIcon, CheckIcon } from "@/components/landing/icons";
import { track } from "@/lib/analytics/client";
import { ChevronRightIcon } from "@/components/ui/icons";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { getButtonClassName } from "@/components/ui/primitives/Button";

// A hajtás feletti kísérőelemek CSS-keyframe-mel úsznak be. A H1 szándékosan
// NEM kapja meg: ez az oldal LCP-eleme, és az opacity: 0 kezdőállapot még
// nulla animation-delay mellett is későbbre tolja, mikor tekinti a böngésző
// teljesen kirajzoltnak.
const riseIn = "animate-rise-in";

/**
 * Statikus hero: a mód az ÚTVONALBÓL jön (`/` → self, `/team-dynamics` →
 * team), nem kliens-oldali kapcsolóból. A 2026-09-03-i egyszerűsítés
 * kivezette a self/team módváltót és az automatikus tab-bemutatót: a
 * beeső látogató egyetlen ígéretet és egyetlen elsődleges utat lát. Ezzel a
 * korábbi „mindkét változat a DOM-ban, láthatatlanul" geometria-rögzítés is
 * feleslegessé vált — nincs mihez rögzíteni.
 */
export function HeroSection({ mode }: { mode: SiteMode }) {
  const { locale } = useLocale();
  const isSelf = mode === "self";
  // Kontraszt (a11y): az alap bronz krém háttéren 3.0:1 – nagy szövegnek épp
  // a határon. A H1 em ezért a bronz-skála középső fokát kapja (3.9:1).
  const headlineAccentColor = isSelf
    ? "var(--color-accent-primary-mid)"
    : "var(--color-layer-team-accent)";
  const ctaBackground = isSelf
    ? "var(--color-bronze-dark)"
    : "var(--color-layer-team-hero-from)";

  // Meglévő vendég-draft: a CTA felirata folytatásra vált. localStorage csak
  // kliensen olvasható, ezért useEffect (hydration-biztos minta).
  const [hasDraft, setHasDraft] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage csak kliensen érhető el
  useEffect(() => { setHasDraft(hasAssessmentDraftInStorage("TRITAN")); }, []);

  const meta = isSelf
    ? [
        { Icon: ClockIcon, text: t("landing.selfMetaTime", locale) },
        { Icon: FlaskIcon, text: t("landing.selfMetaMethod", locale) },
        { Icon: BoltIcon, text: t("landing.selfMetaInstant", locale) },
        { Icon: GiftIcon, text: t("landing.selfMetaFree", locale) },
      ]
    : [
        { Icon: CheckIcon, text: t("landing.teamMetaOnboarding", locale) },
        { Icon: ClockIcon, text: t("landing.teamMetaTiming", locale) },
        { Icon: GiftIcon, text: t("landing.teamMetaOffer", locale) },
      ];

  const primaryLabel = isSelf
    ? hasDraft
      ? t("landing.selfCtaContinue", locale)
      : t("landing.focusedHeroCta", locale)
    : t("landing.teamCta", locale);

  return (
    <section className="bg-cream">
      {/* A következő szekció saját felső térközt ad. A hero alján csak a
          riportkártya árnyékának kell helyet hagyni, különben a két padding
          200 px fölötti üres sávvá adódik össze. */}
      <div data-landing-hero-inner className="mx-auto max-w-[1120px] px-7 pb-8 pt-12 min-[700px]:max-md:pt-14 md:pt-20">
        <div className="grid gap-10 min-[700px]:max-md:gap-6 md:grid-cols-2 md:items-center md:gap-12">
          {/* Mobilon a teljes ígéret és a CTA megelőzi az előnézetet: a
              látogató nem kényszerül egy hosszú riportkártyán végiggörgetni,
              mielőtt elérné az első döntési pontot. */}
          <div
            data-landing-hero-copy
            className="flex min-w-0 flex-col min-[700px]:max-md:mx-auto min-[700px]:max-md:w-full min-[700px]:max-md:max-w-[560px] min-[700px]:max-md:items-center min-[700px]:max-md:text-center"
          >
            <SectionEyebrow tone={isSelf ? "bronze" : "team"} className={`${riseIn} mb-4`}>
              {isSelf ? t("landing.focusedEyebrow", locale) : t("landing.teamEyebrow", locale)}
            </SectionEyebrow>

            <h1 className="max-w-[13ch] text-balance font-fraunces text-fluid-display font-medium tracking-tight text-ink min-[700px]:max-md:max-w-[14ch]">
              {isSelf ? t("landing.ctaSelfHeadlineBefore", locale) : t("landing.teamHeadlineBefore", locale)}
              <em className="italic" style={{ color: headlineAccentColor }}>
                {isSelf ? t("landing.ctaSelfHeadlineEm", locale) : t("landing.teamHeadlineEm", locale)}
              </em>
            </h1>

            <p className={`${riseIn} mb-7 mt-6 max-w-[610px] text-balance text-base font-light leading-relaxed text-ink-body`}>
              {isSelf ? t("landing.focusedHeroSub", locale) : t("landing.teamSub", locale)}
            </p>

            <div
              className={`${riseIn} mb-4 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center min-[700px]:max-md:justify-center`}
              style={{ animationDelay: "0.1s" }}
            >
              <Link
                href={isSelf ? "/try" : "/pilot"}
                onClick={() =>
                  track("cta.click", { cta_id: "hero_primary", surface: "landing", mode })
                }
                className={getButtonClassName({
                  size: "lg",
                  className: "min-h-[52px] w-full px-7 text-base shadow-md hover:-translate-y-px hover:brightness-[1.06] hover:shadow-lg sm:w-auto sm:min-w-[280px]",
                })}
                style={{
                  background: ctaBackground,
                  color: isSelf
                    ? "var(--color-text-on-accent-deep)"
                    : "var(--color-text-on-inverse)",
                  boxShadow: isSelf
                    ? "0 4px 14px color-mix(in srgb, var(--color-bronze-dark) 25%, transparent)"
                    : "0 4px 14px color-mix(in srgb, var(--color-layer-team-hero-from) 28%, transparent)",
                }}
              >
                <span>{primaryLabel}</span>
              </Link>
              {!isSelf ? (
                <Link
                  href="/contact"
                  onClick={() =>
                    track("cta.click", { cta_id: "hero_secondary", surface: "landing", mode: "team" })
                  }
                  className={getButtonClassName({ variant: "ghost", size: "md", className: "group px-3" })}
                  style={{ color: "var(--color-layer-team-accent)" }}
                >
                  {t("landing.teamSecondaryCta", locale)}
                  <ChevronRightIcon className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ) : null}
            </div>

            {/* A tényszerű ígéretek (idő, módszer, azonnali, ingyenes) itt
                élnek — a korábbi StatsBar ugyanezt ismételte lejjebb. */}
            <div
              data-landing-hero-meta
              className={`${riseIn} flex flex-wrap items-center gap-2 min-[700px]:max-md:justify-center`}
              style={{ animationDelay: "0.2s" }}
            >
              {meta.map((m) => (
                <span
                  key={m.text}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface-card)]/60 px-3 py-1.5 text-note text-[var(--color-text-secondary)]"
                >
                  <m.Icon
                    className={`h-3 w-3 shrink-0 ${isSelf ? "text-[var(--color-accent-primary)]" : "text-[var(--color-layer-team-accent)]"}`}
                  />
                  {m.text}
                </span>
              ))}
            </div>
          </div>

          <div data-landing-hero-preview>
            <div className="mx-auto w-full max-w-[460px] min-[700px]:max-md:max-w-[560px]">
              {isSelf ? <SelfPanel /> : <TeamPanel />}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
