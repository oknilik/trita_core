import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ITEMS_PER_DIM,
  ITEMS_PER_FACET,
  alphaFromItems,
  bandFor,
  dimStandardError,
  diffStandardError,
  facetStandardError,
} from "@/lib/psychometrics";
import * as careerPsychometrics from "@/lib/career/psychometrics";
import { tritanConfig } from "@/lib/questions/tritan";
import { TRITAN_ORDER } from "@/lib/tritan";
import { DIFF_MIN_GAP, TYPE_ADJECTIVE_MIN_GAP } from "@/lib/personality-type";
import { DOSSIER_GAP_MIN_DELTA } from "@/lib/member-dossier";

// ── Invariáns: az item-számok a BANKBÓL származnak ───────────────────
// A korábbi kézzel átlagolt konstansok (9.5 / 2.5) driftelhettek a banktól;
// itt függetlenül újraszámoljuk a bankból, és ahhoz kötjük a modult.

describe("psychometrics — item-szám invariánsok a TSFI bankból", () => {
  const mainCodes = new Set<string>(TRITAN_ORDER);
  const mainItems = tritanConfig.questions.filter((q) => mainCodes.has(q.dimension));
  const shortItems = mainItems.filter((q) => q.short === true);
  const facetCount = new Set(
    mainItems.map((q) => q.facet).filter((f): f is string => Boolean(f)),
  ).size;

  it("ITEMS_PER_DIM a bank tényleges item-számaiból jön", () => {
    assert.equal(ITEMS_PER_DIM.short, shortItems.length / TRITAN_ORDER.length);
    assert.equal(ITEMS_PER_DIM.full, mainItems.length / TRITAN_ORDER.length);
    // TSFI v2 szerkezeti tények: 16 item/dim a teljes bankban, a rövid
    // forma dimenziónként 9-10 itemet mér (interstitial altruizmus nélkül).
    assert.equal(ITEMS_PER_DIM.full, 16);
    assert.ok(ITEMS_PER_DIM.short >= 9 && ITEMS_PER_DIM.short <= 10);
  });

  it("ITEMS_PER_FACET a bank facet-lefedéséből jön (full: 4)", () => {
    assert.equal(facetCount, 24); // 6 dim × 4 facet
    assert.equal(ITEMS_PER_FACET.full, mainItems.length / facetCount);
    assert.equal(ITEMS_PER_FACET.full, 4);
    assert.equal(ITEMS_PER_FACET.short, shortItems.length / facetCount);
    assert.ok(ITEMS_PER_FACET.short >= 2 && ITEMS_PER_FACET.short <= 3);
  });

  it("minden rövid-forma item a teljes bank része (short ⊂ full)", () => {
    assert.ok(shortItems.length > 0 && shortItems.length < mainItems.length);
  });
});

describe("psychometrics — SEM és a rá épülő küszöbök", () => {
  it("több item = magasabb alfa, kisebb hiba; facet mindig bizonytalanabb", () => {
    assert.ok(alphaFromItems(16) > alphaFromItems(9));
    assert.ok(dimStandardError("full") < dimStandardError("short"));
    assert.ok(facetStandardError("short") > dimStandardError("short"));
    assert.ok(facetStandardError("full") > dimStandardError("full"));
  });

  it("a rövid forma kerekített SEM-je 10 (egy pont hibája)", () => {
    assert.equal(Math.round(dimStandardError("short")), 10);
  });

  it("diffStandardError = √2·SEM — két pont KÜLÖNBSÉGÉNEK hibája (~15)", () => {
    assert.equal(diffStandardError("short"), Math.SQRT2 * dimStandardError("short"));
    assert.equal(Math.round(diffStandardError("short")), 15);
    assert.ok(diffStandardError("short") > dimStandardError("short"));
  });

  it("DIFF_MIN_GAP (personality-type literál) = round(√2·SEM short)", () => {
    // A literál a kliens-bundle miatt nem importálhatja a bankot — ez a teszt
    // köti a pszichometriai maghoz (drift itt bukik el). A sorrend-kapu KÉT
    // pont különbségét méri, ezért √2·SEM, nem 1×SEM.
    assert.equal(DIFF_MIN_GAP, Math.round(diffStandardError("short")));
    // A régi alias ugyanarra az értékre mutat (visszafelé kompatibilitás).
    assert.equal(TYPE_ADJECTIVE_MIN_GAP, DIFF_MIN_GAP);
  });

  it("DOSSIER_GAP_MIN_DELTA = round(√2·SEM short) — önkép–külső kép különbség", () => {
    assert.equal(DOSSIER_GAP_MIN_DELTA, Math.round(diffStandardError("short")));
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
