export type DimensionTier = "high" | "mid" | "low";

// TIER-küszöb (≥70 magas, ≥40 mérsékelt) — ma már CSAK a rövid SZÖVEGES
// címkét (erősség/mérsékelt/figyelendő, ill. a pólus-tudatos változatát) és
// néhány próza-kaput vezérel.
//
// SZÍNT NEM VEZÉREL TÖBBÉ (2026-08-11). A korábbi `tierColors` Tailwind-térkép
// (zsálya/bronz/homok) festette a dimenzió-kártyát, a keretet, a pöttyöt, a
// sávot és a számot minden felületen — kivezetve. Három baja volt:
//  1. a 70-es vágás a MÉRÉSI HIBÁN BELÜL van (dimenzió-SEM a rövid formán
//     ≈7,6 pont), tehát kategorikus határt húzott oda, ahol az instrumentum
//     nem tud különbséget tenni;
//  2. a <40 sáv ritka, így a „skála" a gyakorlatban binárissá esett össze;
//  3. ÉRTÉKELŐ rámpa volt LEÍRÓ skálán — szembement a score-valence.ts
//     termékdöntésével (az Emocionalitás mindkét pólusa valencia-mentes).
// A szín mostantól a dimenziót AZONOSÍTJA (color-system.ts DIMENSION_COLORS /
// DIMENSION_COLORS_CSS), az értéket a sáv hossza és a szám hordozza. Ezt a
// szerződést a tests/unit/design/dimension-color-identity.test.ts őrzi.
//
// TUDATOSAN KÜLÖN a pólus-küszöbtől (profile-engine.ts PROFILE_HIGH/LOW = 65/35),
// mert MÁS mechanizmust vezérel: az a tension-pár / interakció / pressure
// NARRATÍVA-logika kapuja (melyik pár „tüzel"), ez a vizuális erősség-jelölés.
// A két rendszer ezért egy 65–70 (ill. 35–40) közti pontszámnál eltérő
// besorolást adhat (67 = itt „mid", a pólus-prózában „high") — ez a
// motor-audit F3-lelete. A besorolás ÖSSZEHANGOLÁSA (közös vágás, és melyik
// érték a kanonikus) VALÓDI kalibrációs kérdés: a nyers POMP nem normált, a
// helyes vágópont a pilot-mintától függ. Amíg az nincs, egyik tuningolt
// rendszert sem billentjük át a másikhoz — csak a duplázódás dokumentált.
export function getDimensionTier(value: number): DimensionTier {
  if (value >= 70) return "high";
  if (value >= 40) return "mid";
  return "low";
}

export function getDimensionLabel(value: number, locale: string = "hu"): string {
  const labels: Record<string, Record<string, string>> = {
    high: { hu: "erősség", en: "strength" },
    mid: { hu: "mérsékelt", en: "moderate" },
    low: { hu: "figyelendő", en: "watch" },
  };
  const tier = getDimensionTier(value);
  return labels[tier]?.[locale] ?? labels[tier]?.hu ?? "";
}

// A `tierColors` Tailwind-térkép 2026-08-11-én KIVEZETVE (indoklás a fájl
// fejkommentjében). A dimenzió-felületek a `color-system.ts` identitás-
// palettájából dolgoznak: `dimColorsCss(code)` a DOM-on, `dimColors(code)` a
// fix médiumokon (PDF/OG/email). Az `EVAL_RAMP` maga megmarad — de a
// rendeltetése szerinti helyeken (fit-pontszám, verdikt, magabiztosság,
// adat-minőség), nem a leíró személyiség-dimenziókon.
