import type { Metadata } from "next";
import { TeamLandingContent } from "@/components/landing/TeamLandingContent";
import { JsonLd } from "@/components/seo/JsonLd";
import { DEFAULT_LOCALE, t } from "@/lib/i18n";
import { loadPublicLadder } from "@/lib/pricing/team-ladder.server";
import { buildPageMetadata } from "@/lib/seo";
import { buildFaqJsonLd, buildWebPageJsonLd, type FaqItem } from "@/lib/structured-data";
import { SEO_INTENTS } from "@/lib/seo-intents";
import { TEAM_PAGE_FAQ_INDEXES } from "../pricing/faq";

// Az egyesített csapat-oldal (2026-09-08): a csapatdiagnosztika mélyoldala
// és a korábbi /how-we-work egy lapon. Az ár-horgony a díjkártyából jön
// (admin: /admin/quote): ISR óránként, plusz azonnali revalidálás
// mentéskor (saveRateCard).
export const revalidate = 3600;

const seoIntent = SEO_INTENTS.teamDynamics;
const path = seoIntent.path;
const title = "Csapatdiagnosztika és csapatfejlesztés – értsétek meg, hogyan működtök együtt | trita";
const description =
  "Csapatszerepek, bizalmi háló és pszichológiai biztonság egy tanácsadó által értelmezett csapatképben. Három lépés a közös munkáig, fejenkénti ár, gyakori kérdések.";

export const metadata: Metadata = buildPageMetadata({
  path,
  title,
  description,
  ogTitle: "Csapatdiagnosztika és csapatfejlesztés | trita",
});

export default async function TeamDynamicsPage() {
  const ladder = await loadPublicLadder();
  const faqItems: FaqItem[] = TEAM_PAGE_FAQ_INDEXES.map((i) => ({
    question: t(`pricing.faqQ${i}`, DEFAULT_LOCALE),
    answer: t(`pricing.faqA${i}`, DEFAULT_LOCALE),
  }));

  return (
    <main className="min-h-screen bg-cream">
      <JsonLd
        data={[
          buildWebPageJsonLd({
            path,
            title,
            description,
            about: seoIntent.topics,
            breadcrumb: [
              { name: "Főoldal", path: "/" },
              { name: "Csapatoknak", path },
            ],
          }),
          buildFaqJsonLd(faqItems),
        ]}
      />
      <TeamLandingContent ladder={ladder} />
    </main>
  );
}
