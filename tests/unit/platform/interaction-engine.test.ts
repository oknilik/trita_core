import test from "node:test";
import assert from "node:assert/strict";
import { TRITAN_ORDER, type TritanDimCode } from "@/lib/tritan";
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
function scores(overrides: Partial<Record<TritanDimCode, number>> = {}): DimScores {
  const out: DimScores = {};
  for (const dim of TRITAN_ORDER) out[dim] = 50;
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
  const sides = polarSides(scores({ OPEN: 90, THOR: 10, TEMP: 50 }));
  assert.deepEqual(sides, [
    { dim: "THOR", pole: "low" },
    { dim: "OPEN", pole: "high" },
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
    other: { THOR: Number.NaN, OPEN: 90 },
    level: "profile-archetype",
  });
  assert.equal(result.meta.sparse, true);
});

test("azonos dimenziós atom aktiválódik, és minden kiválasztott atom ad discusst", () => {
  const result = simulateInteraction({
    self: scores({ THOR: 90 }),
    other: scores({ THOR: 90 }),
    level: "profile-profile",
  });
  assert.equal(result.meta.sparse, false);
  assert.deepEqual(result.meta.atomIds, ["same-THOR-high-high"]);
  assert.equal(
    result.discuss.length,
    result.meta.atomIds.length,
    "a discuss atomonként kötelező",
  );
  assert.equal(result.discuss[0].atomId, "same-THOR-high-high");
  assert.deepEqual(result.discuss[0].dims, ["THOR"]);
});

test("determinisztikus: ugyanaz a bemenet ugyanazt a kimenetet adja", () => {
  const input = {
    self: scores({ THOR: 88, ADAP: 20, OPEN: 75 }),
    other: scores({ THOR: 25, ADAP: 82, OPEN: 90 }),
    level: "profile-profile" as const,
  };
  const a = simulateInteraction(input);
  const b = simulateInteraction(input);
  assert.deepEqual(a, b);
});

// ── Tükrözés ─────────────────────────────────────────────────────────

test("tükrözés: a két fél nézete aszimmetrikus atomnál eltér", () => {
  const highSide = simulateInteraction({
    self: scores({ TEMP: 90 }),
    other: scores({ TEMP: 10 }),
    level: "profile-profile",
  });
  const lowSide = simulateInteraction({
    self: scores({ TEMP: 10 }),
    other: scores({ TEMP: 90 }),
    level: "profile-profile",
  });

  assert.deepEqual(highSide.meta.atomIds, ["same-TEMP-high-low"]);
  assert.deepEqual(lowSide.meta.atomIds, ["same-TEMP-high-low"]);
  assert.notEqual(
    highSide.discuss[0].text.hu,
    lowSide.discuss[0].text.hu,
    "ugyanaz az atom, de a két oldal más szöveget kap (view vs viewB)",
  );
});

test("szimmetrikus atomnál a két oldal ugyanazt kapja", () => {
  const a = simulateInteraction({
    self: scores({ OPEN: 90 }),
    other: scores({ OPEN: 85 }),
    level: "profile-profile",
  });
  const b = simulateInteraction({
    self: scores({ OPEN: 85 }),
    other: scores({ OPEN: 90 }),
    level: "profile-profile",
  });
  assert.deepEqual(a.meta.atomIds, ["same-OPEN-high-high"]);
  assert.equal(a.discuss[0].text.hu, b.discuss[0].text.hu);
});

// ── Rangsor és válogatás ─────────────────────────────────────────────

test("a sorrend a FRICTION_WEIGHTS-et követi: azonos erősségnél a THOR nyer", () => {
  const result = simulateInteraction({
    self: scores({ THOR: 90, OPEN: 90 }),
    other: scores({ THOR: 90, OPEN: 90 }),
    level: "profile-profile",
  });
  assert.equal(
    result.meta.atomIds[0],
    "same-THOR-high-high",
    "a THOR (0,30) megelőzi az OPEN-t (0,05)",
  );
});

test("dimenzió-dedup: nem kap a felhasználó két azonos dimenziós szöveget", () => {
  const result = simulateInteraction({
    self: scores({ THOR: 90, OPEN: 90 }),
    other: scores({ THOR: 90, OPEN: 90 }),
    level: "profile-profile",
  });
  // Három jelölt van (same-THOR, same-OPEN, cross-OPEN-THOR), de a
  // same-OPEN már nem hoz új dimenziót a cross után.
  assert.equal(result.meta.candidateCount, 3);
  assert.ok(result.meta.atomIds.includes("same-THOR-high-high"));
  assert.ok(result.meta.atomIds.includes("cross-OPEN-high-THOR-high"));
  assert.ok(
    !result.meta.atomIds.includes("same-OPEN-high-high"),
    "a harmadik atom nem hoz új dimenziót, ezért kimarad",
  );
});

test("a markánsabb pár előrébb kerül azonos dimenzió-súly mellett", () => {
  // Két azonos súlyú dimenzió (TEMP és OPEN, mindkettő 0,05), eltérő
  // pólus-erősséggel: a szélsőségesebb pár nyer.
  const result = simulateInteraction({
    self: scores({ TEMP: 99, OPEN: 70 }),
    other: scores({ TEMP: 99, OPEN: 70 }),
    level: "profile-profile",
  });
  assert.equal(result.meta.atomIds[0], "same-TEMP-high-high");
});

test("maxAtoms korlátozza a kimenetet", () => {
  const input = {
    self: scores({ THOR: 95, ADAP: 5, INTE: 95, TEMP: 95, OPEN: 95 }),
    other: scores({ THOR: 5, ADAP: 95, INTE: 5, TEMP: 95, OPEN: 95 }),
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
    self: scores({ THOR: 90 }),
    other: scores({ THOR: 90 }),
    level: "profile-profile",
  });
  assert.deepEqual(result.leaderNotes, []);
  assert.equal(result.meta.mode, "peer");
});

test("vezető-mód: csak a VEZETŐ pólusos dimenzióira ad kiegészítőt", () => {
  const result = simulateInteraction({
    self: scores({ OPEN: 90 }),
    other: scores({ THOR: 90 }),
    mode: "other-leads",
    level: "profile-archetype",
  });
  assert.deepEqual(
    result.leaderNotes.map((note) => note.dim),
    ["THOR"],
    "a vezető a másik fél, akinek csak a THOR pólusos",
  );
  assert.equal(result.leaderNotes[0].pole, "high");

  const mirrored = simulateInteraction({
    self: scores({ OPEN: 90 }),
    other: scores({ THOR: 90 }),
    mode: "self-leads",
    level: "profile-archetype",
  });
  assert.deepEqual(
    mirrored.leaderNotes.map((note) => note.dim),
    ["OPEN"],
  );
});

test("vezetői kiegészítők súly szerint rendezve, maxLeaderNotes-ig", () => {
  const leader = scores({ THOR: 90, ADAP: 90, TEMP: 90 });
  const result = simulateInteraction({
    self: BALANCED,
    other: leader,
    mode: "other-leads",
    level: "profile-archetype",
  });
  assert.deepEqual(
    result.leaderNotes.map((note) => note.dim),
    ["THOR", "ADAP"],
    "THOR (0,30) > ADAP (0,25) > TEMP (0,05), alapból 2 fér ki",
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
    ["THOR", "ADAP", "TEMP"],
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
    self: scores({ ADAP: 10 }),
    other: scores({ THOR: 90 }),
    level: "profile-profile",
  });
  assert.deepEqual(result.meta.atomIds, ["cross-THOR-high-ADAP-low"]);

  const found = findAtom(
    { dim: "ADAP", pole: "low" },
    { dim: "THOR", pole: "high" },
  );
  assert.ok(found);
  const expected = atomBlocksFor(found.atom, found.mirrored);
  assert.equal(result.discuss[0].text.hu, expected.discuss.hu);
  assert.deepEqual(result.discuss[0].dims, ["THOR", "ADAP"]);
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
  const innovator = archetypePrototype({ dominant: "OPEN", secondary: "TEMP" });
  const architect = archetypePrototype({ dominant: "THOR", secondary: "INTE" });
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
