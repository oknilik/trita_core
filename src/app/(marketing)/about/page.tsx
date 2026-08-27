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
  title: "Rólunk – a trita mögött álló műhely | trita",
  description:
    "A trita tanácsadói műhely és csapatdiagnosztikai platform. Megmutatjuk, miért építjük, milyen szakmai keretek között dolgozunk, és hogyan lesz a mérésből közös változás.",
  ogTitle: "Rólunk – a trita mögött álló műhely",
  ogDescription:
    "Tanácsadó vezette csapatdiagnosztika: mérés, közös értelmezés és visszamérés egy folyamatban.",
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
