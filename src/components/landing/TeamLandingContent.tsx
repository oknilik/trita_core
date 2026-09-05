"use client";

import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { ProofSection } from "@/components/landing/ProofSection";
import { StatsBar } from "@/components/landing/StatsBar";
import { CtaSection } from "@/components/landing/CtaSection";
import { TeamIntelligenceDefinition } from "@/components/landing/TeamIntelligenceDefinition";
import { TeamFaq } from "@/components/landing/TeamFaq";
import { SectionTransition, artKeyFrom } from "@/components/ui/EditorialArt";

/**
 * A /team-dynamics pillar: a csapatdiagnosztika teljes bemutatója a korábbi
 * csapat-módú landing szekcióiból, módváltó nélkül. A főoldal csapatos
 * átvezetője ide mutat a részletekért; az elsődleges út innen is a pilot.
 *
 * Sorrend és szerep (2026-09-05, csapatintelligencia-pillar):
 *   1. Hero + csapatkép-előnézet: az ígéret.
 *   2. Definíció + fogalomtár: mit értünk csapatintelligencián, mit jelentenek
 *      a csapatkép szavai (DefinedTermSet forrása).
 *   3. Három lépés · mérési rétegek · „miért más" · számok: a bizonyíték.
 *   4. GYIK (FAQPage forrása) → Együttműködés.
 *   5. Záró CTA: pilot.
 */
export function TeamLandingContent() {
  return (
    <>
      <HeroSection mode="team" />
      <TeamIntelligenceDefinition />
      <HowItWorks mode="team" />
      <SectionTransition artKey={artKeyFrom("landing", "how-features", "team")} />
      <Features mode="team" />
      <ProofSection mode="team" />
      <StatsBar mode="team" />
      <TeamFaq />
      <CtaSection mode="team" />
    </>
  );
}
