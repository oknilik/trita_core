import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DIFF_MIN_GAP,
  TYPE_ADJECTIVE_MIN_GAP,
  resolvePersonalityTypeFromScores,
  resolvePersonalityTypeLabel,
} from "@/lib/personality-type";

// Melléknév-óvatosság: ha a 2. és 3. helyezett dimenzió különbsége a mérési
// hibán belül van (< TYPE_ADJECTIVE_MIN_GAP = round(SEM, rövid forma)), a
// melléknévi színezet nem állítható megbízhatóan → főnév-only címke.
// Top-pár óvatosság (motor-audit v3, interpr. S3): ugyanez a kapu az 1-2.
// helyezettre is fut — ha a két legerősebb dimenzió van egy SEM-en belül,
// a domináns kijelölése (és vele a fő archetípus) volna műtermék.

const dims = (scores: Record<string, number>) =>
  Object.entries(scores).map(([code, score]) => ({ code, score }));

describe("resolvePersonalityTypeFromScores — melléknév-óvatosság", () => {
  it("közeli 2-3. helyezett (gap < küszöb) → csak főnév, nagybetűsítve", () => {
    // OPEN(80) domináns, TEMP(60) vs THOR(55): gap 5 < 10 → a melléknév bizonytalan.
    const scores = dims({ OPEN: 80, TEMP: 60, THOR: 55, ADAP: 30, RESO: 25, INTE: 20 });
    assert.equal(resolvePersonalityTypeFromScores(scores, "hu"), "Újító");
    assert.equal(resolvePersonalityTypeFromScores(scores, "en"), "Innovator");
  });

  it("távoli 2-3. helyezett (gap >= küszöb) → teljes címke", () => {
    // TEMP(60) vs THOR(45): gap 15 → magabiztos melléknév.
    const scores = dims({ OPEN: 80, TEMP: 60, THOR: 45, ADAP: 30, RESO: 25, INTE: 20 });
    assert.equal(resolvePersonalityTypeFromScores(scores, "hu"), "Energikus újító");
    assert.equal(resolvePersonalityTypeFromScores(scores, "en"), "Energetic Innovator");
  });

  it("pont a küszöbön (gap == küszöb) → teljes címke (a szabály szigorú <)", () => {
    const scores = dims({
      OPEN: 80,
      TEMP: 60,
      THOR: 60 - TYPE_ADJECTIVE_MIN_GAP,
      ADAP: 30,
      RESO: 25,
      INTE: 20,
    });
    assert.equal(resolvePersonalityTypeFromScores(scores, "hu"), "Energikus újító");
  });

  it("közeli 1-2. helyezett (gap < küszöb) → csak főnév, hiába nagy a 2-3. gap (interpr. S3)", () => {
    // OPEN(80) vs TEMP(78): a domináns kijelölése SEM-en belüli sorrend —
    // pedig ez dönti el a fő archetípust. A 2-3. gap (33) önmagában nagy,
    // a korábbi kapu ezért itt teljes címkét engedett ki.
    const scores = dims({ OPEN: 80, TEMP: 78, THOR: 45, ADAP: 30, RESO: 25, INTE: 20 });
    assert.equal(resolvePersonalityTypeFromScores(scores, "hu"), "Újító");
    assert.equal(resolvePersonalityTypeFromScores(scores, "en"), "Innovator");
  });

  it("pont a küszöbön lévő 1-2. gap → teljes címke (a szabály szigorú <)", () => {
    const scores = dims({
      OPEN: 80,
      TEMP: 80 - TYPE_ADJECTIVE_MIN_GAP,
      THOR: 45,
      ADAP: 30,
      RESO: 25,
      INTE: 20,
    });
    assert.equal(resolvePersonalityTypeFromScores(scores, "hu"), "Energikus újító");
  });

  it("teljes holtverseny → főnév-only (a sorrend a kanonikus tie-break műterméke)", () => {
    const scores = dims({ OPEN: 50, TEMP: 50, THOR: 50, ADAP: 50, RESO: 50, INTE: 50 });
    // Holtversenynél a rangsor: INTE, RESO, … — de a címke csak a főnév.
    assert.equal(resolvePersonalityTypeFromScores(scores, "hu"), "Értékőr");
    assert.equal(resolvePersonalityTypeFromScores(scores, "en"), "Value Guardian");
  });

  it("pontosan két, jól elváló dimenziónál → teljes címke marad", () => {
    const scores = dims({ OPEN: 80, TEMP: 60 });
    assert.equal(
      resolvePersonalityTypeFromScores(scores, "hu"),
      resolvePersonalityTypeLabel("OPEN", "TEMP", "hu"),
    );
  });

  it("pontosan két, SEM-en belüli dimenzió → főnév-only (a top-pár kapu 3. helyezett nélkül is él)", () => {
    const scores = dims({ OPEN: 80, TEMP: 78 });
    assert.equal(resolvePersonalityTypeFromScores(scores, "hu"), "Újító");
    assert.equal(resolvePersonalityTypeFromScores(scores, "en"), "Innovator");
  });

  it("kevesebb mint két (ismert) dimenzió → null (hívói fallback)", () => {
    assert.equal(resolvePersonalityTypeFromScores(dims({ OPEN: 80 }), "hu"), null);
    assert.equal(resolvePersonalityTypeFromScores([], "hu"), null);
    assert.equal(
      resolvePersonalityTypeFromScores(dims({ OPEN: 80, I: 70 }), "hu"),
      null,
    );
  });

  it("ismeretlen kód (pl. az intersticiális 'I') nem torzítja a rangsort és a gap-et", () => {
    // Az altruizmus-skála gyakran magas — nyers scores.dimensions bemenetnél
    // sem lophatja el a 2. helyet, és a 2-3. helyezett gap-jébe sem számít.
    const withI = dims({ OPEN: 80, I: 75, TEMP: 60, THOR: 45, ADAP: 30, RESO: 25, INTE: 20 });
    const withoutI = dims({ OPEN: 80, TEMP: 60, THOR: 45, ADAP: 30, RESO: 25, INTE: 20 });
    assert.equal(
      resolvePersonalityTypeFromScores(withI, "hu"),
      resolvePersonalityTypeFromScores(withoutI, "hu"),
    );
    assert.equal(resolvePersonalityTypeFromScores(withI, "hu"), "Energikus újító");
  });

  it("a küszöb a KÜLÖNBSÉG mérési hibájából jön (√2·SEM ~15) — ld. psychometrics invariáns-teszt", () => {
    // Két dimenzió KÜLÖNBSÉGE dönti el a sorrendet, ezért a kapu √2·SEM (≈15),
    // nem 1×SEM (10). A régi alias visszafelé kompatibilis, azonos értékkel.
    assert.equal(DIFF_MIN_GAP, 15);
    assert.equal(TYPE_ADJECTIVE_MIN_GAP, DIFF_MIN_GAP);
  });
});
