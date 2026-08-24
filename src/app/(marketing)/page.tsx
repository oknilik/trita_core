import type { Metadata } from "next";
import { LandingContent } from "@/components/landing/LandingContent";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildPageMetadata } from "@/lib/seo";
import {
  buildOrganizationJsonLd,
  buildWebPageJsonLd,
  buildWebSiteJsonLd,
} from "@/lib/structured-data";

// A `<title>` KULCSSZÓ-ELSŐ, márka-utolsó sorrendben: a magyar keresésekben a
// „személyiségteszt" és a „csapatdiagnosztika" a kereslet, a „trita" nem —
// márkanévre amúgy is első találat vagyunk. A korábbi, márkával kezdődő cím
// („trita — személyiség- és csapatintelligencia platform") a saját kategória-
// megnevezésünkre optimalizált, amit senki nem keres.
export const metadata: Metadata = buildPageMetadata({
  path: "/",
  title: "Személyiségteszt és csapatdiagnosztika | Trita",
  description:
    "Személyiségteszt hat dimenzió mentén, 360°-os visszajelzés és csapatdiagnosztika magyarul: mérhető csapatdinamika, tanácsadói értelmezéssel. Az egyéni felmérés ingyenes.",
  ogTitle: "Trita — személyiség- és csapatintelligencia",
  ogDescription:
    "Mérhető személyiség- és csapatdinamika insightok együttműködéshez, fejlesztéshez és döntéstámogatáshoz.",
});

// Statikus oldal: a bejelentkezett látogatót a proxy irányítja a journey
// handoffra, a ?mode= paramétert a LandingContent kezeli kliens-oldalon.
// A LandingContent már NEM használ useSearchParams-t (ld. site-mode.ts), ezért
// nem kell Suspense-határ: a teljes landing — a hero H1-gyel, ami az LCP-elem —
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
            title: "Személyiségteszt és csapatdiagnosztika | Trita",
            description:
              "Személyiségteszt hat dimenzió mentén, 360°-os visszajelzés és csapatdiagnosztika magyarul: mérhető csapatdinamika, tanácsadói értelmezéssel.",
            about: ["Személyiségteszt", "Csapatdiagnosztika", "Hatfaktoros személyiségmodell"],
          }),
        ]}
      />
      <LandingContent />
    </main>
  );
}
