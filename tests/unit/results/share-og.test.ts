import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildShareOgModel } from "@/lib/share-og";

// Jól elváló rangsor: az 1-2. ÉS a 2-3. helyezett közti gap is nagyobb a
// mérési hibánál (DIFF_MIN_GAP = 15, SE(diff)-kapu) — így a teljes
// „melléknév + főnév" címke megy ki. SEM-en belüli top-párnál (interp S3
// kapu) a resolver főnév-only címkére szelídül, az a személyiség-típus
// tesztjeiben él. (A fixture a 10→15-ös küszöb-emelés után frissítve:
// 90/73/55 — mindkét gap ≥ 15.)
const DIMS = {
  H: 55,
  E: 50,
  X: 73,
  A: 30,
  C: 55,
  O: 90,
};

describe("buildShareOgModel — OG-kártya adatmodell", () => {
  it("érvényes pontszámokból nevet, típust és glyph-párt ad", () => {
    const model = buildShareOgModel(DIMS, "Kata", "hu");
    assert.equal(model.displayName, "Kata");
    // domináns O (újító), második X (energikus)
    assert.equal(model.primaryCode, "O");
    assert.equal(model.secondaryCode, "X");
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
