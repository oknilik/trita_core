import type { Metadata } from "next";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import { buildPageMetadata, clampMetaDescription } from "@/lib/seo";
import { LEGAL_DOCS_ARE_DRAFT } from "@/lib/legal/company";
import { getPrivacyPolicy } from "@/lib/legal/privacy-policy";
import { PrivacyContent } from "./PrivacyContent";

// Statikus metadata a DEFAULT_LOCALE-lal — cookie-olvasás nélkül az oldal
// build-time prerenderelhető; a nyelvváltást a kliens-oldali LocaleProvider
// kezeli. A cím és a leírás a tájékoztató DOKUMENTUMÁBÓL jön (nem külön
// SEO-szövegből), így nem tud elcsúszni attól, ami a lapon látszik; a
// bevezetőt mondathatáron vágjuk a snippet-hosszra.
const doc = getPrivacyPolicy(DEFAULT_LOCALE);

export const metadata: Metadata = {
  ...buildPageMetadata({
    path: "/privacy",
    title: `${doc.title} | trita`,
    description: clampMetaDescription(doc.lead),
    type: "article",
  }),
  // TERVEZET-ÁLLAPOT = NOINDEX.
  //
  // Amíg a cégadatok helykitöltők (`LEGAL_DOCS_ARE_DRAFT`), a lap látható
  // „Tervezet" jelölést kap — de a jelölés csak az EMBERI olvasónak szól.
  // A keresőnek nem: egy indexelt, találati listán megjelenő jogi oldal
  // kitalált cégjegyzékszámmal akkor is félrevezet, ha a lap tetején ott a
  // figyelmeztetés (a snippetben az nem látszik). A `sitemap.ts` ugyanezen
  // a konstanson dönt, hogy kiveszi-e a lapot — a kettő EGYÜTT mozog.
  //
  // Az élesítés egyetlen lépés: `LEGAL_DOCS_ARE_DRAFT = false` a valós
  // cégadatok bevezetésekor (`src/lib/legal/company.ts`).
  ...(LEGAL_DOCS_ARE_DRAFT ? { robots: { index: false, follow: true } } : {}),
};

export default function PrivacyPage() {
  return <PrivacyContent />;
}
