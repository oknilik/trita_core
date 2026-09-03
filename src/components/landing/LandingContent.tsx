"use client";

import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ProofSection } from "@/components/landing/ProofSection";
import { TeamPathway } from "@/components/landing/TeamPathway";
import { CtaSection } from "@/components/landing/CtaSection";
import { SectionTransition, artKeyFrom } from "@/components/ui/EditorialArt";

/**
 * A főoldal — egyetlen, egyéni ígérettel (2026-09-03).
 *
 * Sorrend és szerep:
 *   1. Hero + profil-előnézet: mit kapsz, mennyi idő, mibe kerül (semmibe).
 *   2. Három lépés: hogyan jutsz el odáig.
 *   3. Miért több egy átlagos tesztnél: bizalom + idézet.
 *   4. Csapatos átvezető: ha csapatként folytatnátok — pilot és mélyoldal.
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
      {/* Csillagos brand-motívum a hero és a lépések közt (formanyelv 2.
          szint); a negatív margó a két szekció közé úsztatja. */}
      <div data-landing-brand-mark className="relative z-20 -my-7 sm:-my-8">
        <SectionTransition artKey={artKeyFrom("landing", "hero-steps", "self")} />
      </div>
      <HowItWorks mode="self" />
      <ProofSection mode="self" />
      <TeamPathway />
      <CtaSection mode="self" />
    </>
  );
}
