import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildPageMetadata } from "@/lib/seo";
import { buildWebPageJsonLd } from "@/lib/structured-data";
import { RolunkContent } from "./RolunkContent";

// Statikus metadata a DEFAULT_LOCALE-lal — a nyelvváltást a kliens-oldali
// LocaleProvider kezeli (RolunkContent), mint a többi marketing-lapon.
export const metadata: Metadata = buildPageMetadata({
  path: "/rolunk",
  title: "Rólunk — a Trita mögött álló műhely | Trita",
  description:
    "A Trita mögött nem szoftvercég áll, hanem tanácsadói műhely: a platformot a saját munkánkhoz építettük. Miért csináljuk, és hogyan dolgozunk a partnercsapatainkkal.",
  ogTitle: "Rólunk — a Trita mögött álló műhely",
  ogDescription:
    "Tanácsadói műhely vagyunk: mérés + emberi értelmezés, kevés csapat, közeli munka. Miért építjük a Tritát, és hogyan dolgozunk.",
});

export default function RolunkPage() {
  return (
    <>
      <JsonLd
        data={buildWebPageJsonLd({
          path: "/rolunk",
          title: "Rólunk — a Trita mögött álló műhely",
          description:
            "A Trita mögött tanácsadói műhely áll: a platformot a saját munkánkhoz építettük, és tanácsadás-vezérelt modellben dolgozunk — mérés, emberi validálás, közös értelmezés.",
          about: ["Tanácsadás", "Csapatdiagnosztika"],
          breadcrumb: [
            { name: "Főoldal", path: "/" },
            { name: "Rólunk", path: "/rolunk" },
          ],
        })}
      />
      <RolunkContent />
    </>
  );
}
