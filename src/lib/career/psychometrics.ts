// Mérési bizonytalanság a karrier-motorban: a közös pszichometriai mag
// (reliabilitás → SE → sáv, ld. src/lib/psychometrics.ts) + a karrier-
// specifikus hibaterjesztés: observer-keverés, illeszkedés-SE, klaszterezés.
//
// A hibát végigvezetjük az illeszkedés-számításon: ahol a különbség a
// hibán belül van, ott NEM állítunk sorrendet.

import type { OccupationFit } from "./types";

// A közös mag re-exportja — minden meglévő career-oldali import változatlan.
// FIGYELEM (2026-08-11): a MEAN_ITEM_R / SCORE_SD már nem kézi prior, hanem
// MÉRT érték (r̄ = 0,264, SD = 16,2; IPIP–HEXACO nyílt adat, n = 21 681) —
// a karrier-motor minden SE-je (fitStandardError, klaszterezés) ezzel ~25%-kal
// szűkebb sávot ad. Forrás és korlátok: a psychometrics.ts forrás-blokkja.
export {
  ITEMS_PER_DIM,
  ITEMS_PER_FACET,
  MEAN_ITEM_R,
  SCORE_SD,
  MEASURED_SCORE_SD_BY_DIM,
  MEASURED_MEAN_ITEM_R_BY_DIM,
  alphaFromItems,
  dimStandardError,
  facetStandardError,
  bandFor,
} from "@/lib/psychometrics";

/**
 * Komponens-hibák (0-100 skálán) a rangsor-SE terjesztéséhez ÉS a felületi
 * ítélet-kapukhoz. Itt élnek (nem az engine-ben), mert a kliens-oldali
 * címke-kapu (CareerResults) is ezekből számol margót — az engine a katalógus-
 * JSON-okat húzná be a kliens-bundle-be, ez a modul könnyű.
 */
export const INTEREST_SE_MEASURED = 6;
export const INTEREST_SE_OTHER = 12;

/**
 * Intervallum-tudatos negatív ítélet: csak akkor állítjuk, hogy az érték a
 * vágás ALATT van, ha a teljes ±margin sáv is alatta marad. Egy 54-es érték
 * 8-as hibával nem „a küszöb alatt van", hanem „a küszöb körül" — a kimondott
 * negatív verdikt ilyenkor többet állít, mint amit a mérés tud.
 */
export function clearlyBelow(value: number, margin: number, cut: number): boolean {
  return value + margin < cut;
}

/**
 * Observer-súly: az értékelők számával nő, de a self mindig legalább 50%-ot tart.
 * (A v1 fix 50/50 keverése egyetlen értékelőnek ugyanakkora szót adott, mint ötnek.)
 */
export function observerWeight(raterCount: number): number {
  if (raterCount <= 0) return 0;
  return Math.min(0.5, raterCount / (raterCount + 3));
}

/** Kevert (self + observer) pontszám SE-je. Az observer-mérés per-értékelő zajosabb. */
export function blendedStandardError(
  selfSe: number,
  raterCount: number,
  weight: number,
): number {
  if (raterCount <= 0 || weight <= 0) return selfSe;
  const observerSe = (selfSe * 1.15) / Math.sqrt(raterCount);
  return Math.sqrt((1 - weight) ** 2 * selfSe ** 2 + weight ** 2 * observerSe ** 2);
}

/**
 * Az illeszkedés-pontszám SE-je: a dimenzió-hibák terjesztése a súlyokon és az
 * illeszkedés-függvény meredekségén keresztül (`d(alignment)/d(user) = 100/(2·tol)`).
 */
export function fitStandardError(
  components: Array<{ weight: number; tol: number }>,
  dimSe: number,
): number {
  const variance = components.reduce((sum, c) => {
    const slope = 100 / (2 * c.tol);
    return sum + (c.weight * slope * dimSe) ** 2;
  }, 0);
  return Math.sqrt(variance);
}

/**
 * Klaszterezés: a rangsorban addig tart egy csoport, amíg a következő tétel
 * pontszáma a csoportvezető hibasávján belül van. Egy klaszteren belül a
 * sorrend NEM értelmezhető — a UI ezt így is mutatja.
 */
export function clusterByOverlap(
  ranked: OccupationFit[],
  minSeparation = 1,
): OccupationFit[][] {
  const clusters: OccupationFit[][] = [];
  for (const fit of ranked) {
    const current = clusters[clusters.length - 1];
    if (!current) {
      clusters.push([fit]);
      continue;
    }
    const leader = current[0];
    const combinedSe = Math.sqrt(leader.rankSe ** 2 + fit.rankSe ** 2);
    const gap = leader.rank - fit.rank;
    if (gap <= Math.max(minSeparation, combinedSe)) current.push(fit);
    else clusters.push([fit]);
  }
  // Klaszteren BELÜL nincs rangsor-sorrend (ez a lényeg). A megjelenítést más
  // szempont adja: előbb ami a mai végzettséggel elérhető, azon belül a
  // SZEMÉLYISÉG-illeszkedés (scope/interest-módban ez a 2. jelszint), végül a
  // magyar munkaerőpiacon gyakoribb (tier).
  return clusters.map((cluster) =>
    cluster.length === 1
      ? cluster
      : [...cluster].sort(
          (a, b) =>
            Number(b.feasibility.ready) - Number(a.feasibility.ready) ||
            b.demandFit - a.demandFit ||
            a.tier - b.tier,
        ),
  );
}
