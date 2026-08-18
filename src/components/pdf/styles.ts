import { StyleSheet, Font } from "@react-pdf/renderer";

// ─── Font registration (local TTF files) ─────────────────────────────────────

// A forrásfájlok VARIABLE fontok — a react-pdf a default (400-as)
// példányt rendereli, akárhány súlyt regisztrálunk ugyanarról a fájlról.
// Ezért a Medium/SemiBold statikus instance-ok külön fájlból jönnek
// (fonttools varLib.instancer, tipográfiai audit #2).
Font.register({
  family: "Fraunces",
  fonts: [
    { src: "/fonts/Fraunces-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/Fraunces-SemiBold.ttf", fontWeight: 600 },
    { src: "/fonts/Fraunces-Italic.ttf", fontStyle: "italic" },
  ],
});

Font.register({
  family: "DM Sans",
  fonts: [
    { src: "/fonts/DMSans-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/DMSans-Medium.ttf", fontWeight: 500 },
    { src: "/fonts/DMSans-SemiBold.ttf", fontWeight: 600 },
  ],
});

// ─── Colors ──────────────────────────────────────────────────────────────────
// IMPORTANT: react-pdf renders in Node.js, NOT in a browser.
// CSS custom properties (var(--xxx)) do not work here — use hex values only.
// A paletta a közös token-modulból fordul (2026-07-22, F2) — palettacsere a
// design-tokens.ts-ben (a globals.css-sel szinkronban) történik, itt nem.
import { PDF_COLORS } from "@/lib/design-tokens";

export const colors = PDF_COLORS;

// ─── Tipográfiai skála (PDF-audit 2026-08-18, P1/10) ─────────────────────────
// A riport korábban szinte mindent 5,5–7,5 pt-on hozott: képernyőn és A4-en
// egyaránt olvashatatlan volt, és nem volt érzékelhető cím-hierarchia sem.
// EGYETLEN tokenizált skála; szétszórt inline `fontSize` már nem kerülhet
// a komponensekbe (guardrail: tests/unit/results/pdf-typography-scale.test.ts).
//
//   chapter   24  Fraunces  — fejezetcím (01/02/03)
//   section   15  Fraunces  — szekciócím fejezeten belül
//   subhead   11  Fraunces  — kártya-/dimenziócím
//   cardTitle  9.5          — kártyacím sans
//   body       9.5          — törzsszöveg (1,5 sorköz)
//   caption    8            — meta, forrás-jegyzet, disclaimer
//   micro      6            — KIZÁRÓLAG nem lényegi lábléc-információ
export const type = {
  chapter: 24,
  chapterNumber: 12,
  section: 15,
  subhead: 11,
  cardTitle: 9.5,
  body: 9.5,
  caption: 8,
  /** Csak láblécben/oldalszámnál — lényegi szöveg SOHA nem mehet ide. */
  micro: 6,
  lineHeight: {
    body: 1.5,
    tight: 1.4,
    caption: 1.45,
  },
  /** Eyebrow (uppercase, ritkított) — a webes SectionEyebrow párja. */
  eyebrow: 8,
  eyebrowTracking: 1.6,
} as const;

/**
 * A fixed fejléc/lábléc MAGASSÁGA — a lap paddingje tartja fenn a helyüket.
 *
 * A react-pdf `fixed` eleme minden lapon újrarenderel, de a FOLYTATÁS-lapokon
 * nem tolja el a folyó tartalmat: ha a fejléc a flow-ban ül, az áttört blokk
 * BEÚSZIK alá. Ezért a fejléc/lábléc abszolút pozicionált, a helyüket pedig a
 * lap padding-je foglalja — így törésnél sem lesz átfedés.
 */
export const chrome = {
  headerHeight: 38,
  footerHeight: 34,
} as const;

// ─── Kártya-geometria — a webes DashboardPrimitives Card-jának párja ─────────
export const cardShape = {
  radius: 12,
  padding: "14 16",
  gap: 12,
} as const;

// ─── Shared styles ───────────────────────────────────────────────────────────
// Az élő riport design-nyelve: krém vászon, fehér lekerekített kártyák,
// bronz eyebrow-k, levegős térközök — „mintha az oldalt másolnánk".

export const s = StyleSheet.create({
  page: {
    backgroundColor: colors.canvas,
    fontFamily: "DM Sans",
    fontSize: type.body,
    color: colors.ink,
    position: "relative",
    display: "flex",
    flexDirection: "column",
    // A fejléc és a lábléc helyét a LAP foglalja (a react-pdf a lap-paddinget
    // töréskor helyesen kezeli) — konténer-szintű padding túlcsordulna és
    // üres folytatás-oldalt szülne.
    // +10: levegő a fejléc alatt a FOLYTATÁS-lapokon is (a body top-paddingje
    // csak a flow elején hat, oldaltörés után nem).
    paddingTop: chrome.headerHeight + 10,
    paddingBottom: chrome.footerHeight,
  },
  header: {
    backgroundColor: colors.white,
    padding: "20 32 14 32",
    borderBottom: `1 solid ${colors.sand}`,
  },
  body: {
    padding: "8 32 0 32",
  },
  // Fehér kártya — az élő felület Card/DashboardPanel megfelelője.
  card: {
    backgroundColor: colors.white,
    borderRadius: cardShape.radius,
    border: `1 solid ${colors.sand}`,
    padding: cardShape.padding,
    marginBottom: cardShape.gap,
  },
  // Kártya-fejléc: bronz vonal-jelzés + eyebrow (DashboardSectionHeader).
  cardEyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 8,
  },
  cardEyebrowLine: {
    width: 12,
    height: 1,
    backgroundColor: colors.bronze,
    opacity: 0.7,
  },
  cardEyebrow: {
    fontSize: type.eyebrow,
    letterSpacing: type.eyebrowTracking,
    textTransform: "uppercase",
    color: colors.bronze,
    fontWeight: 600,
  },
  // Szekciócím a fejezeten belül — Fraunces, valódi második szint.
  sectionTitle: {
    fontFamily: "Fraunces",
    fontSize: type.section,
    color: colors.ink,
    marginBottom: 6,
  },
  subhead: {
    fontFamily: "Fraunces",
    fontSize: type.subhead,
    color: colors.ink,
    marginBottom: 4,
  },
  bodyText: {
    fontSize: type.body,
    color: colors.ink500,
    lineHeight: type.lineHeight.body,
  },
  caption: {
    fontSize: type.caption,
    color: colors.ink300,
    lineHeight: type.lineHeight.caption,
  },
  sectionEyebrow: {
    fontSize: type.eyebrow,
    letterSpacing: type.eyebrowTracking,
    textTransform: "uppercase",
    color: colors.bronze,
    marginBottom: 6,
    marginTop: 12,
    fontWeight: 600,
  },
  // First eyebrow after header — no top margin
  sectionEyebrowFirst: {
    fontSize: type.eyebrow,
    letterSpacing: type.eyebrowTracking,
    textTransform: "uppercase",
    color: colors.bronze,
    marginBottom: 6,
    fontWeight: 600,
  },
  // Divider line between sub-sections
  divider: {
    borderTop: `1 solid ${colors.sand}`,
    marginTop: 8,
    marginBottom: 8,
  },
  // Divider line between major sections — bigger spacing
  sectionDivider: {
    borderTop: `1 solid ${colors.sand}`,
    marginTop: 14,
    marginBottom: 12,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: "7 32",
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: type.micro,
    color: colors.ink300,
    borderTop: `0.5 solid ${colors.sand}`,
  },
});
