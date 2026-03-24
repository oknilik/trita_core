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

export const colors = {
  sage: "#3d6b5e",
  sageDark: "#1e3d34",
  sageLight: "#5a8f7f",
  sage100: "#e8f2f0",
  bronze: "#c17f4a",
  bronzeLight: "#e8a96a",
  bronze100: "#fdf5ee",
  bronzeDark: "#8a5530",
  ink: "#1a1a2e",
  ink500: "#4a4a5e",
  ink300: "#8a8a9a",
  cream: "#f7f4ef",
  cream500: "#e8e0d3",
  cream300: "#f2ede6",
  white: "#ffffff",
};

// ─── Shared styles ───────────────────────────────────────────────────────────

export const s = StyleSheet.create({
  page: {
    backgroundColor: colors.white,
    fontFamily: "DM Sans",
    fontSize: 8,
    color: colors.ink,
    position: "relative",
    display: "flex",
    flexDirection: "column",
    paddingBottom: 28,
  },
  header: {
    backgroundColor: colors.sageDark,
    padding: "20 32 14 32",
  },
  body: {
    flex: 1,
    padding: "10 32",
  },
  sectionEyebrow: {
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: colors.ink300,
    marginBottom: 4,
    marginTop: 10,
    fontWeight: 600,
  },
  // First eyebrow after header — no top margin
  sectionEyebrowFirst: {
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: colors.ink300,
    marginBottom: 4,
    fontWeight: 600,
  },
  // Divider line between sub-sections
  divider: {
    borderTop: `1 solid ${colors.cream500}`,
    marginTop: 6,
    marginBottom: 6,
  },
  // Divider line between major sections — bigger spacing
  sectionDivider: {
    borderTop: `1 solid ${colors.cream500}`,
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
    borderTop: `0.5 solid ${colors.cream500}`,
  },
});
