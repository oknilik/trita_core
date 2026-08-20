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
  muted:       "#6a6a7b", // 5.3:1 fehéren, 4,55:1 a meleg lapokon (UX-audit 2026-08-07)
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

// ─── Email-paletta ──────────────────────────────────────────────────────────
// Az email inline-style HTML — CSS-var kliens-támogatás megbízhatatlan, ezért
// hexben fordul, de EBBŐL a modulból (nem kézzel szórt konstansokból).
//
// 2026-08-19 arculati átállás: a készlet ÉRTÉK-listából SZEREP-listává vált,
// és a szerepek az app szemantikus rétegét tükrözik (globals.css @theme).
// Ami változott és miért:
//
//  · canvas: fehér → krém. Az app viszonya `surface-canvas` (krém) +
//    `surface-card` (fehér); a levél eddig kártya nélkül, tiszta fehérre írt.
//  · actionPrimary: bronz → ZSÁLYA. Az elsődleges akció szerepszíne a
//    2026-08-05-i szín-rendszer óta `--color-action-primary-bg` = sage. A
//    fehér felirat a bronzon ráadásul 3,28:1 volt (AA-bukó); zsályán 6,06:1.
//    A bronz akcentnek szabadult fel (i-pont, eyebrow, másodlagos gomb).
//  · muted: inkWarm/mutedWarm → muted. A `mutedWarm` 4,40:1-et adott fehéren,
//    és pont a 12px-es lábléc- és disclaimer-sorokat vitte — AA alatt. A
//    `muted` fehéren 5,30:1, a krém vásznon 4,82:1.
//  · headerBg + wordmarkT/Body/A KIVEZETVE: a homok fejléc-plakett és a
//    háromszínű szójel a kanonikus egyszínű `trıta` + bronz i-pont jelre
//    cserélődött (TritaLogo.tsx / PdfWordmark.tsx paritás).
export const EMAIL_COLORS = {
  // ── Felületek ─────────────────────────────────────────────────────────────
  /** Lap-alap. Az app `surface-canvas`-a — a levél nem fehér lapra ír. */
  canvas: COLORS.cream,
  /** A tartalom kártyája a vásznon (`surface-card`). */
  card: "#ffffff",
  /** Kiemelt felület a FEHÉR kártyán belül: kód-doboz, QR-keret. */
  surface: COLORS.cream,
  /** Keret és hajszálvonal — az app `border-default`-ja (= sand). */
  border: COLORS.sand,

  // ── Szöveg-szerepek ───────────────────────────────────────────────────────
  /** Címsor és kiemelt érték. */
  heading: COLORS.ink,
  /** Folyószöveg. */
  body: COLORS.inkBody,
  /** Halk kísérőszöveg, lábléc, disclaimer. A kis fokok padlója. */
  muted: COLORS.muted,

  // ── Akció ─────────────────────────────────────────────────────────────────
  /** Elsődleges gomb — `action-primary`. Fehér felirattal 6,06:1. */
  actionPrimaryBg: COLORS.sage,
  actionPrimaryFg: "#ffffff",
  /**
   * Másodlagos gomb — bronz felület TINTA felirattal (5,20:1). A fehér itt
   * 3,28:1 lenne; a web ugyanezért tartja a `--palette-text-on-accent`-et
   * sötéten („az akcentek MINDKÉT témában világosak").
   */
  actionSecondaryBg: COLORS.bronze,
  actionSecondaryFg: COLORS.ink,

  // ── Akcent ────────────────────────────────────────────────────────────────
  /** Grafikai akcent: eyebrow-pötty, szójel i-pontja. */
  accent: COLORS.bronze,
  /** Akcent-SZÖVEG (eyebrow felirata) — a brand-bronz 11px-en 2,9:1 lenne. */
  accentText: COLORS.bronzeDark,

  // ── Szójel ────────────────────────────────────────────────────────────────
  wordmark: COLORS.ink,
  wordmarkDot: COLORS.bronze,
} as const;

// ─── PDF-paletta (react-pdf Node-ban renderel, CSS-var nem működik) ────────
// A pdf/styles.ts színobjektuma innen fordul; a PDF-specifikus árnyalatok
// (canvas, világosított sage/bronze) itt vannak nevesítve.
export const PDF_COLORS = {
  sage: COLORS.sage,
  sageDark: "#2d4f46",
  sageLight: "#4a8b78",
  sage100: "#e8f0ed",
  // Kártya-keret tintek a PDF-hez: a react-pdf `border` shorthand-parsere nem
  // old fel rgba()-t (a keret ilyenkor a bronz alapértelmezettre esik vissza),
  // ezért a 30%-os sage/bronze tintek IT T élnek, előre keverve fehérre.
  sage200: "#c5d3cf",
  bronze: COLORS.bronze,
  bronzeLight: "#d4a67a",
  bronze100: "#faf0e6",
  bronze200: "#ecd9c9",
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
