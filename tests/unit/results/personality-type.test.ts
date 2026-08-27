import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DIFF_MIN_GAP,
  TYPE_ADJECTIVE_MIN_GAP,
  resolvePersonalityTypeFromScores,
  resolvePersonalityTypeLabel,
} from "@/lib/personality-type";
import { diffStandardError } from "@/lib/psychometrics";

// Melléknév-óvatosság: ha a 2. és 3. helyezett dimenzió különbsége a mérési
// hibán belül van (< TYPE_ADJECTIVE_MIN_GAP = round(SEM, rövid forma)), a
// melléknévi színezet nem állítható megbízhatóan → főnév-only címke.
// Top-pár óvatosság (motor-audit v3, interpr. S3): ugyanez a kapu az 1-2.
// helyezettre is fut — ha a két legerősebb dimenzió van egy SEM-en belül,
// a domináns kijelölése (és vele a fő archetípus) volna műtermék.

const dims = (scores: Record<string, number>) =>
  Object.entries(scores).map(([code, score]) => ({ code, score }));

describe("resolvePersonalityTypeFromScores – melléknév-óvatosság", () => {
  it("közeli 2-3. helyezett (gap < küszöb) → csak főnév, nagybetűsítve", () => {
    // O(80) domináns, X(60) vs C(55): gap 5 < küszöb → a melléknév bizonytalan.
    const scores = dims({ O: 80, X: 60, C: 55, A: 30, E: 25, H: 20 });
    assert.equal(resolvePersonalityTypeFromScores(scores, "hu"), "Újító");
    assert.equal(resolvePersonalityTypeFromScores(scores, "en"), "Innovator");
  });

  it("távoli 2-3. helyezett (gap >= küszöb) → teljes címke", () => {
    // X(60) vs C(45): gap 15 → magabiztos melléknév.
    const scores = dims({ O: 80, X: 60, C: 45, A: 30, E: 25, H: 20 });
    assert.equal(resolvePersonalityTypeFromScores(scores, "hu"), "Energikus újító");
    assert.equal(resolvePersonalityTypeFromScores(scores, "en"), "Energetic Innovator");
  });

  it("pont a küszöbön (gap == küszöb) → teljes címke (a szabály szigorú <)", () => {
    const scores = dims({
      O: 80,
      X: 60,
      C: 60 - TYPE_ADJECTIVE_MIN_GAP,
      A: 30,
      E: 25,
      H: 20,
    });
    assert.equal(resolvePersonalityTypeFromScores(scores, "hu"), "Energikus újító");
  });

  it("közeli 1-2. helyezett (gap < küszöb) → csak főnév, hiába nagy a 2-3. gap (interpr. S3)", () => {
    // O(80) vs X(78): a domináns kijelölése SEM-en belüli sorrend —
    // pedig ez dönti el a fő archetípust. A 2-3. gap (33) önmagában nagy,
    // a korábbi kapu ezért itt teljes címkét engedett ki.
    const scores = dims({ O: 80, X: 78, C: 45, A: 30, E: 25, H: 20 });
    assert.equal(resolvePersonalityTypeFromScores(scores, "hu"), "Újító");
    assert.equal(resolvePersonalityTypeFromScores(scores, "en"), "Innovator");
  });

  it("pont a küszöbön lévő 1-2. gap → teljes címke (a szabály szigorú <)", () => {
    const scores = dims({
      O: 80,
      X: 80 - TYPE_ADJECTIVE_MIN_GAP,
      C: 45,
      A: 30,
      E: 25,
      H: 20,
    });
    assert.equal(resolvePersonalityTypeFromScores(scores, "hu"), "Energikus újító");
  });

  it("teljes holtverseny → főnév-only (a sorrend a kanonikus tie-break műterméke)", () => {
    const scores = dims({ O: 50, X: 50, C: 50, A: 50, E: 50, H: 50 });
    // Holtversenynél a rangsor: H, E, … — de a címke csak a főnév.
    assert.equal(resolvePersonalityTypeFromScores(scores, "hu"), "Értékőr");
    assert.equal(resolvePersonalityTypeFromScores(scores, "en"), "Value Guardian");
  });

  it("pontosan két, jól elváló dimenziónál → teljes címke marad", () => {
    const scores = dims({ O: 80, X: 60 });
    assert.equal(
      resolvePersonalityTypeFromScores(scores, "hu"),
      resolvePersonalityTypeLabel("O", "X", "hu"),
    );
  });

  it("pontosan két, SEM-en belüli dimenzió → főnév-only (a top-pár kapu 3. helyezett nélkül is él)", () => {
    const scores = dims({ O: 80, X: 78 });
    assert.equal(resolvePersonalityTypeFromScores(scores, "hu"), "Újító");
    assert.equal(resolvePersonalityTypeFromScores(scores, "en"), "Innovator");
  });

  it("kevesebb mint két (ismert) dimenzió → null (hívói fallback)", () => {
    assert.equal(resolvePersonalityTypeFromScores(dims({ O: 80 }), "hu"), null);
    assert.equal(resolvePersonalityTypeFromScores([], "hu"), null);
    assert.equal(
      resolvePersonalityTypeFromScores(dims({ O: 80, I: 70 }), "hu"),
      null,
    );
  });

  it("ismeretlen kód (pl. az intersticiális 'I') nem torzítja a rangsort és a gap-et", () => {
    // Az altruizmus-skála gyakran magas — nyers scores.dimensions bemenetnél
    // sem lophatja el a 2. helyet, és a 2-3. helyezett gap-jébe sem számít.
    const withI = dims({ O: 80, I: 75, X: 60, C: 45, A: 30, E: 25, H: 20 });
    const withoutI = dims({ O: 80, X: 60, C: 45, A: 30, E: 25, H: 20 });
    assert.equal(
      resolvePersonalityTypeFromScores(withI, "hu"),
      resolvePersonalityTypeFromScores(withoutI, "hu"),
    );
    assert.equal(resolvePersonalityTypeFromScores(withI, "hu"), "Energikus újító");
  });

  it("a küszöb a KÜLÖNBSÉG mérési hibájából jön (√2·SEM) – ld. psychometrics invariáns-teszt", () => {
    // Két dimenzió KÜLÖNBSÉGE dönti el a sorrendet, ezért a kapu √2·SEM,
    // nem 1×SEM. A KONKRÉT érték a bankból (rövid forma item-száma) ÉS a
    // reliabilitás-konstansokból jön, ezért itt NEM literálhoz kötjük — a
    // korábbi kézi 15 pontosan attól avult el, hogy a bank változott
    // (2026-08-11: 60 fő-dimenziós item → 14), majd a 14 attól, hogy a kézi
    // SEM-priorok helyére MÉRT értékek kerültek (→ 11). A számszerű invariáns
    // helye: tests/unit/scoring/psychometrics.test.ts (ott a bankból számol).
    assert.equal(DIFF_MIN_GAP, Math.round(diffStandardError("short")));
    assert.equal(TYPE_ADJECTIVE_MIN_GAP, DIFF_MIN_GAP);
  });
});
