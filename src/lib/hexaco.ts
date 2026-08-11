// HEXACO — a platform hatfaktoros személyiségmodelljének KANONIKUS térképe.
//
// 2026-08-11: a belső dimenziókódok (INTE/RESO/TEMP/ADAP/THOR/OPEN) és a
// TRITAN_* export-azonosítók KIVEZETVE — a kód és a felület egyaránt a
// HEXACO-betűkkel dolgozik (H · E · X · A · C · O). Indok: a két párhuzamos
// névrendszer (belső kód + megjelenített HEXACO-címke) folyamatos
// keveredés-forrás volt; a v4–v9 vak körök leletei között többször szerepelt,
// hogy egy felület a belső kódot mutatta vagy a rossz térképet használta.
//
// LEGACY-KOMPATIBILITÁS (kötelező): a DB-ben már TÁROLT score-JSON-ok a régi
// kulcsokat használják. Minden olvasási úton normalizálni kell —
// `normalizeDimensionKeys` / `normalizeFacetKeys` (lásd lent), amit a
// kanonikus olvasó (`extractDimensionScores`, scoring.ts) alkalmaz. Új írás
// már HEXACO-kulccsal történik. A `TestType.TRITAN` prisma-enum NEM változik
// (DB-érték, migrációt igényelne) — ez tudatos maradék.
// Történet: docs/product/tritan-naming.md

export type HexacoCode = "H" | "E" | "X" | "A" | "C" | "O";

export const HEXACO_MODEL_NAME = "HEXACO";

/** Kanonikus HEXACO-sorrend: H · E · X · A · C · O. */
export const HEXACO_ORDER: HexacoCode[] = ["H", "E", "X", "A", "C", "O"];

/**
 * Örökség-kód → HEXACO-betű. A tárolt score-JSON-ok (és a régi seed-ek)
 * ezeket a kulcsokat használják; olvasáskor ezen a térképen jönnek át.
 */
export const LEGACY_DIM_CODE_MAP: Record<string, HexacoCode> = {
  INTE: "H",
  RESO: "E",
  TEMP: "X",
  ADAP: "A",
  THOR: "C",
  OPEN: "O",
};

/** A kiegészítő (intersticiális) altruizmus-skála kódja — nem fő dimenzió. */
export const ALTRUISM_CODE = "I";

export const HEXACO_DIMENSIONS: Record<
  HexacoCode,
  { hu: string; en: string; letter: HexacoCode }
> = {
  H: { hu: "Becsületesség-Alázat", en: "Honesty-Humility", letter: "H" },
  E: { hu: "Emocionalitás", en: "Emotionality", letter: "E" },
  X: { hu: "Extraverzió", en: "Extraversion", letter: "X" },
  A: { hu: "Barátságosság", en: "Agreeableness", letter: "A" },
  C: { hu: "Lelkiismeretesség", en: "Conscientiousness", letter: "C" },
  O: { hu: "Nyitottság", en: "Openness", letter: "O" },
};

export function isHexacoCode(code: string | undefined | null): code is HexacoCode {
  return typeof code === "string" && code in HEXACO_DIMENSIONS;
}

/**
 * Tetszőleges (örökség vagy kanonikus) dimenziókód → HEXACO-betű.
 * Ismeretlen kódra `null` — a hívó dönt (kihagyás vs fallback).
 */
export function toHexacoCode(code: string | undefined | null): HexacoCode | null {
  if (!code) return null;
  if (isHexacoCode(code)) return code;
  return LEGACY_DIM_CODE_MAP[code] ?? null;
}

/**
 * HEXACO-betű megjelenítéshez — badge-ek, chipek, radar-tengelyek.
 * KANONIKUS feloldó: a felületeken nyers belső/örökség kód soha nem
 * jelenhet meg; ismeretlen kódra a bemenetet adja vissza.
 */
export function hexLetter(code: string): string {
  return toHexacoCode(code) ?? code;
}

/** Mondatba illő, kisbetűs alakok (magyarázó szövegekhez). */
export const HEXACO_DIMENSIONS_LOWER: Record<HexacoCode, { hu: string; en: string }> = {
  H: { hu: "becsületesség-alázat", en: "honesty-humility" },
  E: { hu: "emocionalitás", en: "emotionality" },
  X: { hu: "extraverzió", en: "extraversion" },
  A: { hu: "barátságosság", en: "agreeableness" },
  C: { hu: "lelkiismeretesség", en: "conscientiousness" },
  O: { hu: "nyitottság", en: "openness" },
};

/**
 * Determinisztikus rangsor pontozott dimenzió-listára: pontszám szerint
 * csökkenő, holtversenynél a kanonikus sorrend (HEXACO_ORDER) dönt — minden
 * felület (vendég-teaser, eredményoldal, share) ugyanezt használja, hogy
 * azonos pontszámokra azonos top-lista (és archetípus) szülessen.
 */
export function rankDimensionScores<T extends { code: string; score: number }>(
  entries: ReadonlyArray<T>,
): T[] {
  const orderIndex = (code: string) => {
    const hex = toHexacoCode(code);
    const idx = hex ? HEXACO_ORDER.indexOf(hex) : -1;
    return idx === -1 ? HEXACO_ORDER.length : idx;
  };
  return [...entries].sort(
    (a, b) => b.score - a.score || orderIndex(a.code) - orderIndex(b.code),
  );
}

/**
 * Facet-nevek a kérdésbank facet-kódjai szerint (HEXACO-PI-R terminológia).
 * A NEVEK KANONIKUS FORRÁSA A KÉRDÉSBANK (questions/ FacetConfig labeljei) —
 * ez a térkép ahhoz igazodik, és guardrail-teszt őrzi
 * (tests/unit/results/dimension-facet-map.test.ts): a zárt teaser és a
 * feloldott akkordeon így soha nem mutat eltérő alskála-nevet.
 */
export const HEXACO_FACETS: Record<string, { hu: string; en: string }> = {
  // H — Becsületesség-Alázat
  sincerity: { hu: "Őszinteség", en: "Sincerity" },
  fairness: { hu: "Méltányosság", en: "Fairness" },
  greed_avoidance: { hu: "Mohóságkerülés", en: "Greed Avoidance" },
  modesty: { hu: "Szerénység", en: "Modesty" },
  // E — Emocionalitás
  fearfulness: { hu: "Félelem", en: "Fearfulness" },
  anxiety: { hu: "Szorongás", en: "Anxiety" },
  dependence: { hu: "Dependencia", en: "Dependence" },
  sentimentality: { hu: "Szentimentalitás", en: "Sentimentality" },
  // X — Extraverzió
  social_self_esteem: { hu: "Társas önértékelés", en: "Social Self-Esteem" },
  social_boldness: { hu: "Társas merészség", en: "Social Boldness" },
  sociability: { hu: "Társaságkedvelés", en: "Sociability" },
  liveliness: { hu: "Élénkség", en: "Liveliness" },
  // A — Barátságosság
  forgiveness: { hu: "Megbocsátás", en: "Forgiveness" },
  gentleness: { hu: "Gyengédség", en: "Gentleness" },
  flexibility: { hu: "Rugalmasság", en: "Flexibility" },
  patience: { hu: "Türelem", en: "Patience" },
  // C — Lelkiismeretesség
  organization: { hu: "Szervezettség", en: "Organization" },
  diligence: { hu: "Szorgalom", en: "Diligence" },
  perfectionism: { hu: "Perfekcionizmus", en: "Perfectionism" },
  prudence: { hu: "Körültekintés", en: "Prudence" },
  // O — Nyitottság
  aesthetic_appreciation: { hu: "Esztétikai fogékonyság", en: "Aesthetic Appreciation" },
  inquisitiveness: { hu: "Kíváncsiság", en: "Inquisitiveness" },
  creativity: { hu: "Kreativitás", en: "Creativity" },
  unconventionality: { hu: "Konvenciómentesség", en: "Unconventionality" },
};

/** Dimenzió → facet-kódok, a kérdésbank sorrendjében. */
export const HEXACO_DIMENSION_FACETS: Record<HexacoCode, readonly string[]> = {
  H: ["sincerity", "fairness", "greed_avoidance", "modesty"],
  E: ["fearfulness", "anxiety", "dependence", "sentimentality"],
  X: ["social_self_esteem", "social_boldness", "sociability", "liveliness"],
  A: ["forgiveness", "gentleness", "flexibility", "patience"],
  C: ["organization", "diligence", "perfectionism", "prudence"],
  O: ["aesthetic_appreciation", "inquisitiveness", "creativity", "unconventionality"],
};

/** Egy dimenzió lokalizált facet-nevei (pl. upsell-teaser felsorolás). */
export function dimensionFacetNames(code: string, locale: "hu" | "en"): string[] {
  const hex = toHexacoCode(code);
  const facetCodes = hex ? HEXACO_DIMENSION_FACETS[hex] : undefined;
  if (!facetCodes) return [];
  return facetCodes
    .map((facet) => HEXACO_FACETS[facet]?.[locale])
    .filter((name): name is string => Boolean(name));
}

// ─────────────────────────────────────────────────────────────────────
// Örökség-normalizálás (a tárolt score-JSON-ok olvasásához)
// ─────────────────────────────────────────────────────────────────────

/**
 * Dimenzió-pontszám map kulcsainak normalizálása HEXACO-betűkre.
 * - a már kanonikus kulcsok változatlanul mennek át;
 * - az örökség-kódok (INTE/RESO/…) átfordulnak;
 * - a kiegészítő `I` skála MEGMARAD (nem fő dimenzió, de valós adat);
 * - minden más kulcs kimarad (a korábbi „flat legacy" sorokban `answers`,
 *   `questionCount` stb. is szerepelhetett — azok nem pontszámok).
 * Ha ugyanaz a dimenzió mindkét alakban jelen van, a KANONIKUS nyer.
 */
export function normalizeDimensionKeys(
  raw: Record<string, unknown> | null | undefined,
): Record<string, number> {
  const out: Record<string, number> = {};
  if (!raw) return out;
  // Első kör: örökség-kulcsok — hogy a kanonikus felülírhassa őket.
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    if (isHexacoCode(key) || key === ALTRUISM_CODE) continue;
    const hex = LEGACY_DIM_CODE_MAP[key];
    if (hex) out[hex] = value;
  }
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    if (isHexacoCode(key) || key === ALTRUISM_CODE) out[key] = value;
  }
  return out;
}

/**
 * Facet-map kulcsainak normalizálása: a KÜLSŐ kulcs (dimenzió) fordul át,
 * a facet-kódok változatlanok. Nem-szám értékek és ismeretlen dimenziók
 * kimaradnak.
 */
export function normalizeFacetKeys(
  raw: Record<string, unknown> | null | undefined,
): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {};
  if (!raw) return out;
  for (const [dimKey, facetMap] of Object.entries(raw)) {
    if (!facetMap || typeof facetMap !== "object") continue;
    const hex =
      isHexacoCode(dimKey) || dimKey === ALTRUISM_CODE
        ? dimKey
        : LEGACY_DIM_CODE_MAP[dimKey];
    if (!hex) continue;
    const values: Record<string, number> = {};
    for (const [facetCode, value] of Object.entries(facetMap as Record<string, unknown>)) {
      if (typeof value === "number" && Number.isFinite(value)) values[facetCode] = value;
    }
    // A már meglévő (kanonikus kulcsú) bejegyzést nem írjuk felül örökségivel.
    if (Object.keys(values).length > 0 && !out[hex]) out[hex] = values;
    else if (Object.keys(values).length > 0 && isHexacoCode(dimKey)) out[hex] = values;
  }
  return out;
}
