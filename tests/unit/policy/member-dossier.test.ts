import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canViewMemberDossier } from "@/lib/measurement-auth";
import {
  DOSSIER_GAP_MIN_DELTA,
  DOSSIER_OBSERVER_MIN,
  computeObserverAverage,
  computeObserverFacetAverages,
  computeDimComparisons,
  topGapDims,
} from "@/lib/member-dossier";
import { TRITAN_DIMENSION_FACETS, TRITAN_ORDER } from "@/lib/tritan";

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

describe("computeObserverFacetAverages — facet-szintű küszöb + listwise átlag", () => {
  const fullFacets = (v: number): Record<string, Record<string, number>> =>
    Object.fromEntries(
      TRITAN_ORDER.map((dim) => [
        dim,
        Object.fromEntries(TRITAN_DIMENSION_FACETS[dim].map((f) => [f, v])),
      ]),
    );

  it("0 vagy 1 készlet → null (küszöb alatt)", () => {
    assert.equal(computeObserverFacetAverages(TRITAN_ORDER, []), null);
    assert.equal(computeObserverFacetAverages(TRITAN_ORDER, [fullFacets(50)]), null);
  });

  it("2 teljes készlet → facetenként kerekített átlag", () => {
    const avg = computeObserverFacetAverages(TRITAN_ORDER, [fullFacets(40), fullFacets(51)]);
    assert.ok(avg);
    // (40+51)/2 = 45.5 → 46 (Math.round félfelé)
    for (const dim of TRITAN_ORDER) {
      for (const f of TRITAN_DIMENSION_FACETS[dim]) {
        assert.equal(avg![dim][f], 46);
      }
    }
  });

  it("vegyes lefedettség: 1 raternél lévő facet kimarad, 2-nél csak belőlük átlagol", () => {
    const a = fullFacets(60);
    const b = fullFacets(80);
    const c = fullFacets(100);
    // creativity csak a+c-nél van → (60+100)/2 = 80
    delete b["OPEN"]["creativity"];
    // inquisitiveness csak b-nél van → küszöb alatt, kulcs-kihagyás
    delete a["OPEN"]["inquisitiveness"];
    delete c["OPEN"]["inquisitiveness"];
    const avg = computeObserverFacetAverages(TRITAN_ORDER, [a, b, c]);
    assert.ok(avg);
    assert.equal(avg!["OPEN"]["creativity"], 80);
    assert.equal("inquisitiveness" in avg!["OPEN"], false);
    // teljes lefedettségnél mindhárom számít: (60+80+100)/3 = 80
    assert.equal(avg!["OPEN"]["unconventionality"], 80);
  });

  it("üresen maradt dimenzió kulcsa is kimarad", () => {
    const a = fullFacets(60);
    const b = fullFacets(80);
    delete a["OPEN"]; // OPEN csak b-nél → minden OPEN-facet küszöb alatt
    const avg = computeObserverFacetAverages(TRITAN_ORDER, [a, b]);
    assert.ok(avg);
    assert.equal("OPEN" in avg!, false);
    assert.equal(avg!["TEMP"]["sociability"], 70); // (60+80)/2
  });

  it("facets nélküli (örökség) készletet tolerál — minden facet küszöb alatt → üres objektum", () => {
    const avg = computeObserverFacetAverages(TRITAN_ORDER, [fullFacets(50), undefined]);
    assert.deepEqual(avg, {});
  });

  it("kerekítés: 61 és 62 átlaga 61.5 → 62", () => {
    const avg = computeObserverFacetAverages(TRITAN_ORDER, [fullFacets(61), fullFacets(62)]);
    assert.equal(avg!["INTE"]["sincerity"], 62);
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

describe("topGapDims — rangsor + SEM-alapú küszöb", () => {
  it("a default küszöb a mérési hiba: pontosan 10", () => {
    // = Math.round(dimStandardError("short")) — a fix 5 a hiba alatt volt.
    assert.equal(DOSSIER_GAP_MIN_DELTA, 10);
  });

  it("|delta| szerint csökkenő, a SEM-küszöb (10) alattiak és null-ok kihagyva, max n", () => {
    const self: Record<string, number> = { TEMP: 50, RESO: 50, INTE: 50, THOR: 50, ADAP: 50, OPEN: 50 };
    const obs: Record<string, number> = { TEMP: 53, RESO: 42, INTE: 70, THOR: 46, ADAP: 65, OPEN: 51 };
    // deltak: TEMP +3(kihagy), RESO -8(kihagy — hibán belül), INTE +20,
    // THOR -4(kihagy), ADAP +15, OPEN +1(kihagy)
    const gaps = topGapDims(computeDimComparisons(TRITAN_ORDER, self, obs));
    assert.deepEqual(gaps.map((d) => d.code), ["INTE", "ADAP"]);
  });

  it("küszöb-határ: |delta| = 9 kimarad, |delta| = 10 bekerül", () => {
    const self: Record<string, number> = { TEMP: 50, RESO: 50, INTE: 50, THOR: 50, ADAP: 50, OPEN: 50 };
    const obs: Record<string, number> = { TEMP: 59, RESO: 40, INTE: 50, THOR: 50, ADAP: 50, OPEN: 50 };
    // deltak: TEMP +9 (kihagy), RESO -10 (bekerül)
    const gaps = topGapDims(computeDimComparisons(TRITAN_ORDER, self, obs));
    assert.deepEqual(gaps.map((d) => d.code), ["RESO"]);
  });

  it("a minAbsDelta paraméter felülírja a defaultot", () => {
    const self: Record<string, number> = { TEMP: 50, RESO: 50, INTE: 50, THOR: 50, ADAP: 50, OPEN: 50 };
    const obs: Record<string, number> = { TEMP: 53, RESO: 42, INTE: 70, THOR: 46, ADAP: 65, OPEN: 51 };
    const gaps = topGapDims(computeDimComparisons(TRITAN_ORDER, self, obs), 3, 5);
    assert.deepEqual(gaps.map((d) => d.code), ["INTE", "ADAP", "RESO"]);
  });

  it("observer nélküli (null delta) sorok sosem gap-ek", () => {
    const self: Record<string, number> = { TEMP: 50, RESO: 40, INTE: 30, THOR: 20, ADAP: 60, OPEN: 70 };
    assert.deepEqual(topGapDims(computeDimComparisons(TRITAN_ORDER, self, null)), []);
  });
});
