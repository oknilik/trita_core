/**
 * pdf-report-snapshots.tsx — PDF-regressziós snapshotok a riport-kimenetről.
 *
 * Minden forgatókönyvet (scripts/pdf-report-scenarios.ts) a VALÓDI
 * dokumentum-komponenssel (TritaReportDocument) renderel, és oldalanként PNG-t
 * ír ki, hogy a tördelés, a sűrűség és a tipográfia szemmel is ellenőrizhető
 * legyen (PDF-audit 2026-08-18, P2/16).
 *
 * Futtatás:
 *   pnpm report:pdf-snapshots
 *   pnpm report:pdf-snapshots --only plus-hu-mixed-full
 *   pnpm report:pdf-snapshots --out /abs/dir --dpi 110
 *   pnpm report:pdf-snapshots --pdf-only        # csak PDF, raszterizálás nélkül
 *
 * A PDF-ek MINDIG elkészülnek (tiszta node). A PNG-hez raszterizáló kell:
 * `pdftoppm` (poppler) vagy `pdftocairo`; ha egyik sincs a PATH-on, a script
 * PDF-eket ír, PNG-t nem, és ezt jelzi — a CI-ban a szerződést a
 * tests/unit/results/pdf-report-*.test.ts fedi le, ez a script emberi
 * átnézésre való.
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { buildPdfScenarios } from "./pdf-report-scenarios";
import { findBlankPages, renderReportBuffer } from "./pdf-report-render";

function parseArgs(): Record<string, string> {
  const args = process.argv.slice(2);
  const out: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = args[i + 1];
    if (next && !next.startsWith("--")) {
      out[key] = next;
      i++;
    } else {
      out[key] = "true";
    }
  }
  return out;
}

function findRasterizer(): string | null {
  for (const bin of ["pdftoppm", "pdftocairo"]) {
    try {
      execFileSync("which", [bin], { stdio: "pipe" });
      return bin;
    } catch {
      // következő jelölt
    }
  }
  return null;
}

async function main() {
  const args = parseArgs();
  const outDir = args.out
    ? resolve(args.out)
    : join(process.cwd(), "docs", "testing", "pdf-snapshots");
  const dpi = Number(args.dpi ?? 96);
  const pdfOnly = args["pdf-only"] === "true";

  let scenarios = buildPdfScenarios();
  if (args.only) {
    const wanted = new Set(args.only.split(",").map((s) => s.trim()));
    scenarios = scenarios.filter((s) => wanted.has(s.id));
    if (scenarios.length === 0) {
      console.error("❌  --only nem talált forgatókönyvet");
      process.exit(1);
    }
  }

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  const rasterizer = pdfOnly ? null : findRasterizer();
  if (!pdfOnly && !rasterizer) {
    console.warn(
      "⚠️   Nincs raszterizáló (pdftoppm/pdftocairo) — csak PDF-ek készülnek, PNG nem.",
    );
  }

  const manifest: { id: string; covers: string; pdf: string; pages: number }[] = [];
  const blankPageFailures: string[] = [];

  for (const scenario of scenarios) {
    const pdfPath = join(outDir, `${scenario.id}.pdf`);
    const buffer = await renderReportBuffer(scenario.input);
    writeFileSync(pdfPath, buffer);

    // Üres, „lebegő" lap őre: ha egy elem alsó margója éppen túllóg a
    // tartalom-dobozon, a react-pdf tartalom nélküli folytatás-lapot nyit.
    const blanks = findBlankPages(buffer);
    if (blanks.length > 0) {
      blankPageFailures.push(`${scenario.id}: ${blanks.map((i) => `#${i}`).join(", ")}`);
    }

    manifest.push({
      id: scenario.id,
      covers: scenario.covers,
      pdf: `${scenario.id}.pdf`,
      pages: (buffer.toString("latin1").match(/\/Type\s*\/Page\b/g) ?? []).length,
    });

    if (rasterizer) {
      execFileSync(rasterizer, ["-png", "-r", String(dpi), pdfPath, join(outDir, scenario.id)], {
        stdio: "pipe",
      });
    }
    console.log(`  ${blanks.length > 0 ? "✗" : "✓"} ${scenario.id} — ${scenario.covers}`);
  }

  writeFileSync(join(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  if (blankPageFailures.length > 0) {
    console.error(
      `\n❌  Üres (tartalom nélküli) lap a riportban:\n   ${blankPageFailures.join("\n   ")}`,
    );
    process.exit(1);
  }

  console.log(`🎉  Kész: ${outDir} (${scenarios.length} forgatókönyv)`);
}

main().catch((e) => {
  console.error("❌  Hiba:", (e as Error).message, e);
  process.exit(1);
});
