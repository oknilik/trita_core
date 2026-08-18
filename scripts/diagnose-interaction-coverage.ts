/**
 * diagnose-interaction-coverage.ts
 *
 * CSAK-OLVASÓ diagnosztika: megméri, MENNYIT lát a profilból az
 * interakció-motor (`src/lib/interaction-engine.ts`), amikor két profilt
 * eresztünk össze az /interaction (archetípus) és az /interaction?pair
 * (valós pár) felületen.
 *
 * Nem nyúl az adatbázishoz, nem kell env — a KANONIKUS motort futtatja
 * (simulateInteraction), tehát a kimenete a valódi viselkedést tükrözi,
 * nem újraimplementált közelítés.
 *
 * Három populáción mér:
 *   1. SZINTETIKUS — a mért dimenzió-szórásokból (MEASURED_SCORE_SD_BY_DIM,
 *      IPIP-referencia, n = 21 681) húzott profilok. Ez a REALISZTIKUS eset.
 *   2. PERSONA — a scripts/personas.shared.ts fixture-készlete. Ezek
 *      SZÁNDÉKOSAN sarkos profilok (86/68/52/48/44/30), tehát a motor
 *      LEGJOBB esetét mutatják, nem az átlagosat.
 *   3. ARCHETÍPUS — a /interaction alapértelmezett útja: valós saját
 *      profil × 86/74-es prototípus.
 *
 * Kimenet: hány dimenzió szólal meg a 6-ból, és mennyi VOLNA elérhető a
 * kanonikus mérési-hiba kapuval (DIFF_MIN_GAP = √2·SEM).
 *
 * Futtatás:
 *   npx tsx scripts/diagnose-interaction-coverage.ts
 *   npx tsx scripts/diagnose-interaction-coverage.ts --samples 20000
 */

import { HEXACO_ORDER, type HexacoCode } from "../src/lib/hexaco";
import { DIFF_MIN_GAP } from "../src/lib/personality-type";
import { MEASURED_SCORE_SD_BY_DIM } from "../src/lib/psychometrics";
import {
  ARCHETYPE_PAIRS,
  archetypePrototype,
  polarSides,
  simulateInteraction,
  type DimScores,
} from "../src/lib/interaction-engine";
import {
  CROSS_DIMENSION_ATOMS,
  RELATION_ATOMS,
  SAME_DIMENSION_ATOMS,
} from "../src/lib/interaction-atoms";
import { buildAllPersonas } from "./personas.shared";

function getArg(name: string, fallback: number): number {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return fallback;
  const value = Number(process.argv[idx + 1]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

const SAMPLES = getArg("samples", 20000);

// Determinisztikus PRNG — ugyanaz a futtatás ugyanazt a számot adja, hogy
// a doksiba írt érték később ellenőrizhető legyen.
let seed = 20260818;
function rnd(): number {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 2 ** 32;
}
function gauss(mean: number, sd: number): number {
  const u = Math.max(1e-9, rnd());
  const v = rnd();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function syntheticProfile(): DimScores {
  const scores: DimScores = {};
  for (const dim of HEXACO_ORDER) {
    scores[dim] = Math.min(100, Math.max(0, Math.round(gauss(50, MEASURED_SCORE_SD_BY_DIM[dim]))));
  }
  return scores;
}

interface Coverage {
  pairs: number;
  /** Átlagos kiválasztott atom-szám (a motor maxAtoms plafonja alatt). */
  atoms: number;
  /** Ahol egyetlen atom sem aktiválódott. */
  emptyRatio: number;
  /** Átlagosan hány dimenzióról esik szó a kimenetben (0–6). */
  dimsSpoken: number;
  /** Átlagosan hány dimenzión van a mérési hibát MEGHALADÓ eltérés (0–6). */
  dimsWithRealGap: number;
  /** Átlagosan hány pólusos (>65 / <35) dimenziója van egy profilnak. */
  polarDims: number;
}

function measure(pairs: Array<[DimScores, DimScores]>): Coverage {
  let atoms = 0, empty = 0, spoken = 0, gaps = 0, polar = 0;
  for (const [self, other] of pairs) {
    const result = simulateInteraction({ self, other, level: "profile-profile" });
    atoms += result.meta.atomIds.length;
    if (result.meta.sparse) empty++;
    spoken += new Set(result.discuss.flatMap((line) => line.dims)).size;
    polar += polarSides(self).length;
    for (const dim of HEXACO_ORDER) {
      const a = self[dim];
      const b = other[dim];
      if (typeof a === "number" && typeof b === "number" && Math.abs(a - b) >= DIFF_MIN_GAP) {
        gaps++;
      }
    }
  }
  const n = pairs.length;
  return {
    pairs: n,
    atoms: atoms / n,
    emptyRatio: empty / n,
    dimsSpoken: spoken / n,
    dimsWithRealGap: gaps / n,
    polarDims: polar / n,
  };
}

function report(title: string, note: string, coverage: Coverage): void {
  const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
  console.log(`\n── ${title}`);
  console.log(`   ${note}`);
  console.log(`   párok:                              ${coverage.pairs}`);
  console.log(`   pólusos dimenzió / profil:          ${coverage.polarDims.toFixed(2)} / 6`);
  console.log(`   kiválasztott atom / pár:            ${coverage.atoms.toFixed(2)} (plafon: 3)`);
  console.log(`   ÜRES kimenet (egy atom sem szól):   ${pct(coverage.emptyRatio)}`);
  console.log(`   MOST megszólaló dimenzió:           ${coverage.dimsSpoken.toFixed(2)} / 6`);
  console.log(`   mérési hibát meghaladó eltérés:     ${coverage.dimsWithRealGap.toFixed(2)} / 6   ← ennyi VOLNA elmondható`);
}

function main(): void {
  console.log("Interakció-motor lefedettség-diagnosztika");
  console.log(`DIFF_MIN_GAP (√2·SEM, dimenzió) = ${DIFF_MIN_GAP} pont`);

  // ── 0. Atom-bank lefedettsége ────────────────────────────────────────
  // Azonos dimenzió: 6 dimenzió × 3 pólus-kombináció (hh/hl/ll) = 18.
  // Kereszt: C(6,2) = 15 dimenzió-pár × 4 pólus-kombináció = 60.
  const sameSlots = HEXACO_ORDER.length * 3;
  const crossSlots = ((HEXACO_ORDER.length * (HEXACO_ORDER.length - 1)) / 2) * 4;
  console.log("\n── Atom-bank");
  console.log(`   azonos dimenziós atom: ${SAME_DIMENSION_ATOMS.length} / ${sameSlots} lehetséges (teljes)`);
  console.log(`   kereszt-atom:          ${CROSS_DIMENSION_ATOMS.length} / ${crossSlots} lehetséges`);
  console.log(`   összesen:              ${RELATION_ATOMS.length}`);

  // ── 1. Szintetikus (realisztikus) ────────────────────────────────────
  const synthetic: Array<[DimScores, DimScores]> = [];
  for (let i = 0; i < SAMPLES; i++) synthetic.push([syntheticProfile(), syntheticProfile()]);
  report(
    "1. SZINTETIKUS pár — realisztikus eset",
    "mért dimenzió-szórásokból húzott profilok (IPIP-referencia)",
    measure(synthetic),
  );

  // ── 2. Persona-fixture (legjobb eset) ────────────────────────────────
  const personas = buildAllPersonas();
  const personaPairs: Array<[DimScores, DimScores]> = [];
  for (let i = 0; i < personas.length; i++) {
    for (let j = i + 1; j < personas.length; j++) {
      personaPairs.push([
        personas[i].dimensions as DimScores,
        personas[j].dimensions as DimScores,
      ]);
    }
  }
  report(
    "2. PERSONA pár — LEGJOBB eset",
    `${personas.length} sarkos fixture-profil minden párosítása (nem átlagos kitöltő)`,
    measure(personaPairs),
  );

  // ── 3. Archetípus-út ─────────────────────────────────────────────────
  // A prototípus recept szerint a domináns 86, a második 74, a maradék NÉGY
  // pontosan 50 — azaz szerkezetileg középsávos, tehát atomot sem aktiválhat.
  const archetypePairs: Array<[DimScores, DimScores]> = [];
  for (let i = 0; i < Math.min(SAMPLES, 4000); i++) {
    const pair = ARCHETYPE_PAIRS[i % ARCHETYPE_PAIRS.length];
    archetypePairs.push([syntheticProfile(), archetypePrototype(pair)]);
  }
  const archetypeCoverage = measure(archetypePairs);
  report(
    "3. ARCHETÍPUS út — /interaction alapértelmezés",
    "valós saját profil × 86/74/50×4 prototípus",
    archetypeCoverage,
  );
  const otherSidePolar = polarSides(archetypePrototype(ARCHETYPE_PAIRS[0])).length;
  console.log(`   a prototípus pólusos dimenziói:     ${otherSidePolar} / 6   ← szerkezeti plafon`);

  console.log("");
}

main();
