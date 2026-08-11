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

import type { TrustEdgeType } from "./trust-network";

const DIM_ORDER = ["H", "E", "X", "A", "C", "O"] as const;

export type DynamicsEdgeType = "aligned" | "complementary" | "friction";

// Súlyok a személyiségpszichológiai szakirodalomból: a C (lelkiismeretesség)
// és az A (barátságosság) eltérés a legerősebb munkahelyi súrlódás-jósló, a
// H (becsületesség-alázat) követi; az E, X, O gyengébb.
export const FRICTION_WEIGHTS: Record<string, number> = {
  C: 0.30,  // határidő / minőség / végigvitel feszültsége
  A: 0.25,  // kommunikációs stílus ütközése
  H: 0.20,  // bizalom és szándék-tulajdonítás
  E: 0.15,  // érzelmi termosztát eltérése
  X: 0.05,  // kommunikációs gyakoriság eltérése
  O: 0.05,  // újítás vs pragmatizmus
};

/**
 * Páronkénti súrlódás-pontszám (0–100 skálájú eltérésekből). Részleges
 * profilnál a jelen lévő súlyok összegével újranormalizál — enélkül a
 * hiányzó dimenziók hamisan „aligned" irányba húznák az eredményt.
 * Null, ha a két profilnak egyetlen közös dimenziója sincs.
 */
export function calculatePairFriction(
  scoresA: Record<string, number>,
  scoresB: Record<string, number>,
): number | null {
  let weightedSum = 0;
  let presentWeight = 0;
  for (const dim of DIM_ORDER) {
    const a = scoresA[dim];
    const b = scoresB[dim];
    if (typeof a !== "number" || typeof b !== "number") continue;
    const w = FRICTION_WEIGHTS[dim] ?? 0;
    weightedSum += w * Math.abs(a - b);
    presentWeight += w;
  }
  if (presentWeight <= 0) return null;
  return Math.round(weightedSum / presentWeight);
}

export function frictionToEdgeType(frictionScore: number): DynamicsEdgeType {
  if (frictionScore < 12) return "aligned";
  if (frictionScore < 22) return "complementary";
  return "friction";
}

/**
 * Mért bizalmi-kör él → dinamika-él típus. A `disconnected` (a mért trust
 * a kapcsolat-küszöb ALATT) NEM súrlódás, hanem a kapcsolat HIÁNYA — ezért
 * `null`, és a hívó KIHAGYJA (nem rajzol élt, nem növeli a friction-számot).
 * A kapcsolat hiányát konfliktusnak könyvelni hamis jelzés volt.
 */
export function trustToDynamicsEdge(
  trustType: TrustEdgeType,
): DynamicsEdgeType | null {
  switch (trustType) {
    case "strong_trust":
      return "aligned";
    case "moderate":
      return "complementary";
    case "weak_trust":
      return "friction";
    case "disconnected":
      return null;
  }
}

/**
 * MÉRT kapcsolati él-e a forrás: mért bizalmi kör (`trust_round`) vagy a
 * régi observer-forrás. Minden más (`profile_estimate`) becslés. EGYETLEN
 * definíció — a dinamika-térkép, a cockpit-összegző és a csapatriport is
 * ezt hívja, hogy a „mért" felirat mindenhol ugyanazt jelentse.
 */
export function isMeasuredDynamicsSource(
  source: string | null | undefined,
): boolean {
  return source === "trust_round" || source === "observer";
}

// ── Aligned-fokszám hub ─────────────────────────────────────────────────────
// A profil-alapú hub definíció EGYETLEN helye: a legalább ennyi "aligned"
// éllel rendelkező tag hub (mindkét él-végpont számít). A trust-network
// erős-él fokszámú hub-ja ettől független, MÉRT fogalom — az ott marad.

export const ALIGNED_HUB_MIN_DEGREE = 3;

export function computeAlignedHubIds(
  edges: ReadonlyArray<{ from: string; to: string; type: string }>,
): string[] {
  const degree = new Map<string, number>();
  for (const e of edges) {
    if (e.type !== "aligned") continue;
    degree.set(e.from, (degree.get(e.from) ?? 0) + 1);
    degree.set(e.to, (degree.get(e.to) ?? 0) + 1);
  }
  return [...degree.entries()]
    .filter(([, d]) => d >= ALIGNED_HUB_MIN_DEGREE)
    .map(([id]) => id);
}
