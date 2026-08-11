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
// Aktuális szabályok:
//  - Deficit / kockázat / fejlesztendő slot (alacsony pólus): a RESO SOSEM
//    kerülhet bele — az alacsony Emocionalitás stabilitás, nem gyengeség.
//  - Erősség slot (magas pólus): ÉRTÉKELŐ felületen (hiring, csapat-
//    kockázat, vezetői döntéstámogatás) a RESO kizárva — a magas
//    Emocionalitás nem „erősség" egy munkáltatói/vezetői döntésben.
//    Önismereti felületen (saját eredmény, PDF) jelenleg megengedett
//    („Empata" karakterjegy) — ez NYITOTT termékdöntés, ld.
//    docs/audits/motor-known-residuals.md §2.
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

export function isReverseValenced(code: string): boolean {
  return code === REVERSE_DIM_CODE;
}

/**
 * Bekerülhet-e a dimenzió alacsony pólusa deficit-jellegű slotba
 * (gyengeség, kockázat, fejlesztendő terület)? A RESO-ra mindig false.
 */
export function deficitSlotEligible(code: string): boolean {
  return !isReverseValenced(code);
}

/**
 * Bekerülhet-e a dimenzió magas pólusa erősség-jellegű slotba?
 * A RESO értékelő felületen kizárva; önismereti felületen megengedett
 * (nyitott termékdöntésig — ld. fejléc).
 */
export function strengthSlotEligible(
  code: string,
  surface: ValenceSurface,
): boolean {
  if (!isReverseValenced(code)) return true;
  return surface === "self";
}
