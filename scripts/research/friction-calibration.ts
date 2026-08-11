/**
 * Súrlódás-kalibráció MÉRT trust-adattal — a motor-audit P1 „súrlódás v2:
 * 12/22 kalibráció" tételéhez (docs/audits/motor-audit-2026-08-10.md).
 *
 *   npx tsx scripts/research/friction-calibration.ts [--mutual-only] [--json <fájl>]
 *
 * Páronként összeveti a MÉRT trust-élt (TrustObservation →
 * computeTrustNetwork; körönként a legfrissebb megfigyelés nyer — a
 * buildTeamTrustNetwork dedupe-mintája) a profil-alapú súrlódás-BECSLÉSSEL
 * (calculatePairFriction), ha mindkét tagnak teljes 6-dimenziós
 * self-profilja van. Kimenet:
 *  1) trust-sávonkénti friction-eloszlás (n, átlag, medián, kvartilisek);
 *  2) konkordancia a jelenlegi vágással (a határokat a kódból deriválja,
 *     nem literálból) — elvárt megfelelés: erős↔aligned ·
 *     közepes↔complementary · gyenge↔friction; a szétkapcsolt él a
 *     runtime-modellel összhangban (trustToDynamicsEdge → null) kimarad;
 *  3) javasolt új vágáspontok: a szomszédos sáv-mediánok felezőpontjai.
 *
 * n < 30 párnál a javaslat csak jelzésértékű — a riport ezt kiírja.
 * Üres DB-nél / adat nélkül értelmes üzenettel, hibátlanul lép ki.
 */
import fs from "node:fs";
import path from "node:path";
import { fmt, mean, median, pct, percentile, roundTo } from "./stats";

// ── env betöltés (seed-scriptek mintája): shell-env nyer, utána .env.local,
// majd .env — a Prisma kliens csak az első lekérdezésnél kapcsolódik, így a
// hoisted importok után beállított DATABASE_URL is időben érkezik.
function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      const content = fs.readFileSync(path.resolve(process.cwd(), file), "utf-8");
      for (const line of content.split("\n")) {
        const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
        if (!match) continue;
        const [, key, raw] = match;
        if (!process.env[key]) process.env[key] = raw.replace(/^['"]|['"]$/g, "").trim();
      }
    } catch {
      /* nincs ilyen fájl — a következő jön */
    }
  }
}
loadEnv();

import { prisma } from "../../src/lib/prisma";
import {
  calculatePairFriction,
  frictionToEdgeType,
  type DynamicsEdgeType,
} from "../../src/lib/friction-model";
import {
  computeTrustNetwork,
  isValidTrustAnswerSet,
  trustEdgeType,
  type TrustAnswerSet,
  type TrustEdgeType,
} from "../../src/lib/trust-network";
import { extractDimensionScores } from "../../src/lib/scoring";
import { HEXACO_ORDER } from "../../src/lib/hexaco";

// Elvárt trust↔friction megfelelés (a kalibráció hipotézise): magas mért
// bizalom ↔ alacsony becsült súrlódás. A `disconnected` él SZÁNDÉKOSAN
// nincs a hipotézisben: a runtime-modell szerint (trustToDynamicsEdge →
// null) a kapcsolat hiánya nem súrlódás-jel — a konkordancia és a
// vágás-javaslat ezért kihagyja; a leíró eloszlás-táblában viszont marad,
// mert ott informatív.
const EXPECTED_BY_TRUST: Record<
  Exclude<TrustEdgeType, "disconnected">,
  DynamicsEdgeType
> = {
  strong_trust: "aligned",
  moderate: "complementary",
  weak_trust: "friction",
};

const TRUST_BAND_ORDER: TrustEdgeType[] = [
  "strong_trust",
  "moderate",
  "weak_trust",
  "disconnected",
];

const FRICTION_LABEL_ORDER: DynamicsEdgeType[] = [
  "aligned",
  "complementary",
  "friction",
];

/**
 * A jelenlegi friction-vágáspontok a frictionToEdgeType-ból DERIVÁLVA
 * (0–100 szken) — egy későbbi átkalibrálás után is a kódban élő határokat
 * mutatja, literál-másolat nélkül. c1: az első nem-aligned, c2: az első
 * friction pontszám.
 */
function currentFrictionCuts(): { c1: number; c2: number } {
  let c1 = -1;
  let c2 = -1;
  for (let f = 0; f <= 100; f += 1) {
    const type = frictionToEdgeType(f);
    if (c1 < 0 && type !== "aligned") c1 = f;
    if (c2 < 0 && type === "friction") {
      c2 = f;
      break;
    }
  }
  return { c1, c2 };
}

/** Trust-sávok alsó határai a trustEdgeType-ból derivált formában (címkékhez). */
function trustBandFloors(): Record<Exclude<TrustEdgeType, "disconnected">, number> {
  const floors = { weak_trust: -1, moderate: -1, strong_trust: -1 };
  for (let score = 0; score <= 100; score += 1) {
    const type = trustEdgeType(score);
    if (type !== "disconnected" && floors[type] < 0) floors[type] = score;
  }
  return floors;
}

function classifyWithCuts(friction: number, c1: number, c2: number): DynamicsEdgeType {
  if (friction < c1) return "aligned";
  if (friction < c2) return "complementary";
  return "friction";
}

function parseArgs(): { mutualOnly: boolean; jsonPath: string | null } {
  const argv = process.argv.slice(2);
  let mutualOnly = false;
  let jsonPath: string | null = null;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--mutual-only") {
      mutualOnly = true;
    } else if (arg === "--json") {
      jsonPath = argv[i + 1] ?? null;
      i += 1;
    } else {
      console.error(`Ismeretlen argumentum: ${arg}`);
      console.error(
        "Használat: npx tsx scripts/research/friction-calibration.ts [--mutual-only] [--json <fájl>]",
      );
      process.exit(2);
    }
  }
  return { mutualOnly, jsonPath };
}

interface PairRecord {
  trustScore: number;
  trustType: TrustEdgeType;
  friction: number;
  mutual: boolean;
}

interface BandStats {
  band: TrustEdgeType;
  n: number;
  mean: number;
  median: number;
  p25: number;
  p75: number;
}

async function main() {
  const { mutualOnly, jsonPath } = parseArgs();

  if (!process.env.DATABASE_URL) {
    console.error("Nincs DATABASE_URL — exportáld a shellben, vagy tedd a .env(.local)-ba.");
    process.exit(1);
  }

  // ── 1. mért trust-élek ────────────────────────────────────────────────
  const observations = await prisma.trustObservation.findMany({
    orderBy: { updatedAt: "asc" },
    select: { teamId: true, aboutUserId: true, raterUserId: true, answers: true },
  });

  console.log("── SÚRLÓDÁS-KALIBRÁCIÓ mért trust-adattal ──────────────────────");

  if (observations.length === 0) {
    console.log("Még nincs mért trust-adat (TrustObservation üres).");
    console.log("A kalibráció az első TRUST_360 kör beérkezése után futtatható.");
    await prisma.$disconnect();
    return;
  }

  const invalidCount = observations.filter(
    (o) => !isValidTrustAnswerSet(o.answers),
  ).length;

  // Csapatonként (rater → értékelt) a legfrissebb válasz nyer — az asc
  // rendezés + Map felülírás pontosan a buildTeamTrustNetwork dedupe-ja.
  type LatestObservation = {
    aboutUserId: string;
    raterUserId: string;
    answers: TrustAnswerSet;
  };
  const byTeam = new Map<string, Map<string, LatestObservation>>();
  for (const obs of observations) {
    let teamMap = byTeam.get(obs.teamId);
    if (!teamMap) {
      teamMap = new Map<string, LatestObservation>();
      byTeam.set(obs.teamId, teamMap);
    }
    teamMap.set(`${obs.raterUserId}→${obs.aboutUserId}`, {
      aboutUserId: obs.aboutUserId,
      raterUserId: obs.raterUserId,
      answers: obs.answers as TrustAnswerSet,
    });
  }

  // Pár-élek csapatonként a lib-logikával, majd user-pár szinten összevonva:
  // ha ugyanaz a pár több csapatban is mért (ritka), a csapat-élek átlaga —
  // az irány-átlagolás filozófiájának folytatása.
  interface MergedPair {
    a: string;
    b: string;
    scores: number[];
    mutualAny: boolean;
    teamCount: number;
  }
  const mergedPairs = new Map<string, MergedPair>();
  let dedupedDirected = 0;
  for (const teamMap of byTeam.values()) {
    dedupedDirected += teamMap.size;
    const network = computeTrustNetwork([...teamMap.values()]);
    for (const edge of network.edges) {
      const key = `${edge.a}|${edge.b}`;
      const entry: MergedPair =
        mergedPairs.get(key) ??
        { a: edge.a, b: edge.b, scores: [], mutualAny: false, teamCount: 0 };
      entry.scores.push(edge.score);
      entry.mutualAny = entry.mutualAny || edge.mutual;
      entry.teamCount += 1;
      mergedPairs.set(key, entry);
    }
  }
  const crossTeamPairs = [...mergedPairs.values()].filter((p) => p.teamCount > 1).length;

  console.log(
    `trust-megfigyelés: ${observations.length} sor (${byTeam.size} csapat) · ` +
      `érvénytelen válaszkészlet: ${invalidCount} · körök dedupe után: ${dedupedDirected} irányított`,
  );
  console.log(
    `mért pár-él (irányok átlaga): ${mergedPairs.size} · több csapatban mért pár: ${crossTeamPairs}`,
  );

  // ── 2. teljes self-profilok ───────────────────────────────────────────
  // Userenként a legutolsó self-eredmény (a team-stats betöltő mintája);
  // törölt profil kimarad (GDPR-szándék tisztelete offline elemzésben is).
  const userIds = [...new Set([...mergedPairs.values()].flatMap((p) => [p.a, p.b]))];
  const results = await prisma.assessmentResult.findMany({
    where: {
      isSelfAssessment: true,
      userProfileId: { in: userIds },
      userProfile: { deleted: false },
    },
    orderBy: { createdAt: "desc" },
    select: { userProfileId: true, scores: true },
  });

  const profileByUser = new Map<string, Record<string, number>>();
  const seen = new Set<string>();
  for (const row of results) {
    if (!row.userProfileId || seen.has(row.userProfileId)) continue;
    seen.add(row.userProfileId);
    const dims = extractDimensionScores(row.scores);
    if (!dims || !HEXACO_ORDER.every((c) => typeof dims[c] === "number")) continue;
    profileByUser.set(row.userProfileId, dims);
  }

  // ── 3. pár-rekordok: mért trust × becsült friction ────────────────────
  let skippedNoProfile = 0;
  let skippedOneSided = 0;
  const records: PairRecord[] = [];
  for (const pair of mergedPairs.values()) {
    const profileA = profileByUser.get(pair.a);
    const profileB = profileByUser.get(pair.b);
    if (!profileA || !profileB) {
      skippedNoProfile += 1;
      continue;
    }
    if (mutualOnly && !pair.mutualAny) {
      skippedOneSided += 1;
      continue;
    }
    const friction = calculatePairFriction(profileA, profileB);
    if (friction === null) continue; // teljes profiloknál nem fordulhat elő
    const trustScore = Math.round(mean(pair.scores));
    records.push({
      trustScore,
      trustType: trustEdgeType(trustScore),
      friction,
      mutual: pair.mutualAny,
    });
  }

  const mutualCount = records.filter((r) => r.mutual).length;
  console.log(
    `teljes self-profil nélkül kihagyva: ${skippedNoProfile} pár` +
      (mutualOnly ? ` · egyoldalú él kihagyva: ${skippedOneSided}` : ""),
  );
  console.log(
    `elemzett pár: ${records.length} (mutual: ${mutualCount} · egyoldalú: ${records.length - mutualCount})` +
      (mutualOnly ? " — csak mutual élek (--mutual-only)" : ""),
  );

  if (records.length === 0) {
    console.log(
      "\nNincs olyan mért pár, ahol mindkét tagnak teljes self-profilja volna —",
    );
    console.log("a kalibráció önkitöltések ÉS trust-kör együttes megléte után fut.");
    await prisma.$disconnect();
    return;
  }
  if (records.length < 30) {
    console.log(
      `FIGYELEM: n = ${records.length} pár < 30 — kalibrációhoz kevés, minden lenti szám csak jelzésértékű.`,
    );
  }

  // ── 4. friction-eloszlás trust-sávonként ──────────────────────────────
  const floors = trustBandFloors();
  const bandLabels: Record<TrustEdgeType, string> = {
    strong_trust: `erős (≥${floors.strong_trust})`,
    moderate: `közepes (${floors.moderate}–${floors.strong_trust - 1})`,
    weak_trust: `gyenge (${floors.weak_trust}–${floors.moderate - 1})`,
    disconnected: `szétkapcsolt (<${floors.weak_trust})`,
  };
  const labelWidth = Math.max(...Object.values(bandLabels).map((l) => l.length)) + 2;

  const frictionsByBand = new Map<TrustEdgeType, number[]>(
    TRUST_BAND_ORDER.map((band) => [band, []]),
  );
  for (const record of records) {
    frictionsByBand.get(record.trustType)?.push(record.friction);
  }
  const bandStats: BandStats[] = TRUST_BAND_ORDER.map((band) => {
    const values = frictionsByBand.get(band) ?? [];
    return {
      band,
      n: values.length,
      mean: mean(values),
      median: median(values),
      p25: percentile(values, 25),
      p75: percentile(values, 75),
    };
  });

  console.log("\n── Friction-eloszlás trust-sávonként ──");
  console.log(
    `${"trust-sáv".padEnd(labelWidth)}${"n".padStart(5)}${"átlag".padStart(8)}` +
      `${"medián".padStart(8)}${"P25".padStart(7)}${"P75".padStart(7)}`,
  );
  for (const s of bandStats) {
    console.log(
      `${bandLabels[s.band].padEnd(labelWidth)}${String(s.n).padStart(5)}` +
        `${fmt(s.mean).padStart(8)}${fmt(s.median).padStart(8)}` +
        `${fmt(s.p25).padStart(7)}${fmt(s.p75).padStart(7)}`,
    );
  }

  // ── 5. konkordancia a jelenlegi vágással ──────────────────────────────
  // A szétkapcsolt párok kimaradnak: a runtime-modell (trustToDynamicsEdge)
  // a kapcsolat hiányát nem fordítja súrlódásra, így elvárt címkéjük sincs.
  const { c1, c2 } = currentFrictionCuts();
  const concordanceRecords = records.filter((r) => r.trustType !== "disconnected");
  const concordance = (cutA: number, cutB: number) =>
    concordanceRecords.filter(
      (r) =>
        classifyWithCuts(r.friction, cutA, cutB) ===
        EXPECTED_BY_TRUST[r.trustType as Exclude<TrustEdgeType, "disconnected">],
    ).length;

  const currentMatches = concordance(c1, c2);
  console.log(
    `\n── Konkordancia a jelenlegi vágással (aligned <${c1} · complementary <${c2}) ──`,
  );
  console.log(
    "elvárt megfelelés: erős↔aligned · közepes↔complementary · gyenge↔friction " +
      "(szétkapcsolt: kizárva — a runtime-modellben nem súrlódás-jel)",
  );
  console.log(
    `egyezés: ${currentMatches}/${concordanceRecords.length} ` +
      `(${pct(currentMatches, concordanceRecords.length)})`,
  );

  console.log("\nkonfúziós mátrix (sor: mért trust-sáv · oszlop: friction-címke):");
  console.log(
    `${"".padEnd(labelWidth)}${FRICTION_LABEL_ORDER.map((l) => l.padStart(15)).join("")}`,
  );
  const matrix: Record<TrustEdgeType, Record<DynamicsEdgeType, number>> = {
    strong_trust: { aligned: 0, complementary: 0, friction: 0 },
    moderate: { aligned: 0, complementary: 0, friction: 0 },
    weak_trust: { aligned: 0, complementary: 0, friction: 0 },
    disconnected: { aligned: 0, complementary: 0, friction: 0 },
  };
  for (const record of records) {
    matrix[record.trustType][frictionToEdgeType(record.friction)] += 1;
  }
  for (const band of TRUST_BAND_ORDER) {
    console.log(
      `${bandLabels[band].padEnd(labelWidth)}` +
        FRICTION_LABEL_ORDER.map((l) => String(matrix[band][l]).padStart(15)).join(""),
    );
  }

  // ── 6. javasolt vágáspontok ───────────────────────────────────────────
  // A konkordancia-csoportosítás szerinti három sáv mediánjai; a javasolt
  // vágás a szomszédos mediánok felezőpontja.
  // A szétkapcsolt sáv itt is kimarad (ld. EXPECTED_BY_TRUST) — a vágást a
  // három, súrlódás-hipotézissel bíró bizalmi szint mediánjai határozzák meg.
  const strongFrictions = frictionsByBand.get("strong_trust") ?? [];
  const moderateFrictions = frictionsByBand.get("moderate") ?? [];
  const lowTrustFrictions = frictionsByBand.get("weak_trust") ?? [];

  console.log("\n── Javasolt vágáspontok (szomszédos sáv-mediánok felezőpontjai) ──");
  let suggestion: { c1: number; c2: number; matches: number } | null = null;
  const medianGroups: Array<{ name: string; values: number[] }> = [
    { name: "erős", values: strongFrictions },
    { name: "közepes", values: moderateFrictions },
    { name: "gyenge", values: lowTrustFrictions },
  ];
  const emptyGroups = medianGroups.filter((g) => g.values.length === 0).map((g) => g.name);

  if (emptyGroups.length > 0) {
    console.log(
      `nem számítható: üres trust-csoport(ok): ${emptyGroups.join(", ")} — ` +
        "több mért pár kell mindhárom bizalmi szinten.",
    );
  } else {
    const mStrong = median(strongFrictions);
    const mModerate = median(moderateFrictions);
    const mLow = median(lowTrustFrictions);
    console.log(
      `sáv-mediánok: erős ${fmt(mStrong)} · közepes ${fmt(mModerate)} · ` +
        `gyenge ${fmt(mLow)}`,
    );
    if (!(mStrong < mModerate && mModerate < mLow)) {
      console.log(
        "FIGYELEM: a mediánok nem monoton nőnek a bizalom csökkenésével — az adat",
      );
      console.log(
        "nem támasztja alá a modell irányát ezen a mintán; a javaslat megbízhatatlan.",
      );
    }
    const rawC1 = (mStrong + mModerate) / 2;
    const rawC2 = (mModerate + mLow) / 2;
    const intC1 = Math.round(rawC1);
    const intC2 = Math.round(rawC2);
    const suggestedMatches = concordance(intC1, intC2);
    suggestion = { c1: intC1, c2: intC2, matches: suggestedMatches };
    console.log(
      `javaslat: aligned < ${fmt(rawC1)} · complementary < ${fmt(rawC2)}` +
        `  (egészre kerekítve: ${intC1} / ${intC2} — jelenlegi: ${c1} / ${c2})`,
    );
    console.log(
      `konkordancia a javasolt (egész) vágással: ${suggestedMatches}/${concordanceRecords.length} ` +
        `(${pct(suggestedMatches, concordanceRecords.length)})`,
    );
    console.log(
      "élesítés: friction-model.ts frictionToEdgeType + tests/unit/team/friction-model.test.ts",
    );
  }

  if (jsonPath) {
    // Csak aggregátumok — user-azonosító nem kerül az exportba.
    const report = {
      generatedAt: new Date().toISOString(),
      filter: { mutualOnly },
      counts: {
        observations: observations.length,
        invalidAnswerSets: invalidCount,
        teams: byTeam.size,
        dedupedDirected,
        measuredPairs: mergedPairs.size,
        crossTeamPairs,
        skippedNoProfile,
        skippedOneSided,
        analyzedPairs: records.length,
        mutualPairs: mutualCount,
      },
      bands: bandStats.map((s) => ({
        band: s.band,
        n: s.n,
        mean: roundTo(s.mean, 2),
        median: roundTo(s.median, 2),
        p25: roundTo(s.p25, 2),
        p75: roundTo(s.p75, 2),
      })),
      concordance: {
        // A ráta nevezője a szétkapcsolt párok NÉLKÜLI halmaz (a runtime-
        // modellben a disconnected élnek nincs elvárt friction-címkéje).
        scoredPairs: concordanceRecords.length,
        current: {
          cuts: [c1, c2],
          matches: currentMatches,
          rate: roundTo(currentMatches / concordanceRecords.length, 3),
          matrix,
        },
        suggested: suggestion
          ? {
              cuts: [suggestion.c1, suggestion.c2],
              matches: suggestion.matches,
              rate: roundTo(suggestion.matches / concordanceRecords.length, 3),
            }
          : null,
      },
      lowSample: records.length < 30,
    };
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
