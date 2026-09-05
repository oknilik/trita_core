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

// A főoldal a csapatintelligencia márka- és kategóriaoldala. Az ingyenes
// egyéni teszt a /try önálló funnel-céloldalán célozza a hozzá tartozó
// kereséseket; a /team-dynamics a mélyebb „csapatdiagnosztika" szándéké.
const seoIntent = SEO_INTENTS.home;
const title = "Csapatintelligencia és csapatdinamika | trita";
const description =
  "A trita az egyéni profilokból és csapatmérésekből közös csapatképet készít: erősségek, bizalom, pszichológiai biztonság és közös következő lépések.";

export const metadata: Metadata = buildPageMetadata({
  path: "/",
  title,
  description,
  ogTitle: "trita – csapatintelligencia a közös munkához",
  ogDescription:
    "Értsétek meg, hogyan működtök együtt, mire építhettek, és hol érdemes közösen változtatnotok.",
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
