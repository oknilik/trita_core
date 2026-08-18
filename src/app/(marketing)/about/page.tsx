import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildPageMetadata } from "@/lib/seo";
import { buildWebPageJsonLd } from "@/lib/structured-data";
import { AboutContent } from "./AboutContent";

// Statikus metadata a DEFAULT_LOCALE-lal — a tartalom nyelvváltását a
// kliens-oldali LocaleProvider kezeli (AboutContent), ahogy a többi
// marketing-lapon is.
//
// A `<title>` a valódi keresésre megy („mi az a trita", „hogyan működik"),
// nem a belső fejezetcímre.
export const metadata: Metadata = buildPageMetadata({
  path: "/about",
  title: "Mi az a Trita? A gondolat és a felépítés | Trita",
  description:
    "Ami mérhető, az megbeszélhető. Így épül fel a Trita: három alapréteg, tanácsadói validálás és közös nyelv rólad és a csapatról — egyénileg ingyenes, csapatoknak program.",
  ogTitle: "Mi az a Trita? A gondolat és a felépítés",
  ogDescription:
    "Ami mérhető, az megbeszélhető. Három alapréteg, tanácsadói validálás és közös nyelv rólad és a csapatról.",
});

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={buildWebPageJsonLd({
          path: "/about",
          title: "Mi az a Trita? A gondolat és a felépítés",
          description:
            "Ami mérhető, az megbeszélhető. A Trita három alaprétege az önértékelés, a mért bizalmi háló és a névtelen pszichológiai biztonság pulse — tanácsadó által jóváhagyott csapatképpé összeolvasva. Egyéneknek ingyenes, csapatoknak tanácsadó vezette program.",
          about: ["Csapatdiagnosztika", "Személyiségfelmérés", "Csapatintelligencia"],
          breadcrumb: [
            { name: "Főoldal", path: "/" },
            { name: "Mi az a Trita", path: "/about" },
          ],
        })}
      />
      <AboutContent />
    </>
  );
}
