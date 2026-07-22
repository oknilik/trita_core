import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { COLORS } from "@/lib/design-tokens";

// A web forrásigazsága a globals.css @theme blokk; a design-tokens.ts a
// TS-oldali tükör (PDF, email, SVG). Ez a teszt őrzi a szinkront: ha a
// globals.css-ben átszínezünk, itt szól, hogy a TS-tükör is átvezetendő.

const css = readFileSync(
  join(process.cwd(), "src/app/globals.css"),
  "utf8",
);

function cssVar(name: string): string | null {
  const match = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`));
  return match ? match[1].toLowerCase() : null;
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
  ["cream", "cream"],
  ["sand", "sand"],
  ["warm", "warm"],
  ["warmMid", "warm-mid"],
  ["warmDark", "warm-dark"],
];

test("design-tokens.ts COLORS szinkronban a globals.css @theme értékeivel", () => {
  for (const [tsKey, cssName] of PAIRS) {
    const fromCss = cssVar(cssName);
    assert.ok(fromCss, `--color-${cssName} hiányzik a globals.css-ből`);
    assert.equal(
      COLORS[tsKey].toLowerCase(),
      fromCss,
      `COLORS.${tsKey} (${COLORS[tsKey]}) ≠ --color-${cssName} (${fromCss}) — ` +
        "palettacsere esetén mindkét forrást frissítsd",
    );
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
