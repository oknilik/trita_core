import type { Metadata } from "next";
import { LandingContent } from "@/components/landing/LandingContent";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildPageMetadata } from "@/lib/seo";
import { SEO_INTENTS } from "@/lib/seo-intents";
import {
  buildOrganizationJsonLd,
  buildWebPageJsonLd,
  buildWebSiteJsonLd,
} from "@/lib/structured-data";

// A `<title>` KULCSSZÓ-ELSŐ, márka-utolsó sorrendben: a magyar keresésekben a
// „személyiségteszt magyarul" a főoldal keresési szándéka, a „trita" nem —
// márkanévre amúgy is első találat vagyunk.
//
// POZICIONÁLÁS vs. KERESÉSI SZÁNDÉK (2026-09-05): a Google OLDALT rangsorol,
// nem site-ot. A főoldal a funnel egyéni belépője marad (H1, hero, CTA nem
// változik), a márka csapatintelligencia-pozicionálását viszont NEM a H1
// hordozza, hanem:
//   - a description második fele (márkakeresésnél ez a snippet mondja ki,
//     mi a trita — miközben az oldal a tesztre rangsorol),
//   - az OG-pár (megosztásnál a márka-, nem a funnel-üzenet látszik),
//   - az Organization/WebSite entitás (`structured-data.ts`),
//   - és a `/team-dynamics` pillar, amely a „csapatintelligencia" kategória
//     gazdája. Így a két lap nem ugyanarra a kifejezésre versenyez.
const seoIntent = SEO_INTENTS.home;
const title = "Magyar személyiségteszt – értsd meg, hogyan működsz | trita";
const description =
  "Ingyenes magyar személyiségteszt 60 kérdéssel és azonnali eredménnyel. A trita csapatintelligencia-platform egyéni belépője: mintázataid, erősségeid, csapatszerepeid.";

export const metadata: Metadata = buildPageMetadata({
  path: "/",
  title,
  description,
  ogTitle: "trita – csapatintelligencia-platform",
  ogDescription:
    "Ingyenes egyéni személyiségprofil belépőként; csapatoknak tanácsadóval kísért csapatkép: szerepek, bizalmi háló, pszichológiai biztonság.",
});

// Statikus oldal: a bejelentkezett látogatót a proxy irányítja a journey
// handoffra. A landing nem használ useSearchParams-t, ezért nem kell
// Suspense-határ: a teljes oldal — a hero H1-gyel, ami az LCP-elem —
// bekerül a prerenderelt HTML-be. A korábbi /self-awareness tükör-oldal ide
// irányít (next.config.ts): az egyéni ígéret egyetlen lapon él.
export default function Home() {
  // A gyökér-lapon él a márka- és site-entitás (`@id` horgonyokkal); az összes
  // többi lap ezekre HIVATKOZIK ahelyett, hogy újra kihirdetné őket.
  return (
    <main className="min-h-screen bg-cream">
      <JsonLd
        data={[
          buildOrganizationJsonLd("hu"),
          buildWebSiteJsonLd("hu"),
          buildWebPageJsonLd({
            path: "/",
            title,
            description,
            about: seoIntent.topics,
          }),
        ]}
      />
      <LandingContent />
    </main>
  );
}
