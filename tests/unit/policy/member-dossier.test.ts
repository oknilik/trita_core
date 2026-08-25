import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canViewMemberDossier } from "@/lib/measurement-auth";
import {
  DOSSIER_GAP_MIN_DELTA,
  DOSSIER_OBSERVER_MIN,
  computeObserverAverage,
  computeObserverFacetAverages,
  computeDimComparisons,
  computeFacetComparisons,
  topGapDims,
} from "@/lib/member-dossier";
import { HEXACO_DIMENSION_FACETS, HEXACO_ORDER } from "@/lib/hexaco";
import { diffStandardError } from "@/lib/psychometrics";

// A tag-dossié hozzáférés KŐBE VÉSETT (2026-08-25): kizárólag tanácsadói
// kör. Az org admin, a manager és a tag NEM fér hozzá.
describe("canViewMemberDossier — hozzáférési allowlist", () => {
  it("ORG_ADMIN → false", () => {
    assert.equal(canViewMemberDossier("ORG_ADMIN"), false);
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
    Object.fromEntries(HEXACO_ORDER.map((c) => [c, v]));

  it("küszöb alatt (0/1/2 készlet) → null", () => {
    assert.equal(DOSSIER_OBSERVER_MIN, 3);
    assert.equal(computeObserverAverage(HEXACO_ORDER, []), null);
    assert.equal(computeObserverAverage(HEXACO_ORDER, [full(50)]), null);
    assert.equal(computeObserverAverage(HEXACO_ORDER, [full(40), full(51)]), null);
  });

  it("3 készlet → dimenziónként kerekített átlag", () => {
    const avg = computeObserverAverage(HEXACO_ORDER, [full(40), full(50), full(51)]);
    assert.ok(avg);
    // (40+50+51)/3 = 47 (Math.round)
    for (const c of HEXACO_ORDER) assert.equal(avg![c], 47);
  });

  it("a küszöb alatt lefedett dimenzió KIMARAD (per-érték anonimitás-padló)", () => {
    const a = full(60);
    const b = full(80);
    const c = full(70);
    delete b["O"]; // O csak KÉT készletben van → 2 < DOSSIER_OBSERVER_MIN
    const avg = computeObserverAverage(HEXACO_ORDER, [a, b, c]);
    // Az anonimitás-padló PER-ÉRTÉK érvényes, nem csak a készletek számára:
    // két értékelőből képzett „átlag" a két konkrét választ fedné fel. Ugyanaz
    // a listwise szabály, mint a facet-siblingnél (motor-audit v8).
    assert.equal(avg!["O"], undefined, "2 értékelős dimenzió nem kerül ki");
    assert.equal(avg!["X"], 70); // (60+80+70)/3 — teljes lefedettség marad
  });
});

describe("computeObserverFacetAverages — facet-szintű küszöb + listwise átlag", () => {
  const fullFacets = (v: number): Record<string, Record<string, number>> =>
    Object.fromEntries(
      HEXACO_ORDER.map((dim) => [
        dim,
        Object.fromEntries(HEXACO_DIMENSION_FACETS[dim].map((f) => [f, v])),
      ]),
    );

  it("küszöb alatt (0/1/2 készlet) → null", () => {
    assert.equal(computeObserverFacetAverages(HEXACO_ORDER, []), null);
    assert.equal(computeObserverFacetAverages(HEXACO_ORDER, [fullFacets(50)]), null);
    assert.equal(
      computeObserverFacetAverages(HEXACO_ORDER, [fullFacets(40), fullFacets(51)]),
      null,
    );
  });

  it("3 teljes készlet → facetenként kerekített átlag", () => {
    const avg = computeObserverFacetAverages(HEXACO_ORDER, [
      fullFacets(40),
      fullFacets(50),
      fullFacets(51),
    ]);
    assert.ok(avg);
    // (40+50+51)/3 = 47 (Math.round)
    for (const dim of HEXACO_ORDER) {
      for (const f of HEXACO_DIMENSION_FACETS[dim]) {
        assert.equal(avg![dim][f], 47);
      }
    }
  });

  it("vegyes lefedettség: a nem teljesen lefedett facet kimarad (per-facet küszöb = DOSSIER_OBSERVER_MIN)", () => {
    const a = fullFacets(60);
    const b = fullFacets(80);
    const c = fullFacets(100);
    // creativity csak a+c-nél (2/3) → küszöb alatt, kulcs-kihagyás
    delete b["O"]["creativity"];
    const avg = computeObserverFacetAverages(HEXACO_ORDER, [a, b, c]);
    assert.ok(avg);
    assert.equal("creativity" in avg!["O"], false);
    // teljes (3/3) lefedettségnél mindhárom számít: (60+80+100)/3 = 80
    assert.equal(avg!["O"]["unconventionality"], 80);
  });

  it("üresen maradt dimenzió kulcsa is kimarad", () => {
    const a = fullFacets(60);
    const b = fullFacets(80);
    const c = fullFacets(70);
    delete a["O"];
    delete b["O"];
    delete c["O"]; // O egyik készletben sincs → dimenzió-kulcs kimarad
    const avg = computeObserverFacetAverages(HEXACO_ORDER, [a, b, c]);
    assert.ok(avg);
    assert.equal("O" in avg!, false);
    assert.equal(avg!["X"]["sociability"], 70); // (60+80+70)/3
  });

  it("facets nélküli (örökség) készletet tolerál — minden facet küszöb alatt → üres objektum", () => {
    // 3-elemű halmaz, egy örökség-sorral (facets nélkül): minden facetnek
    // csak 2 valódi lefedettsége van (< DOSSIER_OBSERVER_MIN) → mind kimarad.
    const avg = computeObserverFacetAverages(HEXACO_ORDER, [
      fullFacets(50),
      fullFacets(60),
      undefined,
    ]);
    assert.deepEqual(avg, {});
  });

  it("kerekítés: 61, 62, 63 átlaga 62", () => {
    const avg = computeObserverFacetAverages(HEXACO_ORDER, [
      fullFacets(61),
      fullFacets(62),
      fullFacets(63),
    ]);
    assert.equal(avg!["H"]["sincerity"], 62);
  });
});

describe("computeDimComparisons — sorrend, delta, üres self", () => {
  it("HEXACO-sorrend + delta = observer − self", () => {
    const self: Record<string, number> = { X: 50, E: 40, H: 30, C: 20, A: 60, O: 70 };
    const obs: Record<string, number> = { X: 55, E: 30, H: 30, C: 25, A: 60, O: 90 };
    const cmp = computeDimComparisons(HEXACO_ORDER, self, obs);
    assert.deepEqual(cmp.map((d) => d.code), HEXACO_ORDER);
    // HEXACO-sorrend: H(H), E(E), X(X), A(A), C(C), O(O)
    assert.equal(cmp[0].delta, 0); // H 30-30
    assert.equal(cmp[1].delta, -10); // E 30-40
    assert.equal(cmp[2].delta, 5); // X 55-50
    assert.equal(cmp[5].delta, 20); // O 90-70
  });

  it("observer nélkül (null) → observer/delta null", () => {
    const self: Record<string, number> = { X: 50, E: 40, H: 30, C: 20, A: 60, O: 70 };
    const cmp = computeDimComparisons(HEXACO_ORDER, self, null);
    assert.equal(cmp.length, HEXACO_ORDER.length);
    for (const d of cmp) {
      assert.equal(d.observer, null);
      assert.equal(d.delta, null);
    }
  });

  it("üres self → üres lista", () => {
    assert.deepEqual(computeDimComparisons(HEXACO_ORDER, {}, null), []);
  });

  it("hiányzó self-dimenzió kimarad a sorokból (nincs hamis −100 delta)", () => {
    const self: Record<string, number> = { X: 50, E: 40, H: 30, C: 20, A: 60 }; // O hiányzik
    const obs: Record<string, number> = Object.fromEntries(
      HEXACO_ORDER.map((c) => [c, 60]),
    );
    const cmp = computeDimComparisons(HEXACO_ORDER, self, obs);
    assert.deepEqual(
      cmp.map((d) => d.code),
      HEXACO_ORDER.filter((c) => c !== "O"),
    );
    assert.ok(cmp.every((d) => d.delta === null || d.delta > -100));
  });
});

describe("computeFacetComparisons — sorrend, delta, hiányzó értékek", () => {
  it("dimenzió- és facet-sorrendben adja vissza a mért self-faceteket", () => {
    const self = {
      H: { fairness: 70, sincerity: 61 },
      O: { creativity: 82 },
    };
    const observer = {
      H: { sincerity: 66, fairness: 64 },
      O: { creativity: 82 },
    };
    const cmp = computeFacetComparisons(HEXACO_ORDER, self, observer);
    assert.deepEqual(
      cmp.map((f) => `${f.dimensionCode}/${f.code}`),
      ["H/sincerity", "H/fairness", "O/creativity"],
    );
    assert.deepEqual(cmp.map((f) => f.delta), [5, -6, 0]);
  });

  it("observer-facet nélkül null értéket ad, hiányzó self-facetet nem kohol", () => {
    const cmp = computeFacetComparisons(
      HEXACO_ORDER,
      { C: { organization: 75 } },
      { C: { diligence: 80 } },
    );
    assert.deepEqual(cmp, [{
      dimensionCode: "C",
      code: "organization",
      self: 75,
      observer: null,
      delta: null,
    }]);
  });
});

describe("topGapDims — rangsor + SEM-alapú küszöb", () => {
  it("a default küszöb a KÜLÖNBSÉG mérési hibája: √2·SEM", () => {
    // = Math.round(diffStandardError("short")): az önkép és a külső (observer)
    // átlag KÉT független mérés, a különbségük hibája √2·SEM — a korábbi
    // 1×SEM ~40%-kal alul-becsülte, így a hibán belüli deltákat is felhozta.
    // A SZÁMÉRTÉK a bankból (rövid forma item/dimenzió) ÉS a mért
    // reliabilitás-konstansokból származik (2026-08-11 óta 14 → 11), ezért itt
    // nem literálhoz kötjük — a numerikus invariáns helye:
    // tests/unit/scoring/psychometrics.test.ts.
    assert.equal(DOSSIER_GAP_MIN_DELTA, Math.round(diffStandardError("short")));
    assert.ok(DOSSIER_GAP_MIN_DELTA > 10);
  });

  it("|delta| szerint csökkenő, a diff-küszöb alattiak és null-ok kihagyva, max n", () => {
    const self: Record<string, number> = { X: 50, E: 50, H: 50, C: 50, A: 50, O: 50 };
    const obs: Record<string, number> = { X: 53, E: 42, H: 70, C: 46, A: 65, O: 51 };
    // deltak: X +3(kihagy), E -8(kihagy), H +20 (bekerül),
    // C -4(kihagy), A +15 (bekerül), O +1(kihagy)
    const gaps = topGapDims(computeDimComparisons(HEXACO_ORDER, self, obs));
    assert.deepEqual(gaps.map((d) => d.code), ["H", "A"]);
  });

  it("küszöb-határ: a küszöb alatti egy ponttal kimarad, a küszöb bekerül", () => {
    // A határeset a kanonikus küszöbhöz igazodik (nem fix literál), így a
    // bank item-számának változása nem teszi hamissá a tesztet.
    const gate = DOSSIER_GAP_MIN_DELTA;
    const self: Record<string, number> = { X: 50, E: 50, H: 50, C: 50, A: 50, O: 50 };
    const obs: Record<string, number> = {
      X: 50 + (gate - 1), // pont a küszöb alatt → kihagy
      E: 50 - gate, //       pont a küszöbön (>=) → bekerül
      H: 50,
      C: 50,
      A: 50,
      O: 50,
    };
    const gaps = topGapDims(computeDimComparisons(HEXACO_ORDER, self, obs));
    assert.deepEqual(gaps.map((d) => d.code), ["E"]);
  });

  it("a minAbsDelta paraméter felülírja a defaultot", () => {
    const self: Record<string, number> = { X: 50, E: 50, H: 50, C: 50, A: 50, O: 50 };
    const obs: Record<string, number> = { X: 53, E: 42, H: 70, C: 46, A: 65, O: 51 };
    const gaps = topGapDims(computeDimComparisons(HEXACO_ORDER, self, obs), 3, 5);
    assert.deepEqual(gaps.map((d) => d.code), ["H", "A", "E"]);
  });

  it("observer nélküli (null delta) sorok sosem gap-ek", () => {
    const self: Record<string, number> = { X: 50, E: 40, H: 30, C: 20, A: 60, O: 70 };
    assert.deepEqual(topGapDims(computeDimComparisons(HEXACO_ORDER, self, null)), []);
  });
});
