import type { Metadata } from "next";
import { LandingContent } from "@/components/landing/LandingContent";
import { getSiteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "trita — személyiség- és csapatintelligencia platform",
  description:
    "A trita validált módszertanra épülő személyiség- és csapatintelligencia platform: mérhető személyiség- és csapatdinamika insightok felvételhez, fejlesztéshez és döntéstámogatáshoz.",
  alternates: { canonical: "/" },
};

// Statikus oldal: a bejelentkezett látogatót a proxy irányítja a journey
// handoffra, a ?mode= paramétert a LandingContent kezeli kliens-oldalon.
// A LandingContent már NEM használ useSearchParams-t (ld. site-mode.ts), ezért
// nem kell Suspense-határ: a teljes landing — a hero H1-gyel, ami az LCP-elem —
// bekerül a prerenderelt HTML-be.
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
      <LandingContent />
    </main>
  );
}
