import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { COLORS, PDF_COLORS } from "@/lib/design-tokens";
import {
  DIMENSION_COLORS,
  EVAL_RAMP,
  LAYER_THEMES,
  STATE_SOLID,
  TEAM_ROLE_FAMILIES,
  type DimCode,
} from "@/lib/color-system";

// A web forrásigazsága a globals.css @theme blokk; a design-tokens.ts és a
// color-system.ts a TS-oldali tükrök (PDF, email, OG, SVG). Ez a teszt őrzi
// a szinkront: ha a globals.css-ben átszínezünk, itt szól, hogy a TS-tükör
// is átvezetendő — és fordítva. (2026-08 szín-rendszer: a dim/layer/eval/
// state-solid tokenek is ide tartoznak.)

const css = readFileSync(
  join(process.cwd(), "src/app/globals.css"),
  "utf8",
);

// A tokenek egy része var(--color-…) referenciával van definiálva —
// a feloldáshoz beolvassuk az összes definíciót, és követjük a láncot.
const DEFINITIONS = new Map<string, string>();
for (const match of css.matchAll(/--color-([a-z0-9-]+):\s*([^;]+);/g)) {
  DEFINITIONS.set(match[1], match[2].trim());
}

function resolveCssVar(name: string, depth = 0): string | null {
  if (depth > 8) return null;
  const value = DEFINITIONS.get(name);
  if (!value) return null;
  const ref = value.match(/^var\(--color-([a-z0-9-]+)\)$/);
  if (ref) return resolveCssVar(ref[1], depth + 1);
  const hex = value.match(/^#[0-9a-fA-F]{6}$/);
  return hex ? value.toLowerCase() : value;
}

function cssVar(name: string): string | null {
  return resolveCssVar(name);
}

function assertPair(tsValue: string, cssName: string, label: string) {
  const fromCss = cssVar(cssName);
  assert.ok(fromCss, `--color-${cssName} hiányzik a globals.css-ből (${label})`);
  assert.equal(
    tsValue.toLowerCase(),
    fromCss,
    `${label} (${tsValue}) ≠ --color-${cssName} (${fromCss}) — ` +
      "palettacsere esetén mindkét forrást frissítsd",
  );
}

const PAIRS: Array<[keyof typeof COLORS, string]> = [
  ["sage", "sage"],
  ["sageDark", "sage-dark"],
  ["sageDeep", "sage-deep"],
  ["sageSoft", "sage-soft"],
  ["sageGhost", "sage-ghost"],
  ["sageRing", "sage-ring"],
  ["bronze", "bronze"],
  ["bronzeDark", "bronze-dark"],
  ["bronzeSoft", "bronze-soft"],
  ["bronzeEdge", "bronze-edge"],
  ["ink", "ink"],
  ["inkBody", "ink-body"],
  ["inkWarm", "ink-warm"],
  ["muted", "muted"],
  ["mutedWarm", "muted-warm"],
  ["ink300", "ink-300"],
  ["cream", "cream"],
  ["sand", "sand"],
  ["warm", "warm"],
  ["warmMid", "warm-mid"],
  ["warmDark", "warm-dark"],
];

test("design-tokens.ts COLORS szinkronban a globals.css @theme értékeivel", () => {
  for (const [tsKey, cssName] of PAIRS) {
    assertPair(COLORS[tsKey], cssName, `COLORS.${tsKey}`);
  }
});

test("a típus-skála tokenek jelen vannak a globals.css-ben", () => {
  for (const token of [
    "--text-display", "--text-title", "--text-heading",
    "--text-body", "--text-caption", "--text-label", "--text-micro",
  ]) {
    assert.ok(css.includes(`${token}:`), `${token} hiányzik a globals.css-ből`);
  }
});

// ─── 2026-08 szín-rendszer: color-system.ts ↔ globals.css ───────────────────

const DIM_CSS_LETTER: Record<DimCode, string> = {
  INTE: "h",
  RESO: "e",
  TEMP: "x",
  ADAP: "a",
  THOR: "c",
  OPEN: "o",
};

test("DIMENSION_COLORS szinkronban a --color-dim-* tokenekkel", () => {
  for (const [code, letter] of Object.entries(DIM_CSS_LETTER)) {
    const triple = DIMENSION_COLORS[code as DimCode];
    assertPair(triple.base, `dim-${letter}-base`, `DIMENSION_COLORS.${code}.base`);
    assertPair(triple.strong, `dim-${letter}-strong`, `DIMENSION_COLORS.${code}.strong`);
    assertPair(triple.soft, `dim-${letter}-soft`, `DIMENSION_COLORS.${code}.soft`);
  }
});

test("E/O hue-döntés érvényben (E=viola, O=mályva — doksi 5. fejezet)", () => {
  assert.equal(DIMENSION_COLORS.RESO.base, "#7b5fae");
  assert.equal(DIMENSION_COLORS.OPEN.base, "#b4688a");
});

test("TEAM_ROLE_FAMILIES szinkronban a --color-role-* tokenekkel", () => {
  assertPair(TEAM_ROLE_FAMILIES.thinking.chipText, "role-thinking-fg", "role thinking fg");
  assertPair(TEAM_ROLE_FAMILIES.thinking.chipBg, "role-thinking-bg", "role thinking bg");
  assertPair(TEAM_ROLE_FAMILIES.action.chipText, "role-action-fg", "role action fg");
  assertPair(TEAM_ROLE_FAMILIES.action.chipBg, "role-action-bg", "role action bg");
  assertPair(TEAM_ROLE_FAMILIES.people.chipText, "role-people-fg", "role people fg");
  assertPair(TEAM_ROLE_FAMILIES.people.chipBg, "role-people-bg", "role people bg");
});

test("LAYER_THEMES szinkronban a --color-layer-* tokenekkel", () => {
  for (const layer of ["self", "team", "org", "candidate"] as const) {
    const t = LAYER_THEMES[layer];
    assertPair(t.accent, `layer-${layer}-accent`, `LAYER_THEMES.${layer}.accent`);
    assertPair(t.heroFrom, `layer-${layer}-hero-from`, `LAYER_THEMES.${layer}.heroFrom`);
    assertPair(t.heroMid, `layer-${layer}-hero-mid`, `LAYER_THEMES.${layer}.heroMid`);
    assertPair(t.heroTo, `layer-${layer}-hero-to`, `LAYER_THEMES.${layer}.heroTo`);
    assertPair(t.glow, `layer-${layer}-glow`, `LAYER_THEMES.${layer}.glow`);
    assertPair(t.soft, `layer-${layer}-soft`, `LAYER_THEMES.${layer}.soft`);
    if (t.bright) {
      assertPair(t.bright, `layer-${layer}-bright`, `LAYER_THEMES.${layer}.bright`);
    }
  }
});

test("EVAL_RAMP szinkronban a --color-eval-* tokenekkel", () => {
  for (const level of ["high", "mid", "low"] as const) {
    const stop = EVAL_RAMP[level];
    assertPair(stop.fg, `eval-${level}-fg`, `EVAL_RAMP.${level}.fg`);
    assertPair(stop.accent, `eval-${level}-accent`, `EVAL_RAMP.${level}.accent`);
    assertPair(stop.bg, `eval-${level}-bg`, `EVAL_RAMP.${level}.bg`);
  }
});

test("STATE_SOLID szinkronban a --color-state-*-solid tokenekkel", () => {
  for (const [key, value] of Object.entries(STATE_SOLID)) {
    assertPair(value, `state-${key}-solid`, `STATE_SOLID.${key}`);
  }
});

test("a kivezetett tokenek nem térnek vissza a globals.css-be", () => {
  for (const legacy of [
    "--color-visual-gradient-indigo",
    "--color-visual-gradient-violet",
    "--color-visual-cyan",
    "--color-state-success-strong",
    "--color-state-warning-strong",
  ]) {
    assert.ok(
      !css.includes(`${legacy}:`),
      `${legacy} kivezetett token — ne definiáld újra (color-system-2026-08.md)`,
    );
  }
});

test("PDF_COLORS kiegészítések szinkronban", () => {
  assertPair(PDF_COLORS.bronze700, "bronze-700", "PDF_COLORS.bronze700");
});
