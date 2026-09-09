import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { DEFAULT_LOCALE, t, tf } from "@/lib/i18n";
import { loadPublicLadder } from "@/lib/pricing/team-ladder.server";
import { buildPageMetadata } from "@/lib/seo";
import { SEO_INTENTS } from "@/lib/seo-intents";
import {
  buildFaqJsonLd,
  buildServiceJsonLd,
  buildWebPageJsonLd,
  type FaqItem,
} from "@/lib/structured-data";
import { PRICING_PAGE_FAQ_INDEXES, pricingFaqVars } from "./faq";
import { PricingPageContent } from "./PricingPageContent";

// /pricing — az önálló Árak oldal (2026-09-08). Korábban a /how-we-work-re
// irányított; most ez az oldal a kereshető, egyértelmű ár-belépő. Az árak a
// díjkártyából jönnek (admin: /admin/quote): ISR óránként, plusz azonnali
// revalidálás mentéskor (saveRateCard).
export const revalidate = 3600;

const seoIntent = SEO_INTENTS.pricing;
const CANONICAL_PATH = seoIntent.path;

export const metadata: Metadata = buildPageMetadata({
  path: CANONICAL_PATH,
  title: t("pricing.metaTitle", DEFAULT_LOCALE),
  description: t("pricing.metaDescription", DEFAULT_LOCALE),
});

export default async function PricingPage() {
  const ladder = await loadPublicLadder();
  const vars = pricingFaqVars(ladder);
  const faqItems: FaqItem[] = PRICING_PAGE_FAQ_INDEXES.map((i) => ({
    question: t(`pricing.faqQ${i}`, DEFAULT_LOCALE),
    answer: tf(`pricing.faqA${i}`, DEFAULT_LOCALE, vars),
  }));

  return (
    <>
      <JsonLd
        data={[
          buildWebPageJsonLd({
            path: CANONICAL_PATH,
            title: t("pricing.metaTitle", DEFAULT_LOCALE),
            description: t("pricing.metaDescription", DEFAULT_LOCALE),
            about: seoIntent.topics,
            breadcrumb: [
              { name: "Főoldal", path: "/" },
              { name: "Árazás", path: CANONICAL_PATH },
            ],
          }),
          buildFaqJsonLd(faqItems),
          buildServiceJsonLd({
            name: "Csapatdiagnosztika és csapatfejlesztő program",
            description:
              "Tanácsadó-vezérelt csapatprogram személyiség-alapú csapatképpel, mért csapatszerep-térképpel és pszichológiai biztonság pulzusméréssel – fejenkénti áron, minden méréssel.",
            serviceType: "Szervezetfejlesztés és csapatdiagnosztika",
            catalogName: "trita csapatprogramok",
            offerings: [
              {
                name: "Egyéni személyiségfelmérés",
                description:
                  "Személyiségfelmérés hat dimenzió mentén, dimenziószintű riporttal, munkastílus- és csapatszerep-elemzéssel. Ingyenes.",
              },
              {
                name: "Csapatkép",
                description:
                  "Minden mérés (személyiség, csapatszerep, bizalmi kör, pszichológiai biztonság, observer), validált csapatriport, vezetői visszajelzés, 90 perces online közös értelmezés.",
                price: ladder.tiers.kep.perHead,
              },
              {
                name: "Csapatprogram",
                description: "A Csapatkép félnapos értelmező workshoppal és utánkövető méréssel fél év múlva.",
                price: ladder.tiers.prog.perHead,
              },
            ],
          }),
        ]}
      />
      <PricingPageContent ladder={ladder} />
    </>
  );
}
