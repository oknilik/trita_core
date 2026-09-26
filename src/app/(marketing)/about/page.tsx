import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildPageMetadata } from "@/lib/seo";
import { buildWebPageJsonLd } from "@/lib/structured-data";
import { AboutContent } from "./AboutContent";

// Statikus metadata a DEFAULT_LOCALE-lal — a tartalom nyelvváltását a
// kliens-oldali LocaleProvider kezeli (AboutContent), ahogy a többi
// marketing-lapon is.
//
export const metadata: Metadata = buildPageMetadata({
  path: "/about",
  title: "Rólunk – a trita mögött álló csapat | trita",
  description:
    "A tritát a csapatokkal végzett munka és a csapatvezetés sokéves tapasztalatából építjük. Ismerd meg a munkánkat és a közös munkában követett elveinket.",
  ogTitle: "Rólunk – a trita mögött álló csapat",
  ogDescription:
    "Csapatokkal szerzett tapasztalatokra építünk: felmérjük a működéseteket, együtt értelmezzük az eredményeket, és követjük a változást.",
});

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={buildWebPageJsonLd({
          path: "/about",
          title: "Rólunk – a trita mögött álló műhely",
          description:
            "A trita tanácsadó vezette csapatdiagnosztikai folyamatban kapcsolja össze a mérést, az emberi értelmezést és a változás követését.",
          about: ["Csapatdiagnosztika", "Személyiségfelmérés", "Csapatintelligencia"],
          breadcrumb: [
            { name: "Főoldal", path: "/" },
            { name: "Rólunk", path: "/about" },
          ],
        })}
      />
      <AboutContent />
    </>
  );
}
