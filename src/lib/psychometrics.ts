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
// A hat fő dimenzió itemei számítanak (a kiegészítő altruizmus-skála nem);
// a korábbi kézzel átlagolt konstansok (9.5 / 2.5) helyett a bank a
// forrás — invariáns-teszt: tests/unit/scoring/psychometrics.test.ts.
//
// 2026-08-11 óta a rövid forma MINDEN itemje fő-dimenziós: 60 item,
// dimenziónként pontosan 10 (korábban 58 + 2 altruizmus). Ez mozgatja a
// SEM-et (10,36 → 10,23) és vele a DIFF_MIN_GAP-et (15 → 14) — a küszöb
// nem itt él (kliens-bundle), hanem a personality-type.ts literáljában,
// amit a fenti invariáns-teszt köt ide.
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

/**
 * Két FÜGGETLEN pontszám KÜLÖNBSÉGÉNEK standard hibája: SE(diff) = √2·SEM.
 * Minden „a sorrend/gap a mérési hibán belül van?" döntés EZT használja, nem az
 * egy-pontos SEM-et — két hiba-bearing pont különbsége √2-szer zajosabb, mint
 * egy pont. (A korábbi 1×SEM-kapu ~40%-kal alul-becsülte a különbség hibáját.)
 *
 * FONTOS: ez BELSŐ logikai küszöb — eldönti, MIKOR NE állítsunk sorrendet/
 * címkét. A felületen mérési-hiba SZÁM (±) NEM jelenik meg (2026-08-11 termék-
 * döntés: a ± nem kerül ki a UI-ra, a magyarázat külön, központi leírásban él).
 */
export function diffStandardError(form: AssessmentForm): number {
  return Math.SQRT2 * dimStandardError(form);
}
