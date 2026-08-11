import test from "node:test";
import assert from "node:assert/strict";
import { hexLetter, HEXACO_DIMENSIONS, HEXACO_ORDER } from "@/lib/hexaco";

// A hexLetter a KÖZÖS badge-feloldó (tritan.ts): a felületeken a belső
// dimenziókód (X/H/…) soha nem jelenhet meg nyersen — a manager-
// cockpit, a TeamInsights, a TeamHeatmap és a TeamIntelligence korábban
// három lokális másolatból (ill. feloldás nélkül) dolgozott.

test("hexLetter: belső kód → HEXACO-betű (H/E/X/A/C/O)", () => {
  assert.equal(hexLetter("H"), "H");
  assert.equal(hexLetter("E"), "E");
  assert.equal(hexLetter("X"), "X");
  assert.equal(hexLetter("A"), "A");
  assert.equal(hexLetter("C"), "C");
  assert.equal(hexLetter("O"), "O");
});

test("hexLetter: a kanonikus térképpel (HEXACO_DIMENSIONS) azonos betűt ad", () => {
  for (const code of HEXACO_ORDER) {
    assert.equal(hexLetter(code), HEXACO_DIMENSIONS[code].letter);
  }
});

test("hexLetter: ismeretlen kódra a bemenetet adja vissza (nem dob)", () => {
  assert.equal(hexLetter("NOPE"), "NOPE");
  assert.equal(hexLetter(""), "");
});
