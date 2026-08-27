import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { DEFAULT_LOCALE, t } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/seo";
import {
  buildFaqJsonLd,
  buildServiceJsonLd,
  buildWebPageJsonLd,
  type FaqItem,
} from "@/lib/structured-data";
import { PricingContent } from "../pricing/PricingContent";
import { PRICING_FAQ_INDEXES } from "../pricing/faq";

const CANONICAL_PATH = "/how-we-work";

export const metadata: Metadata = buildPageMetadata({
  path: CANONICAL_PATH,
  title: t("pricing.metaTitle", DEFAULT_LOCALE),
  description: t("pricing.metaDescription", DEFAULT_LOCALE),
});

export default function HowWeWorkPage() {
  const faqItems: FaqItem[] = PRICING_FAQ_INDEXES.map((i) => ({
    question: t(`pricing.faqQ${i}`, DEFAULT_LOCALE),
    answer: t(`pricing.faqA${i}`, DEFAULT_LOCALE),
  }));

  return (
    <>
      <JsonLd
        data={[
          buildWebPageJsonLd({
            path: CANONICAL_PATH,
            title: t("pricing.metaTitle", DEFAULT_LOCALE),
            description: t("pricing.metaDescription", DEFAULT_LOCALE),
            about: ["Csapatdiagnosztika", "Szervezetfejlesztés"],
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
                name: "Csapatkép és csapatszerep-térkép",
                description:
                  "Személyiség-alapú csapatdinamika és mért csapatszerepek egy csapatszintű riportban.",
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
      <PricingContent />
    </>
  );
}
