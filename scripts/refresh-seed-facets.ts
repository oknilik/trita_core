/**
 * refresh-seed-facets.ts
 *
 * A SEEDELT eredmények facet-bontásának újraszámolása a javított
 * generátorral (`personas.shared.ts` → buildFacets, 2026-08-18).
 *
 * MIÉRT KELL: a korábbi generátor FIX eltolás-sorrendet használt
 * ([-6, -2, 3, 7]) minden dimenzióra és minden személyre. Emiatt két seedelt
 * ember facetenkénti KÜLÖNBSÉGE pontosan a dimenzió-különbségük lett (az
 * azonos eltolás kiesik a kivonásban), a ±7-es sáv pedig szűkebb volt, mint
 * a facet-szintű mérési hiba. Következmény: a facet-szintű felületek
 * (pár-nézet attribúció és nüansz, önkép–külső kép alskála-összevetés, PDF
 * facet-sorai) a demó-adaton SZERKEZETILEG nem tudtak megszólalni.
 *
 * MIÉRT NEM ÚJRA-SEEDELÉS: a seed-scriptek Clerk dev-kulcsot követelnek, és
 * `deleteMany`-vel törlik a meglévő eredményeket (observer-válaszokkal
 * együtt). Ez a script CSAK a `scores.facets` mezőt írja felül, minden mást
 * — dimenziók, válaszok, observer-adatok, kapcsolatok — érintetlenül hagy.
 *
 * BIZTONSÁGI KAPU — valódi kitöltést SOHA nem ír át. Két feltétel EGYÜTT:
 *   1. `scores.answers` üres tömb (a seedek így írnak; valódi kitöltés a
 *      teljes válaszlistát tárolja),
 *   2. a tárolt facet-értékek pontosan a RÉGI, fix eltolás-mintát követik.
 * Amelyik sorra bármelyik nem teljesül, az kimarad.
 *
 * Futtatás (alapból SZÁRAZ futás, nem ír semmit):
 *   npx tsx scripts/refresh-seed-facets.ts
 *   npx tsx scripts/refresh-seed-facets.ts --apply
 */

import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      const content = readFileSync(resolve(process.cwd(), file), "utf-8");
      for (const line of content.split("\n")) {
        const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
        if (!match) continue;
        const [, key, raw] = match;
        if (!process.env[key]) {
          process.env[key] = raw.replace(/^['"]|['"]$/g, "").trim();
        }
      }
      console.log(`📄 Env betöltve: ${file}`);
      return;
    } catch {
      // nincs ilyen fájl — a következőt próbáljuk
    }
  }
}

/** A RÉGI generátor eltolásai, a kanonikus facet-sorrendben. */
const LEGACY_OFFSETS = [-6, -2, 3, 7];
const clamp = (value: number) => Math.max(0, Math.min(100, value));

async function main() {
  loadEnv();

  if (!process.env.DATABASE_URL) {
    console.error("❌ Nincs DATABASE_URL — .env.local vagy .env kell a futtatáshoz.");
    process.exit(1);
  }

  const apply = process.argv.includes("--apply");

  // A prisma-kliens modul-szinten olvassa a DATABASE_URL-t, ezért csak az
  // env betöltése UTÁN importálható.
  const { PrismaClient } = await import("@prisma/client");
  const { HEXACO_DIMENSION_FACETS } = await import("@/lib/hexaco");
  const { buildFacets } = await import("./personas.shared");

  const prisma = new PrismaClient();

  /** Igaz, ha a tárolt facetek a RÉGI, fix eltolás-mintát követik. */
  const hasLegacyFacetSignature = (
    dimensions: Record<string, number>,
    facets: Record<string, Record<string, number>>,
  ): boolean => {
    let matchedDims = 0;
    for (const [dim, values] of Object.entries(facets)) {
      const codes = HEXACO_DIMENSION_FACETS[dim as keyof typeof HEXACO_DIMENSION_FACETS];
      const base = dimensions[dim];
      if (!codes || typeof base !== "number") return false;
      for (const [index, facet] of codes.entries()) {
        const expected = clamp(base + LEGACY_OFFSETS[index % LEGACY_OFFSETS.length]);
        if (values[facet] !== expected) return false;
      }
      matchedDims++;
    }
    return matchedDims > 0;
  };

  const rows = await prisma.assessmentResult.findMany({
    select: { id: true, scores: true, isSelfAssessment: true },
  });
  console.log(`\nEredmény-sorok összesen: ${rows.length}`);

  let skippedRealFill = 0;
  let skippedNoSignature = 0;
  const targets: Array<{ id: string; facets: Record<string, Record<string, number>> }> = [];

  for (const row of rows) {
    const scores = row.scores as Record<string, unknown> | null;
    if (!scores || typeof scores !== "object") continue;

    // 1. kapu: valódi kitöltés → érintetlen.
    const answers = scores.answers;
    if (!Array.isArray(answers) || answers.length > 0) {
      skippedRealFill++;
      continue;
    }

    const dimensions = scores.dimensions as Record<string, number> | undefined;
    const facets = scores.facets as Record<string, Record<string, number>> | undefined;
    if (!dimensions || !facets) {
      skippedNoSignature++;
      continue;
    }

    // 2. kapu: csak a régi minta írható felül.
    if (!hasLegacyFacetSignature(dimensions, facets)) {
      skippedNoSignature++;
      continue;
    }

    targets.push({ id: row.id, facets: buildFacets(dimensions) });
  }

  console.log(`  · valódi kitöltés (érintetlen):        ${skippedRealFill}`);
  console.log(`  · nincs régi facet-minta (kimarad):    ${skippedNoSignature}`);
  console.log(`  · ÚJRASZÁMOLANDÓ:                      ${targets.length}`);

  if (targets.length === 0) {
    console.log("\nNincs mit tenni.");
    await prisma.$disconnect();
    return;
  }

  if (!apply) {
    console.log("\n🔍 SZÁRAZ FUTÁS — nem írtam semmit.");
    console.log("   Íráshoz: npx tsx scripts/refresh-seed-facets.ts --apply\n");
    await prisma.$disconnect();
    return;
  }

  let written = 0;
  for (const target of targets) {
    const current = await prisma.assessmentResult.findUnique({
      where: { id: target.id },
      select: { scores: true },
    });
    if (!current?.scores) continue;
    await prisma.assessmentResult.update({
      where: { id: target.id },
      // CSAK a facets kulcs cserélődik — a dimenziók, a forma-pecsét és
      // minden egyéb kísérő mező marad.
      data: {
        scores: {
          ...(current.scores as Record<string, unknown>),
          facets: target.facets,
        } as object,
      },
    });
    written++;
  }

  console.log(`\n✅ Frissítve: ${written} sor.`);
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
