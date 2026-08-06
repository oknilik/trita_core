import { Suspense } from "react";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildPageMetadata, getAbsoluteUrl } from "@/lib/seo";
import { buildItemListJsonLd, buildWebPageJsonLd } from "@/lib/structured-data";
import { PATTERNS } from "@/lib/pattern-data";
import { PatternDirectory, axisProfileLabels } from "./PatternDirectory";
import { PatternExplorer } from "./PatternExplorer";

export const metadata: Metadata = buildPageMetadata({
  path: "/patterns",
  title: "16 csapatműködési mintázat — melyik a tiéd? | Trita",
  description:
    "A 16 csapatműködési mintázat négy tengely mentén: hajtóerő, kohézió, fegyelem, nyitottság. Nézd meg mindegyik erősségeit és kockázatait, és melyik illik a csapatodra.",
  ogTitle: "16 csapatminta — Melyik a tiéd?",
  ogDescription:
    "Interaktív csapatminta felfedező. 4 tengely, 16 mintázat, személyre szabott meglátások.",
});

export default function PatternsPage() {
  // ItemList: a lista-típusú tartalom („16 X") a leggyakrabban idézett forma
  // az AI-válaszokban — de csak akkor, ha a tételek gépi formában is
  // megvannak. Ugyanabból a PATTERNS forrásból jön, mint a látható katalógus.
  const patternKeys = Object.keys(PATTERNS).sort();

  return (
    <>
      <JsonLd
        data={[
          buildWebPageJsonLd({
            path: "/patterns",
            title: "16 csapatműködési mintázat",
            description:
              "A 16 csapatműködési mintázat négy tengely mentén: hajtóerő, kohézió, fegyelem, nyitottság.",
            about: ["Csapatdinamika", "Csapatműködési mintázatok"],
            breadcrumb: [
              { name: "Főoldal", path: "/" },
              { name: "Csapatmintázatok", path: "/patterns" },
            ],
          }),
          buildItemListJsonLd({
            name: "A 16 csapatműködési mintázat",
            description:
              "Négy tengely (hajtóerő, kohézió, fegyelem, nyitottság) metszetéből adódó 16 csapatműködési mintázat, erősségekkel és kockázatokkal.",
            items: patternKeys.map((key) => ({
              name: PATTERNS[key].name,
              description: `${PATTERNS[key].description} Jellemzők: ${axisProfileLabels(key).join(", ")}. Erősségek: ${PATTERNS[key].strengths.join(", ")}. Kockázatok: ${PATTERNS[key].risks.join(", ")}.`,
              url: `${getAbsoluteUrl("/patterns")}#mind-a-16-mintazat`,
            })),
          }),
        ]}
      />
      <Suspense>
        <PatternExplorer />
      </Suspense>
      <div style={{ backgroundColor: "var(--color-paper-bg)" }}>
        <PatternDirectory />
      </div>
    </>
  );
}
