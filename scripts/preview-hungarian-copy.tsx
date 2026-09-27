/**
 * A magyar stílusminták teljes, helyben átolvasható változata.
 * Szintetikus adatokból, az alkalmazás valódi szövegforrásaival és PDF-jeivel
 * dolgozik. Nem olvas adatbázist, nem küld levelet, és nem publikál riportot.
 *
 * npx tsx scripts/preview-hungarian-copy.tsx --out /abs/output/pdf
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { TeamReportDocument } from "../src/components/pdf/TeamReportPdf";
import { buildHeroInsight } from "../src/lib/workstyle-content";
import { dimStandardError } from "../src/lib/psychometrics";
import { buildPdfScenarios } from "./pdf-report-scenarios";
import { findBlankPages, renderReportBuffer } from "./pdf-report-render";
import { makeEditorialTeamReport } from "./fixtures/team-report-reader";

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== "--out" || !args[1]) {
    throw new Error("Használat: npx tsx scripts/preview-hungarian-copy.tsx --out /abs/output/pdf");
  }
  const outDir = resolve(args[1]);
  mkdirSync(outDir, { recursive: true });

  const personal = buildPdfScenarios().find(({ id }) => id === "plus-hu-mixed-full");
  if (!personal) throw new Error("Hiányzik a plus-hu-mixed-full mintaprofil.");

  const personalBuffer = await renderReportBuffer({
    ...personal.input,
    userName: "Személyes riport · bemutatóadat",
    heroInsight: buildHeroInsight(
      personal.input.dimensions.filter(({ code }) => code !== "I"),
      dimStandardError("full"),
      "hu",
    ),
  });
  const blankPages = findBlankPages(personalBuffer);
  if (blankPages.length) {
    throw new Error(`Üres személyes riportoldal: ${blankPages.map((page) => page + 1).join(", ")}`);
  }
  writeFileSync(join(outDir, "szemelyes-riport.pdf"), personalBuffer);

  const team = makeEditorialTeamReport();
  const teamBuffer = await renderToBuffer(<TeamReportDocument report={team} isHu />);
  writeFileSync(join(outDir, "ceges-riport.pdf"), teamBuffer);

  const blogPath = "content/blog/amikor-a-csapatriport-beszelgetest-indit.mdx";
  writeFileSync(join(outDir, "blogminta.mdx"), readFileSync(blogPath));
  writeFileSync(join(outDir, "README.md"), `# Magyar szövegminták

A két riport szintetikus adatokból készült. A fájlok az alkalmazás aktuális
szövegforrásait használják; szerkesztői minták, nem valódi személy vagy
csapat felmérései. A blog a repóban szereplő teljes cikk másolata.

- Személyes riport: szemelyes-riport.pdf (${personal.id})
- Céges riport: ceges-riport.pdf (${team.id})
- Blog: blogminta.mdx (${blogPath})

A riportokat elejétől a végéig olvassuk át: ismétlések, átvezetések,
megszólítás, a megállapítások forrása és a javaslatok érthetősége.
A tördelést a PDF-ekben is ellenőrizzük.

Útmutató: docs/development/hungarian-style-guide.md
Szerkesztői példák: docs/development/hungarian-style-samples.md
`);
  console.log(`Elkészült a két riport és a teljes blogminta: ${outDir}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
