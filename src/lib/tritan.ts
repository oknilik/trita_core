// HEXACO — a platform hatfaktoros személyiségmodelljének megjelenítési
// térképe (2026-07-29: a TRITAN-elnevezés kivezetve, vissza a HEXACO
// jelölésekre — az itemek IPIP–HEXACO eredete miatt ez a hiteles keret).
//
// FONTOS: a BELSŐ dimenziókódok (TEMP/RESO/INTE/THOR/ADAP/OPEN) és az
// export-azonosítók (TRITAN_*) változatlanok — a DB-ben tárolt score-JSON-ok
// ezeket a kulcsokat használják, a csere csak a MEGJELENÍTÉSI értékeket
// érinti. Kód↔HEXACO megfeleltetés:
//   INTE→H (Honesty-Humility) · RESO→E (Emotionality) · TEMP→X (eXtraversion)
//   ADAP→A (Agreeableness) · THOR→C (Conscientiousness) · OPEN→O (Openness)
// Történet: docs/product/tritan-naming.md (a TRITAN-korszak dokumentuma).

export type TritanDimCode = "TEMP" | "RESO" | "INTE" | "THOR" | "ADAP" | "OPEN";

export const TRITAN_MODEL_NAME = "HEXACO";

/** Kanonikus HEXACO-sorrend: H · E · X · A · C · O. */
export const TRITAN_ORDER: TritanDimCode[] = [
  "INTE",
  "RESO",
  "TEMP",
  "ADAP",
  "THOR",
  "OPEN",
];

export const TRITAN_DIMENSIONS: Record<
  TritanDimCode,
  { hu: string; en: string; letter: string }
> = {
  INTE: { hu: "Becsületesség-Alázat", en: "Honesty-Humility", letter: "H" },
  RESO: { hu: "Emocionalitás", en: "Emotionality", letter: "E" },
  TEMP: { hu: "Extraverzió", en: "Extraversion", letter: "X" },
  ADAP: { hu: "Barátságosság", en: "Agreeableness", letter: "A" },
  THOR: { hu: "Lelkiismeretesség", en: "Conscientiousness", letter: "C" },
  OPEN: { hu: "Nyitottság", en: "Openness", letter: "O" },
};

/**
 * Rövid tengely-címkék (radar, kompakt chipek) — a HEXACO standard
 * egybetűs jelölései.
 */
export const TRITAN_DIM_ABBR: Record<TritanDimCode, { hu: string; en: string }> = {
  INTE: { hu: "H", en: "H" },
  RESO: { hu: "E", en: "E" },
  TEMP: { hu: "X", en: "X" },
  ADAP: { hu: "A", en: "A" },
  THOR: { hu: "C", en: "C" },
  OPEN: { hu: "O", en: "O" },
};

/** Mondatba illő, kisbetűs alakok (magyarázó szövegekhez). */
export const TRITAN_DIMENSIONS_LOWER: Record<TritanDimCode, { hu: string; en: string }> = {
  INTE: { hu: "becsületesség-alázat", en: "honesty-humility" },
  RESO: { hu: "emocionalitás", en: "emotionality" },
  TEMP: { hu: "extraverzió", en: "extraversion" },
  ADAP: { hu: "barátságosság", en: "agreeableness" },
  THOR: { hu: "lelkiismeretesség", en: "conscientiousness" },
  OPEN: { hu: "nyitottság", en: "openness" },
};

/** Facet-nevek a kérdésbank facet-kódjai szerint (HEXACO-PI-R terminológia). */
export const TRITAN_FACETS: Record<string, { hu: string; en: string }> = {
  // INTE — Becsületesség-Alázat (H)
  sincerity: { hu: "Őszinteség", en: "Sincerity" },
  fairness: { hu: "Méltányosság", en: "Fairness" },
  greed_avoidance: { hu: "Mohóságkerülés", en: "Greed Avoidance" },
  modesty: { hu: "Szerénység", en: "Modesty" },
  // RESO — Emocionalitás (E)
  fearfulness: { hu: "Félelem", en: "Fearfulness" },
  anxiety: { hu: "Szorongás", en: "Anxiety" },
  dependence: { hu: "Dependencia", en: "Dependence" },
  sentimentality: { hu: "Szentimentalitás", en: "Sentimentality" },
  // TEMP — Extraverzió (X)
  social_self_esteem: { hu: "Társas önértékelés", en: "Social Self-Esteem" },
  social_boldness: { hu: "Társas merészség", en: "Social Boldness" },
  sociability: { hu: "Társaságkedvelés", en: "Sociability" },
  liveliness: { hu: "Élénkség", en: "Liveliness" },
  // ADAP — Barátságosság (A)
  forgiveness: { hu: "Megbocsátás", en: "Forgivingness" },
  gentleness: { hu: "Gyengédség", en: "Gentleness" },
  flexibility: { hu: "Rugalmasság", en: "Flexibility" },
  patience: { hu: "Türelem", en: "Patience" },
  // THOR — Lelkiismeretesség (C)
  organization: { hu: "Szervezettség", en: "Organization" },
  diligence: { hu: "Szorgalom", en: "Diligence" },
  perfectionism: { hu: "Perfekcionizmus", en: "Perfectionism" },
  prudence: { hu: "Körültekintés", en: "Prudence" },
  // OPEN — Nyitottság (O)
  aesthetic_appreciation: { hu: "Esztétikai fogékonyság", en: "Aesthetic Appreciation" },
  inquisitiveness: { hu: "Kíváncsiság", en: "Inquisitiveness" },
  creativity: { hu: "Kreativitás", en: "Creativity" },
  unconventionality: { hu: "Konvenciómentesség", en: "Unconventionality" },
};

/** Intersticiális altruizmus-skála (HEXACO interstitial). */
export const TRITAN_ALTRUISM = { hu: "Altruizmus", en: "Altruism" };
