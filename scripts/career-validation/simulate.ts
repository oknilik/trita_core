/**
 * Karrier-motor szimulációs benchmark — a `career-engine-plan.md` 2. fejezetének
 * metrikái, reprodukálhatóan, a MOSTANI (v2) motoron.
 *
 * Miért kell: a v1 motor számai (2026-07-30) egy eldobható inline szkriptből
 * származtak, ezért a v2 javításai után nem lehetett megmondani, hogy a
 * „nem differenciál" fődiagnózis megszűnt-e. Ez a szkript az a hiányzó
 * regressziós korlát, amit a terv F0 lépése előírt.
 *
 * FONTOS: ez SZIMULÁCIÓ, nem validáció. Szintetikus profilokon a motor
 * BELSŐ viselkedését méri (differenciál-e, a hibán belül rangsorol-e,
 * stabil-e zajra). Azt, hogy a rangsor a valóságban jó tanácsot ad-e, csak
 * pilot-adat mondja meg (ld. `calibration.ts`, known-groups).
 *
 * Futtatás:
 *   npx tsx scripts/career-validation/simulate.ts
 *   npx tsx scripts/career-validation/simulate.ts --n 2000 --json
 */

import {
  computeCareerFit,
  type EngineOptions,
} from "../../src/lib/career/engine";
import { getOccupations } from "../../src/lib/career/catalog";
import { estimateInterests } from "../../src/lib/career/interests";
import {
  DIM_CODES,
  RIASEC_LETTERS,
  type AxisKey,
  type DimCode,
  type OccupationFit,
  type PersonInput,
  type RiasecLetter,
} from "../../src/lib/career/types";
import { SCORE_SD } from "../../src/lib/psychometrics";

// ---------------------------------------------------------------------------
// Determinisztikus véletlen — ugyanaz a mag ugyanazt a jelentést adja, tehát a
// szám-változás mindig a MOTOR változása, nem a mintáé.
// ---------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box–Muller: standard normál a [0,1) egyenletesből. */
function gauss(rnd: () => number): number {
  const u = Math.max(rnd(), Number.EPSILON);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd());
}

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

// ---------------------------------------------------------------------------
// Leíró statisztika
// ---------------------------------------------------------------------------

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** Bessel-korrigált szórás (a repó `stats/dimension-stats.ts` konvenciója). */
function sd(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1));
}

function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function pearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;
  const mx = mean(xs.slice(0, n));
  const my = mean(ys.slice(0, n));
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i += 1) {
    num += (xs[i] - mx) * (ys[i] - my);
    dx += (xs[i] - mx) ** 2;
    dy += (ys[i] - my) ** 2;
  }
  return dx === 0 || dy === 0 ? 0 : num / Math.sqrt(dx * dy);
}

/** Rangokra váltott Pearson = Spearman (kötések átlagolt ranggal). */
function spearman(xs: number[], ys: number[]): number {
  const rank = (values: number[]) => {
    const idx = values.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0]);
    const ranks = new Array<number>(values.length);
    let i = 0;
    while (i < idx.length) {
      let j = i;
      while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j += 1;
      const avg = (i + j) / 2 + 1;
      for (let k = i; k <= j; k += 1) ranks[idx[k][1]] = avg;
      i = j + 1;
    }
    return ranks;
  };
  return pearson(rank(xs), rank(ys));
}

/** Normált Shannon-entrópia (0 = mindig ugyanaz a győztes, 1 = egyenletes). */
function normalizedEntropy(counts: number[]): number {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0 || counts.length < 2) return 0;
  let h = 0;
  for (const c of counts) {
    if (c <= 0) continue;
    const p = c / total;
    h -= p * Math.log(p);
  }
  return h / Math.log(counts.length);
}

// ---------------------------------------------------------------------------
// Profil-generálás
// ---------------------------------------------------------------------------

/**
 * Korrelálatlan, normál-szerű profil — a v1 alapvonal (2026-07-30) ugyanezzel a
 * feltevéssel készült, hogy a két szám összevethető legyen. A szórás a MÉRT
 * `SCORE_SD` (IPIP-referencia), nem kézi prior.
 */
function randomProfile(rnd: () => number): Record<DimCode, number> {
  const dims = {} as Record<DimCode, number>;
  for (const dim of DIM_CODES) dims[dim] = clamp(Math.round(50 + gauss(rnd) * SCORE_SD));
  return dims;
}

/** Mérési zaj rátétele egy „valódi" profilra (test-retest szimuláció). */
function observeProfile(
  truth: Record<DimCode, number>,
  se: number,
  rnd: () => number,
): Record<DimCode, number> {
  const dims = {} as Record<DimCode, number>;
  for (const dim of DIM_CODES) dims[dim] = clamp(Math.round(truth[dim] + gauss(rnd) * se));
  return dims;
}

const AXES: AxisKey[] = ["people", "variety", "autonomy", "creation"];

function randomPrefs(rnd: () => number): Partial<Record<AxisKey, -1 | 0 | 1>> {
  const prefs: Partial<Record<AxisKey, -1 | 0 | 1>> = {};
  for (const axis of AXES) {
    const roll = rnd();
    prefs[axis] = roll < 0.35 ? -1 : roll < 0.7 ? 1 : 0;
  }
  return prefs;
}

/** Differenciált MÉRT érdeklődés-vektor (kérdőív-kitöltést szimulál). */
function randomInterests(rnd: () => number): Partial<Record<RiasecLetter, number>> {
  const vector: Partial<Record<RiasecLetter, number>> = {};
  for (const letter of RIASEC_LETTERS) vector[letter] = clamp(Math.round(50 + gauss(rnd) * 18));
  return vector;
}

// ---------------------------------------------------------------------------
// Katalógus-szerkezet (személytől független)
// ---------------------------------------------------------------------------

interface CatalogStats {
  occupations: number;
  weightMass: Record<DimCode, number>;
  rolesUsingDim: Record<DimCode, number>;
  rolesMissingDim: Record<DimCode, number>;
  componentsPerRole: number;
  targetSpreadSd: Record<DimCode, number>;
}

function catalogStats(): CatalogStats {
  const occupations = getOccupations();
  const weightMass = {} as Record<DimCode, number>;
  const rolesUsingDim = {} as Record<DimCode, number>;
  const rolesMissingDim = {} as Record<DimCode, number>;
  const targets: Record<DimCode, number[]> = {} as Record<DimCode, number[]>;
  for (const dim of DIM_CODES) {
    weightMass[dim] = 0;
    rolesUsingDim[dim] = 0;
    targets[dim] = [];
  }
  let totalWeight = 0;
  let componentCount = 0;
  for (const occupation of occupations) {
    const seen = new Set<DimCode>();
    for (const component of occupation.demand) {
      weightMass[component.dim] += component.w;
      totalWeight += component.w;
      componentCount += 1;
      targets[component.dim].push(component.target);
      seen.add(component.dim);
    }
    for (const dim of seen) rolesUsingDim[dim] += 1;
  }
  const targetSpreadSd = {} as Record<DimCode, number>;
  for (const dim of DIM_CODES) {
    weightMass[dim] = weightMass[dim] / (totalWeight || 1);
    rolesMissingDim[dim] = occupations.length - rolesUsingDim[dim];
    targetSpreadSd[dim] = sd(targets[dim]);
  }
  return {
    occupations: occupations.length,
    weightMass,
    rolesUsingDim,
    rolesMissingDim,
    componentsPerRole: componentCount / (occupations.length || 1),
    targetSpreadSd,
  };
}

// ---------------------------------------------------------------------------
// Forgatókönyvek
// ---------------------------------------------------------------------------

interface Scenario {
  key: string;
  label: string;
  /** mit tud a motor erről a userről */
  build: (rnd: () => number, dims: Record<DimCode, number>) => PersonInput;
  options?: EngineOptions;
}

const SCENARIOS: Scenario[] = [
  {
    key: "demand-only",
    label: "DIAGNOSZTIKA: csak a személyiség-illeszkedés (nem valódi user-állapot)",
    // A `person.ts` SOHA nem ad ilyen inputot: érdeklődés híján is becsül
    // (`estimateInterests`). Ez a sor a demandFit-komponens önmagában mért
    // felbontóképessége — a felső korlát, amit a többi jel javít.
    build: (_rnd, dims) => ({ dims, form: "short" }),
  },
  {
    key: "no-wizard",
    label: "wizard nélkül (csak teszt) — becsült érdeklődés, nincs preferencia",
    build: (_rnd, dims) => ({
      dims,
      form: "short",
      interests: { vector: estimateInterests(dims, undefined), source: "estimated" },
    }),
  },
  {
    key: "estimated-interests",
    label: "wizard preferenciákkal, érdeklődés-kérdőív nélkül (becsült)",
    build: (rnd, dims) => {
      const prefs = randomPrefs(rnd);
      return {
        dims,
        form: "short",
        prefs,
        interests: { vector: estimateInterests(dims, prefs), source: "estimated" },
      };
    },
  },
  {
    key: "measured-interests",
    label: "személyiség + preferenciák + MÉRT érdeklődés (interest-led)",
    build: (rnd, dims) => ({
      dims,
      form: "short",
      prefs: randomPrefs(rnd),
      interests: { vector: randomInterests(rnd), source: "measured" },
    }),
  },
];

/** A teljes katalógusra futtatunk: a metrikák a rangsor egészéről szólnak. */
const FULL_RUN: EngineOptions = { limit: 10_000, diversify: false };

interface ScenarioResult {
  key: string;
  label: string;
  strategy: string;
  /** egy személyen belül a rangsor-pontszámok szórása */
  withinPersonSd: number;
  /** a rangsor mérési hibája (medián) */
  medianRankSe: number;
  /** jel/zaj: mekkora a rangsorolható jel a saját hibájához képest */
  signalToNoise: number;
  /** hány tétel esik a listavezető hibasávjába (a „nincs valódi 1. hely" mérete) */
  topClusterSize: number;
  /** r(profil-átlag, átlagos illeszkedés) — elevation-hatás */
  elevationR: number;
  /** r(dimenzió, átlagos illeszkedés) dimenziónként — egydimenziósság-teszt */
  dimR: Record<DimCode, number>;
  /** legnagyobb |r| a dimenziók közül */
  maxAbsDimR: number;
  /** győztes-szerep entrópia (1 = teljesen szétszórt, 0 = mindig ugyanaz) */
  winnerEntropy: number;
  distinctWinners: number;
  /** a leggyakoribb győztes szerep részesedése */
  topWinnerShare: number;
  /** test-retest: két zajos mérés top-10 metszete */
  retestTop10Jaccard: number;
  /** test-retest: teljes rangsor Spearman-korrelációja */
  retestSpearman: number;
  /** a megjelenített top-24 hány karrier-családot fed le */
  familiesInTop24: number;
}

function runScenario(scenario: Scenario, n: number, seed: number): ScenarioResult {
  const rnd = mulberry32(seed);
  const occupations = getOccupations();
  const ids = occupations.map((o) => o.id);
  // (az azonosító-lista a győztes-entrópia normálásához kell)

  const withinSds: number[] = [];
  const rankSes: number[] = [];
  const clusterSizes: number[] = [];
  const meanFits: number[] = [];
  const profileMeans: number[] = [];
  const dimValues: Record<DimCode, number[]> = {} as Record<DimCode, number[]>;
  for (const dim of DIM_CODES) dimValues[dim] = [];
  const winners = new Map<string, number>();
  const jaccards: number[] = [];
  const spearmans: number[] = [];
  const familyCounts: number[] = [];
  let strategy = "";

  for (let i = 0; i < n; i += 1) {
    const dims = randomProfile(rnd);
    const person = scenario.build(rnd, dims);
    const result = computeCareerFit(person, { ...FULL_RUN, ...scenario.options });
    strategy = result.meta.strategy;
    const ranked = result.ranked;
    if (ranked.length === 0) continue;

    const ranks = ranked.map((f) => f.rank);
    withinSds.push(sd(ranks));
    rankSes.push(median(ranked.map((f) => f.rankSe)));
    meanFits.push(mean(ranks));
    profileMeans.push(mean(DIM_CODES.map((d) => dims[d])));
    for (const dim of DIM_CODES) dimValues[dim].push(dims[dim]);

    // A listavezető hibasávjába eső tételek száma: ennyi szerep között a motor
    // saját mérési hibája szerint NEM lehet sorrendet állítani.
    const leader = ranked[0];
    const cluster = ranked.filter(
      (f) => leader.rank - f.rank <= Math.sqrt(leader.rankSe ** 2 + f.rankSe ** 2),
    ).length;
    clusterSizes.push(cluster);

    winners.set(leader.id, (winners.get(leader.id) ?? 0) + 1);

    const top24 = ranked.slice(0, 24);
    familyCounts.push(new Set(top24.map((f) => f.family ?? f.isco ?? "?")).size);

    // Test-retest: ugyanaz a „valódi" profil, két független mérési zajjal.
    const se = result.meta.dimSe;
    const a = computeCareerFit(
      { ...person, dims: observeProfile(dims, se, rnd) },
      { ...FULL_RUN, ...scenario.options },
    ).ranked;
    const b = computeCareerFit(
      { ...person, dims: observeProfile(dims, se, rnd) },
      { ...FULL_RUN, ...scenario.options },
    ).ranked;
    if (a.length && b.length) {
      const topA = new Set(a.slice(0, 10).map((f) => f.id));
      const topB = new Set(b.slice(0, 10).map((f) => f.id));
      const intersect = [...topA].filter((id) => topB.has(id)).length;
      jaccards.push(intersect / (topA.size + topB.size - intersect));
      spearmans.push(rankVectorSpearman(a, b));
    }
  }

  const dimR = {} as Record<DimCode, number>;
  for (const dim of DIM_CODES) dimR[dim] = pearson(dimValues[dim], meanFits);

  const winnerCounts = [...winners.values()];
  const withinPersonSd = mean(withinSds);
  const medianRankSe = mean(rankSes);

  return {
    key: scenario.key,
    label: scenario.label,
    strategy,
    withinPersonSd,
    medianRankSe,
    signalToNoise: medianRankSe === 0 ? 0 : withinPersonSd / medianRankSe,
    topClusterSize: mean(clusterSizes),
    elevationR: pearson(profileMeans, meanFits),
    dimR,
    maxAbsDimR: Math.max(...DIM_CODES.map((d) => Math.abs(dimR[d]))),
    winnerEntropy: normalizedEntropy(
      // Az entrópia a TELJES katalógusra normálva értelmes: a nem nyertes
      // szerepek 0-s cellái is a lehetséges kimenetek része.
      ids.map((id) => winners.get(id) ?? 0),
    ),
    distinctWinners: winnerCounts.length,
    topWinnerShare: winnerCounts.length ? Math.max(...winnerCounts) / n : 0,
    retestTop10Jaccard: mean(jaccards),
    retestSpearman: mean(spearmans),
    familiesInTop24: mean(familyCounts),
  };
}

/**
 * Két rangsor Spearman-korrelációja a KÖZÖS tételeken.
 *
 * Szándékosan nem a teljes katalógus-vektoron: az interest-led stratégia
 * jelölt-halmaza 30–60 tétel, a hiányzókat 0-val kitöltve a 400+ azonos kötés
 * önmagában ~1,0-ra hajtaná a korrelációt — a szám a metszet méretéről szólna,
 * nem a rangsor stabilitásáról.
 */
function rankVectorSpearman(a: OccupationFit[], b: OccupationFit[]): number {
  const rankB = new Map(b.map((fit) => [fit.id, fit.rank]));
  const va: number[] = [];
  const vb: number[] = [];
  for (const fit of a) {
    const other = rankB.get(fit.id);
    if (other === undefined) continue;
    va.push(fit.rank);
    vb.push(other);
  }
  return va.length < 3 ? 0 : spearman(va, vb);
}

// ---------------------------------------------------------------------------
// Kimenet
// ---------------------------------------------------------------------------

/**
 * A v1 motor mért alapvonala (`career-engine-plan.md` 2. fejezet, 2026-07-30).
 * A v2 számok EHHEZ mérendők — ez a dokumentum állítja, hogy a motor „nem
 * differenciál".
 */
const V1_BASELINE = {
  withinPersonSd: 5.3,
  band: 8,
  elevationR: 0.7,
  maxAbsDimR: 0.82,
} as const;

function fmt(value: number, digits = 2): string {
  return value.toFixed(digits);
}

function main(): void {
  const args = process.argv.slice(2);
  const nArg = args.indexOf("--n");
  const n = nArg >= 0 ? Number(args[nArg + 1]) : 600;
  const seedArg = args.indexOf("--seed");
  const seed = seedArg >= 0 ? Number(args[seedArg + 1]) : 20260811;
  const asJson = args.includes("--json");

  const catalog = catalogStats();
  const results = SCENARIOS.map((scenario) => runScenario(scenario, n, seed));

  if (asJson) {
    console.log(JSON.stringify({ n, seed, catalog, results }, null, 2));
    return;
  }

  console.log(`\n=== Karrier-motor szimuláció (n=${n} profil, seed=${seed}) ===\n`);

  console.log(`Katalógus: ${catalog.occupations} foglalkozás, `
    + `${fmt(catalog.componentsPerRole, 1)} súly/szerep\n`);
  console.log("Dimenzió-lefedettség (a v1 fődiagnózisa: egydimenziós motor):");
  for (const dim of DIM_CODES) {
    console.log(
      `  ${dim}: súlymassza ${fmt(catalog.weightMass[dim] * 100, 1)}%`
        + ` · használja ${catalog.rolesUsingDim[dim]} szerep`
        + ` · hiányzik ${catalog.rolesMissingDim[dim]} szerepből`
        + ` · cél-szórás ${fmt(catalog.targetSpreadSd[dim], 1)}`,
    );
  }

  for (const r of results) {
    console.log(`\n--- ${r.label} [${r.strategy}] ---`);
    console.log(`  rangsor-szórás egy személyen belül : ${fmt(r.withinPersonSd)}`
      + `   (v1: ${V1_BASELINE.withinPersonSd})`);
    console.log(`  rangsor-hiba (SE, medián)          : ${fmt(r.medianRankSe)}`
      + `   (v1 sáv: ±${V1_BASELINE.band})`);
    console.log(`  JEL/ZAJ (szórás / SE)              : ${fmt(r.signalToNoise)}`);
    console.log(`  listavezető klaszterének mérete    : ${fmt(r.topClusterSize, 1)} szerep`);
    console.log(`  r(profil-átlag, átlagos fit)       : ${fmt(r.elevationR)}`
      + `   (v1: ${V1_BASELINE.elevationR})`);
    console.log(`  legerősebb r(dimenzió, átlagos fit): ${fmt(r.maxAbsDimR)}`
      + `   (v1: ${V1_BASELINE.maxAbsDimR})`);
    console.log(
      `    dimenziónként: ${DIM_CODES.map((d) => `${d} ${fmt(r.dimR[d])}`).join(" · ")}`,
    );
    console.log(`  győztes-entrópia (0..1)            : ${fmt(r.winnerEntropy)}`);
    console.log(`  különböző győztes szerepek         : ${r.distinctWinners}`
      + ` · leggyakoribb részesedése ${fmt(r.topWinnerShare * 100, 1)}%`);
    console.log(`  test-retest top-10 átfedés         : ${fmt(r.retestTop10Jaccard)}`);
    console.log(`  test-retest Spearman (teljes lista): ${fmt(r.retestSpearman)}`);
    console.log(`  karrier-családok a top-24-ben      : ${fmt(r.familiesInTop24, 1)}`);
  }

  console.log("\nOlvasat:");
  console.log("  · JEL/ZAJ < 1  → a rangsor különbségei a mérési hibán belül vannak");
  console.log("  · retest top-10 átfedés < 0,5 → a lista feje mérésről mérésre cserélődik");
  console.log("  · |r(dimenzió)| > 0,5 → a motor gyakorlatilag azt az egy dimenziót mutatja\n");
}

main();
