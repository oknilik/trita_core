// ─────────────────────────────────────────────────────────────────────
// Kanonikus valencia-kapu (motor-audit v9 szerkezeti lépés, 2026-08-11).
//
// A fordított kódolású Emocionalitás (E) kezelése korábban legalább hat
// fájlban élt szétszórt `!== "E"` literálként — a v4–v9 vak körök
// visszatérő hibaosztálya pontosan az volt, hogy egy-egy felület kimaradt
// (hol a deficit-, hol az erősség-oldalon). Innentől MINDEN
// „pontszám → erősség / kockázat / fejlesztendő" besorolás ezen a modulon
// megy át; új felületen tilos kézzel E-literált szűrni.
//
// TERMÉKDÖNTÉS 2026-08-11 (a korábban NYITOTT kérdés lezárva): az
// Emocionalitás (E) MINDKÉT pólusa, MINDKÉT felület-típuson
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
//  - Deficit / kockázat / fejlesztendő slot (alacsony pólus): a E SOSEM
//    kerülhet bele — az alacsony Emocionalitás stabilitás, nem gyengeség.
//  - Erősség slot (magas pólus): a E SOSEM kerülhet bele — sem értékelő
//    (hiring, csapat-kockázat, vezetői döntéstámogatás), sem önismereti
//    (saját eredmény, PDF, share, OG) felületen.
//
// A `surface` paraméter SZÁNDÉKOSAN megmarad: a hívási helyek jelzik vele,
// milyen kontextusban sorolnak be, és egy jövőbeli, felület-függő szabály
// (nem a E-ra) így nem igényel újabb call-site túrát.
// ─────────────────────────────────────────────────────────────────────

/** A fordított kódolású dimenzió belső kódja (magasabb = érzelmesebb). */
export const REVERSE_DIM_CODE = "E";

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
 * (gyengeség, kockázat, fejlesztendő terület)? A E-ra mindig false.
 */
export function deficitSlotEligible(code: string | undefined | null): boolean {
  return !isReverseValenced(code);
}

/**
 * Bekerülhet-e a dimenzió magas pólusa erősség-jellegű slotba?
 * A E-ra MINDIG false — mindkét felület-típuson (2026-08-11-i
 * termékdöntés, ld. fejléc). A `surface` a hívási hely kontextusát
 * dokumentálja; a E-szabály nem függ tőle.
 */
export function strengthSlotEligible(
  code: string | undefined | null,
  _surface: ValenceSurface,
): boolean {
  return !isReverseValenced(code);
}

// ─────────────────────────────────────────────────────────────────────
// Tension-párok hangneme (2026-08-11, a `risk: boolean` kivezetése).
//
// A profile-engine TENSION_PAIRS táblája korábban logikai `risk` jelzőt
// hordozott. Ez strukturálisan valenciás volt: a hat dimenzió közül
// EGYEDÜL a E-magas párok voltak `risk: true`, vagyis a fordított skála
// magas pólusa mindig borostyán „Figyelendő" kártyát kapott, az alacsony
// pólusa zöldet — pontosan az a valencia, amit a fenti termékdöntés
// elvet. Kétállapotú jelzővel nem is lehetett másképp: minden pár vagy
// „pozitív feloldás", vagy „kockázat" volt.
//
// Ezért három hangnem:
//  - "resolution" — pozitív/semleges feloldás-narratíva;
//  - "risk"       — valódi figyelendő mintázat, valenciát hordozó
//                   dimenziókon;
//  - "note"       — valódi, cselekvésre váltható mintázat-megfigyelés,
//                   amit TILOS hiányosságként keretezni (a fordított
//                   skálából eredő párok ide kerülnek).
//
// A besorolás ITT dől el (nem a hívási helyeken): egy jövőbeli valencia-
// döntés egyetlen fájlt érint.
// ─────────────────────────────────────────────────────────────────────

/** A tartalmi táblában deklarált (szerzői) hangnem. */
export type DeclaredPairTone = "resolution" | "risk";

/** A megjelenítendő hangnem — a valencia-kapu kimenete. */
export type PairTone = DeclaredPairTone | "note";

/**
 * Egy tension-pár tagja: dimenzió-kód + a pólus, amelyen a pár tüzel.
 * A szintet SZÁNDÉKOSAN kéri a helper (nem csak a kódot): a jelenlegi
 * szabály nem használja, de a pólus-függő valencia-döntés így nem igényel
 * újabb call-site túrát.
 */
export type PairMember = {
  code: string;
  level: "high" | "medium" | "low";
};

/**
 * Egy tension-pár megjelenítendő hangneme.
 *
 * Szabályok:
 *  1. Deklarált „risk" + fordított skálájú tag → "note". Az E egyik pólusa
 *     sem hiányosság, tehát deficit-keretes („Figyelendő") kártyára nem
 *     kerülhet — a TARTALOM viszont nem vész el, semleges slotba megy.
 *  2. Deklarált „resolution" + fordított skálájú tag ÉRTÉKELŐ felületen
 *     → "note". Az értékelő felület (hiring) a feloldás-párokra zöld
 *     „Erősség" badge-et tesz; az alacsony E-t erősségként címkézni
 *     ugyanaz a valencia, csak tükrözve. Önismereti felületen a
 *     feloldás-narratíva nem hordoz valenciás címkét (folyó szöveg), ott
 *     nincs mit kapuzni — marad "resolution".
 *  3. Minden más eset: a deklarált hangnem.
 */
export function resolvePairTone(
  declared: DeclaredPairTone,
  members: ReadonlyArray<PairMember>,
  surface: ValenceSurface,
): PairTone {
  const touchesReverse = members.some((m) => isReverseValenced(m.code));
  if (!touchesReverse) return declared;
  if (declared === "risk") return "note";
  return surface === "evaluative" ? "note" : "resolution";
}
