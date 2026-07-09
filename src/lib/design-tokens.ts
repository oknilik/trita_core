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
  muted:       "#8a8a9a",
  mutedWarm:   "#a09c96",

  // Surface
  cream:       "#f7f4ef",
  sand:        "#e8e0d3",
  warm:        "#f3eee4",
  warmMid:     "#f0ede6",
  warmDark:    "#d9cfc1",
} as const;

export type ColorKey = keyof typeof COLORS;

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
