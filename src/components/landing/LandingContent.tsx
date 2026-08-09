"use client";

import { HeroSection } from "@/components/landing/HeroSection";
import { TrustBar } from "@/components/landing/TrustBar";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { ProofSection } from "@/components/landing/ProofSection";
import { StatsBar } from "@/components/landing/StatsBar";
import { CtaSection } from "@/components/landing/CtaSection";
import { SectionTransition, artKeyFrom } from "@/components/ui/EditorialArt";
import { useSiteMode } from "@/components/landing/site-mode";

// A ?mode= paramétert az URL-ből olvassuk, de NEM useSearchParams-szal:
// az a statikus prerendert CSR-re bájtolta (BAILOUT_TO_CLIENT_SIDE_RENDERING),
// ezért a build-elt HTML <main>-je üres volt és a hero H1 (LCP-elem) csak
// hidratálás után jelent meg. A useSiteMode() szerver-snapshotja "self", így
// a teljes landing bekerül a statikus HTML-be; a "team" mód a switcherre /
// mélylinkre vált (részletek: site-mode.ts).
export function LandingContent() {
  const mode = useSiteMode();

  return (
    <>
      <HeroSection mode={mode} />
      <TrustBar mode={mode} />
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
