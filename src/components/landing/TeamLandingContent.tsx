"use client";

import { useLocale } from "@/components/LocaleProvider";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { ProofSection } from "@/components/landing/ProofSection";
import { StatsBar } from "@/components/landing/StatsBar";
import { CtaSection } from "@/components/landing/CtaSection";
import { FaqList } from "@/components/marketing/FaqList";
import { PilotSpotsIndicator } from "@/components/marketing/PilotSpotsIndicator";
import { PriceAnchorCard } from "@/components/pricing/PriceAnchorCard";
import { ChevronRightIcon } from "@/components/ui/icons";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { SectionTransition, artKeyFrom } from "@/components/ui/EditorialArt";
import { track } from "@/lib/analytics/client";
import { t, tf } from "@/lib/i18n/public";
import { formatMoney } from "@/lib/pricing/fx";
import { ladderEntryPerHead, type PublicLadder } from "@/lib/pricing/team-ladder";
import { FOCUS_RING_CLASS } from "@/lib/ui/focus";
import { TEAM_PAGE_FAQ_INDEXES } from "@/app/(marketing)/pricing/faq";
import Link from "next/link";

/**
 * A /team-dynamics — az egyesített csapat-oldal (2026-09-08).
 *
 * A korábbi csapatdiagnosztika-mélyoldal és a /how-we-work („Együttműködés")
 * egy oldalba olvadt: a MIT (mit mérünk, miért hiteles) és a HOGYAN (három
 * lépés, ár-horgony, pilot, GYIK) egymás után, egyetlen záró CTA-val. Az
 * ár itt csak horgony (a főoldali krém kártya); a kalkulátor és a részletek
 * az önálló /pricing oldalon élnek. A számok a díjkártyából jönnek
 * (`ladder`, szerverről).
 */
export function TeamLandingContent({ ladder }: { ladder: PublicLadder }) {
  const { locale } = useLocale();
  const entry = ladderEntryPerHead(ladder);

  return (
    <>
      <HeroSection
        mode="team"
        priceChip={tf("landing.teamMetaPrice", locale, { price: formatMoney(entry.perHead, locale, ladder.fx), band: ladder.firstBandHeads })}
      />
      <HowItWorks mode="team" />
      <SectionTransition artKey={artKeyFrom("landing", "how-features", "team")} />
      <Features mode="team" />

      {/* Ár-horgony: egy szám, nem kalkulátor — a részletek az /pricing oldalon. */}
      <section id="arak" data-team-price-anchor className="scroll-mt-24 bg-warm">
        <div className="mx-auto grid max-w-[1120px] gap-10 px-7 py-16 md:py-24 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionEyebrow>{t("pricing.anchorEyebrow", locale)}</SectionEyebrow>
            <h2 className="mt-4 max-w-[18ch] font-fraunces text-fluid-title tracking-tight text-ink">
              {t("pricing.anchorTitle", locale)}
            </h2>
            <p className="mt-5 max-w-[56ch] text-base leading-relaxed text-ink-body">{t("pricing.anchorBody", locale)}</p>
            <Link
              href="/pricing"
              onClick={() => track("cta.click", { cta_id: "team_page_pricing", surface: "team", mode: "team" })}
              className={`group mt-6 inline-flex min-h-11 items-center gap-1 rounded-lg font-semibold text-sage-dark transition-colors hover:text-sage ${FOCUS_RING_CLASS}`}
            >
              {t("pricing.anchorLink", locale)}
              <ChevronRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <PriceAnchorCard
            ladder={ladder}
            locale={locale}
            ctaId="team_page_price"
            surface="team"
            className="lg:justify-self-end"
          />
        </div>
      </section>

      {/* Pilot-helyek: a program konkrét belépője, közvetlenül az ár után —
          a „−50% az első csapatoknak" ott a legerősebb, ahol a listaár még
          friss. A részletek a saját oldalán. */}
      <section className="bg-cream px-7 py-16 md:py-24">
        <div className="mx-auto max-w-[760px]">
          <div className="text-center">
            <SectionEyebrow tone="team">{t("pricing.pilotEyebrow", locale)}</SectionEyebrow>
            <h2 className="mt-4 font-fraunces text-fluid-title text-ink">{t("pricing.pilotSectionTitle", locale)}</h2>
          </div>
          <PilotSpotsIndicator locale={locale} href="/pilot" ctaId="team_page_pilot" surface="team" className="mx-auto mt-8" />
        </div>
      </section>

      <ProofSection mode="team" />
      <StatsBar mode="team" />

      <section className="bg-cream">
        <div className="mx-auto max-w-[1120px] px-7 pb-16 md:pb-24">
          <FaqList indexes={TEAM_PAGE_FAQ_INDEXES} locale={locale} surface="team" eyebrow={t("pricing.faqTeamEyebrow", locale)} />
        </div>
      </section>

      <CtaSection mode="team" />
    </>
  );
}
