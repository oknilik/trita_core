import type { Metadata } from "next";
import { DEFAULT_LOCALE, t } from "@/lib/i18n";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildPageMetadata } from "@/lib/seo";
import {
  buildFaqJsonLd,
  buildServiceJsonLd,
  buildWebPageJsonLd,
  type FaqItem,
} from "@/lib/structured-data";
import { PRICING_FAQ_INDEXES } from "./faq";
import { PricingContent } from "./PricingContent";

// Statikus metadata a DEFAULT_LOCALE-lal — cookie-olvasás nélkül az oldal
// build-time prerenderelhető; a tartalom nyelvváltását a kliens-oldali
// LocaleProvider kezeli.
export const metadata: Metadata = buildPageMetadata({
  path: "/pricing",
  title: t("pricing.metaTitle", DEFAULT_LOCALE),
  description: t("pricing.metaDescription", DEFAULT_LOCALE),
});

export default function PricingPage() {
  // A GYIK ugyanabból az i18n-kulcskészletből épül, amit a felület is
  // megjelenít (PRICING_FAQ_INDEXES, ld. ./faq) — a Google FAQ-irányelve
  // megköveteli, hogy a strukturált adatban szereplő kérdés-válasz LÁTHATÓ is
  // legyen az oldalon.
  const faqItems: FaqItem[] = PRICING_FAQ_INDEXES.map((i) => ({
    question: t(`pricing.faqQ${i}`, DEFAULT_LOCALE),
    answer: t(`pricing.faqA${i}`, DEFAULT_LOCALE),
  }));

  return (
    <>
      <JsonLd
        data={[
          buildWebPageJsonLd({
            path: "/pricing",
            title: t("pricing.metaTitle", DEFAULT_LOCALE),
            description: t("pricing.metaDescription", DEFAULT_LOCALE),
            about: ["Csapatdiagnosztika", "Szervezetfejlesztés"],
            breadcrumb: [
              { name: "Főoldal", path: "/" },
              { name: "Együttműködés", path: "/pricing" },
            ],
          }),
          buildFaqJsonLd(faqItems),
          buildServiceJsonLd({
            name: "Csapatdiagnosztika és csapatfejlesztő program",
            description:
              "Tanácsadó-vezérelt csapatprogram három mérési réteggel: személyiség-alapú csapatkép, mért csapatszerep-térkép és a pszichológiai biztonság névtelen pulzusmérése — validált összképpel és közös értelmező workshoppal.",
            serviceType: "Szervezetfejlesztés és csapatdiagnosztika",
            catalogName: "Trita programelemek",
            offerings: [
              {
                name: "Egyéni személyiségfelmérés",
                description:
                  "HEXACO-alapú, kb. 10 perces felmérés dimenziószintű riporttal, munkastílus- és karrierképpel. Ingyenes.",
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
                name: "Tanácsadói validálás és értelmező workshop",
                description:
                  "A csapatkép tanácsadói validálása és közös feldolgozása workshop keretében.",
              },
            ],
          }),
        ]}
      />
      <PricingContent />
    </>
  );
}
