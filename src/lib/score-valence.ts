// ─────────────────────────────────────────────────────────────────────
// Kanonikus valencia-kapu (motor-audit v9 szerkezeti lépés, 2026-08-11).
//
// A fordított kódolású Emocionalitás (RESO) kezelése korábban legalább hat
// fájlban élt szétszórt `!== "RESO"` literálként — a v4–v9 vak körök
// visszatérő hibaosztálya pontosan az volt, hogy egy-egy felület kimaradt
// (hol a deficit-, hol az erősség-oldalon). Innentől MINDEN
// „pontszám → erősség / kockázat / fejlesztendő" besorolás ezen a modulon
// megy át; új felületen tilos kézzel RESO-literált szűrni.
//
// TERMÉKDÖNTÉS 2026-08-11 (a korábban NYITOTT kérdés lezárva): az
// Emocionalitás (RESO) MINDKÉT pólusa, MINDKÉT felület-típuson
// valencia-mentes. Nem erősség és nem hiányosság — jellemző.
// Indok: a dimenzió facetjei a Félelem / Szorongás / Dependencia /
// Érzelmi kötődés — ezekre a saját eredményoldalon zöld „erősség" badge-et
// és „Legerősebb: Emocionalitás" chipet adni önmagával került ellentmondásba
// (egy görgetéssel lejjebb ugyanaz a pontszám „Szorongás 82"-ként jelent meg).
// A dimenzió NEM tűnik el: leírható és látható marad (pólus-próza mindkét
// oldalon ajándékkal ÉS költséggel, dimension-insights.ts), csak a
// valenciás (erősség/gyengeség) slotokból marad ki.
//
// Aktuális szabályok:
//  - Deficit / kockázat / fejlesztendő slot (alacsony pólus): a RESO SOSEM
//    kerülhet bele — az alacsony Emocionalitás stabilitás, nem gyengeség.
//  - Erősség slot (magas pólus): a RESO SOSEM kerülhet bele — sem értékelő
//    (hiring, csapat-kockázat, vezetői döntéstámogatás), sem önismereti
//    (saját eredmény, PDF, share, OG) felületen.
//
// A `surface` paraméter SZÁNDÉKOSAN megmarad: a hívási helyek jelzik vele,
// milyen kontextusban sorolnak be, és egy jövőbeli, felület-függő szabály
// (nem a RESO-ra) így nem igényel újabb call-site túrát.
// ─────────────────────────────────────────────────────────────────────

/** A fordított kódolású dimenzió belső kódja (magasabb = érzelmesebb). */
export const REVERSE_DIM_CODE = "RESO";

/**
 * Melyik felület-típuson történik a besorolás:
 *  - "self": az érintett a saját eredményét nézi (results, PDF, share);
 *  - "evaluative": másvalaki hoz róla döntést (hiring, csapat-riport
 *    kockázat-slot, vezetői/tanácsadói döntéstámogatás).
 */
export type ValenceSurface = "self" | "evaluative";

/**
 * A kód lehet `undefined` is (részleges/örökség sorokból származó lista-elem) —
 * ilyenkor nem fordított skáláról van szó, a hívónak nem kell külön őriznie.
 */
export function isReverseValenced(code: string | undefined | null): boolean {
  return code === REVERSE_DIM_CODE;
}

/**
 * Bekerülhet-e a dimenzió alacsony pólusa deficit-jellegű slotba
 * (gyengeség, kockázat, fejlesztendő terület)? A RESO-ra mindig false.
 */
export function deficitSlotEligible(code: string | undefined | null): boolean {
  return !isReverseValenced(code);
}

/**
 * Bekerülhet-e a dimenzió magas pólusa erősség-jellegű slotba?
 * A RESO-ra MINDIG false — mindkét felület-típuson (2026-08-11-i
 * termékdöntés, ld. fejléc). A `surface` a hívási hely kontextusát
 * dokumentálja; a RESO-szabály nem függ tőle.
 */
export function strengthSlotEligible(
  code: string | undefined | null,
  _surface: ValenceSurface,
): boolean {
  return !isReverseValenced(code);
}
