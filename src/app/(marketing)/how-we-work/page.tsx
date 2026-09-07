import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { DEFAULT_LOCALE, t, tf } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/seo";
import {
  buildFaqJsonLd,
  buildServiceJsonLd,
  buildWebPageJsonLd,
  type FaqItem,
} from "@/lib/structured-data";
import { PricingContent } from "../pricing/PricingContent";
import { PRICING_FAQ_INDEXES } from "../pricing/faq";
import { SEO_INTENTS } from "@/lib/seo-intents";
import { loadPublicLadder } from "@/lib/pricing/team-ladder.server";
import { formatHuf } from "@/lib/pricing/team-ladder";

// Az árak a díjkártyából jönnek (admin: /admin/quote). ISR: a mentés
// azonnal revalidál (saveRateCard), ezen felül óránként frissül.
export const revalidate = 3600;

const seoIntent = SEO_INTENTS.howWeWork;
const CANONICAL_PATH = seoIntent.path;

export const metadata: Metadata = buildPageMetadata({
  path: CANONICAL_PATH,
  title: t("pricing.metaTitle", DEFAULT_LOCALE),
  description: t("pricing.metaDescription", DEFAULT_LOCALE),
});

export default async function HowWeWorkPage() {
  const ladder = await loadPublicLadder();
  const faqVars = {
    kep: formatHuf(ladder.tiers.kep.perHead),
    prog: formatHuf(ladder.tiers.prog.perHead),
    band: ladder.firstBandHeads,
  };
  const faqItems: FaqItem[] = PRICING_FAQ_INDEXES.map((i) => ({
    question: t(`pricing.faqQ${i}`, DEFAULT_LOCALE),
    answer: tf(`pricing.faqA${i}`, DEFAULT_LOCALE, faqVars),
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
              { name: "Együttműködés", path: CANONICAL_PATH },
            ],
          }),
          buildFaqJsonLd(faqItems),
          buildServiceJsonLd({
            name: "Csapatdiagnosztika és csapatfejlesztő program",
            description:
              "Tanácsadó-vezérelt csapatprogram személyiség-alapú csapatképpel, mért csapatszerep-térképpel és pszichológiai biztonság pulzusméréssel – validált összképpel és közös értelmezéssel.",
            serviceType: "Szervezetfejlesztés és csapatdiagnosztika",
            catalogName: "trita programelemek",
            offerings: [
              {
                name: "Egyéni személyiségfelmérés",
                description:
                  "Személyiségfelmérés hat dimenzió mentén, dimenziószintű riporttal, munkastílus- és csapatszerep-elemzéssel. Ingyenes.",
              },
              {
                name: "360°-os observer-visszajelzés",
                description:
                  "Ismerősi és kollégai visszajelzés az önértékelés mellé, megbízhatóság-jelöléssel.",
              },
              {
                name: "Csapatkép",
                description:
                  "Személyiség-alapú csapatdinamika, mért csapatszerepek, bizalmi kör és pszichológiai biztonság egy validált csapatriportban, online közös értelmezéssel.",
                price: ladder.tiers.kep.perHead,
              },
              {
                name: "Csapatprogram",
                description:
                  "A Csapatkép félnapos értelmező workshoppal és utánkövető méréssel.",
                price: ladder.tiers.prog.perHead,
              },
              {
                name: "Pszichológiai biztonság pulzusmérés",
                description: "Névtelen mérés a csapaton belüli biztonságérzet szintjéről.",
              },
              {
                name: "Tanácsadói validálás és közös értelmezés",
                description:
                  "A csapatkép tanácsadói validálása és közös feldolgozása a programhoz igazított keretben.",
              },
            ],
          }),
        ]}
      />
      <PricingContent ladder={ladder} />
    </>
  );
}
