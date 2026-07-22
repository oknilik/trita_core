import { StyleSheet, Font } from "@react-pdf/renderer";

// ─── Font registration (local TTF files) ─────────────────────────────────────

Font.register({
  family: "Fraunces",
  fonts: [
    { src: "/fonts/Fraunces-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/Fraunces-Regular.ttf", fontWeight: 600 },
    { src: "/fonts/Fraunces-Italic.ttf", fontStyle: "italic" },
  ],
});

Font.register({
  family: "DM Sans",
  fonts: [
    { src: "/fonts/DMSans-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/DMSans-Regular.ttf", fontWeight: 500 },
    { src: "/fonts/DMSans-Regular.ttf", fontWeight: 600 },
  ],
});

// ─── Colors ──────────────────────────────────────────────────────────────────
// IMPORTANT: react-pdf renders in Node.js, NOT in a browser.
// CSS custom properties (var(--xxx)) do not work here — use hex values only.
// A paletta a közös token-modulból fordul (2026-07-22, F2) — palettacsere a
// design-tokens.ts-ben (a globals.css-sel szinkronban) történik, itt nem.
import { PDF_COLORS } from "@/lib/design-tokens";

export const colors = PDF_COLORS;

// ─── Shared styles ───────────────────────────────────────────────────────────
// Az élő riport design-nyelve: krém vászon, fehér lekerekített kártyák,
// bronz eyebrow-k, levegős térközök — „mintha az oldalt másolnánk".

export const s = StyleSheet.create({
  page: {
    backgroundColor: colors.canvas,
    fontFamily: "DM Sans",
    fontSize: 8,
    color: colors.ink,
    position: "relative",
    display: "flex",
    flexDirection: "column",
    paddingBottom: 30,
  },
  header: {
    backgroundColor: colors.white,
    padding: "20 32 14 32",
    borderBottom: `1 solid ${colors.sand}`,
  },
  body: {
    flex: 1,
    padding: "14 28 12 28",
  },
  // Fehér kártya — az élő felület DashboardPanel-jének megfelelője.
  card: {
    backgroundColor: colors.white,
    borderRadius: 8,
    border: `1 solid ${colors.sand}`,
    padding: "11 13",
    marginBottom: 10,
  },
  // Kártya-fejléc: bronz vonal-jelzés + eyebrow (DashboardSectionHeader).
  cardEyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  cardEyebrowLine: {
    width: 10,
    height: 1,
    backgroundColor: colors.bronze,
    opacity: 0.7,
  },
  cardEyebrow: {
    fontSize: 7,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: colors.bronze,
    fontWeight: 600,
  },
  sectionEyebrow: {
    fontSize: 7,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: colors.bronze,
    marginBottom: 5,
    marginTop: 10,
    fontWeight: 600,
  },
  // First eyebrow after header — no top margin
  sectionEyebrowFirst: {
    fontSize: 7,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: colors.bronze,
    marginBottom: 5,
    fontWeight: 600,
  },
  // Divider line between sub-sections
  divider: {
    borderTop: `1 solid ${colors.sand}`,
    marginTop: 6,
    marginBottom: 6,
  },
  // Divider line between major sections — bigger spacing
  sectionDivider: {
    borderTop: `1 solid ${colors.sand}`,
    marginTop: 12,
    marginBottom: 10,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: "6 32",
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 5,
    color: colors.ink300,
    borderTop: `0.5 solid ${colors.sand}`,
  },
});
