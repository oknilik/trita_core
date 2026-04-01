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
  sage: "var(--color-action-primary-bg)",
  sageDark: "var(--color-accent-self-deep)",
  sageLight: "var(--color-accent-self)",
  sage100: "var(--color-surface-self-accent-soft)",
  bronze: "var(--color-accent-primary)",
  bronzeLight: "var(--color-accent-primary-soft)",
  bronze100: "var(--color-surface-highlight-warm)",
  bronzeDark: "var(--color-accent-primary-strong)",
  ink: "var(--color-text-primary)",
  ink500: "var(--color-text-secondary)",
  ink300: "var(--color-text-muted)",
  cream: "var(--color-surface-canvas)",
  cream500: "var(--color-border-default)",
  cream300: "var(--color-surface-subtle)",
  white: "var(--color-neutral-white)",
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
