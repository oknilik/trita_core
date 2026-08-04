import test from "node:test";
import assert from "node:assert/strict";
import {
  DIMENSION_GLYPHS,
  FORM_GEOMETRY,
  GLYPH_DIMENSION_ORDER,
  intensityFromScore,
  resolveGlyphPair,
} from "@/lib/type-glyph";
import { PERSONALITY_TYPE_PARTS } from "@/lib/personality-type";
import { TRITAN_DIMENSIONS } from "@/lib/tritan";

// A típus-ábra nyelvtana csak akkor működik, ha MINDEN dimenzióhoz van
// forma és motívum, és ha az ábra ugyanazt a párt használja, mint a
// típusnév (domináns forma + második motívum).

test("minden dimenzióhoz tartozik glyph, forma-geometriával", () => {
  for (const code of Object.keys(PERSONALITY_TYPE_PARTS)) {
    const glyph = DIMENSION_GLYPHS[code];
    assert.ok(glyph, `nincs glyph a(z) ${code} dimenzióhoz`);
    assert.equal(glyph.hexaco, TRITAN_DIMENSIONS[code as keyof typeof TRITAN_DIMENSIONS].letter);
    const geometry = FORM_GEOMETRY[glyph.form];
    assert.ok(geometry, `nincs geometria a(z) ${glyph.form} formához`);
    assert.ok(
      geometry.path || (geometry.discs && geometry.discs.length > 0),
      `a(z) ${glyph.form} formának nincs rajzolható eleme`,
    );
  }
});

test("a formák és motívumok dimenziónként egyediek (megkülönböztethetőség)", () => {
  const forms = new Set(GLYPH_DIMENSION_ORDER.map((code) => DIMENSION_GLYPHS[code].form));
  const motifs = new Set(GLYPH_DIMENSION_ORDER.map((code) => DIMENSION_GLYPHS[code].motif));
  assert.equal(forms.size, GLYPH_DIMENSION_ORDER.length);
  assert.equal(motifs.size, GLYPH_DIMENSION_ORDER.length);
});

test("resolveGlyphPair a két legerősebb dimenziót adja, sorrendhelyesen", () => {
  const pair = resolveGlyphPair([
    { code: "INTE", score: 40 },
    { code: "OPEN", score: 88 },
    { code: "TEMP", score: 71 },
  ]);
  assert.deepEqual(pair, { primaryCode: "OPEN", secondaryCode: "TEMP", intensity: 5 });
});

test("resolveGlyphPair: ismeretlen kód kiesik, két érvényes alatt null", () => {
  assert.equal(resolveGlyphPair([{ code: "I", score: 90 }, { code: "OPEN", score: 50 }]), null);
  assert.equal(resolveGlyphPair([{ code: "OPEN", score: 50 }]), null);
});

test("egyező pár = tiszta típus (a komponens ilyenkor duplázza a motívumot)", () => {
  const pair = resolveGlyphPair([
    { code: "THOR", score: 64 },
    { code: "THOR", score: 64 },
  ]);
  assert.ok(pair);
  assert.equal(pair.primaryCode, pair.secondaryCode);
});

test("intenzitás-skála 1–5 közé esik és monoton", () => {
  const levels = [0, 24, 30, 50, 70, 85, 100].map(intensityFromScore);
  for (const level of levels) {
    assert.ok(level >= 1 && level <= 5);
  }
  for (let i = 1; i < levels.length; i += 1) {
    assert.ok(levels[i] >= levels[i - 1], "az intenzitás nem csökkenhet a pontszámmal");
  }
  assert.equal(intensityFromScore(null), 3);
});
