// ─────────────────────────────────────────────────────────────────────
// Súrlódás-modell — TISZTA modul (Prisma-mentes, kliens-oldalon és unit
// tesztben is importálható).
//
// Korábban a `team-stats.ts`-ben élt, ami viszont behúzza a Prismát és a
// szerver-oldali trust-network betöltőt — ezért a kliens `DynamicsMap.tsx`
// kénytelen volt SAJÁT másolatot tartani a súlyokból. A harmadik másolat
// helyett (interakció-motor) a modell ide került; a `team-stats.ts`
// változatlanul re-exportálja, tehát a meglévő importok érintetlenek.
// ─────────────────────────────────────────────────────────────────────

const DIM_ORDER = ["INTE", "RESO", "TEMP", "ADAP", "THOR", "OPEN"] as const;

export type DynamicsEdgeType = "aligned" | "complementary" | "friction";

// Súlyok a személyiségpszichológiai szakirodalomból: a C (lelkiismeretesség)
// és az A (barátságosság) eltérés a legerősebb munkahelyi súrlódás-jósló, a
// H (becsületesség-alázat) követi; az E, X, O gyengébb.
export const FRICTION_WEIGHTS: Record<string, number> = {
  THOR: 0.30,  // határidő / minőség / végigvitel feszültsége
  ADAP: 0.25,  // kommunikációs stílus ütközése
  INTE: 0.20,  // bizalom és szándék-tulajdonítás
  RESO: 0.15,  // érzelmi termosztát eltérése
  TEMP: 0.05,  // kommunikációs gyakoriság eltérése
  OPEN: 0.05,  // újítás vs pragmatizmus
};

export function calculatePairFriction(
  scoresA: Record<string, number>,
  scoresB: Record<string, number>,
): number {
  let weightedSum = 0;
  for (const dim of DIM_ORDER) {
    const a = scoresA[dim];
    const b = scoresB[dim];
    if (typeof a !== "number" || typeof b !== "number") continue;
    weightedSum += (FRICTION_WEIGHTS[dim] ?? 0) * Math.abs(a - b);
  }
  return Math.round(weightedSum);
}

export function frictionToEdgeType(frictionScore: number): DynamicsEdgeType {
  if (frictionScore < 12) return "aligned";
  if (frictionScore < 22) return "complementary";
  return "friction";
}
