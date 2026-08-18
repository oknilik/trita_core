export type DimensionTier = "high" | "mid" | "low";

// TIER-küszöb (≥70 magas, ≥40 közepes) — ma már CSAK a rövid SZÖVEGES
// SZINT-címkét (magas/közepes/alacsony) és néhány próza-kaput vezérel.
//
// A CÍMKE VALENCIA-MENTES (2026-08-18). Korábban „erősség / mérsékelt /
// figyelendő" volt — ÉRTÉKELŐ szókincs egy LEÍRÓ skálán, vagyis pontosan az
// a hiba, amit a színnél 2026-08-11-én már kijavítottunk (a `tierColors`
// értékelő rámpa kivezetése). Három baja volt:
//  1. a 0–100 nem teljesítmény-skála: a magas Extraverzió nem „jobb", mint a
//     közepes Becsületesség-Alázat, a szekció saját alcíme is ezt mondja
//     („a dimenziók nem skatulyák, minősítések vagy percentilisek");
//  2. a 70-es vágás a MÉRÉSI HIBÁN BELÜL van (dimenzió-SEM a rövid formán
//     ≈7,6 pont) — a téves besorolás ára szint-szónál kerekítési
//     pontatlanság, valencia-szónál viszont ítélet;
//  3. külön-esetet szült: a fordított kódolású Emocionalitáson a
//     „figyelendő" hazudott, ezért egy pólus-tudatos folt (a kivezetett
//     `poleAwareDimensionLabel`) írta felül „stabil"-ra. Semleges szint-szóval
//     a folt tárgytalan — „alacsony Emocionalitás" tényállítás, nem verdikt.
//
// A VALENCIA NEM TŰNIK EL A TERMÉKBŐL, csak elköltözik: a „mi visz előre /
// mire figyelj" ítélet a NARRATÍV slotoké (workstyle-content HowYouWork
// mintázat-kártyái, a score-valence.ts kapuján át), nem a pontszám melletti
// címkéé. Doktrína: pontszám mellé szint-szó, narratíva mellé funkció —
// pontszám soha nem kap valenciát.
//
// SZÍNT NEM VEZÉREL (2026-08-11). A szín a dimenziót AZONOSÍTJA
// (color-system.ts DIMENSION_COLORS / DIMENSION_COLORS_CSS), az értéket a sáv
// hossza és a szám hordozza. Ezt a szerződést a
// tests/unit/design/dimension-color-identity.test.ts őrzi.
//
// TUDATOSAN KÜLÖN a pólus-küszöbtől (profile-engine.ts PROFILE_HIGH/LOW = 65/35),
// mert MÁS mechanizmust vezérel: az a tension-pár / interakció / pressure
// NARRATÍVA-logika kapuja (melyik pár „tüzel"), ez a megjelenített szint-szó.
// A két rendszer ezért egy 65–70 (ill. 35–40) közti pontszámnál eltérő
// besorolást adhat (67 = itt „közepes", a pólus-prózában „high") — ez a
// motor-audit F3-lelete. A besorolás ÖSSZEHANGOLÁSA (közös vágás, és melyik
// érték a kanonikus) VALÓDI kalibrációs kérdés: a nyers POMP nem normált, a
// helyes vágópont a pilot-mintától függ. Amíg az nincs, egyik tuningolt
// rendszert sem billentjük át a másikhoz — csak a duplázódás dokumentált.
export function getDimensionTier(value: number): DimensionTier {
  if (value >= 70) return "high";
  if (value >= 40) return "mid";
  return "low";
}

/**
 * Kanonikus szint-szavak a 0–100-as pontszám-sávokhoz. EGYETLEN forrás —
 * a `CATEGORY_LABELS` (profile-content.ts) is ebből származtat, hogy a
 * felületen ne futhasson kétféle szóhasználat ugyanarra a sávra.
 */
export const DIMENSION_LEVEL_LABELS: Record<DimensionTier, { hu: string; en: string }> = {
  high: { hu: "magas", en: "high" },
  mid: { hu: "közepes", en: "medium" },
  low: { hu: "alacsony", en: "low" },
};

/**
 * Egy 0–100-as pontszám szint-szava — dimenzióra ÉS facetre egyaránt (ugyanaz
 * a POMP-skála, ugyanazok a sávok). Valencia-mentes: leír, nem minősít
 * (indoklás a fájl fejkommentjében).
 *
 * A dimenzió-kódot SZÁNDÉKOSAN nem kéri: a kivezetett `poleAwareDimensionLabel`
 * azért kellett, mert a valenciás címke a fordított Emocionalitáson hamis volt
 * — szint-szónál nincs olyan dimenzió, amelyiken a „magas"/„alacsony" ne lenne
 * igaz. Új felületen NE tegyél vissza kód-függő különesetet.
 */
export function getDimensionLabel(value: number, locale: string = "hu"): string {
  const labels = DIMENSION_LEVEL_LABELS[getDimensionTier(value)];
  return locale === "en" ? labels.en : labels.hu;
}

// A `tierColors` Tailwind-térkép 2026-08-11-én KIVEZETVE (indoklás a fájl
// fejkommentjében). A dimenzió-felületek a `color-system.ts` identitás-
// palettájából dolgoznak: `dimColorsCss(code)` a DOM-on, `dimColors(code)` a
// fix médiumokon (PDF/OG/email). Az `EVAL_RAMP` maga megmarad — de a
// rendeltetése szerinti helyeken (fit-pontszám, verdikt, magabiztosság,
// adat-minőség), nem a leíró személyiség-dimenziókon.
