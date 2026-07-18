// TRITAN — a Trita hatfaktoros személyiségmodellje.
//
// T·R·I·T·A·N = Tempo · Resonance · Integrity · Thoroughness ·
// Adaptability · opeNness (az N a szó belsejéből).
//
// A dimenziókódok 4 betűsek (a mozaikszóban két T van, ezért egybetűs kód
// nem lehetséges): TEMP · RESO · INTE · THOR · ADAP · OPEN.
// A felületen a TRITAN megjelenítés él (radar-betűk, sorrend, kifejtés).
// A DB is natívan TRITAN-kódokat tárol (2026-07-16-i tiszta újraindítás).
// Indoklás és elnevezési térkép: docs/product/tritan-naming.md.

export type TritanDimCode = "TEMP" | "RESO" | "INTE" | "THOR" | "ADAP" | "OPEN";

export const TRITAN_MODEL_NAME = "TRITAN";

/** Kanonikus TRITAN-sorrend (a mozaikszó betűrendje: T·R·I·T·A·N). */
export const TRITAN_ORDER: TritanDimCode[] = [
  "TEMP",
  "RESO",
  "INTE",
  "THOR",
  "ADAP",
  "OPEN",
];

export const TRITAN_DIMENSIONS: Record<
  TritanDimCode,
  { hu: string; en: string; letter: string }
> = {
  INTE: { hu: "Integritás", en: "Integrity", letter: "I" },
  RESO: { hu: "Rezonancia", en: "Resonance", letter: "R" },
  TEMP: { hu: "Társas energia", en: "Tempo", letter: "T" },
  ADAP: { hu: "Alkalmazkodás", en: "Adaptability", letter: "A" },
  THOR: { hu: "Tervezettség", en: "Thoroughness", letter: "T" },
  OPEN: { hu: "Nyitottság", en: "Openness", letter: "N" },
};

/**
 * Rövid tengely-címkék (radar, kompakt chipek). A TRITAN-betűk helyett
 * 3 betűs rövidítés — a mozaikszóban két T is van, ami tengelycímkeként
 * összetéveszthető lenne.
 */
export const TRITAN_DIM_ABBR: Record<TritanDimCode, { hu: string; en: string }> = {
  INTE: { hu: "INT", en: "INT" },
  RESO: { hu: "REZ", en: "RES" },
  TEMP: { hu: "TÁR", en: "TEM" },
  ADAP: { hu: "ALK", en: "ADA" },
  THOR: { hu: "TER", en: "THO" },
  OPEN: { hu: "NYI", en: "OPE" },
};

/** Mondatba illő, kisbetűs alakok (magyarázó szövegekhez). */
export const TRITAN_DIMENSIONS_LOWER: Record<TritanDimCode, { hu: string; en: string }> = {
  INTE: { hu: "integritás", en: "integrity" },
  RESO: { hu: "rezonancia", en: "resonance" },
  TEMP: { hu: "társas energia", en: "tempo" },
  ADAP: { hu: "alkalmazkodás", en: "adaptability" },
  THOR: { hu: "tervezettség", en: "thoroughness" },
  OPEN: { hu: "nyitottság", en: "openness" },
};

/** Facet-nevek a kérdésbank facet-kódjai szerint. */
export const TRITAN_FACETS: Record<string, { hu: string; en: string }> = {
  // INTE — Integritás
  sincerity: { hu: "Egyenesség", en: "Sincerity" },
  fairness: { hu: "Méltányosság", en: "Fairness" },
  greed_avoidance: { hu: "Mértékletesség", en: "Moderation" },
  modesty: { hu: "Szerénység", en: "Modesty" },
  // RESO — Rezonancia
  fearfulness: { hu: "Óvatosság", en: "Caution" },
  anxiety: { hu: "Stresszérzékenység", en: "Stress Sensitivity" },
  dependence: { hu: "Támaszkeresés", en: "Support Seeking" },
  sentimentality: { hu: "Érzelmi kötődés", en: "Emotional Bonding" },
  // TEMP — Társas energia / Tempo
  social_self_esteem: { hu: "Társas önbizalom", en: "Social Confidence" },
  social_boldness: { hu: "Fellépés", en: "Presence" },
  sociability: { hu: "Társaságkedvelés", en: "Sociability" },
  liveliness: { hu: "Lendület", en: "Vitality" },
  // ADAP — Alkalmazkodás
  forgiveness: { hu: "Megbocsátás", en: "Forgiveness" },
  gentleness: { hu: "Elfogadás", en: "Acceptance" },
  flexibility: { hu: "Rugalmasság", en: "Flexibility" },
  patience: { hu: "Türelem", en: "Patience" },
  // THOR — Tervezettség
  organization: { hu: "Rendszerezettség", en: "Organization" },
  diligence: { hu: "Kitartás", en: "Persistence" },
  perfectionism: { hu: "Precizitás", en: "Precision" },
  prudence: { hu: "Megfontoltság", en: "Deliberation" },
  // OPEN — Nyitottság
  aesthetic_appreciation: { hu: "Esztétikai fogékonyság", en: "Aesthetic Sensitivity" },
  inquisitiveness: { hu: "Kíváncsiság", en: "Curiosity" },
  creativity: { hu: "Alkotókedv", en: "Creativity" },
  unconventionality: { hu: "Rendhagyó gondolkodás", en: "Unconventional Thinking" },
};

/** Intersticiális altruizmus-skála. */
export const TRITAN_ALTRUISM = { hu: "Segítőkészség", en: "Helpfulness" };
