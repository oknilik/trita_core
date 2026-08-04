import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildShareOgModel } from "@/lib/share-og";

const DIMS = {
  INTE: 55,
  RESO: 50,
  TEMP: 88,
  ADAP: 30,
  THOR: 74,
  OPEN: 90,
};

describe("buildShareOgModel — OG-kártya adatmodell", () => {
  it("érvényes pontszámokból nevet, típust és glyph-párt ad", () => {
    const model = buildShareOgModel(DIMS, "Kata", "hu");
    assert.equal(model.displayName, "Kata");
    // domináns OPEN (újító), második TEMP (energikus)
    assert.equal(model.primaryCode, "OPEN");
    assert.equal(model.secondaryCode, "TEMP");
    assert.equal(model.typeLabel, "Energikus újító");
    assert.ok(model.intensity >= 1 && model.intensity <= 5);
  });

  it("angol locale-lal angol címkét ad", () => {
    const model = buildShareOgModel(DIMS, null, "en");
    assert.equal(model.typeLabel, "Energetic Innovator");
    assert.equal(model.displayName, null);
  });

  it("hiányzó pontszámoknál üres modell (generikus brand-kép ág)", () => {
    const model = buildShareOgModel(null, "Kata", "hu");
    assert.equal(model.typeLabel, null);
    assert.equal(model.primaryCode, null);
    assert.equal(model.displayName, "Kata");
  });

  it("ismeretlen dimenziókódokkal (nem-likert / sérült JSON) üres modell", () => {
    const model = buildShareOgModel({ FOO: 80 }, null, "hu");
    assert.equal(model.typeLabel, null);
    assert.equal(model.primaryCode, null);
  });
});
