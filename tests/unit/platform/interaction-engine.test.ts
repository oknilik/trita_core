import test from "node:test";
import assert from "node:assert/strict";
import { HEXACO_ORDER, type HexacoCode } from "@/lib/hexaco";
import {
  RELATION_ATOMS,
  atomBlocksFor,
  findAtom,
  type AtomSide,
} from "@/lib/interaction-atoms";
import {
  ARCHETYPE_DOMINANT_SCORE,
  ARCHETYPE_PAIRS,
  ARCHETYPE_SECONDARY_SCORE,
  archetypePrototype,
  polarSides,
  polarityOf,
  simulateInteraction,
  type DimScores,
} from "@/lib/interaction-engine";

/** Minden dimenzió a néma középsávban, kivéve a megadottakat. */
function scores(overrides: Partial<Record<HexacoCode, number>> = {}): DimScores {
  const out: DimScores = {};
  for (const dim of HEXACO_ORDER) out[dim] = 50;
  return { ...out, ...overrides };
}

/** Egy pólusos oldalhoz tartozó, egyébként néma profil. */
function profileFor(side: AtomSide, strong = true): DimScores {
  const value = side.pole === "high" ? (strong ? 90 : 70) : strong ? 10 : 30;
  return scores({ [side.dim]: value });
}

const BALANCED = scores();

// ── Pólus-meghatározás ───────────────────────────────────────────────

test("pólus-küszöb: a profile-engine konvenciója (HIGH 65 / LOW 35, szigorú)", () => {
  assert.equal(polarityOf(66), "high");
  assert.equal(polarityOf(65), "medium", "65 még nem magas");
  assert.equal(polarityOf(50), "medium");
  assert.equal(polarityOf(35), "medium", "35 még nem alacsony");
  assert.equal(polarityOf(34), "low");
  assert.equal(polarityOf(undefined), null);
  assert.equal(polarityOf(Number.NaN), null);
});

test("polarSides csak a pólusos dimenziókat adja, kanonikus sorrendben", () => {
  const sides = polarSides(scores({ O: 90, C: 10, X: 50 }));
  assert.deepEqual(sides, [
    { dim: "C", pole: "low" },
    { dim: "O", pole: "high" },
  ]);
});

// ── Alapviselkedés ───────────────────────────────────────────────────

test("kiegyensúlyozott pár → sparse, nem üres lista-találgatás", () => {
  const result = simulateInteraction({
    self: BALANCED,
    other: BALANCED,
    level: "profile-profile",
  });
  assert.equal(result.meta.sparse, true);
  assert.equal(result.meta.candidateCount, 0);
  assert.deepEqual(result.meta.atomIds, []);
  assert.deepEqual(result.easy, []);
  assert.deepEqual(result.friction, []);
  assert.deepEqual(result.discuss, []);
});

test("hiányzó és érvénytelen pontszám nem borítja a motort", () => {
  const result = simulateInteraction({
    self: {},
    other: { C: Number.NaN, O: 90 },
    level: "profile-archetype",
  });
  assert.equal(result.meta.sparse, true);
});

test("azonos dimenziós atom aktiválódik, és minden kiválasztott atom ad discusst", () => {
  const result = simulateInteraction({
    self: scores({ C: 90 }),
    other: scores({ C: 90 }),
    level: "profile-profile",
  });
  assert.equal(result.meta.sparse, false);
  assert.deepEqual(result.meta.atomIds, ["same-C-high-high"]);
  assert.equal(
    result.discuss.length,
    result.meta.atomIds.length,
    "a discuss atomonként kötelező",
  );
  assert.equal(result.discuss[0].atomId, "same-C-high-high");
  assert.deepEqual(result.discuss[0].dims, ["C"]);
});

test("determinisztikus: ugyanaz a bemenet ugyanazt a kimenetet adja", () => {
  const input = {
    self: scores({ C: 88, A: 20, O: 75 }),
    other: scores({ C: 25, A: 82, O: 90 }),
    level: "profile-profile" as const,
  };
  const a = simulateInteraction(input);
  const b = simulateInteraction(input);
  assert.deepEqual(a, b);
});

// ── Tükrözés ─────────────────────────────────────────────────────────

test("tükrözés: a két fél nézete aszimmetrikus atomnál eltér", () => {
  const highSide = simulateInteraction({
    self: scores({ X: 90 }),
    other: scores({ X: 10 }),
    level: "profile-profile",
  });
  const lowSide = simulateInteraction({
    self: scores({ X: 10 }),
    other: scores({ X: 90 }),
    level: "profile-profile",
  });

  assert.deepEqual(highSide.meta.atomIds, ["same-X-high-low"]);
  assert.deepEqual(lowSide.meta.atomIds, ["same-X-high-low"]);
  assert.notEqual(
    highSide.discuss[0].text.hu,
    lowSide.discuss[0].text.hu,
    "ugyanaz az atom, de a két oldal más szöveget kap (view vs viewB)",
  );
});

test("szimmetrikus atomnál a két oldal ugyanazt kapja", () => {
  const a = simulateInteraction({
    self: scores({ O: 90 }),
    other: scores({ O: 85 }),
    level: "profile-profile",
  });
  const b = simulateInteraction({
    self: scores({ O: 85 }),
    other: scores({ O: 90 }),
    level: "profile-profile",
  });
  assert.deepEqual(a.meta.atomIds, ["same-O-high-high"]);
  assert.equal(a.discuss[0].text.hu, b.discuss[0].text.hu);
});

// ── Rangsor és válogatás ─────────────────────────────────────────────

test("a sorrend a FRICTION_WEIGHTS-et követi: azonos erősségnél a C nyer", () => {
  const result = simulateInteraction({
    self: scores({ C: 90, O: 90 }),
    other: scores({ C: 90, O: 90 }),
    level: "profile-profile",
  });
  assert.equal(
    result.meta.atomIds[0],
    "same-C-high-high",
    "a C (0,30) megelőzi az O-t (0,05)",
  );
});

test("dimenzió-dedup: nem kap a felhasználó két azonos dimenziós szöveget", () => {
  const result = simulateInteraction({
    self: scores({ C: 90, O: 90 }),
    other: scores({ C: 90, O: 90 }),
    level: "profile-profile",
  });
  // Három jelölt van (same-C, same-O, cross-O-C), de a
  // same-O már nem hoz új dimenziót a cross után.
  assert.equal(result.meta.candidateCount, 3);
  assert.ok(result.meta.atomIds.includes("same-C-high-high"));
  assert.ok(result.meta.atomIds.includes("cross-O-high-C-high"));
  assert.ok(
    !result.meta.atomIds.includes("same-O-high-high"),
    "a harmadik atom nem hoz új dimenziót, ezért kimarad",
  );
});

test("a markánsabb pár előrébb kerül azonos dimenzió-súly mellett", () => {
  // Két azonos súlyú dimenzió (X és O, mindkettő 0,05), eltérő
  // pólus-erősséggel: a szélsőségesebb pár nyer.
  const result = simulateInteraction({
    self: scores({ X: 99, O: 70 }),
    other: scores({ X: 99, O: 70 }),
    level: "profile-profile",
  });
  assert.equal(result.meta.atomIds[0], "same-X-high-high");
});

test("maxAtoms korlátozza a kimenetet", () => {
  const input = {
    self: scores({ C: 95, A: 5, H: 95, X: 95, O: 95 }),
    other: scores({ C: 5, A: 95, H: 5, X: 95, O: 95 }),
    level: "profile-profile" as const,
  };
  const three = simulateInteraction(input);
  const one = simulateInteraction({ ...input, maxAtoms: 1 });
  assert.equal(three.meta.atomIds.length, 3);
  assert.equal(one.meta.atomIds.length, 1);
  assert.equal(one.meta.atomIds[0], three.meta.atomIds[0]);
});

// ── Vezető-mód ───────────────────────────────────────────────────────

test("peer módban nincs vezetői kiegészítő", () => {
  const result = simulateInteraction({
    self: scores({ C: 90 }),
    other: scores({ C: 90 }),
    level: "profile-profile",
  });
  assert.deepEqual(result.leaderNotes, []);
  assert.equal(result.meta.mode, "peer");
});

test("vezető-mód: csak a VEZETŐ pólusos dimenzióira ad kiegészítőt", () => {
  const result = simulateInteraction({
    self: scores({ O: 90 }),
    other: scores({ C: 90 }),
    mode: "other-leads",
    level: "profile-archetype",
  });
  assert.deepEqual(
    result.leaderNotes.map((note) => note.dim),
    ["C"],
    "a vezető a másik fél, akinek csak a C pólusos",
  );
  assert.equal(result.leaderNotes[0].pole, "high");

  const mirrored = simulateInteraction({
    self: scores({ O: 90 }),
    other: scores({ C: 90 }),
    mode: "self-leads",
    level: "profile-archetype",
  });
  assert.deepEqual(
    mirrored.leaderNotes.map((note) => note.dim),
    ["O"],
  );
});

test("vezetői kiegészítők súly szerint rendezve, maxLeaderNotes-ig", () => {
  const leader = scores({ C: 90, A: 90, X: 90 });
  const result = simulateInteraction({
    self: BALANCED,
    other: leader,
    mode: "other-leads",
    level: "profile-archetype",
  });
  assert.deepEqual(
    result.leaderNotes.map((note) => note.dim),
    ["C", "A"],
    "C (0,30) > A (0,25) > X (0,05), alapból 2 fér ki",
  );

  const all = simulateInteraction({
    self: BALANCED,
    other: leader,
    mode: "other-leads",
    maxLeaderNotes: 5,
    level: "profile-archetype",
  });
  assert.deepEqual(
    all.leaderNotes.map((note) => note.dim),
    ["C", "A", "X"],
  );
});

// ── Lefedettség ──────────────────────────────────────────────────────

test("lefedettség: mind a 30 atom elérhető valamilyen bemenettel", () => {
  for (const atom of RELATION_ATOMS) {
    const result = simulateInteraction({
      self: profileFor(atom.a),
      other: profileFor(atom.b),
      level: "profile-profile",
    });
    assert.ok(
      result.meta.atomIds.includes(atom.id),
      `${atom.id}: nem aktiválódott a saját pólus-párjára`,
    );
  }
});

test("a kimenet szövegei tényleg az atom-készletből jönnek", () => {
  const result = simulateInteraction({
    self: scores({ A: 10 }),
    other: scores({ C: 90 }),
    level: "profile-profile",
  });
  assert.deepEqual(result.meta.atomIds, ["cross-C-high-A-low"]);

  const found = findAtom(
    { dim: "A", pole: "low" },
    { dim: "C", pole: "high" },
  );
  assert.ok(found);
  const expected = atomBlocksFor(found.atom, found.mirrored);
  assert.equal(result.discuss[0].text.hu, expected.discuss.hu);
  assert.deepEqual(result.discuss[0].dims, ["C", "A"]);
});

// ── Archetípus-prototípusok ──────────────────────────────────────────

test("30 archetípus-pár, mind egyedi, önmagával nem párosítva", () => {
  assert.equal(ARCHETYPE_PAIRS.length, 30);
  const keys = new Set(
    ARCHETYPE_PAIRS.map((pair) => `${pair.dominant}-${pair.secondary}`),
  );
  assert.equal(keys.size, 30);
  for (const pair of ARCHETYPE_PAIRS) {
    assert.notEqual(pair.dominant, pair.secondary);
  }
});

test("a prototípus pontosan két pólusos dimenziót ad — a többi néma", () => {
  for (const pair of ARCHETYPE_PAIRS) {
    const prototype = archetypePrototype(pair);
    assert.equal(prototype[pair.dominant], ARCHETYPE_DOMINANT_SCORE);
    assert.equal(prototype[pair.secondary], ARCHETYPE_SECONDARY_SCORE);

    const sides = polarSides(prototype);
    assert.equal(
      sides.length,
      2,
      `${pair.dominant}/${pair.secondary}: a maradék négy dimenziónak némának kell lennie`,
    );
    assert.ok(sides.every((side) => side.pole === "high"));
  }
});

test("archetípus × archetípus szimuláció ad kimenetet és jelöli a szintet", () => {
  const innovator = archetypePrototype({ dominant: "O", secondary: "X" });
  const architect = archetypePrototype({ dominant: "C", secondary: "H" });
  const result = simulateInteraction({
    self: innovator,
    other: architect,
    level: "archetype",
  });
  assert.equal(result.meta.level, "archetype");
  assert.equal(result.meta.sparse, false);
  assert.ok(result.discuss.length > 0);
  assert.equal(result.discuss.length, result.meta.atomIds.length);
});
