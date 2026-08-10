import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canViewMemberDossier } from "@/lib/measurement-auth";
import {
  DOSSIER_OBSERVER_MIN,
  computeObserverAverage,
  computeDimComparisons,
  topGapDims,
} from "@/lib/member-dossier";
import { TRITAN_ORDER } from "@/lib/tritan";

// A tag-dossié hozzáférés KŐBE VÉSETT (2026-07-28): kizárólag org admin +
// tanácsadói kör. A manager NEM, a tag a sajátját SEM. Explicit allowlist.
describe("canViewMemberDossier — hozzáférési allowlist", () => {
  it("ORG_ADMIN → true", () => {
    assert.equal(canViewMemberDossier("ORG_ADMIN"), true);
  });

  it("ORG_CONSULTANT → true", () => {
    assert.equal(canViewMemberDossier("ORG_CONSULTANT"), true);
  });

  it("isConsultant=true bármely (nem-privilegizált) szereppel → true", () => {
    assert.equal(canViewMemberDossier("ORG_MEMBER", null, true), true);
    assert.equal(canViewMemberDossier("ORG_MANAGER", null, true), true);
    assert.equal(canViewMemberDossier(null, null, true), true);
  });

  it("ORG_MANAGER (tanácsadói jel nélkül) → false", () => {
    assert.equal(canViewMemberDossier("ORG_MANAGER"), false);
    assert.equal(canViewMemberDossier("ORG_MANAGER", "manager@x.io", false), false);
  });

  it("ORG_MEMBER → false (a tag a sajátját sem éri el)", () => {
    assert.equal(canViewMemberDossier("ORG_MEMBER"), false);
    assert.equal(canViewMemberDossier("ORG_MEMBER", "member@x.io", false), false);
  });

  it("null / undefined / üres szerep → false", () => {
    assert.equal(canViewMemberDossier(null), false);
    assert.equal(canViewMemberDossier(undefined), false);
    assert.equal(canViewMemberDossier(""), false);
  });

  it("ismeretlen / rossz alakú szerep-string → false", () => {
    assert.equal(canViewMemberDossier("ORG_OWNER"), false);
    assert.equal(canViewMemberDossier("org_admin"), false); // kisbetűs nem egyezik
    assert.equal(canViewMemberDossier("ADMIN"), false);
  });
});

describe("computeObserverAverage — observer-küszöb + átlag", () => {
  const full = (v: number): Record<string, number> =>
    Object.fromEntries(TRITAN_ORDER.map((c) => [c, v]));

  it("0 vagy 1 készlet → null (küszöb alatt)", () => {
    assert.equal(DOSSIER_OBSERVER_MIN, 2);
    assert.equal(computeObserverAverage(TRITAN_ORDER, []), null);
    assert.equal(computeObserverAverage(TRITAN_ORDER, [full(50)]), null);
  });

  it("2 készlet → dimenziónként kerekített átlag", () => {
    const avg = computeObserverAverage(TRITAN_ORDER, [full(40), full(51)]);
    assert.ok(avg);
    // (40+51)/2 = 45.5 → 46 (Math.round félfelé)
    for (const c of TRITAN_ORDER) assert.equal(avg![c], 46);
  });

  it("hiányzó dimenziót az adott készletben kihagy (csak jelenlévőkből átlagol)", () => {
    const a = full(60);
    const b = full(80);
    delete b["OPEN"]; // OPEN csak az egyik készletben van
    const avg = computeObserverAverage(TRITAN_ORDER, [a, b]);
    assert.equal(avg!["OPEN"], 60); // csak 'a' hordozza → 60
    assert.equal(avg!["TEMP"], 70); // (60+80)/2
  });
});

describe("computeDimComparisons — sorrend, delta, üres self", () => {
  it("HEXACO-sorrend + delta = observer − self", () => {
    const self: Record<string, number> = { TEMP: 50, RESO: 40, INTE: 30, THOR: 20, ADAP: 60, OPEN: 70 };
    const obs: Record<string, number> = { TEMP: 55, RESO: 30, INTE: 30, THOR: 25, ADAP: 60, OPEN: 90 };
    const cmp = computeDimComparisons(TRITAN_ORDER, self, obs);
    assert.deepEqual(cmp.map((d) => d.code), TRITAN_ORDER);
    // HEXACO-sorrend: INTE(H), RESO(E), TEMP(X), ADAP(A), THOR(C), OPEN(O)
    assert.equal(cmp[0].delta, 0); // INTE 30-30
    assert.equal(cmp[1].delta, -10); // RESO 30-40
    assert.equal(cmp[2].delta, 5); // TEMP 55-50
    assert.equal(cmp[5].delta, 20); // OPEN 90-70
  });

  it("observer nélkül (null) → observer/delta null", () => {
    const self: Record<string, number> = { TEMP: 50, RESO: 40, INTE: 30, THOR: 20, ADAP: 60, OPEN: 70 };
    const cmp = computeDimComparisons(TRITAN_ORDER, self, null);
    assert.equal(cmp.length, TRITAN_ORDER.length);
    for (const d of cmp) {
      assert.equal(d.observer, null);
      assert.equal(d.delta, null);
    }
  });

  it("üres self → üres lista", () => {
    assert.deepEqual(computeDimComparisons(TRITAN_ORDER, {}, null), []);
  });

  it("hiányzó self-dimenzió kimarad a sorokból (nincs hamis −100 delta)", () => {
    const self: Record<string, number> = { TEMP: 50, RESO: 40, INTE: 30, THOR: 20, ADAP: 60 }; // OPEN hiányzik
    const obs: Record<string, number> = Object.fromEntries(
      TRITAN_ORDER.map((c) => [c, 60]),
    );
    const cmp = computeDimComparisons(TRITAN_ORDER, self, obs);
    assert.deepEqual(
      cmp.map((d) => d.code),
      TRITAN_ORDER.filter((c) => c !== "OPEN"),
    );
    assert.ok(cmp.every((d) => d.delta === null || d.delta > -100));
  });
});

describe("topGapDims — rangsor + 5 pontos küszöb", () => {
  it("|delta| szerint csökkenő, küszöb alattiak és null-ok kihagyva, max n", () => {
    const self: Record<string, number> = { TEMP: 50, RESO: 50, INTE: 50, THOR: 50, ADAP: 50, OPEN: 50 };
    const obs: Record<string, number> = { TEMP: 53, RESO: 42, INTE: 70, THOR: 46, ADAP: 65, OPEN: 51 };
    // deltak: TEMP +3(kihagy), RESO -8, INTE +20, THOR -4(kihagy), ADAP +15, OPEN +1(kihagy)
    const gaps = topGapDims(computeDimComparisons(TRITAN_ORDER, self, obs));
    assert.deepEqual(gaps.map((d) => d.code), ["INTE", "ADAP", "RESO"]);
  });

  it("observer nélküli (null delta) sorok sosem gap-ek", () => {
    const self: Record<string, number> = { TEMP: 50, RESO: 40, INTE: 30, THOR: 20, ADAP: 60, OPEN: 70 };
    assert.deepEqual(topGapDims(computeDimComparisons(TRITAN_ORDER, self, null)), []);
  });
});
