import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getAcceptedAnswerIds,
  getTestConfig,
  isCompleteFormAnswerSet,
  isLikertQuestion,
  type LikertQuestion,
} from "@/lib/questions";
import { HEXACO_ORDER } from "@/lib/hexaco";

// ─────────────────────────────────────────────────────────────────────
// A TSFI-S rövid forma ÖSSZETÉTELE (2026-08-11) és a forma-váltás
// átmenetének kezelése. A rövid forma 60 item maradt, de a kiegészítő
// altruizmus-skála kikerült belőle — helyette két fő-dimenziós item lépett
// be, így minden fő dimenzió pontosan 10 itemen nyugszik.
// ─────────────────────────────────────────────────────────────────────

const shortItems = getTestConfig("TRITAN", "hu", "short")
  .questions.filter(isLikertQuestion) as LikertQuestion[];
const fullItems = getTestConfig("TRITAN", "hu", "full")
  .questions.filter(isLikertQuestion) as LikertQuestion[];

// A kivezetett TSFI-S v1 halmaz: a mai rövid forma 77/79 nélkül, 98/99-cel.
const legacyShortIds = new Set<number>([
  ...shortItems.map((q) => q.id).filter((id) => id !== 77 && id !== 79),
  98,
  99,
]);

describe("TSFI-S rövid forma összetétele", () => {
  it("60 item, dimenziónként pontosan 10, kiegészítő skála nélkül", () => {
    assert.equal(shortItems.length, 60);

    const byDim = new Map<string, number>();
    for (const q of shortItems) {
      byDim.set(q.dimension, (byDim.get(q.dimension) ?? 0) + 1);
    }
    // Csak a hat fő dimenzió szerepel — `I` (altruizmus) egyáltalán nem.
    assert.deepEqual([...byDim.keys()].sort(), [...HEXACO_ORDER].sort());
    assert.equal(byDim.has("I"), false);
    for (const code of HEXACO_ORDER) {
      assert.equal(byDim.get(code), 10, `${code} item-száma nem 10`);
    }
  });

  it("a 77 (E) és 79 (O) benne van, a 98/99 (altruizmus) nincs", () => {
    const ids = new Set(shortItems.map((q) => q.id));
    assert.ok(ids.has(77));
    assert.ok(ids.has(79));
    assert.equal(ids.has(98), false);
    assert.equal(ids.has(99), false);
  });

  it("a teljes forma változatlan: 100 item, mind a 4 altruizmus-itemmel", () => {
    assert.equal(fullItems.length, 100);
    const altruism = fullItems.filter((q) => q.dimension === "I");
    assert.equal(altruism.length, 4);
    assert.deepEqual(altruism.map((q) => q.id).sort((a, b) => a - b), [97, 98, 99, 100]);
    // short ⊂ full
    const fullIds = new Set(fullItems.map((q) => q.id));
    for (const q of shortItems) assert.ok(fullIds.has(q.id), `${q.id} nincs a teljes bankban`);
  });

  it("minden rövid-forma facet lefedett (24 facet, 2-3 item)", () => {
    const byFacet = new Map<string, number>();
    for (const q of shortItems) {
      if (!q.facet) continue;
      byFacet.set(`${q.dimension}.${q.facet}`, (byFacet.get(`${q.dimension}.${q.facet}`) ?? 0) + 1);
    }
    assert.equal(byFacet.size, 24);
    for (const [facet, count] of byFacet) {
      assert.ok(count >= 2, `${facet} kevesebb mint 2 itemen nyugszik`);
    }
  });
});

describe("isCompleteFormAnswerSet — forma-váltás átmenete", () => {
  it("a mai rövid és teljes forma pontos id-halmazát elfogadja", () => {
    assert.ok(isCompleteFormAnswerSet("TRITAN", new Set(shortItems.map((q) => q.id))));
    assert.ok(isCompleteFormAnswerSet("TRITAN", new Set(fullItems.map((q) => q.id))));
  });

  it("a KORÁBBI rövid forma (98/99-cel, 77/79 nélkül) beadását elfogadja", () => {
    // Beragadt kliens-bundle, több napos vendég-draft, régi observer-fül.
    // Ezek hiánytalanul kitöltött 60 itemes beadások — elutasítani annyi
    // lenne, mint eldobni egy kész kitöltést.
    assert.equal(legacyShortIds.size, 60);
    assert.ok(isCompleteFormAnswerSet("TRITAN", legacyShortIds));
  });

  it("hiányos vagy kevert halmazt továbbra sem fogad el", () => {
    const partial = new Set([...legacyShortIds].slice(0, 59));
    assert.equal(isCompleteFormAnswerSet("TRITAN", partial), false);

    // A mai rövid forma + a két kivezetett item (62 elem) nem érvényes forma.
    const mixed = new Set([...shortItems.map((q) => q.id), 98, 99]);
    assert.equal(isCompleteFormAnswerSet("TRITAN", mixed), false);

    // Régi halmaz, de az egyik item helyett egy bankon kívüli id.
    const swapped = new Set([...legacyShortIds].filter((id) => id !== 98));
    swapped.add(999999);
    assert.equal(isCompleteFormAnswerSet("TRITAN", swapped), false);

    assert.equal(isCompleteFormAnswerSet("TRITAN", new Set()), false);
  });

  it("getAcceptedAnswerIds lefedi a mai bankot és a történeti halmazokat", () => {
    const accepted = getAcceptedAnswerIds("TRITAN");
    for (const q of fullItems) assert.ok(accepted.has(q.id));
    for (const id of legacyShortIds) assert.ok(accepted.has(id));
    // Az API-rétegek ehhez szűrnek: a szűrés után a régi halmaz ÉP marad,
    // különben a teljesség-ellenőrzés sosem láthatná hiánytalannak.
    const survivors = [...legacyShortIds].filter((id) => accepted.has(id));
    assert.equal(survivors.length, 60);
    assert.ok(isCompleteFormAnswerSet("TRITAN", new Set(survivors)));
  });
});
