// Observer-dimenziók aggregálása a karrier-inputhoz — TISZTA függvény, hogy
// az anonimitás-szabály unit-tesztelhető legyen (a person.ts prisma-t húz be).
//
// ANONIMITÁS-PADLÓ DIMENZIÓNKÉNT (2026-08-11, fix): a korábbi kód minden
// dimenziót beírt, amire LEGALÁBB EGY értékelő adott pontot (bucket.n > 0) —
// így egy egyetlen értékelőtől származó dimenzió „observer-átlagként"
// keveredett a karrier-motorba, a kanonikus member-dossier helperek
// per-érték padlója (MIN_RATERS_FOR_ANONYMOUS_AGGREGATE) alatt. A motor
// assessment-szintű kapuja (raterCount ≥ 3) ezt nem fogta: 3 kitöltésből
// elég volt, hogy egy dimenzióra csak 1 válasz érkezzen. Innentől egy
// dimenzió csak akkor kerül az aggregátumba, ha arra a DIMENZIÓRA legalább
// a padlónyi értékelő adott pontot.

import { MIN_RATERS_FOR_ANONYMOUS_AGGREGATE } from "@/lib/anonymity";
import { DIM_CODES, type DimCode } from "./types";

export interface ObserverAggregate {
  dims: Partial<Record<DimCode, number>>;
  /** hány kitöltés adott LEGALÁBB EGY dimenzió-pontot */
  raterCount: number;
}

export function aggregateObserverDims(
  perAssessmentDims: Array<Partial<Record<DimCode, number>>>,
): ObserverAggregate {
  const sums: Partial<Record<DimCode, { sum: number; n: number }>> = {};
  let raterCount = 0;
  for (const values of perAssessmentDims) {
    let counted = false;
    for (const dim of DIM_CODES) {
      const value = values[dim];
      if (typeof value !== "number") continue;
      const bucket = (sums[dim] ??= { sum: 0, n: 0 });
      bucket.sum += value;
      bucket.n += 1;
      counted = true;
    }
    if (counted) raterCount += 1;
  }
  const dims: Partial<Record<DimCode, number>> = {};
  for (const dim of DIM_CODES) {
    const bucket = sums[dim];
    // Per-dimenzió padló: padló alatti n-nél a dimenzió KIMARAD (a motor a
    // hiányzó observer-dimenziónál a self értékre esik vissza).
    if (bucket && bucket.n >= MIN_RATERS_FOR_ANONYMOUS_AGGREGATE) {
      dims[dim] = Math.round(bucket.sum / bucket.n);
    }
  }
  return { dims, raterCount };
}
