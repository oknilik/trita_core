import type { Metadata } from "next";
import { FocusedLandingContent } from "@/components/landing/FocusedLandingContent";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildPageMetadata } from "@/lib/seo";
import { SEO_INTENTS } from "@/lib/seo-intents";
import {
  buildOrganizationJsonLd,
  buildWebPageJsonLd,
  buildWebSiteJsonLd,
} from "@/lib/structured-data";

// A `<title>` KULCSSZÓ-ELSŐ, márka-utolsó sorrendben: a magyar keresésekben a
// a „személyiségteszt magyarul" a főoldal keresési szándéka, a „trita" nem —
// márkanévre amúgy is első találat vagyunk. A csapatdiagnosztikának külön,
// mélyebb céloldala van, így a két lap nem ugyanarra az elsődleges kifejezésre
// versenyez.
const seoIntent = SEO_INTENTS.home;
const title = "Magyar személyiségteszt – értsd meg, hogyan működsz | trita";
const description =
  "Ingyenes magyar személyiségteszt 60 kérdéssel és azonnali eredménnyel. Ismerd meg a fő mintázataidat, erősségeidet és csapatszerepeidet.";

export const metadata: Metadata = buildPageMetadata({
  path: "/",
  title,
  description,
  ogTitle: "trita – személyiség- és csapatintelligencia",
  ogDescription:
    "Mérhető személyiség- és csapatdinamika az együttműködéshez, fejlesztéshez és döntéstámogatáshoz.",
});

// Statikus oldal: a bejelentkezett látogatót a proxy irányítja a journey
// handoffra. A fókuszált landing nem használ useSearchParams-t, ezért nem
// kell Suspense-határ: a teljes oldal — a hero H1-gyel, ami az LCP-elem —
// bekerül a prerenderelt HTML-be.
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
      <FocusedLandingContent />
    </main>
  );
}
