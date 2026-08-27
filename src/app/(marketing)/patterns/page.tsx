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
  title: "16 csapatminta mint értelmezési nyelv | trita",
  description:
    "Négy csapattengely 16 lehetséges olvasata erősségekkel és kockázatokkal. Értelmezési nyelv, nem validált csapattipológia vagy diagnózis.",
  ogTitle: "16 csapatminta – értelmezési nyelv",
  ogDescription:
    "Interaktív szemléltető négy tengellyel és 16 lehetséges olvasattal – nem diagnózis.",
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
            title: "16 csapatminta mint értelmezési nyelv",
            description:
              "Négy csapattengely 16 lehetséges értelmezése; nem validált csapattipológia.",
            about: ["Csapatdinamika", "Csapatműködési mintázatok"],
            breadcrumb: [
              { name: "Főoldal", path: "/" },
              { name: "Csapatmintázatok", path: "/patterns" },
            ],
          }),
          buildItemListJsonLd({
            name: "A négy csapattengely 16 értelmezési mintája",
            description:
              "Négy tengely metszetéből adódó 16 értelmezési minta erősségekkel és kockázatokkal; nem validált tipológia.",
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
