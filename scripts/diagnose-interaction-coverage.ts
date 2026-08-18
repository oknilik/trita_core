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
 * A 4. blokk a FACET-rétegre mér. FIGYELEM: ez az EGYETLEN rész, ami nem
 * mért paraméteren áll — a facetek dimenzión BELÜLI szórására nincs saját
 * adatunk, ezért modell-feltevéssel dolgozik, és három feltevés-értékre is
 * kiírja az eredményt. A számai tájékozódásra valók („tüzel-e egyáltalán,
 * és nem túl gyakran-e?"), NEM mérési eredmények.
 *
 * Futtatás:
 *   npx tsx scripts/diagnose-interaction-coverage.ts
 *   npx tsx scripts/diagnose-interaction-coverage.ts --samples 20000
 */

import { HEXACO_ORDER } from "../src/lib/hexaco";
import { DIFF_MIN_GAP } from "../src/lib/personality-type";
import { MEASURED_SCORE_SD_BY_DIM } from "../src/lib/psychometrics";
import {
  ARCHETYPE_PAIRS,
  DEFAULT_MAX_ATOMS,
  NUANCE_GATE_MULTIPLIER,
  archetypePrototype,
  polarSides,
  simulateInteraction,
  type DimScores,
  type InteractionLevel,
} from "../src/lib/interaction-engine";
import {
  CROSS_DIMENSION_ATOMS,
  RELATION_ATOMS,
  SAME_DIMENSION_ATOMS,
} from "../src/lib/interaction-atoms";
import { HEXACO_DIMENSION_FACETS } from "../src/lib/hexaco";
import { facetStandardError } from "../src/lib/psychometrics";
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

function measure(
  pairs: Array<[DimScores, DimScores]>,
  // A szint NEM kozmetika: a rés-alapú réteg csak két VALÓS profilra
  // aktiválódik, az archetípus-prototípus 50-es dimenzióira nem.
  level: InteractionLevel,
): Coverage {
  let atoms = 0, empty = 0, spoken = 0, gaps = 0, polar = 0;
  for (const [self, other] of pairs) {
    const result = simulateInteraction({ self, other, level });
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
  console.log(`   kiválasztott atom / pár:            ${coverage.atoms.toFixed(2)} (plafon: ${DEFAULT_MAX_ATOMS})`);
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
    measure(synthetic, "profile-profile"),
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
    measure(personaPairs, "profile-profile"),
  );

  // ── 3. Archetípus-út ─────────────────────────────────────────────────
  // A prototípus recept szerint a domináns 86, a második 74, a maradék NÉGY
  // pontosan 50 — azaz szerkezetileg középsávos, tehát atomot sem aktiválhat.
  const archetypePairs: Array<[DimScores, DimScores]> = [];
  for (let i = 0; i < Math.min(SAMPLES, 4000); i++) {
    const pair = ARCHETYPE_PAIRS[i % ARCHETYPE_PAIRS.length];
    archetypePairs.push([syntheticProfile(), archetypePrototype(pair)]);
  }
  const archetypeCoverage = measure(archetypePairs, "profile-archetype");
  report(
    "3. ARCHETÍPUS út — /interaction alapértelmezés",
    "valós saját profil × 86/74/50×4 prototípus",
    archetypeCoverage,
  );
  const otherSidePolar = polarSides(archetypePrototype(ARCHETYPE_PAIRS[0])).length;
  console.log(`   a prototípus pólusos dimenziói:     ${otherSidePolar} / 6   ← szerkezeti plafon`);

  // ── 4. Facet-réteg ───────────────────────────────────────────────────
  reportFacetLayer();

  console.log("");
}

// ─────────────────────────────────────────────────────────────────────
// Facet-réteg — MODELL-FELTEVÉSSEL, nem mért paraméterrel.
//
// A dimenzión BELÜLI facet-szórásra nincs saját adatunk. A modell:
//   megfigyelt facet_i = D + e_i,  D ~ N(50, σ_D),  e_i ~ N(0, σ_W)
// és a dimenzió-pontszám a négy facet átlaga. σ_D-t úgy választjuk, hogy a
// dimenzió szórása a MÉRT 16,2-t adja: σ_D = √(16,2² − σ_W²/4).
// σ_W a feltevés — ezért három értékre is lefut.
// ─────────────────────────────────────────────────────────────────────

const WITHIN_DIM_SD_ASSUMPTIONS = [12, 20, 28];
const MEASURED_DIM_SD = 16.2;

function reportFacetLayer(): void {
  const facetGate = Math.round(Math.SQRT2 * facetStandardError("short"));
  console.log("\n── 4. FACET-réteg (rövid forma, kapu " + facetGate + " pont)");
  console.log("   FIGYELEM: modell-feltevésen áll, nem mért paraméteren — tájékozódásra.");
  console.log("   σ_W = a facetek dimenzión belüli szórása (a feltevés maga)\n");
  console.log("   σ_W    attribúció / pár   nüansz / pár   van legalább egy facet-sor");

  for (const withinSd of WITHIN_DIM_SD_ASSUMPTIONS) {
    const betweenVar = MEASURED_DIM_SD ** 2 - withinSd ** 2 / 4;
    if (betweenVar <= 0) continue;
    const betweenSd = Math.sqrt(betweenVar);

    let drivers = 0, nuances = 0, any = 0;
    const samples = Math.min(SAMPLES, 8000);
    for (let i = 0; i < samples; i++) {
      const build = () => {
        const dims: DimScores = {};
        const facets: Record<string, Record<string, number>> = {};
        for (const dim of HEXACO_ORDER) {
          const base = gauss(50, betweenSd);
          const values: Record<string, number> = {};
          let sum = 0;
          for (const facet of HEXACO_DIMENSION_FACETS[dim]) {
            const value = Math.min(100, Math.max(0, gauss(base, withinSd)));
            values[facet] = value;
            sum += value;
          }
          facets[dim] = values;
          dims[dim] = sum / HEXACO_DIMENSION_FACETS[dim].length;
        }
        return { dims, facets };
      };
      const a = build();
      const b = build();
      const result = simulateInteraction({
        self: a.dims,
        other: b.dims,
        level: "profile-profile",
        selfFacets: a.facets,
        otherFacets: b.facets,
        facetMinGap: facetGate,
      });
      const d = result.facetNuances.filter((row) => row.kind === "driver").length;
      const n = result.facetNuances.length - d;
      drivers += d;
      nuances += n;
      if (d + n > 0) any++;
      void samples;
    }
    const pct = (x: number) => ((x / samples) * 100).toFixed(0) + "%";
    console.log(
      "   " + String(withinSd).padEnd(6) +
      (drivers / samples).toFixed(2).padStart(10) + "  (max 2)" +
      (nuances / samples).toFixed(2).padStart(12) + "  (max 2)" +
      pct(any).padStart(14),
    );
  }

  reportFacetFalsePositives(facetGate);
}

/**
 * A DÖNTŐ szám, és az EGYETLEN, ami NEM függ a σ_W feltevéstől: két AZONOS
 * valós profilú ember között hány facet-sor születne PUSZTÁN a mérési
 * hibából? A megfigyelt facet-különbség ilyenkor tiszta zaj, √2·SEM
 * szórással — ez mért paraméter.
 */
function reportFacetFalsePositives(facetGate: number): void {
  const facetSem = facetStandardError("short");
  const samples = Math.min(SAMPLES, 20000);
  let perFacetHits = 0, nuanceGateHits = 0;
  const tests = 4;
  for (let i = 0; i < samples; i++) {
    for (let k = 0; k < tests; k++) {
      const noise = Math.abs(gauss(0, facetSem) - gauss(0, facetSem));
      if (noise >= facetGate) perFacetHits++;
      if (noise >= facetGate * NUANCE_GATE_MULTIPLIER) nuanceGateHits++;
    }
  }
  const rate = (hits: number) => ((hits / (samples * tests)) * 100).toFixed(1) + "%";
  console.log("\n   Hamis jelzés KÉT AZONOS profil között (feltevés-mentes, mért SEM-ből):");
  console.log(`     1× kapu (${facetGate} pont, attribúció):        ${rate(perFacetHits)} / facet`);
  console.log(
    `     ${NUANCE_GATE_MULTIPLIER}× kapu (${facetGate * NUANCE_GATE_MULTIPLIER} pont, önálló nüansz): ${rate(nuanceGateHits)} / facet`,
  );
  console.log("   Az attribúció az 1×-es kapun áll, DE csak akkor szólal meg, ha PONTOSAN");
  console.log("   egy alskála lépi át a dimenzió irányában — ez a szűrő, nem a kapu.");
}

main();
