/**
 * Pilot-norma számítás a TÁROLT self-eredményekből — a motor-audit P1
 * „norma-percentilis" tételéhez (docs/audits/motor-audit-2026-08-10.md).
 *
 *   npx tsx scripts/research/norms-from-results.ts [--form=short|full]
 *     [--campaign <id> ...] [--source <kohorsz-leírás>] [--json <fájl>]
 *
 * Userenként a LEGUTOLSÓ self-eredmény számít (a team-stats betöltő
 * mintája: isSelfAssessment + createdAt desc), és csak a teljes,
 * 6-dimenziós profilok. Kimenet:
 *  1) dimenziónkénti leíró statisztika stdout-ra: n, átlag, szórás,
 *     kvartilisek, decilisek + sáv-kihasználtság a 40/70-es
 *     (dimension-utils getDimensionTier) és a 35/65-ös (profile-engine
 *     pólus-küszöbök) vágásokra;
 *  2) csak megfelelően scope-olt, legalább 200 fős short-form pilotkohorsznál
 *     a src/lib/norms.ts ACTIVE_NORM_TABLE-jébe kézzel beilleszthető blokk.
 *
 * A mintaméret MINDIG kiírva — kevés vagy scope nélküli adatnál a számok
 * jelzésértékűek, nem normák. Üres DB-nél értelmesen, hibátlanul lép ki.
 */
import fs from "node:fs";
import path from "node:path";
import { fmt, mean, pct, percentile, roundTo, sampleSd } from "./stats";

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

import { TestType } from "@prisma/client";
import { prisma } from "../../src/lib/prisma";
import {
  extractDimensionScores,
  SCORING_FULL_FORM_MIN_ITEMS,
} from "../../src/lib/scoring";
import type { AssessmentForm } from "../../src/lib/questions/types";
import type { DimNorm, NormTable } from "../../src/lib/norms";
import {
  HEXACO_DIMENSIONS,
  HEXACO_ORDER,
  type HexacoCode,
} from "../../src/lib/hexaco";
import { getDimensionTier } from "../../src/lib/dimension-utils";
import {
  PROFILE_HIGH_THRESHOLD,
  PROFILE_LOW_THRESHOLD,
} from "../../src/lib/profile-engine";
import {
  PILOT_NORM_MIN_N,
  pilotNormActivationBlockers,
} from "./norm-activation";

/**
 * Forma a tárolt score-JSON-ból: a kanonikus a scoring-motor `form`
 * pecsétje; a pecsét előtti örökség-sorokra a questionCount-heurisztika
 * (≥100 item = full), minden más short — a career/person.ts (nem exportált)
 * formFromScores tükörképe.
 */
function resolveForm(scores: unknown): AssessmentForm {
  const record = scores as { form?: unknown; questionCount?: unknown } | null;
  if (record?.form === "full" || record?.form === "short") return record.form;
  const count = record?.questionCount;
  return typeof count === "number" && count >= SCORING_FULL_FORM_MIN_ITEMS
    ? "full"
    : "short";
}

/** 35/65-ös pólus-sáv — a profile-engine categorize (szigorú >/<) tükre. */
function poleBand(score: number): "low" | "mid" | "high" {
  if (score > PROFILE_HIGH_THRESHOLD) return "high";
  if (score < PROFILE_LOW_THRESHOLD) return "low";
  return "mid";
}

interface NormArgs {
  form: AssessmentForm | null;
  jsonPath: string | null;
  campaignIds: string[];
  sourceLabel: string | null;
}

function parseArgs(): NormArgs {
  const argv = process.argv.slice(2);
  let form: AssessmentForm | null = null;
  let jsonPath: string | null = null;
  const campaignIds: string[] = [];
  let sourceLabel: string | null = null;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--json") {
      jsonPath = argv[i + 1] ?? null;
      i += 1;
    } else if (arg.startsWith("--form")) {
      const value = arg.includes("=") ? arg.split("=")[1] : argv[++i];
      if (value !== "short" && value !== "full") {
        console.error(`Érvénytelen --form érték: "${value ?? ""}" (short vagy full).`);
        process.exit(2);
      }
      form = value;
    } else if (arg === "--campaign" || arg === "--campaign-id") {
      const value = argv[i + 1]?.trim();
      if (!value) {
        console.error(`${arg} után kampányazonosító szükséges.`);
        process.exit(2);
      }
      campaignIds.push(value);
      i += 1;
    } else if (arg === "--source") {
      const value = argv[i + 1]?.trim();
      if (!value) {
        console.error("--source után a kohorsz rövid leírása szükséges.");
        process.exit(2);
      }
      sourceLabel = value;
      i += 1;
    } else {
      console.error(`Ismeretlen argumentum: ${arg}`);
      console.error(
        "Használat: npx tsx scripts/research/norms-from-results.ts " +
          "[--form=short|full] [--campaign <id> ...] " +
          "[--source <kohorsz-leírás>] [--json <fájl>]",
      );
      process.exit(2);
    }
  }
  return {
    form,
    jsonPath,
    campaignIds: [...new Set(campaignIds)],
    sourceLabel,
  };
}

const DECILE_PS = [10, 20, 30, 40, 50, 60, 70, 80, 90] as const;

interface DimStats {
  code: string;
  label: string;
  mean: number;
  sd: number;
  quartiles: { p25: number; p50: number; p75: number };
  deciles: number[];
  bands4070: { low: number; mid: number; high: number };
  bands3565: { low: number; mid: number; high: number };
}

function dimLabel(code: (typeof HEXACO_ORDER)[number]): string {
  const dim = HEXACO_DIMENSIONS[code];
  return `${dim.letter} ${dim.hu} (${code})`;
}

async function main() {
  const {
    form: formFilter,
    jsonPath,
    campaignIds,
    sourceLabel,
  } = parseArgs();

  if (!process.env.DATABASE_URL) {
    console.error("Nincs DATABASE_URL — exportáld a shellben, vagy tedd a .env(.local)-ba.");
    process.exit(1);
  }

  // Minden self-eredmény regisztrált, nem törölt userhez kötve; a desc
  // rendezés + first-wins adja userenként a legutolsót. (A vendég-sorok —
  // userProfileId nélkül — kimaradnak: ismeretlen populáció, duplikálódhat.)
  const rows = await prisma.assessmentResult.findMany({
    where: {
      isSelfAssessment: true,
      testType: TestType.TRITAN,
      userProfileId: { not: null },
      userProfile: { deleted: false },
      ...(campaignIds.length > 0 ? { campaignId: { in: campaignIds } } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: { userProfileId: true, scores: true },
  });

  const latestByUser = new Map<string, unknown>();
  for (const row of rows) {
    if (!row.userProfileId || latestByUser.has(row.userProfileId)) continue;
    latestByUser.set(row.userProfileId, row.scores);
  }

  // Szűrés: form-pecsét, majd teljesség (mind a 6 dimenzió szám).
  const valuesByDim = new Map<string, number[]>(HEXACO_ORDER.map((c) => [c, []]));
  const bankTally = new Map<string, number>();
  let skippedForm = 0;
  let skippedIncomplete = 0;

  for (const scores of latestByUser.values()) {
    if (formFilter && resolveForm(scores) !== formFilter) {
      skippedForm += 1;
      continue;
    }
    const dims = extractDimensionScores(scores);
    if (!dims || !HEXACO_ORDER.every((c) => typeof dims[c] === "number")) {
      skippedIncomplete += 1;
      continue;
    }
    const bank = (scores as { bankVersion?: unknown } | null)?.bankVersion;
    const bankKey = typeof bank === "string" ? bank : "(pecsét nélkül)";
    bankTally.set(bankKey, (bankTally.get(bankKey) ?? 0) + 1);
    for (const code of HEXACO_ORDER) {
      valuesByDim.get(code)?.push(dims[code]);
    }
  }

  const n = valuesByDim.get(HEXACO_ORDER[0])?.length ?? 0;

  console.log("── PILOT-NORMÁK a tárolt self-eredményekből ────────────────────");
  console.log(
    `szűrő: testType=TRITAN · törölt profil kizárva · form=${formFilter ?? "mind"}` +
      ` · kampány=${campaignIds.length > 0 ? `${campaignIds.length} kijelölt kör` : "NINCS SCOPE"}`,
  );
  console.log(
    `userenként legutolsó self-eredmény: ${latestByUser.size} · ` +
      `form-szűrőn kívül: ${skippedForm} · hiányos profil: ${skippedIncomplete}`,
  );
  if (bankTally.size > 0) {
    const bankLine = [...bankTally.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => `${key}: ${count}`)
      .join(" · ");
    console.log(`bank-pecsét eloszlás: ${bankLine}`);
  }
  console.log(`\nn = ${n} teljes 6-dimenziós profil`);

  if (n === 0) {
    console.log(
      "\nNincs értékelhető self-eredmény — a norma-tábla az első pilot-kitöltések",
    );
    console.log("beérkezése után számítható. (Üres DB-n ez a várt kimenet.)");
    await prisma.$disconnect();
    return;
  }
  if (n < PILOT_NORM_MIN_N) {
    console.log(
      `FIGYELEM: n < ${PILOT_NORM_MIN_N} — leíró kalibrációra használható, ` +
        "de aktív magyar pilot-normaként nem élesíthető.",
    );
  }

  // ── dimenziónkénti statisztika ──────────────────────────────────────────
  const stats: DimStats[] = HEXACO_ORDER.map((code) => {
    const values = valuesByDim.get(code) ?? [];
    const bands4070 = { low: 0, mid: 0, high: 0 };
    const bands3565 = { low: 0, mid: 0, high: 0 };
    for (const v of values) {
      bands4070[getDimensionTier(v)] += 1;
      bands3565[poleBand(v)] += 1;
    }
    return {
      code,
      label: dimLabel(code),
      mean: mean(values),
      sd: sampleSd(values),
      quartiles: {
        p25: percentile(values, 25),
        p50: percentile(values, 50),
        p75: percentile(values, 75),
      },
      deciles: DECILE_PS.map((p) => percentile(values, p)),
      bands4070,
      bands3565,
    };
  });

  const labelWidth = Math.max(...stats.map((s) => s.label.length)) + 2;

  console.log("\n── Leíró statisztika (0–100 POMP skála) ──");
  console.log(
    `${"dim".padEnd(labelWidth)}${"átlag".padStart(7)}${"szórás".padStart(8)}` +
      `${"P25".padStart(7)}${"P50".padStart(7)}${"P75".padStart(7)}`,
  );
  for (const s of stats) {
    console.log(
      `${s.label.padEnd(labelWidth)}${fmt(s.mean).padStart(7)}${fmt(s.sd).padStart(8)}` +
        `${fmt(s.quartiles.p25).padStart(7)}${fmt(s.quartiles.p50).padStart(7)}` +
        `${fmt(s.quartiles.p75).padStart(7)}`,
    );
  }

  console.log("\n── Decilisek ──");
  console.log(
    `${"dim".padEnd(labelWidth)}${DECILE_PS.map((p) => `D${p / 10}`.padStart(7)).join("")}`,
  );
  for (const s of stats) {
    console.log(
      `${s.label.padEnd(labelWidth)}${s.deciles.map((d) => fmt(d).padStart(7)).join("")}`,
    );
  }

  // ── sáv-kihasználtság a két élő vágásrendszerre ─────────────────────────
  // 40/70: getDimensionTier (low <40 · mid 40–69 · high ≥70).
  // 35/65: profile-engine pólusok (low <35 · mid 35–65 · high >65).
  console.log("\n── Sáv-kihasználtság ──");
  console.log(
    `${"dim".padEnd(labelWidth)}${"40/70 (dimension-utils)".padStart(28)}` +
      `${"35/65 (profil-pólus)".padStart(28)}`,
  );
  console.log(
    `${"".padEnd(labelWidth)}${"low".padStart(10)}${"mid".padStart(9)}${"high".padStart(9)}` +
      `${"low".padStart(10)}${"mid".padStart(9)}${"high".padStart(9)}`,
  );
  for (const s of stats) {
    console.log(
      `${s.label.padEnd(labelWidth)}` +
        `${pct(s.bands4070.low, n).padStart(10)}${pct(s.bands4070.mid, n).padStart(9)}` +
        `${pct(s.bands4070.high, n).padStart(9)}` +
        `${pct(s.bands3565.low, n).padStart(10)}${pct(s.bands3565.mid, n).padStart(9)}` +
        `${pct(s.bands3565.high, n).padStart(9)}`,
    );
  }

  // ── norms.ts-be illeszthető blokk ───────────────────────────────────────
  // A NormTable-annotáció miatt a tsc garantálja, hogy a kinyomtatott blokk
  // a src/lib/norms.ts ACTIVE_NORM_TABLE kontraktusára illik (version,
  // source, n, dims{mean,sd}); a beemelés kézzel történik (README).
  // A dims-cast biztonságos: a stats a HEXACO_ORDER-t 1:1 fedi le.
  const normTableCandidate: NormTable = {
    version: `pilot-${new Date().toISOString().slice(0, 10)}`,
    source:
      sourceLabel ??
      `scope nélküli self-eredmények (TSFI${formFilter ? `, form=${formFilter}` : ""})`,
    n,
    dims: Object.fromEntries(
      stats.map((s) => [s.code, { mean: roundTo(s.mean, 2), sd: roundTo(s.sd, 2) }]),
    ) as Record<HexacoCode, DimNorm>,
  };
  const invalidSd = stats.filter((s) => !Number.isFinite(s.sd) || s.sd <= 0);
  const activationBlockers = pilotNormActivationBlockers({
    campaignCount: campaignIds.length,
    form: formFilter,
    sourceLabel,
    n,
    invalidSdCodes: invalidSd.map((s) => s.code),
  });
  const normTable = activationBlockers.length === 0 ? normTableCandidate : null;

  if (normTable) {
    console.log("\n── src/lib/norms.ts — review után beilleszthető PILOT-NORMA ──");
    console.log(JSON.stringify(normTable, null, 2));
  } else {
    console.log("\n── NORMA NEM ÉLESÍTHETŐ ──");
    for (const blocker of activationBlockers) console.log(`- ${blocker}`);
    console.log(
      "A leíró statisztika kalibrációs input marad; ACTIVE_NORM_TABLE blokkot " +
        "a script fail-closed nem bocsát ki.",
    );
  }

  if (jsonPath) {
    const report = {
      generatedAt: new Date().toISOString(),
      filter: {
        form: formFilter,
        testType: "TRITAN",
        campaignIds,
        source: sourceLabel,
      },
      counts: {
        usersWithSelfResult: latestByUser.size,
        skippedForm,
        skippedIncomplete,
        n,
      },
      bankVersions: Object.fromEntries(bankTally),
      dimensions: stats.map((s) => ({
        code: s.code,
        mean: roundTo(s.mean, 2),
        sd: roundTo(s.sd, 2),
        quartiles: {
          p25: roundTo(s.quartiles.p25, 2),
          p50: roundTo(s.quartiles.p50, 2),
          p75: roundTo(s.quartiles.p75, 2),
        },
        deciles: s.deciles.map((d) => roundTo(d, 2)),
        bands4070: s.bands4070,
        bands3565: s.bands3565,
      })),
      normTable,
      normTableCandidate,
      activationBlockers,
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
