"use client";

import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ProofSection } from "@/components/landing/ProofSection";
import { TeamPathway } from "@/components/landing/TeamPathway";
import { CtaSection } from "@/components/landing/CtaSection";
import { SectionTransition, artKeyFrom } from "@/components/ui/EditorialArt";

/**
 * A főoldal — csapatintelligencia-ígérettel, egyéni funnel-belépővel.
 *
 * Sorrend és szerep:
 *   1. Hero: a csapatérték az ígéret, a saját profil az első lépés.
 *   2. Csapatos ajánlat: közös kép, mérési rétegek, tanácsadói értelmezés.
 *   3. Egyéni funnel: hogyan készül el a kiinduló saját profil.
 *   4. Miért több egy átlagos tesztnél: bizalom + idézet.
 *   5. Záró CTA.
 *
 * A korábbi self/team módváltó és a Features/StatsBar szekció kivezetve: a
 * feature-kártyák a profil-előnézetben, a számok a hero pirulái közt élnek.
 * Nincs useSearchParams, ezért nincs Suspense-határ: a hero H1 (LCP-elem)
 * benne van a prerenderelt HTML-ben.
 */
export function LandingContent() {
  return (
    <>
      <HeroSection mode="self" />
      <TeamPathway />
      <HowItWorks mode="self" />
      {/* Csillagos brand-motívum a lépések és a bizonyíték közt (formanyelv
          2. szint); a negatív margó a két szekció közé úsztatja. */}
      <div data-landing-brand-mark className="relative z-20 -my-7 sm:-my-8">
        <SectionTransition artKey={artKeyFrom("landing", "steps-proof", "self")} />
      </div>
      <ProofSection mode="self" />
      <CtaSection mode="self" />
    </>
  );
}
