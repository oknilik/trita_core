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
 * facet-sorai) a demó-adaton SZERKEZETILEG nem tudtak megszólalni. Néhány
 * seed ráadásul VÉLETLEN facet-értékeket írt, vagy facet-bontás nélküli
 * sort hagyott — azok ugyanígy kezelendők.
 *
 * MIÉRT NEM ÚJRA-SEEDELÉS: a seed-scriptek Clerk dev-kulcsot követelnek, és
 * `deleteMany`-vel törlik a meglévő eredményeket (observer-válaszokkal
 * együtt). Ez a script CSAK a `scores.facets` mezőt írja felül, minden mást
 * — dimenziók, forma-pecsét, observer-adatok, kapcsolatok — érintetlenül hagy.
 *
 * BIZTONSÁGI KAPU — valódi kitöltést SOHA nem ír át.
 * A jelölő az `answers` KULCS JELENLÉTE: a seedek explicit `answers: []`-t
 * írnak, a valódi kitöltés score-JSON-ja viszont EGYÁLTALÁN NEM tartalmaz
 * ilyen kulcsot (`calculateScores` → type/dimensions/facets/form/
 * bankVersion/bankHash/engineVersion). Amelyik sorban nincs `answers`
 * tömb, az érintetlen marad.
 *
 * Futtatás (alapból SZÁRAZ futás, nem ír semmit):
 *   pnpm seed:facets:refresh
 *   pnpm seed:facets:refresh -- --apply
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

type Shape =
  | "nincs facet-bontás"
  | "régi fix eltolás-minta"
  | "már az új minta"
  | "egyéb (pl. véletlen értékek)";

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
  const { extractDimensionScores } = await import("@/lib/scoring");
  const { buildFacets } = await import("./personas.shared");

  const prisma = new PrismaClient();

  const matchesOffsets = (
    dimensions: Record<string, number>,
    facets: Record<string, Record<string, number>>,
    expectedFor: (base: number, index: number) => number,
  ): boolean => {
    let matched = 0;
    for (const [dim, values] of Object.entries(facets)) {
      const codes = HEXACO_DIMENSION_FACETS[dim as keyof typeof HEXACO_DIMENSION_FACETS];
      const base = dimensions[dim];
      if (!codes || typeof base !== "number") return false;
      for (const [index, facet] of codes.entries()) {
        if (values[facet] !== expectedFor(base, index)) return false;
      }
      matched++;
    }
    return matched > 0;
  };

  const classify = (
    dims: Record<string, number>,
    facets: Record<string, Record<string, number>> | undefined,
  ): Shape => {
    if (!facets || Object.keys(facets).length === 0) return "nincs facet-bontás";
    if (matchesOffsets(dims, facets, (base, i) => clamp(base + LEGACY_OFFSETS[i % 4]))) {
      return "régi fix eltolás-minta";
    }
    // Az új generátor eltolásai dimenziónként permutáltak, ezért nincs egy
    // fix mintája — a felismerés a referencia-kimenettel való összevetés.
    const fresh = buildFacets(dims);
    const alreadyFresh = Object.entries(fresh).every(([dim, values]) =>
      Object.entries(values).every(([facet, value]) => facets[dim]?.[facet] === value),
    );
    return alreadyFresh ? "már az új minta" : "egyéb (pl. véletlen értékek)";
  };

  const rows = await prisma.assessmentResult.findMany({
    select: { id: true, scores: true, isSelfAssessment: true },
  });

  let realFills = 0;
  let unreadableDims = 0;
  const byShape = new Map<Shape, number>();
  const targets: Array<{ id: string; facets: Record<string, Record<string, number>> }> = [];
  let sample: { shape: Shape; before: string; after: string } | null = null;

  for (const row of rows) {
    const scores = row.scores as Record<string, unknown> | null;
    if (!scores || typeof scores !== "object") continue;

    // A KAPU: `answers` tömb = seedelt sor. Valódi kitöltésben nincs ilyen kulcs.
    if (!Array.isArray(scores.answers)) {
      realFills++;
      continue;
    }

    // Kanonikus olvasó: az örökség-kulcsos (INTE/RESO/…) sorok is átjönnek.
    const dims = extractDimensionScores(scores);
    if (!dims || Object.keys(dims).length === 0) {
      unreadableDims++;
      continue;
    }

    const facets = scores.facets as Record<string, Record<string, number>> | undefined;
    const shape = classify(dims as Record<string, number>, facets);
    byShape.set(shape, (byShape.get(shape) ?? 0) + 1);
    if (shape === "már az új minta") continue;

    const fresh = buildFacets(dims as Record<string, number>);
    targets.push({ id: row.id, facets: fresh });

    if (!sample) {
      const dim = Object.keys(fresh)[0];
      sample = {
        shape,
        before: facets?.[dim] ? JSON.stringify(facets[dim]) : "(nincs)",
        after: JSON.stringify(fresh[dim]),
      };
    }
  }

  console.log(`\nEredmény-sorok összesen: ${rows.length}`);
  console.log(`  · valódi kitöltés (nincs answers kulcs) — ÉRINTETLEN: ${realFills}`);
  if (unreadableDims > 0) {
    console.log(`  · seedelt, de olvashatatlan dimenziók (kimarad):      ${unreadableDims}`);
  }
  console.log("  · seedelt sorok facet-alakja:");
  for (const [shape, count] of [...byShape.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`      ${shape.padEnd(32)} ${count}`);
  }
  console.log(`\n  ÚJRASZÁMOLANDÓ: ${targets.length}`);

  if (sample) {
    console.log(`\n  Példa (${sample.shape}) — egy dimenzió facetjei:`);
    console.log(`    előtte: ${sample.before}`);
    console.log(`    utána:  ${sample.after}`);
  }

  if (targets.length === 0) {
    console.log("\nNincs mit tenni.");
    await prisma.$disconnect();
    return;
  }

  if (!apply) {
    console.log("\n🔍 SZÁRAZ FUTÁS — nem írtam semmit.");
    console.log("   Íráshoz: pnpm seed:facets:refresh -- --apply\n");
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
