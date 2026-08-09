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
    "Mire épül a Trita: négy mérési réteg, tanácsadói validálás és egy közös nyelv a csapatról. Elmondjuk, hogyan áll össze a kép — és mi a célunk vele.",
  ogTitle: "Mi az a Trita? A gondolat és a felépítés",
  ogDescription:
    "Négy mérési réteg, tanácsadói validálás és egy közös nyelv a csapatról — így áll össze a kép.",
});

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={buildWebPageJsonLd({
          path: "/about",
          title: "Mi az a Trita? A gondolat és a felépítés",
          description:
            "A Trita felépítése négy mérési rétegből: személyiség, külső visszajelzés, csapatszerepek és pszichológiai biztonság — tanácsadó által validált csapatképpé összeolvasva.",
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
