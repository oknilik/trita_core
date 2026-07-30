// Mérési bizonytalanság: reliabilitás → SE → konfidencia-sáv → klaszterezés.
//
// A pontszám önértékelés-alapú BECSLÉS. A sáv nem konstans (mint a v1-ben),
// hanem a tényleges item-számból számolt megbízhatóságból jön, és a hibát
// végigvezetjük az illeszkedés-számításon. Ez a termék hitelességi alapelve:
// ahol a különbség a hibán belül van, ott NEM állítunk sorrendet.

import type { AssessmentForm, OccupationFit } from "./types";

/** Item-számok a TSFI bankban (dimenziónként) — a reliabilitás alapja. */
const ITEMS_PER_DIM: Record<AssessmentForm, number> = { short: 9.5, full: 16 };
/** Facet-szintű item-szám (ma nincs facet-cél a katalógusban; a konstans a bővítéshez van). */
export const ITEMS_PER_FACET: Record<AssessmentForm, number> = { short: 2.5, full: 4 };

/** Átlagos item-item korreláció személyiség-skálákon (konzervatív becslés). */
const MEAN_ITEM_R = 0.22;
/** A pontszám-eloszlás szórása a 0-100 skálán (populációs becslés). */
const SCORE_SD = 20;

/** Spearman–Brown / Cronbach-α becslés item-számból és átlagos item-korrelációból. */
export function alphaFromItems(k: number, meanR = MEAN_ITEM_R): number {
  return (k * meanR) / (1 + (k - 1) * meanR);
}

/** Mérési hiba (SEM) egy dimenzió-pontszámon, a kérdőív-forma szerint. */
export function dimStandardError(form: AssessmentForm): number {
  const alpha = alphaFromItems(ITEMS_PER_DIM[form]);
  return SCORE_SD * Math.sqrt(Math.max(0, 1 - alpha));
}

/** Facet-szintű SEM — mindig NAGYOBB, mint a dimenzióé (kevesebb item). */
export function facetStandardError(form: AssessmentForm): number {
  const alpha = alphaFromItems(ITEMS_PER_FACET[form]);
  return SCORE_SD * Math.sqrt(Math.max(0, 1 - alpha));
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

export function bandFor(score: number, se: number): { low: number; high: number } {
  return {
    low: Math.max(0, Math.round(score - se)),
    high: Math.min(100, Math.round(score + se)),
  };
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
  // Klaszteren BELÜL nincs illeszkedés-sorrend (ez a lényeg), ezért a
  // megjelenítési sorrendet más szempont adja: előbb ami a mai végzettséggel
  // elérhető, majd a magyar munkaerőpiacon gyakoribb (tier).
  return clusters.map((cluster) =>
    cluster.length === 1
      ? cluster
      : [...cluster].sort(
          (a, b) =>
            Number(b.feasibility.ready) - Number(a.feasibility.ready) ||
            a.tier - b.tier ||
            b.rank - a.rank,
        ),
  );
}
