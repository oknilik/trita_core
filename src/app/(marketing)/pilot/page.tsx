import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildPageMetadata } from "@/lib/seo";
import { buildWebPageJsonLd } from "@/lib/structured-data";
import { PilotContent } from "./PilotContent";

// Statikus metadata a DEFAULT_LOCALE-lal — a tartalom nyelvváltását a
// kliens-oldali LocaleProvider kezeli (PilotContent).
export const metadata: Metadata = buildPageMetadata({
  path: "/pilot",
  title: "Pilotprogram – az első partnercsapatainknak | trita",
  description:
    "90 napos, személyesen kísért csapatprogram: közös mérés, értelmező workshop, konkrét vezetői lépés és visszamérés.",
  ogTitle: "Pilotprogram – az első partnercsapatainknak",
  ogDescription:
    "90 napos, személyesen kísért csapatprogram az első partnercsapatoknak.",
});

export default function PilotPage() {
  return (
    <>
      <JsonLd
        data={buildWebPageJsonLd({
          path: "/pilot",
          title: "Pilotprogram – az első partnercsapatainknak",
          description:
            "90 nap teljes hozzáférés, személyes bevezetés és kiemelt figyelem az első partnercsapatoknak, egyedi feltételekkel.",
          about: ["Csapatdiagnosztika", "Pilotprogram"],
          breadcrumb: [
            { name: "Főoldal", path: "/" },
            { name: "Pilotprogram", path: "/pilot" },
          ],
        })}
      />
      <PilotContent />
    </>
  );
}
