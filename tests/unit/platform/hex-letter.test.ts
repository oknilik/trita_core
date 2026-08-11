import test from "node:test";
import assert from "node:assert/strict";
import { hexLetter, TRITAN_DIMENSIONS, TRITAN_ORDER } from "@/lib/tritan";

// A hexLetter a KÖZÖS badge-feloldó (tritan.ts): a felületeken a belső
// dimenziókód (TEMP/INTE/…) soha nem jelenhet meg nyersen — a manager-
// cockpit, a TeamInsights, a TeamHeatmap és a TeamIntelligence korábban
// három lokális másolatból (ill. feloldás nélkül) dolgozott.

test("hexLetter: belső kód → HEXACO-betű (H/E/X/A/C/O)", () => {
  assert.equal(hexLetter("INTE"), "H");
  assert.equal(hexLetter("RESO"), "E");
  assert.equal(hexLetter("TEMP"), "X");
  assert.equal(hexLetter("ADAP"), "A");
  assert.equal(hexLetter("THOR"), "C");
  assert.equal(hexLetter("OPEN"), "O");
});

test("hexLetter: a kanonikus térképpel (TRITAN_DIMENSIONS) azonos betűt ad", () => {
  for (const code of TRITAN_ORDER) {
    assert.equal(hexLetter(code), TRITAN_DIMENSIONS[code].letter);
  }
});

test("hexLetter: ismeretlen kódra a bemenetet adja vissza (nem dob)", () => {
  assert.equal(hexLetter("NOPE"), "NOPE");
  assert.equal(hexLetter(""), "");
});
