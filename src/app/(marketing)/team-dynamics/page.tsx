import type { Metadata } from "next";
import { TeamLandingContent } from "@/components/landing/TeamLandingContent";
import { JsonLd } from "@/components/seo/JsonLd";
import { DEFAULT_LOCALE, t } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/seo";
import {
  buildDefinedTermSetJsonLd,
  buildFaqJsonLd,
  buildWebPageJsonLd,
  type FaqItem,
} from "@/lib/structured-data";
import { SEO_INTENTS } from "@/lib/seo-intents";
import { TEAM_FAQ_INDEXES, TEAM_TERM_INDEXES } from "@/lib/team-dynamics-pillar";

/**
 * A csapatintelligencia-PILLAR (2026-09-05).
 *
 * A Google oldalt rangsorol, nem site-ot: a márka csapat-pozicionálását nem a
 * főoldal H1-e hordozza (az a funnel egyéni belépője), hanem ez a lap. Ide
 * mutatnak a blog csapat-témájú cikkei (hub-and-spoke), innen indul a
 * /how-we-work és a /pilot. A `<title>` kimondja a kategóriát
 * („csapatintelligencia"), az elsődleges keresési szándék viszont a valós
 * volumenű „csapatdiagnosztika" marad (ld. `seo-intents.ts`).
 *
 * Strukturált adat: WebPage + FAQPage + DefinedTermSet — mind a lapon LÁTHATÓ
 * i18n-szövegből épül (`TeamIntelligenceDefinition`, `TeamFaq`), ahogy a
 * Google irányelve kéri.
 */
const seoIntent = SEO_INTENTS.teamDynamics;
const path = seoIntent.path;
const title = t("teamDynamics.metaTitle", DEFAULT_LOCALE);
const description = t("teamDynamics.metaDescription", DEFAULT_LOCALE);

export const metadata: Metadata = buildPageMetadata({
  path,
  title,
  description,
  ogTitle: "Csapatdiagnosztika és csapatdinamika | trita",
});

export default function TeamDynamicsPage() {
  const faqItems: FaqItem[] = TEAM_FAQ_INDEXES.map((i) => ({
    question: t(`teamDynamics.faqQ${i}`, DEFAULT_LOCALE),
    answer: t(`teamDynamics.faqA${i}`, DEFAULT_LOCALE),
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
              { name: "Csapatdiagnosztika", path },
            ],
          }),
          buildFaqJsonLd(faqItems),
          buildDefinedTermSetJsonLd({
            path,
            name: t("teamDynamics.glossaryTitle", DEFAULT_LOCALE),
            description: t("teamDynamics.definitionBody", DEFAULT_LOCALE),
            terms: TEAM_TERM_INDEXES.map((i) => ({
              name: t(`teamDynamics.term${i}Name`, DEFAULT_LOCALE),
              description: t(`teamDynamics.term${i}Desc`, DEFAULT_LOCALE),
            })),
          }),
        ]}
      />
      <TeamLandingContent />
    </main>
  );
}
