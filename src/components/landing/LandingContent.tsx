"use client";

import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { ProofSection } from "@/components/landing/ProofSection";
import { StatsBar } from "@/components/landing/StatsBar";
import { CtaSection } from "@/components/landing/CtaSection";
import { SectionTransition, artKeyFrom } from "@/components/ui/EditorialArt";
import { useSiteMode, type SiteMode } from "@/components/landing/site-mode";

// A szerver-snapshotot az útvonal adja át, ezért mindkét indexelhető landing
// a helyes H1-gyel kerül a statikus HTML-be. A kliens-snapshot az URL-ből
// olvas, így a főoldali tab-bemutató hidratációs eltérés nélkül működik.
export function LandingContent({ initialMode = "self" }: { initialMode?: SiteMode }) {
  const mode = useSiteMode(initialMode);

  return (
    <>
      <HeroSection mode={mode} />
      <HowItWorks mode={mode} />
      {/* Szerkesztői átkötő (formanyelv 2. szint) — a „hogyan működik"
          folyamat és a képesség-blokk közti levegő. Dekoráció, aria-hidden;
          a mód a kulcsban van, hogy a self/team nézet ne ugyanazt kapja. */}
      <SectionTransition artKey={artKeyFrom("landing", "how-features", mode)} />
      <Features mode={mode} />
      <ProofSection mode={mode} />
      <StatsBar mode={mode} />
      <CtaSection mode={mode} />
    </>
  );
}
