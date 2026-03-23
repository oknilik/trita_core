import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { HeroSection } from "@/components/landing/HeroSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { PainSection } from "@/components/landing/PainSection";
import { UseCaseSection } from "@/components/landing/UseCaseSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { ScienceSection } from "@/components/landing/ScienceSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { BottomCTA } from "@/components/landing/BottomCTA";
import { getLanguageAlternates, getSiteUrl } from "@/lib/seo";
import { getServerLocale } from "@/lib/i18n-server";
import type { Locale } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();

  const copy: Record<Locale, { title: string; description: string }> = {
    hu: {
      title: "trita",
      description:
        "A trita kutatás alapú csapatintelligencia platform: mérhető személyiség- és csapatdinamika insightok felvételhez, fejlesztéshez és döntéstámogatáshoz.",
    },
    en: {
      title: "trita",
      description:
        "trita is a research-based team intelligence platform: measurable personality and team dynamics insights for hiring, development, and decision support.",
    },
  };

  const { title, description } = copy[locale] ?? copy.hu;

  return {
    title,
    description,
    alternates: {
      canonical: "/",
      languages: getLanguageAlternates("/"),
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: "/",
      siteName: "trita",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function Home() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  const locale = await getServerLocale();
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

      <HeroSection locale={locale} />
      <StatsSection locale={locale} />
      <PainSection locale={locale} />
      <UseCaseSection locale={locale} />
      <HowItWorksSection locale={locale} />
      <ScienceSection locale={locale} />
      <PricingSection locale={locale} />
      <BottomCTA locale={locale} />
    </main>
  );
}
