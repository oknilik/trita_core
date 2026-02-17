import type { Metadata } from "next";
import { HeroSection } from "@/components/landing/HeroSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FeatureCards } from "@/components/landing/FeatureCards";
import { BottomCTA } from "@/components/landing/BottomCTA";
import { DEFAULT_LOCALE, t } from "@/lib/i18n";
import { getLanguageAlternates, getSiteUrl } from "@/lib/seo";

// ISR: Revalidate every 1 hour (3600 seconds)
// This makes the landing page load instantly for most visitors
export const revalidate = 3600;

export function generateMetadata(): Metadata {
  const locale = DEFAULT_LOCALE;
  const title = t("meta.title", locale);
  const description = t("meta.description", locale);

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
      siteName: "Trita",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function Home() {
  const siteUrl = getSiteUrl();
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Trita",
    url: siteUrl,
    logo: `${siteUrl}/favicon.svg`,
  };
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Trita",
    url: siteUrl,
  };

  return (
    <main className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <HeroSection />
      <StatsSection />
      <HowItWorks />
      <FeatureCards />
      <BottomCTA />
    </main>
  );
}
