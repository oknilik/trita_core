"use client";

import { useSearchParams } from "next/navigation";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustBar } from "@/components/landing/TrustBar";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { ProofSection } from "@/components/landing/ProofSection";
import { StatsBar } from "@/components/landing/StatsBar";
import { CtaSection } from "@/components/landing/CtaSection";
import type { SiteMode } from "@/components/landing/ModeSwitcher";

// A ?mode= paramétert kliens-oldalon olvassuk (useSearchParams), így a
// landing page szerver-oldala statikus maradhat — a prerender a "self"
// móddal készül, a "team" mód hydration után vált.
export function LandingContent() {
  const params = useSearchParams();
  const mode: SiteMode = params.get("mode") === "team" ? "team" : "self";

  return (
    <>
      <HeroSection mode={mode} />
      <TrustBar mode={mode} />
      <HowItWorks mode={mode} />
      <Features mode={mode} />
      <ProofSection mode={mode} />
      <StatsBar mode={mode} />
      <CtaSection mode={mode} />
    </>
  );
}
