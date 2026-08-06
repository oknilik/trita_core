/**
 * Trita Design Tokens — JS/SVG kontextushoz
 *
 * Palettacsere esetén ezt a fájlt ÉS a globals.css @theme inline blokkját
 * kell módosítani. A HEX értékek itt és a CSS változókban szinkronban kell maradjanak.
 *
 * Tailwind class-okhoz SOHA ne használd ezeket — ott a CSS változók működnek
 * (bg-sage, text-bronze stb.). Csak inline style-okhoz és SVG attribútumokhoz.
 */

export const COLORS = {
  // Sage – primary action & structure
  sage:        "#3d6b5e",
  sageDark:    "#2d5a4e",
  sageDeep:    "#1e3d34",
  sageSoft:    "#e8f2f0",
  sageGhost:   "#f0f7f5",
  sageRing:    "#b8d0cb",

  // Bronze – accent text & icons
  bronze:      "#c17f4a",
  bronzeDark:  "#9a6538",
  bronzeSoft:  "#f3d4c8",
  bronzeEdge:  "#e8c7b8",

  // Ink – typography
  ink:         "#1a1a2e",
  inkBody:     "#4a4a5e",
  inkWarm:     "#7a756e",
  muted:       "#6e6e80", // 3.4:1→5.0:1 fehéren — globals.css-szinkron (tipó-audit #8)
  mutedWarm:   "#7c786f", // 2.7:1→4.4:1 fehéren — globals.css-szinkron (tipó-audit #8)
  ink300:      "#8a8a9a", // halvány metaadat/grafikai szürke (= --color-ink-300)

  // Surface
  cream:       "#f7f4ef",
  sand:        "#e8e0d3",
  warm:        "#f3eee4",
  warmMid:     "#f0ede6",
  warmDark:    "#d9cfc1",
} as const;

export type ColorKey = keyof typeof COLORS;

// ─── Email-paletta (2026-07-22 UI-egységesítés, F2) ─────────────────────────
// Az email inline-style HTML — CSS-var kliens-támogatás megbízhatatlan, ezért
// hexben fordul, de EBBŐL a modulból (nem kézzel szórt konstansokból).
export const EMAIL_COLORS = {
  // 2026-07-23 egységesítés: fehér canvas + homok fejléc-kártya a színes
  // wordmarkkal (sage t · ink rit · bronz a) — a főoldali brand képe.
  canvas: "#ffffff",
  headerBg: COLORS.sand,
  /** Wordmark-betűszínek a fejléc-kártyán (NavBar-paritás) */
  wordmarkT: COLORS.sage,
  wordmarkBody: COLORS.ink,
  wordmarkA: COLORS.bronze,
  /** CTA: a főoldali bronz gomb (rounded-xl, fehér felirat, nyíl) */
  ctaBg: COLORS.bronze,
  heading: COLORS.ink,
  body: COLORS.inkBody,
  muted: COLORS.inkWarm,
  faint: COLORS.mutedWarm,
  border: COLORS.sand,
  /** Kód-doboz / kiemelt felület háttere a fehér canvason */
  surface: COLORS.cream,
} as const;

// ─── PDF-paletta (react-pdf Node-ban renderel, CSS-var nem működik) ────────
// A pdf/styles.ts színobjektuma innen fordul; a PDF-specifikus árnyalatok
// (canvas, világosított sage/bronze) itt vannak nevesítve.
export const PDF_COLORS = {
  sage: COLORS.sage,
  sageDark: "#2d4f46",
  sageLight: "#4a8b78",
  sage100: "#e8f0ed",
  bronze: COLORS.bronze,
  bronzeLight: "#d4a67a",
  bronze100: "#faf0e6",
  bronzeDark: "#a0623a",
  bronze700: "#8a5530", // gap/magnitúdó-rámpa legmélyebb foka (= --color-bronze-700)
  ink: COLORS.ink,
  ink500: COLORS.inkBody,
  ink300: COLORS.muted,
  cream: "#faf9f6",
  cream500: COLORS.sand,
  cream300: "#f3f0eb",
  white: "#ffffff",
  canvas: "#f6f3ec",
  sand: "#e7e1d5",
} as const;

/** CSS var() referenciák inline style-okhoz (automatikusan szinkronban a globals.css-sel) */
export const CSS_VARS = {
  sage:       "var(--color-sage)",
  sageDark:   "var(--color-sage-dark)",
  sageDeep:   "var(--color-sage-deep)",
  sageSoft:   "var(--color-sage-soft)",
  sageGhost:  "var(--color-sage-ghost)",
  sageRing:   "var(--color-sage-ring)",
  bronze:     "var(--color-bronze)",
  bronzeDark: "var(--color-bronze-dark)",
  ink:        "var(--color-ink)",
  inkBody:    "var(--color-ink-body)",
  inkWarm:    "var(--color-ink-warm)",
  muted:      "var(--color-muted)",
  mutedWarm:  "var(--color-muted-warm)",
  cream:      "var(--color-cream)",
  sand:       "var(--color-sand)",
  warm:       "var(--color-warm)",
  warmMid:    "var(--color-warm-mid)",
  warmDark:   "var(--color-warm-dark)",
} as const;
