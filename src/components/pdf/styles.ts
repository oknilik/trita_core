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
// A paletta az élő riport-felület tokenjeit tükrözi (globals.css):
// meleg krém vászon, fehér kártyák, sand keret, sage/bronze akcentus.

export const colors = {
  sage: "#3d6b5e",
  sageDark: "#2d4f46",
  sageLight: "#4a8b78",
  sage100: "#e8f0ed",
  bronze: "#c17f4a",
  bronzeLight: "#d4a67a",
  bronze100: "#faf0e6",
  bronzeDark: "#a0623a",
  ink: "#1a1a2e",
  ink500: "#4a4a5e",
  ink300: "#8a8a9a",
  cream: "#faf9f6",
  cream500: "#e8e0d3",
  cream300: "#f3f0eb",
  white: "#ffffff",
  // Az élő felület vászna és kerete
  canvas: "#f6f3ec",
  sand: "#e7e1d5",
};

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
    padding: "12 28 10 28",
  },
  // Fehér kártya — az élő felület DashboardPanel-jének megfelelője.
  card: {
    backgroundColor: colors.white,
    borderRadius: 8,
    border: `1 solid ${colors.sand}`,
    padding: "10 12",
    marginBottom: 8,
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
