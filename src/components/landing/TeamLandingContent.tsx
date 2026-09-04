"use client";

import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { ProofSection } from "@/components/landing/ProofSection";
import { StatsBar } from "@/components/landing/StatsBar";
import { CtaSection } from "@/components/landing/CtaSection";
import { SectionTransition, artKeyFrom } from "@/components/ui/EditorialArt";

/**
 * A /team-dynamics mélyoldal: a csapatdiagnosztika teljes bemutatója a
 * korábbi csapat-módú landing szekcióiból, módváltó nélkül. A főoldal
 * csapatos átvezetője ide mutat a részletekért; az elsődleges út innen is a
 * pilot.
 */
export function TeamLandingContent() {
  return (
    <>
      <HeroSection mode="team" />
      <HowItWorks mode="team" />
      <SectionTransition artKey={artKeyFrom("landing", "how-features", "team")} />
      <Features mode="team" />
      <ProofSection mode="team" />
      <StatsBar mode="team" />
      <CtaSection mode="team" />
    </>
  );
}
