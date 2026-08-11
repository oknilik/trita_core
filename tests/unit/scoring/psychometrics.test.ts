import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ITEMS_PER_DIM,
  ITEMS_PER_FACET,
  MEAN_ITEM_R,
  SCORE_SD,
  alphaFromItems,
  bandFor,
  dimStandardError,
  diffStandardError,
  facetStandardError,
} from "@/lib/psychometrics";
import * as careerPsychometrics from "@/lib/career/psychometrics";
import { tritanConfig } from "@/lib/questions/tritan";
import { HEXACO_ORDER } from "@/lib/hexaco";
import { DIFF_MIN_GAP, TYPE_ADJECTIVE_MIN_GAP } from "@/lib/personality-type";
import { DOSSIER_GAP_MIN_DELTA } from "@/lib/member-dossier";

// ── Invariáns: az item-számok a BANKBÓL származnak ───────────────────
// A korábbi kézzel átlagolt konstansok (9.5 / 2.5) driftelhettek a banktól;
// itt függetlenül újraszámoljuk a bankból, és ahhoz kötjük a modult.

describe("psychometrics — item-szám invariánsok a TSFI bankból", () => {
  const mainCodes = new Set<string>(HEXACO_ORDER);
  const mainItems = tritanConfig.questions.filter((q) => mainCodes.has(q.dimension));
  const shortItems = mainItems.filter((q) => q.short === true);
  const facetCount = new Set(
    mainItems.map((q) => q.facet).filter((f): f is string => Boolean(f)),
  ).size;

  it("ITEMS_PER_DIM a bank tényleges item-számaiból jön", () => {
    assert.equal(ITEMS_PER_DIM.short, shortItems.length / HEXACO_ORDER.length);
    assert.equal(ITEMS_PER_DIM.full, mainItems.length / HEXACO_ORDER.length);
    // TSFI v2 szerkezeti tények: 16 item/dim a teljes bankban. A rövid forma
    // 2026-08-11 óta KIEGYENSÚLYOZOTT: mind a 60 itemje fő-dimenziós, tehát
    // pontosan 10 item/dimenzió (korábban 58 + 2 altruizmus → 9,67).
    assert.equal(ITEMS_PER_DIM.full, 16);
    assert.equal(ITEMS_PER_DIM.short, 10);
    assert.equal(shortItems.length, 60);
  });

  it("ITEMS_PER_FACET a bank facet-lefedéséből jön (full: 4, short: 2,5)", () => {
    assert.equal(facetCount, 24); // 6 dim × 4 facet
    assert.equal(ITEMS_PER_FACET.full, mainItems.length / facetCount);
    assert.equal(ITEMS_PER_FACET.full, 4);
    assert.equal(ITEMS_PER_FACET.short, shortItems.length / facetCount);
    assert.equal(ITEMS_PER_FACET.short, 60 / 24);
  });

  it("a rövid formában nincs kiegészítő (nem fő-dimenziós) item", () => {
    // Ez köti a SEM-számítást a valósághoz: a psychometrics a FŐ-dimenziós
    // itemekből számol, tehát ha a rövid formába visszaszivárogna egy
    // kiegészítő skála, a ténylegesnél pontosabbnak hinné a mérést.
    const allShort = tritanConfig.questions.filter((q) => q.short === true);
    assert.equal(allShort.length, shortItems.length);
    assert.equal(allShort.some((q) => !mainCodes.has(q.dimension)), false);
  });

  it("minden rövid-forma item a teljes bank része (short ⊂ full)", () => {
    assert.ok(shortItems.length > 0 && shortItems.length < mainItems.length);
  });
});

describe("psychometrics — SEM és a rá épülő küszöbök", () => {
  it("több item = magasabb alfa, kisebb hiba; facet mindig bizonytalanabb", () => {
    assert.ok(alphaFromItems(16) > alphaFromItems(10));
    assert.ok(alphaFromItems(10) > alphaFromItems(58 / 6));
    assert.ok(dimStandardError("full") < dimStandardError("short"));
    assert.ok(facetStandardError("short") > dimStandardError("short"));
    assert.ok(facetStandardError("full") > dimStandardError("full"));
  });

  it("a mért reliabilitás-konstansok élnek (nem a régi kézi priorok)", () => {
    // 2026-08-11: a kézi priorok (r̄ = 0,22, SD = 20) helyére MÉRT értékek
    // kerültek (IPIP–HEXACO nyílt adat, n = 21 681 — a forrás és a korlátok a
    // psychometrics.ts forrás-blokkjában). Ez a teszt köti a számokat, hogy a
    // visszaállásuk NE csendben történjen: a pilot-adat felülírhatja őket, de
    // csak ezzel a teszttel együtt.
    assert.equal(MEAN_ITEM_R, 0.264);
    assert.equal(SCORE_SD, 16.2);
    assert.notEqual(MEAN_ITEM_R, 0.22);
    assert.notEqual(SCORE_SD, 20);
  });

  it("a rövid forma kerekített SEM-je 8 (egy pont hibája)", () => {
    // Mért konstansokkal 7,56 (a kézi priorokkal 10,23 volt).
    assert.equal(Math.round(dimStandardError("short")), 8);
  });

  it("diffStandardError = √2·SEM — két pont KÜLÖNBSÉGÉNEK hibája (~10,70)", () => {
    assert.equal(diffStandardError("short"), Math.SQRT2 * dimStandardError("short"));
    assert.equal(Math.round(diffStandardError("short")), 11);
    assert.ok(diffStandardError("short") > dimStandardError("short"));
  });

  it("DIFF_MIN_GAP (personality-type literál) = round(√2·SEM short)", () => {
    // A literál a kliens-bundle miatt nem importálhatja a bankot — ez a teszt
    // köti a pszichometriai maghoz (drift itt bukik el). A sorrend-kapu KÉT
    // pont különbségét méri, ezért √2·SEM, nem 1×SEM.
    // 2026-08-11 (a): 15 → 14 — a rövid forma 58 helyett 60 FŐ-dimenziós
    // itemen nyugszik (az altruizmus-skála kikerült, két fő item belépett).
    // 2026-08-11 (b): 14 → 11 — a kézi SEM-priorok helyére MÉRT értékek
    // kerültek (r̄ 0,22 → 0,264, SD 20 → 16,2), a prior ~25%-kal pesszimista volt.
    assert.equal(DIFF_MIN_GAP, Math.round(diffStandardError("short")));
    assert.equal(DIFF_MIN_GAP, 11);
    // A régi alias ugyanarra az értékre mutat (visszafelé kompatibilitás).
    assert.equal(TYPE_ADJECTIVE_MIN_GAP, DIFF_MIN_GAP);
  });

  it("per-dimenzió SEM: mért SD + mért r̄, ismeretlen kódnál globális fallback", () => {
    // A felületi kapuk GLOBÁLIS értéket használnak (ld. a döntés indoklását a
    // dimStandardError doc-blokkjában); ez az ág belső elemzésre/pilot-
    // kalibrációra él. A lényeg: NaN-t soha nem adhat.
    for (const code of HEXACO_ORDER) {
      const se = dimStandardError("short", code);
      assert.ok(Number.isFinite(se) && se > 0);
      assert.ok(dimStandardError("full", code) < se);
    }
    // Az O a legpontosabb, a H a legzajosabb skála a mért adaton.
    assert.equal(Math.round(dimStandardError("short", "O") * 100) / 100, 6.48);
    assert.equal(Math.round(dimStandardError("short", "H") * 100) / 100, 8.19);
    // A per-dimenzió √2·SEM sáv szűk (9,2…11,6) — ezért maradt egy globális kapu.
    const gaps = HEXACO_ORDER.map((c) => diffStandardError("short", c));
    assert.ok(Math.min(...gaps) > 9 && Math.max(...gaps) < 12);
    // Ismeretlen / hiányzó kód → globális érték, nem NaN.
    assert.equal(dimStandardError("short", "I"), dimStandardError("short"));
    assert.equal(dimStandardError("short", "nope"), dimStandardError("short"));
    assert.equal(diffStandardError("short", "I"), diffStandardError("short"));
  });

  it("DOSSIER_GAP_MIN_DELTA = round(√2·SEM short) — önkép–külső kép különbség", () => {
    assert.equal(DOSSIER_GAP_MIN_DELTA, Math.round(diffStandardError("short")));
    assert.equal(DOSSIER_GAP_MIN_DELTA, 11);
  });

  it("facet-szintű eltérés-küszöb (√2·facet-SEM, rövid) = 17", () => {
    // A profil-oldal ezt adja propként a facet-összevetésnek. Mért
    // konstansokkal 16,64 → 17 (a kézi priorokkal 21,66 → 22 volt): a
    // facet-„eltérés" jelzés továbbra is ritkán tüzel, de már nem
    // irreálisan ritkán. Drift-őr: a profil-oldal számítása itt bukik el.
    assert.equal(Math.round(Math.SQRT2 * facetStandardError("short")), 17);
    assert.equal(Math.round(Math.SQRT2 * facetStandardError("full")), 15);
  });

  it("sáv: a pontszám körül szimmetrikus, 0-100 közé vágva", () => {
    assert.deepEqual(bandFor(50, 8), { low: 42, high: 58 });
    assert.deepEqual(bandFor(97, 8), { low: 89, high: 100 });
    assert.deepEqual(bandFor(3, 8), { low: 0, high: 11 });
  });
});

describe("career/psychometrics — a közös mag re-exportja azonos", () => {
  it("ugyanazok a függvény-referenciák és értékek", () => {
    assert.equal(careerPsychometrics.dimStandardError, dimStandardError);
    assert.equal(careerPsychometrics.facetStandardError, facetStandardError);
    assert.equal(careerPsychometrics.alphaFromItems, alphaFromItems);
    assert.equal(careerPsychometrics.bandFor, bandFor);
    assert.deepEqual(careerPsychometrics.ITEMS_PER_DIM, ITEMS_PER_DIM);
    assert.deepEqual(careerPsychometrics.ITEMS_PER_FACET, ITEMS_PER_FACET);
  });
});
