import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildPageMetadata } from "@/lib/seo";
import {
  buildDefinedTermSetJsonLd,
  buildWebPageJsonLd,
} from "@/lib/structured-data";
import { RIASEC_CONTENT } from "@/lib/riasec-content";
import { HollandContent } from "./HollandContent";

export const metadata: Metadata = buildPageMetadata({
  path: "/holland-kod",
  title: "Mi az a Holland-kód? — RIASEC érdeklődés-típusok | trita",
  description:
    "A Holland-kód (RIASEC) hat érdeklődés-típusa érthetően: Megvalósító, Elemző, Alkotó, Segítő, Meggyőző, Rendszerező. Mit jelentenek a betűk, és hogyan olvasd?",
  ogTitle: "Mi az a Holland-kód? — RIASEC érthetően",
  ogDescription:
    "Hat érdeklődés-típus, ami megmutatja, milyen munka tölt fel — betűnkénti magyarázattal és példa-szerepekkel.",
});

export default function HollandCodePage() {
  // Fogalom-magyarázó lap → DefinedTermSet. Egy „mi az a Holland-kód?"
  // kérdésre a válaszmotorok azt a forrást idézik, amelyik a definíciót
  // gépileg kinyerhető formában adja; a hat betű itt hat külön DefinedTerm,
  // ugyanabból az adatforrásból (RIASEC_CONTENT), amiből a látható oldal is
  // renderel — így a strukturált adat nem tud elcsúszni a tartalomtól.
  return (
    <>
      <JsonLd
        data={[
          buildWebPageJsonLd({
            path: "/holland-kod",
            title: "Mi az a Holland-kód? — RIASEC érdeklődés-típusok",
            description:
              "A Holland-kód (RIASEC) hat érdeklődés-típusa érthetően, betűnkénti magyarázattal és példa-szerepekkel.",
            about: ["Holland-kód", "RIASEC", "Pályaorientáció"],
            breadcrumb: [
              { name: "Főoldal", path: "/" },
              { name: "Holland-kód (RIASEC)", path: "/holland-kod" },
            ],
          }),
          buildDefinedTermSetJsonLd({
            name: "Holland-kód (RIASEC) érdeklődés-típusok",
            description:
              "John Holland RIASEC-modelljének hat érdeklődés-típusa: a rád legjellemzőbb kettő-három betű adja a Holland-kódodat. Nem azt mutatja, mihez értesz, hanem hogy milyen munka tölt fel.",
            path: "/holland-kod",
            terms: RIASEC_CONTENT.map((entry) => ({
              name: entry.name.hu,
              description: entry.description.hu,
              termCode: entry.letter,
            })),
          }),
        ]}
      />
      <HollandContent />
    </>
  );
}
