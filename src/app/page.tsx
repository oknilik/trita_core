import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustBar } from "@/components/landing/TrustBar";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { ProofSection } from "@/components/landing/ProofSection";
import { StatsBar } from "@/components/landing/StatsBar";
import { CtaSection } from "@/components/landing/CtaSection";
import { getSiteUrl } from "@/lib/seo";
import type { SiteMode } from "@/components/landing/ModeSwitcher";

export const metadata: Metadata = {
  title: "trita",
  description:
    "A trita kutatás alapú csapatintelligencia platform: mérhető személyiség- és csapatdinamika insightok felvételhez, fejlesztéshez és döntéstámogatáshoz.",
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  const params = await searchParams;
  const mode: SiteMode = params.mode === "team" ? "team" : "self";

  const siteUrl = getSiteUrl();
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "trita",
    url: siteUrl,
    logo: `${siteUrl}/favicon.svg`,
  };
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "trita",
    url: siteUrl,
  };

  return (
    <main className="min-h-screen bg-cream">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <HeroSection mode={mode} />
      <TrustBar mode={mode} />
      <HowItWorks mode={mode} />
      <Features mode={mode} />
      <ProofSection />
      <StatsBar />
      <CtaSection mode={mode} />
    </main>
  );
}
