// ─────────────────────────────────────────────────────────────────────
// Típus-ábrák vizuális nyelvtana (2026-07-30).
//
// Nem 36 független illusztráció, hanem EGY nyelvtan kimenetei: a
// DOMINÁNS dimenzió adja a nagy bronz alapformát, a MÁSODIK legerősebb
// a vékony tinta-vonalmotívumot — pontosan úgy, ahogy a típusnév is
// épül (personality-type.ts: főnév + melléknévi színezet). Ha a kettő
// egyezik („tiszta" típus), a motívum duplázva, felerősítve jelenik meg.
//
// Miró-inspirált absztrakt kompozíció, de a TRITA palettával
// (design-tokens.ts) — nincs saját hexkód ebben a fájlban.
//
// A dimenziókódok a belső TRITAN-kódok (INTE/RESO/TEMP/ADAP/THOR/OPEN),
// a megjelenítés HEXACO-névtérben történik (ld. tritan.ts).
// ─────────────────────────────────────────────────────────────────────

import { COLORS } from "@/lib/design-tokens";

export const GLYPH_CANVAS = { width: 800, height: 900 } as const;

/** A kompozíció közepe — minden alapforma és motívum ide horgonyzódik. */
export const GLYPH_CENTER = { x: 470, y: 430 } as const;

export const GLYPH_COLORS = {
  canvas: COLORS.cream,
  form: COLORS.bronze,
  line: COLORS.ink,
  sun: COLORS.bronzeSoft,
  counterweight: COLORS.sage,
  caption: COLORS.ink,
  captionAccent: COLORS.bronzeDark,
} as const;

export type GlyphFormId = "arch" | "drop" | "comet" | "discs" | "block" | "eye";
export type GlyphMotifId =
  | "scales"
  | "resonance"
  | "bolt"
  | "rings"
  | "rungs"
  | "spiral";

export interface DimensionGlyph {
  /** Belső TRITAN-kód. */
  code: string;
  /** HEXACO-betű a feliratokhoz. */
  hexaco: string;
  /** Nagy alapforma, ha EZ a domináns dimenzió. */
  form: GlyphFormId;
  /** Vékony vonalmotívum, ha EZ a második legerősebb dimenzió. */
  motif: GlyphMotifId;
  /** Rövid, ábrára írható motívum-név (HU/EN) — dokumentációhoz, tooltiphez. */
  formName: { hu: string; en: string };
  motifName: { hu: string; en: string };
}

/** A hat dimenzió alapmotívumai. A sorrend a HEXACO-sorrendet követi. */
export const DIMENSION_GLYPHS: Record<string, DimensionGlyph> = {
  INTE: {
    code: "INTE",
    hexaco: "H",
    form: "arch",
    motif: "scales",
    formName: { hu: "kapuív", en: "arch" },
    motifName: { hu: "mérleg", en: "scales" },
  },
  RESO: {
    code: "RESO",
    hexaco: "E",
    form: "drop",
    motif: "resonance",
    formName: { hu: "csepp", en: "drop" },
    motifName: { hu: "koncentrikus ívek", en: "concentric arcs" },
  },
  TEMP: {
    code: "TEMP",
    hexaco: "X",
    form: "comet",
    motif: "bolt",
    formName: { hu: "üstökös", en: "comet" },
    motifName: { hu: "villám", en: "bolt" },
  },
  ADAP: {
    code: "ADAP",
    hexaco: "A",
    form: "discs",
    motif: "rings",
    formName: { hu: "kapcsolódó korongok", en: "linked discs" },
    motifName: { hu: "gyűrűpár", en: "ring pair" },
  },
  THOR: {
    code: "THOR",
    hexaco: "C",
    form: "block",
    motif: "rungs",
    formName: { hu: "tömb", en: "block" },
    motifName: { hu: "létrafokok", en: "rungs" },
  },
  OPEN: {
    code: "OPEN",
    hexaco: "O",
    form: "eye",
    motif: "spiral",
    formName: { hu: "szem", en: "eye" },
    motifName: { hu: "spirál", en: "spiral" },
  },
};

export const GLYPH_DIMENSION_ORDER = ["INTE", "RESO", "TEMP", "ADAP", "THOR", "OPEN"] as const;

// ── Alapformák ────────────────────────────────────────────────────────
// Mindegyik EGY zárt bronz forma (az egyéni típus egyetlen alakzat; a
// csapat-változat majd konstelláció lesz). A motívum-horgony a forma
// optikai közepe — ide kerül a vékony vonalmotívum.

export interface FormGeometry {
  /** SVG path a bronz alapformához (üstökös-csóva, ív, tömb…). */
  path?: string;
  /** Kör alakú formaelemek (üstökös feje, korong) — külön, hogy ne
   *  degenerált nagy-ívekkel kelljen kört rajzolni. */
  discs?: Array<{ cx: number; cy: number; r: number }>;
  /** Motívum-horgony (a vonalmotívum közepe). */
  anchor: { x: number; y: number };
  /** Forma-specifikus motívum-méret: a szűkebb formákban (üstökös feje,
   *  szem) kisebb motívum kell, hogy ne érjen ki a bronz felületről. */
  motifScale?: number;
  /** Karakter-akcentus: a formához tartozó apró kísérő elem. */
  accent:
    | { kind: "dot"; x: number; y: number; r: number; color: "form" | "line" }
    | { kind: "ring"; x: number; y: number; r: number };
}

export const FORM_GEOMETRY: Record<GlyphFormId, FormGeometry> = {
  // Kapuív — tartás, keret, elvek. (H · értékőr)
  arch: {
    path: "M 372 604 L 372 424 A 98 98 0 0 1 568 424 L 568 604 Z",
    anchor: { x: 470, y: 452 },
    accent: { kind: "dot", x: 470, y: 268, r: 11, color: "line" },
  },
  // Csepp — érzelmi telítettség, rezonancia. (E · empata)
  drop: {
    path: "M 470 288 C 566 404, 578 476, 524 538 C 470 598, 396 574, 384 496 C 374 434, 416 358, 470 288 Z",
    anchor: { x: 470, y: 462 },
    accent: { kind: "dot", x: 470, y: 626, r: 9, color: "form" },
  },
  // Üstökös — lendület, tempó. (X · hajtóerő)
  comet: {
    path: "M 148 718 C 268 668, 356 590, 440 460 L 478 492 C 420 585, 300 680, 160 728 Z",
    discs: [{ cx: 504, cy: 418, r: 86 }],
    anchor: { x: 504, y: 418 },
    motifScale: 0.86,
    accent: { kind: "dot", x: 600, y: 315, r: 9, color: "line" },
  },
  // Kapcsolódó korongok — együttműködés, hídépítés. (A · hídépítő)
  discs: {
    discs: [{ cx: 432, cy: 428, r: 104 }],
    anchor: { x: 432, y: 428 },
    accent: { kind: "ring", x: 566, y: 476, r: 58 },
  },
  // Tömb — rendszer, kiszámíthatóság. (C · rendszerépítő)
  block: {
    path: "M 410 306 L 570 306 A 42 42 0 0 1 612 348 L 612 512 A 42 42 0 0 1 570 554 L 410 554 A 42 42 0 0 1 368 512 L 368 348 A 42 42 0 0 1 410 306 Z",
    anchor: { x: 490, y: 430 },
    accent: { kind: "dot", x: 490, y: 244, r: 11, color: "line" },
  },
  // Szem — nyitottság, mintázat-észlelés. (O · újító)
  eye: {
    path: "M 322 428 Q 470 268 618 428 Q 470 588 322 428 Z",
    anchor: { x: 470, y: 428 },
    motifScale: 0.92,
    accent: { kind: "dot", x: 470, y: 575, r: 9, color: "form" },
  },
};

// ── Intenzitás (1–5) ──────────────────────────────────────────────────
// A domináns dimenzió erősségét a kitöltés és a vonalvastagság hordozza,
// nem külön szín. 3 = alapérték (teli forma, normál vonal).

export interface IntensityStyle {
  formFill: string;
  formFillOpacity: number;
  formStroke: string | null;
  formStrokeWidth: number;
  motifStrokeWidth: number;
  /** 5-ös szinten extra szikra-akcentus. */
  extraSparks: boolean;
}

export function intensityStyle(level: number): IntensityStyle {
  const clamped = Math.min(5, Math.max(1, Math.round(level)));
  switch (clamped) {
    case 1:
      return {
        formFill: "none",
        formFillOpacity: 1,
        formStroke: GLYPH_COLORS.form,
        formStrokeWidth: 5,
        motifStrokeWidth: 4.5,
        extraSparks: false,
      };
    case 2:
      return {
        formFill: GLYPH_COLORS.form,
        formFillOpacity: 0.24,
        formStroke: GLYPH_COLORS.form,
        formStrokeWidth: 4,
        motifStrokeWidth: 5,
        extraSparks: false,
      };
    case 4:
      return {
        formFill: GLYPH_COLORS.form,
        formFillOpacity: 1,
        formStroke: null,
        formStrokeWidth: 0,
        motifStrokeWidth: 7,
        extraSparks: false,
      };
    case 5:
      return {
        formFill: GLYPH_COLORS.form,
        formFillOpacity: 1,
        formStroke: null,
        formStrokeWidth: 0,
        motifStrokeWidth: 8.5,
        extraSparks: true,
      };
    default:
      return {
        formFill: GLYPH_COLORS.form,
        formFillOpacity: 1,
        formStroke: null,
        formStrokeWidth: 0,
        motifStrokeWidth: 5.5,
        extraSparks: false,
      };
  }
}

/** Dimenzió-pontszámból (0–100) intenzitás-szint. */
export function intensityFromScore(score: number | null | undefined): number {
  if (typeof score !== "number" || Number.isNaN(score)) return 3;
  if (score < 25) return 1;
  if (score < 40) return 2;
  if (score < 62) return 3;
  if (score < 80) return 4;
  return 5;
}

// ── Kísérőelemek pozíció-variációi ────────────────────────────────────
// Az állandó elemek (csillag, nap, ellensúly-pont, talajvonal) adják a
// családi azonosságot; a pozíció a típus-párból determinisztikusan
// variálódik, hogy a sorozat ne legyen gépies.

export interface Accompaniment {
  star: { x: number; y: number };
  sun: { x: number; y: number; r: number };
  counterweight: { x: number; y: number; r: number };
  ground: string;
}

// A csillag és a nap MINDIG ellentétes oldalra kerül (bal/jobb párban
// indexelve), így a kompozíció felső sávja nem csúszik egymásra.
const STAR_SLOTS_LEFT = [
  { x: 195, y: 185 },
  { x: 185, y: 232 },
];

const STAR_SLOTS_RIGHT = [
  { x: 640, y: 180 },
  { x: 612, y: 196 },
];

const SUN_SLOTS_LEFT = [
  { x: 170, y: 160, r: 36 },
  { x: 158, y: 196, r: 32 },
];

const SUN_SLOTS_RIGHT = [
  { x: 645, y: 150, r: 36 },
  { x: 628, y: 182, r: 33 },
];

const COUNTERWEIGHT_SLOTS = [
  { x: 672, y: 520, r: 15 },
  { x: 150, y: 540, r: 15 },
  { x: 660, y: 560, r: 13 },
  { x: 140, y: 500, r: 14 },
];

const GROUND_PATHS = [
  "M 112 762 C 240 726, 340 792, 470 752 C 560 724, 620 762, 692 730",
  "M 108 748 C 220 790, 360 722, 500 764 C 600 794, 660 740, 694 756",
  "M 110 770 C 236 742, 352 784, 468 744 C 574 708, 632 758, 690 742",
];

/** Stabil hash a típus-párra — ugyanaz a típus mindig ugyanazt az ábrát kapja. */
function pairSeed(primaryCode: string, secondaryCode: string): number {
  const key = `${primaryCode}:${secondaryCode}`;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) % 100003;
  }
  return hash;
}

export function accompaniment(primaryCode: string, secondaryCode: string): Accompaniment {
  const seed = pairSeed(primaryCode, secondaryCode);
  const starOnLeft = seed % 2 === 0;
  const slot = (seed >> 1) % 2;
  return {
    star: starOnLeft ? STAR_SLOTS_LEFT[slot] : STAR_SLOTS_RIGHT[slot],
    sun: starOnLeft ? SUN_SLOTS_RIGHT[slot] : SUN_SLOTS_LEFT[slot],
    counterweight: COUNTERWEIGHT_SLOTS[(seed >> 2) % COUNTERWEIGHT_SLOTS.length],
    ground: GROUND_PATHS[(seed >> 3) % GROUND_PATHS.length],
  };
}

/**
 * Ábra-pár a pontozott dimenzió-listából — ugyanabból a sorrendből, mint a
 * típusnév (resolvePersonalityTypeFromScores): a legerősebb adja a formát,
 * a második a motívumot. Az intenzitás a domináns dimenzió pontszámából jön.
 */
export function resolveGlyphPair(
  dimensions: ReadonlyArray<{ code: string; score: number }>,
): { primaryCode: string; secondaryCode: string; intensity: number } | null {
  const known = dimensions.filter((d) => DIMENSION_GLYPHS[d.code]);
  if (known.length < 2) return null;
  const [first, second] = [...known].sort((a, b) => b.score - a.score);
  return {
    primaryCode: first.code,
    secondaryCode: second.code,
    intensity: intensityFromScore(first.score),
  };
}

/** A típus-ábra leíró szövege (aria-label / alt) — nem dekoráció, hanem tartalom. */
export function glyphDescription(
  primaryCode: string,
  secondaryCode: string,
  typeLabel: string,
  locale: "hu" | "en",
): string {
  const primary = DIMENSION_GLYPHS[primaryCode];
  const secondary = DIMENSION_GLYPHS[secondaryCode];
  if (!primary || !secondary) return typeLabel;
  if (locale === "hu") {
    return `${typeLabel} — absztrakt típus-ábra: ${primary.formName.hu} alapforma (${primary.hexaco}) ${secondary.motifName.hu} motívummal (${secondary.hexaco}).`;
  }
  return `${typeLabel} — abstract type glyph: ${primary.formName.en} form (${primary.hexaco}) with ${secondary.motifName.en} motif (${secondary.hexaco}).`;
}
