// ─────────────────────────────────────────────────────────────────────
// Pszichometriai mag — reliabilitás → mérési hiba (SEM) → konfidencia-sáv.
//
// A pontszám önértékelés-alapú BECSLÉS: ahol a különbség a mérési hibán
// belül van, ott NEM állítunk sorrendet/címkét — ez a termék hitelességi
// alapelve. Ez a modul a KÖZÖS mag (fő személyiség-út + karrier-motor);
// a karrier-specifikus terjesztés (observer-keverés, fit-SE, klaszterezés)
// a src/lib/career/psychometrics.ts-ben él, és innen re-exportál.
//
// FIGYELEM (bundle): az item-számok a kérdésbankból (questions/tritan.ts)
// származnak MODULBETÖLTÉSKOR, így ez a modul behúzza a bankot — kliens-
// komponensből NE importáld (a kliens-felület a kerekített SEM-et proppal
// kapja, ld. profile/results/page.tsx → DimensionAccordion).
// ─────────────────────────────────────────────────────────────────────

import type { AssessmentForm } from "@/lib/questions/types";
import { tritanConfig } from "@/lib/questions/tritan";
import { TRITAN_ORDER } from "@/lib/tritan";

// ── Item-számok a TSFI bankból származtatva ──────────────────────────
// A hat fő dimenzió itemei számítanak (az intersticiális altruizmus-skála
// nem); a korábbi kézzel átlagolt konstansok (9.5 / 2.5) helyett a bank a
// forrás — invariáns-teszt: tests/unit/scoring/psychometrics.test.ts.
const MAIN_DIM_CODES = new Set<string>(TRITAN_ORDER);
const mainItems = tritanConfig.questions.filter((q) =>
  MAIN_DIM_CODES.has(q.dimension),
);
const shortMainItems = mainItems.filter((q) => q.short === true);
const mainFacetCount = new Set(
  mainItems.map((q) => q.facet).filter((f): f is string => Boolean(f)),
).size;

if (mainItems.length === 0 || shortMainItems.length === 0 || mainFacetCount === 0) {
  // Sérült bank mellett a SEM-számítás értelmezhetetlen — inkább hangosan.
  throw new Error("psychometrics: a TSFI bankból nem származtatható item-szám");
}

/** Átlagos item-szám dimenziónként, kérdőív-formánként (a reliabilitás alapja). */
export const ITEMS_PER_DIM: Record<AssessmentForm, number> = {
  short: shortMainItems.length / TRITAN_ORDER.length,
  full: mainItems.length / TRITAN_ORDER.length,
};

/** Átlagos item-szám facetenként, kérdőív-formánként. */
export const ITEMS_PER_FACET: Record<AssessmentForm, number> = {
  short: shortMainItems.length / mainFacetCount,
  full: mainItems.length / mainFacetCount,
};

/** Átlagos item-item korreláció személyiség-skálákon (konzervatív becslés). */
export const MEAN_ITEM_R = 0.22;
/** A pontszám-eloszlás szórása a 0-100 skálán (populációs becslés). */
export const SCORE_SD = 20;

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

export function bandFor(score: number, se: number): { low: number; high: number } {
  return {
    low: Math.max(0, Math.round(score - se)),
    high: Math.min(100, Math.round(score + se)),
  };
}
