/**
 * F3 — validációs riport a VALÓS adatokból.
 *
 *   npx tsx scripts/career-validation/report.ts [--json <fájl>]
 *
 * Két elemzés:
 *  1) KNOWN-GROUPS: akik megadták a jelenlegi foglalkozásukat, azoknál a saját
 *     szerep percentilise a saját rangsorukban. Véletlen esetén ez 50 körül van;
 *     ha a motor mér valamit, szisztematikusan magasabb.
 *  2) KALIBRÁCIÓ: a „találó volt?" visszajelzések foglalkozásonként, Wilson-féle
 *     alsó korláttal — a véletlen alatti szerepek felülvizsgálandók.
 *
 * A riport a mintaméretet MINDIG kiírja: kevés adatnál a számok jelzésértékűek,
 * nem bizonyítékok.
 */
import fs from "node:fs";
import { Prisma } from "@prisma/client";
import { prisma } from "../../src/lib/prisma";
import { buildPersonInput } from "../../src/lib/career/person";
import { getOccupation } from "../../src/lib/career/catalog";
import {
  calibrateFeedback,
  runKnownGroups,
  type FeedbackRow,
  type KnownGroupCase,
} from "../../src/lib/career/calibration";

interface StoredBackground {
  currentOccupationId?: string | null;
  currentOccupationLabel?: string | null;
}

async function main() {
  const jsonFlagIndex = process.argv.indexOf("--json");
  const jsonPath = jsonFlagIndex >= 0 ? process.argv[jsonFlagIndex + 1] : null;

  // ── 1. known-groups ───────────────────────────────────────────────────────
  const profiles = await prisma.userProfile.findMany({
    where: { careerBackground: { not: Prisma.DbNull } },
    select: { id: true, careerBackground: true },
  });

  const cases: KnownGroupCase[] = [];
  let missingOccupation = 0;
  let missingAssessment = 0;
  for (const profile of profiles) {
    const background = profile.careerBackground as StoredBackground | null;
    const occupationId = background?.currentOccupationId ?? null;
    if (!occupationId) continue;
    if (!getOccupation(occupationId)) {
      missingOccupation += 1;
      continue;
    }
    const { person, hasSelfResult } = await buildPersonInput(profile.id);
    if (!hasSelfResult) {
      missingAssessment += 1;
      continue;
    }
    cases.push({ occupationId, person });
  }
  const knownGroups = runKnownGroups(cases);

  // ── 2. kalibráció ─────────────────────────────────────────────────────────
  const feedbackRows = await prisma.feedback.findMany({
    where: { kind: "role_fit" },
    select: { targetKey: true, rating: true, payload: true },
  });
  const rows: FeedbackRow[] = [];
  let legacyRows = 0;
  for (const row of feedbackRows) {
    const key = row.targetKey ?? "";
    if (!key || key.includes(":")) {
      legacyRows += 1;
      continue; // v1 kulcstér, nem összevethető
    }
    const verdict = (row.payload as { verdict?: string } | null)?.verdict;
    rows.push({
      occupationId: key,
      verdict: verdict === "accurate" ? "accurate" : "inaccurate",
      fitScore: row.rating ?? 0,
    });
  }
  const calibration = calibrateFeedback(rows);

  // ── riport ────────────────────────────────────────────────────────────────
  const report = {
    generatedAt: new Date().toISOString(),
    knownGroups: {
      ...knownGroups,
      profilesWithBackground: profiles.length,
      skippedUnknownOccupation: missingOccupation,
      skippedNoAssessment: missingAssessment,
    },
    calibration: {
      rows: rows.length,
      legacyRowsSkipped: legacyRows,
      occupations: calibration.length,
      belowChance: calibration.filter((entry) => entry.belowChance),
      top: calibration.slice(0, 20),
    },
  };

  console.log("── KNOWN-GROUPS ─────────────────────────────────────────");
  console.log(`megadott jelenlegi foglalkozás: ${knownGroups.n} fő`);
  if (knownGroups.n === 0) {
    console.log("  nincs elég adat — a validáció akkor indul, ha a felhasználók");
    console.log("  megadják a jelenlegi munkájukat a karrier-fülön");
  } else {
    console.log(`  saját szerep átlagos percentilise: ${knownGroups.meanPercentile} (véletlen: 50)`);
    console.log(`  medián: ${knownGroups.medianPercentile} · felső negyedbe került: ${Math.round(knownGroups.topQuartileShare * 100)}%`);
    console.log(`  t = ${knownGroups.t} · Cohen d = ${knownGroups.d}`);
    if (knownGroups.n < 30) console.log("  FIGYELEM: n < 30, a t-érték csak jelzés");
    for (const entry of knownGroups.perOccupation.slice(0, 10)) {
      const occupation = getOccupation(entry.occupationId);
      console.log(`   ${(occupation?.hu ?? entry.occupationId).padEnd(34)} n=${entry.n}  átlag=${entry.meanPercentile}`);
    }
  }

  console.log("\n── KALIBRÁCIÓ (role_fit visszajelzések) ─────────────────");
  console.log(`v2 sorok: ${rows.length} · kihagyott v1 sorok: ${legacyRows} · foglalkozás: ${calibration.length}`);
  for (const entry of calibration.slice(0, 15)) {
    const occupation = getOccupation(entry.occupationId);
    const flag = entry.belowChance ? "  ⚠ FELÜLVIZSGÁLANDÓ" : "";
    console.log(
      `   ${(occupation?.hu ?? entry.occupationId).padEnd(34)} ` +
        `n=${String(entry.total).padStart(3)}  találó=${Math.round(entry.hitRate * 100)}%  ` +
        `Wilson-alsó=${entry.wilsonLow.toFixed(2)}${flag}`,
    );
  }
  if (calibration.length === 0) console.log("   még nincs v2 visszajelzés");

  if (jsonPath) {
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    console.log(`\nJSON: ${jsonPath}`);
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
