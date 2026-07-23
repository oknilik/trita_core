import { Suspense } from "react";
import type { Metadata } from "next";
import { LandingContent } from "@/components/landing/LandingContent";
import { getSiteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "trita — személyiség- és csapatintelligencia platform",
  description:
    "A trita validált módszertanra épülő személyiség- és csapatintelligencia platform: mérhető személyiség- és csapatdinamika insightok felvételhez, fejlesztéshez és döntéstámogatáshoz.",
};

// Statikus oldal: a bejelentkezett látogatót a proxy irányítja a journey
// handoffra, a ?mode= paramétert a LandingContent kezeli kliens-oldalon.
export default function Home() {
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
      <Suspense>
        <LandingContent />
      </Suspense>
    </main>
  );
}
