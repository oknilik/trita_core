import { COLORS } from "@/lib/design-tokens";

/**
 * trita szín-rendszer — szemantikus térképek (web + PDF + OG + email).
 *
 * Terv és leltár: docs/development/color-system-2026-08.md (2. fejezet +
 * 5. fejezet LEZÁRT döntési kör). Négy jelentés-osztály, egy hue csak egy
 * osztályban élhet:
 *   1. neutrális alap (cream/ink/sand — design-tokens.COLORS)
 *   2. réteg-akcent („hol vagyok") — LAYER_THEMES
 *   3. adat-identitás („mit látok") — DIMENSION_COLORS, TEAM_ROLE_FAMILIES
 *   4. státusz + értékelő ramp — STATE_SOLID, EVAL_RAMP
 *
 * A CSS-oldali tükör a globals.css @theme blokkja (--color-dim-*,
 * --color-layer-*, --color-role-*, --color-eval-*, --color-state-*-solid);
 * a szinkront a tests/unit/design/design-tokens-sync.test.ts őrzi.
 * Ez a modul hexben beszél, mert a react-pdf (Node) és az OG-képek
 * (edge runtime) nem olvasnak CSS-változót.
 */

// ─── HEXACO dimenzió-paletta (kanonikus, minden médiumra) ────────────────────
// L*-lépcső: H 41 · E 46 · C 50 · O 53 · A 56 · X 62 — grayscale-ben és
// CVD-szimulációban is lépcsőzik. E/O hue-döntés (doksi 5. fejezet):
// E = viola (introspektív-semleges, nem riadó-rózsaszín), O = mályva.
// Nincs piros, success-zöld vagy warning-amber a hat hue között — a
// dimenzió identitást kódol, nem értéket.

export type DimCode = "H" | "E" | "X" | "A" | "C" | "O";

export interface DimColorTriple {
  /** Mark (sáv, cella, pötty, radar) — fehér kártyán ≥3:1. */
  base: string;
  /** Szöveg/ikon és FEHÉR BETŰS kitöltött badge — fehéren/krémen/softon ≥4.5:1. */
  strong: string;
  /** Háttér-tint (chip, panel). */
  soft: string;
}

export const DIMENSION_COLORS: Record<DimCode, DimColorTriple> = {
  /** H · Becsületesség-Alázat — indigó (mély, higgadt, megbízható) */
  H: { base: "#4f5aa8", strong: "#3e4785", soft: "#eef0f8" },
  /** E · Emocionalitás — viola (introspektív érzelmi rezonancia) */
  E: { base: "#7b5fae", strong: "#5f4693", soft: "#f1ecf9" },
  /** X · Extraverzió — okker/arany (napfény; ≠ warning-amber: tompább, barnább) */
  X: { base: "#c08d2e", strong: "#8a6215", soft: "#f8efdc" },
  /** A · Barátságosság — moha (természet, szelídség; ≠ success-emerald) */
  A: { base: "#78924f", strong: "#556b35", soft: "#eff3e4" },
  /** C · Lelkiismeretesség — petrol (hűvös-stabil, strukturált) */
  C: { base: "#3d7f95", strong: "#2c5f72", soft: "#e6f1f5" },
  /** O · Nyitottság — mályva (képzelet, rendhagyó gondolkodás) */
  O: { base: "#b4688a", strong: "#8e4263", soft: "#f9eef3" },
};

const DIM_FALLBACK: DimColorTriple = {
  base: COLORS.sage,
  strong: "#1e3d34",
  soft: "#e8f2f0",
};

/** Kód-alapú lookup nem-tipizált (string) dimenziókódhoz, sage-fallbackkel. */
export function dimColors(code: string): DimColorTriple {
  return DIMENSION_COLORS[code as DimCode] ?? DIM_FALLBACK;
}

/**
 * Ugyanaz a paletta DOM-hoz: CSS-változóként, tehát színsémát vált.
 *
 * Miért két térkép — ld. a DYNAMICS_COLORS / DYNAMICS_COLORS_CSS párost: a
 * literál hex a FIX médiumoké (react-pdf, OG-kép, email — ott nincs
 * CSS-változó), ez pedig az inline style-é és az SVG-attribútumoké a
 * felületen. A kettő szinkronját a ts-color-maps teszt őrzi.
 */
export const DIMENSION_COLORS_CSS: Record<DimCode, DimColorTriple> = {
  H: { base: "var(--color-dim-h-base)", strong: "var(--color-dim-h-strong)", soft: "var(--color-dim-h-soft)" },
  E: { base: "var(--color-dim-e-base)", strong: "var(--color-dim-e-strong)", soft: "var(--color-dim-e-soft)" },
  X: { base: "var(--color-dim-x-base)", strong: "var(--color-dim-x-strong)", soft: "var(--color-dim-x-soft)" },
  A: { base: "var(--color-dim-a-base)", strong: "var(--color-dim-a-strong)", soft: "var(--color-dim-a-soft)" },
  C: { base: "var(--color-dim-c-base)", strong: "var(--color-dim-c-strong)", soft: "var(--color-dim-c-soft)" },
  O: { base: "var(--color-dim-o-base)", strong: "var(--color-dim-o-strong)", soft: "var(--color-dim-o-soft)" },
};

/**
 * A kiegészítő (intersticiális) Segítőkészség-skála NEM a hat főfaktor
 * egyike, ezért nincs saját identitás-hue-ja: semleges tintán jelenik meg.
 * Így a kártya vizuálisan is azt mondja, amit a bannere szövegben állít.
 */
const DIM_NEUTRAL_CSS: DimColorTriple = {
  base: "var(--color-text-muted)",
  strong: "var(--color-text-secondary)",
  soft: "var(--color-surface-subtle)",
};

/** Kód-alapú lookup a DOM-hoz; ismeretlen/kiegészítő kódra semleges tint. */
export function dimColorsCss(code: string): DimColorTriple {
  return DIMENSION_COLORS_CSS[code as DimCode] ?? DIM_NEUTRAL_CSS;
}

/** Kényelmi térképek a `Record<string, string>` alakú fogyasztóknak. */
export const DIMENSION_BASE: Record<DimCode, string> = {
  H: DIMENSION_COLORS.H.base,
  E: DIMENSION_COLORS.E.base,
  X: DIMENSION_COLORS.X.base,
  A: DIMENSION_COLORS.A.base,
  C: DIMENSION_COLORS.C.base,
  O: DIMENSION_COLORS.O.base,
};

export const DIMENSION_STRONG: Record<DimCode, string> = {
  H: DIMENSION_COLORS.H.strong,
  E: DIMENSION_COLORS.E.strong,
  X: DIMENSION_COLORS.X.strong,
  A: DIMENSION_COLORS.A.strong,
  C: DIMENSION_COLORS.C.strong,
  O: DIMENSION_COLORS.O.strong,
};

// ─── Csapatszerep-színek: 3 család × árnyalat (B-döntés) ─────────────────────
// A 9 önálló hue helyett a kódban már létező hármas kategorizálás
// (gondolkodó / cselekvő / emberközpontú) kap színt; a szerep-chip mindig
// feliratos, a szín csak a családot kódolja. A hue-k a dim-palettából
// öröklődnek (indigó/okker/moha) — szerep- és dimenzió-vizualizáció soha
// nem él ugyanazon az ábrán, és a formanyelvük is eltér.

export type TeamRoleFamilyKey = "thinking" | "action" | "people";
export type TeamRoleCodeKey =
  | "OG" | "KE" | "KO" | "HA" | "ER" | "CS" | "MV" | "MI" | "SZ";

export interface TeamRoleFamily {
  /** Chip-szöveg (soft háttéren és fehéren is AA). */
  chipText: string;
  /** Chip-háttér (soft tint). */
  chipBg: string;
  /** A család fő mark-színe. */
  accent: string;
  /** Sáv-árnyalatok a családon belül, a `roles` sorrendjében. */
  shades: readonly [string, string, string];
  roles: readonly [TeamRoleCodeKey, TeamRoleCodeKey, TeamRoleCodeKey];
}

export const TEAM_ROLE_FAMILIES: Record<TeamRoleFamilyKey, TeamRoleFamily> = {
  /** Gondolkodó — indigó */
  thinking: {
    chipText: "#3e4785",
    chipBg: "#eef0f8",
    accent: "#4f5aa8",
    shades: ["#4f5aa8", "#7580c4", "#a3abdd"],
    roles: ["OG", "ER", "SZ"],
  },
  /** Cselekvő — okker */
  action: {
    chipText: "#8a6215",
    chipBg: "#f8efdc",
    accent: "#c08d2e",
    shades: ["#8a6215", "#c08d2e", "#dcbd7a"],
    roles: ["HA", "MV", "MI"],
  },
  /** Emberközpontú — moha */
  people: {
    chipText: "#556b35",
    chipBg: "#eff3e4",
    accent: "#78924f",
    shades: ["#556b35", "#78924f", "#a9bd85"],
    roles: ["KE", "KO", "CS"],
  },
};

export const TEAM_ROLE_FAMILY_OF: Record<TeamRoleCodeKey, TeamRoleFamilyKey> = {
  OG: "thinking", ER: "thinking", SZ: "thinking",
  HA: "action", MV: "action", MI: "action",
  KE: "people", KO: "people", CS: "people",
};

export interface TeamRoleColor {
  family: TeamRoleFamilyKey;
  /** Chip: strong szöveg soft háttéren (mindig felirattal). */
  chipText: string;
  chipBg: string;
  /** Sáv/mark — a családon belüli árnyalat. */
  mark: string;
}

/** Szerepenkénti színek — a családból + családon belüli árnyalatból származtatva. */
export const TEAM_ROLE_COLORS: Record<TeamRoleCodeKey, TeamRoleColor> =
  Object.fromEntries(
    (Object.entries(TEAM_ROLE_FAMILIES) as [TeamRoleFamilyKey, TeamRoleFamily][])
      .flatMap(([familyKey, family]) =>
        family.roles.map((role, i) => [
          role,
          {
            family: familyKey,
            chipText: family.chipText,
            chipBg: family.chipBg,
            mark: family.shades[i],
          } satisfies TeamRoleColor,
        ]),
      ),
  ) as Record<TeamRoleCodeKey, TeamRoleColor>;

const ROLE_FALLBACK: TeamRoleColor = {
  family: "thinking",
  chipText: COLORS.inkBody,
  chipBg: "#f2ede6",
  mark: COLORS.muted,
};

export function teamRoleColors(code: string): TeamRoleColor {
  return TEAM_ROLE_COLORS[code as TeamRoleCodeKey] ?? ROLE_FALLBACK;
}

// ─── Réteg-akcentek (self / team / org / candidate) ──────────────────────────
// „Hol vagyok" — mindig chrome-on (hero, eyebrow, nav, gomb), sosem adat-markon.
// A glow-színek CSAK sötét herón élhetnek (fehéren AA-bukók); világos
// felületen az `accent` (team esetén szilva, org esetén a `bright` is) beszél.

export type LayerKey = "self" | "team" | "org" | "candidate";

export interface LayerTheme {
  /** Világos felületi szöveg/akcent (AA fehéren és krémen). */
  accent: string;
  /** Világos felületi mark/szöveg világosabb változata (org: 5.4:1 fehéren). */
  bright?: string;
  heroFrom: string;
  heroMid: string;
  heroTo: string;
  /** Akcent a SÖTÉT herón (CTA, glow) — világos felületen tilos szövegként. */
  glow: string;
  badgeBg: string;
  badgeText: string;
  /** Világos felületi tint (chip/panel háttér). */
  soft: string;
}

export const LAYER_THEMES: Record<LayerKey, LayerTheme> = {
  /** Zsálya — a brand-primary kettős szerepe szándékos (self = alapállás). */
  self: {
    accent: COLORS.sage,
    heroFrom: "#2a5244",
    heroMid: COLORS.sageDeep,
    heroTo: "#1a2e28",
    glow: COLORS.bronze,
    badgeBg: "rgba(193,127,74,0.2)",
    // A korábbi bronze-300 (#e8a96a) a hero-alapon 4.32:1 volt — ez a
    // világosított bronz-tint 4.87:1 (AA), a surface-hero-theme teszt őrzi.
    badgeText: "#eeb681",
    soft: COLORS.sageSoft,
  },
  /** Szilva; a barack (#d48e62) glow csak a sötét herón él. */
  team: {
    accent: "#66455d",
    bright: "#a66a8c",
    heroFrom: "#66455d",
    heroMid: "#4a314a",
    heroTo: "#2f2035",
    glow: "#d48e62",
    badgeBg: "rgba(212,142,98,0.22)",
    badgeText: "#f3c39d",
    soft: "#f6e8dc",
  },
  /** Éjkék — kanonikus akcent #2f4863; a korábbi #3f6d9a a `bright` változat. */
  org: {
    accent: "#2f4863",
    bright: "#3f6d9a",
    heroFrom: "#2f4863",
    heroMid: "#22374d",
    heroTo: "#172737",
    glow: "#d2a36a",
    badgeBg: "rgba(210,163,106,0.22)",
    badgeText: "#f4c792",
    soft: "#e8eff7",
  },
  /** Terrakotta — kizárólag a jelölt-domain rétegszíne (destruktívként tilos). */
  candidate: {
    accent: "#8a4a32",
    heroFrom: "#4b3930",
    heroMid: "#372a25",
    heroTo: "#191924",
    glow: "#e0a878",
    badgeBg: "rgba(224,168,120,0.22)",
    badgeText: "#f6cfa8",
    soft: "#f6e5da",
  },
};

/**
 * Réteg-hero gradiens LITERÁL hexekkel — a FIX médiumoknak (react-pdf
 * borító, OG-kép): ott nincs CSS-változó, amit fel lehetne oldani.
 *
 * A FELÜLETRE a `layerHeroGradientCss` való — az követi a színsémát.
 */
export function layerHeroGradient(layer: LayerKey): string {
  const t = LAYER_THEMES[layer];
  return `linear-gradient(135deg, ${t.heroFrom} 0%, ${t.heroMid} 60%, ${t.heroTo} 100%)`;
}

/**
 * Ugyanaz a DOM-nak: szerep-tokenekből, tehát színsémát vált.
 *
 * MIÉRT KELL KÜLÖN: a hero mindkét sémán sötét panel, de NEM ugyanaz a
 * sötét. Világosban a krém vászon fölött ül (7–8:1 elválás), sötéten a
 * majdnem-fekete vászon fölött — ott ugyanaz a hex 1,0–1,3:1-et adna a
 * lap saját réteg-tónusához képest, vagyis a hero alsó fele eltűnne. A
 * sötét készlet ezért MEGEMELT stopokat kap (2,3 / 1,85 / 1,45 a
 * lap-tónushoz mérve) — a figura-háttér viszony így mindkét sémán él.
 */
export function layerHeroGradientCss(layer: LayerKey): string {
  return (
    `linear-gradient(135deg, var(--color-layer-${layer}-hero-from) 0%, ` +
    `var(--color-layer-${layer}-hero-mid) 60%, ` +
    `var(--color-layer-${layer}-hero-to) 100%)`
  );
}

// ─── Értékelő ramp (tier / fit / verdict / confidence / adat-minőség) ────────
// Szándékos értékelés színe: zsálya→bronz→neutrális — „hangosabb→halkabb",
// sosem „jó→rossz-piros". Piros ezen a skálán TILOS (a piros kizárólag
// hiba-állapot és destruktív megerősítés).

export type EvalLevel = "high" | "mid" | "low";

export interface EvalStop {
  /** Szöveg (AA fehéren, krémen és a saját bg-jén). */
  fg: string;
  /** Mark/sáv/pötty. */
  accent: string;
  /** Háttér-tint. */
  bg: string;
}

export const EVAL_RAMP: Record<EvalLevel, EvalStop> = {
  /** zsálya */
  high: { fg: "#1e3d34", accent: COLORS.sage, bg: COLORS.sageSoft },
  /** bronz */
  mid: { fg: "#8a5530", accent: COLORS.bronze, bg: "#fdf5ee" },
  /** meleg neutrális (homok-család) — nem „hiány-szürke" */
  low: { fg: COLORS.muted, accent: "#8a8a9a", bg: "#f2ede6" },
};

// ─── Státusz-solid (grafikai, ≥3:1) ──────────────────────────────────────────
// A state-* fg/bg/border tokenek maradnak az igazság (globals.css); a solid
// a grafikai (donut, él, mark) változat. A korábbi „state-success-strong"
// (#10b981) és „state-warning-strong" (#f59e0b) kivezetve.

export const STATE_SOLID = {
  success: "#059669",
  warning: "#d97706",
  error: "#e11d48",
  info: "#3b82f6",
} as const;

/**
 * Dinamika-trió (aligned / complementary / friction) — dokumentált KIVÉTEL:
 * státusz-jellegű kódolás adat-kontextusban, mindig felirattal és a
 * „nem jelent tényleges konfliktust" magyarázattal (doksi 2.5).
 */
export const DYNAMICS_COLORS = {
  aligned: STATE_SOLID.success,
  complementary: STATE_SOLID.info,
  friction: STATE_SOLID.warning,
} as const;

/**
 * Ugyanaz DOM-hoz: CSS-változóként, hogy kövesse a színsémát.
 *
 * Miért két térkép: a fenti literál kell a fix médiumoknak (PDF, email,
 * OG-kép — ott nincs CSS-változó), ez pedig az inline style-hoz és az
 * SVG-attribútumokhoz a felületen. A kettő szinkronját unit-teszt őrzi
 * (tests/unit/design/ts-color-maps.test.ts).
 */
export const DYNAMICS_COLORS_CSS = {
  aligned: "var(--color-state-success-solid)",
  complementary: "var(--color-state-info-solid)",
  friction: "var(--color-state-warning-solid)",
} as const;

// ─── Avatar-paletta (identitás) ──────────────────────────────────────────────
//
// 2026-08-09 — a MÉRÉS palettájáról a MÁRKA palettájára állítva.
//
// Az avatar eddig a hat dimenzió-base színt kapta (indigó, lila, arany,
// oliva, petrol, rózsa). Két baja volt ennek:
//
//  1. JELENTÉS. A dimenzió-színek mérési eredményt jelölnek. Ha a monogram
//     az „Emocionalitás lilát" viseli, az olvasó jelentést lát bele — pedig
//     az avatar színe a névből hasheltet, nem a profilból. Ugyanaz a hiba,
//     mint amikor a jelentő formák dekorációba kerülnek: a jel elveszti a
//     hitelét. (Ezért került ki korábban a success/warning is.)
//  2. ARCULAT. Krém-zsálya-bronz felületen az indigó és a rózsa idegen test.
//
// Az új készlet kizárólag a márka saját tónusaiból áll (COLORS), és minden
// alapszín ≥ 4,5:1 FEHÉR monogram-szöveggel. A hat érték szándékosan a
// mélység és a hőfok mentén szóródik (két zöld, barna, pala, meleg szürke,
// tinta), nem hat különböző hue mentén — így megkülönböztethetők, de nem
// esnek szét szivárvánnyá.
//
// FONTOS: ezek nyers hexek, mert inline gradiens-háttérként utaznak, tehát
// a színsémával NEM fordulnak. Mindegyik elég sötét ahhoz, hogy a fehér
// monogram mindkét sémán olvasható maradjon rajta.

export const AVATAR_COLORS: readonly string[] = [
  COLORS.sage,
  COLORS.bronzeDark,
  COLORS.inkBody,
  COLORS.sageDark,
  COLORS.inkWarm,
  COLORS.sageDeep,
];

export const AVATAR_GRADIENT_PAIRS: readonly (readonly [string, string])[] = [
  [COLORS.sage, COLORS.sageDeep],
  // A márka két akcentje egy gradiensben — a készlet „aláírás" darabja.
  [COLORS.bronzeDark, COLORS.sageDeep],
  [COLORS.inkBody, COLORS.ink],
  [COLORS.sageDark, COLORS.ink],
  [COLORS.inkWarm, COLORS.bronzeDark],
  [COLORS.sageDeep, COLORS.ink],
];
