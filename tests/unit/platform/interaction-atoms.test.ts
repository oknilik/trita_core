import test from "node:test";
import assert from "node:assert/strict";
import { HEXACO_ORDER, type HexacoCode } from "@/lib/hexaco";
import {
  CROSS_DIMENSION_ATOMS,
  LEADER_SUPPLEMENTS,
  RELATION_ATOMS,
  SAME_DIMENSION_ATOMS,
  atomBlocksFor,
  findAtom,
  type LocalizedText,
  type Pole,
  type RelationAtom,
} from "@/lib/interaction-atoms";

const POLES: Pole[] = ["high", "low"];

function assertLocalized(text: LocalizedText | undefined, label: string) {
  assert.ok(text, `${label}: hiányzó szöveg`);
  assert.ok(text.hu.trim().length >= 30, `${label}: HU túl rövid`);
  assert.ok(text.en.trim().length >= 30, `${label}: EN túl rövid`);
}

function assertBlocks(atom: RelationAtom, which: "view" | "viewB") {
  const blocks = which === "view" ? atom.view : atom.viewB;
  assert.ok(blocks, `${atom.id}: hiányzó ${which}`);
  assertLocalized(blocks.discuss, `${atom.id}.${which}.discuss`);
  // Minden atomnak legalább easy VAGY friction blokkja van a discuss mellett.
  assert.ok(
    blocks.easy || blocks.friction,
    `${atom.id}.${which}: se easy, se friction blokk`,
  );
  if (blocks.easy) assertLocalized(blocks.easy, `${atom.id}.${which}.easy`);
  if (blocks.friction) {
    assertLocalized(blocks.friction, `${atom.id}.${which}.friction`);
  }
}

test("azonos dimenziós lefedettség: 6 dimenzió × 3 pólus-kombináció = 18 atom", () => {
  assert.equal(SAME_DIMENSION_ATOMS.length, 18);
  for (const dim of HEXACO_ORDER) {
    const combos: Array<[Pole, Pole]> = [
      ["high", "high"],
      ["high", "low"],
      ["low", "low"],
    ];
    for (const [pa, pb] of combos) {
      const found = findAtom({ dim, pole: pa }, { dim, pole: pb });
      assert.ok(found, `hiányzó azonos-dimenziós atom: ${dim} ${pa}-${pb}`);
      assert.equal(found.atom.kind, "same");
    }
  }
});

test("kereszt-atomok: legalább 10 kiemelt pár, mind aszimmetrikus viewB-vel", () => {
  assert.ok(CROSS_DIMENSION_ATOMS.length >= 10);
  for (const atom of CROSS_DIMENSION_ATOMS) {
    assert.notEqual(atom.a.dim, atom.b.dim, `${atom.id}: kereszt-atom azonos dimenzióval`);
    assert.ok(!atom.symmetric, `${atom.id}: kereszt-atom nem lehet symmetric`);
    assert.ok(atom.viewB, `${atom.id}: kereszt-atomhoz viewB kell`);
  }
});

test("minden atom: érvényes dimenziókód, egyedi id, egyedi pólus-pár", () => {
  const ids = new Set<string>();
  const keys = new Set<string>();
  const validDims = new Set<string>(HEXACO_ORDER);
  for (const atom of RELATION_ATOMS) {
    assert.ok(!ids.has(atom.id), `duplikált id: ${atom.id}`);
    ids.add(atom.id);
    for (const side of [atom.a, atom.b]) {
      assert.ok(validDims.has(side.dim), `${atom.id}: érvénytelen dim ${side.dim}`);
      assert.ok(POLES.includes(side.pole), `${atom.id}: érvénytelen pólus`);
    }
    const key = [`${atom.a.dim}:${atom.a.pole}`, `${atom.b.dim}:${atom.b.pole}`]
      .sort()
      .join("|");
    assert.ok(!keys.has(key), `duplikált pólus-pár: ${key}`);
    keys.add(key);
  }
});

test("minden atom szöveg-blokkja kitöltött HU+EN párral", () => {
  for (const atom of RELATION_ATOMS) {
    assertBlocks(atom, "view");
    if (atom.viewB) assertBlocks(atom, "viewB");
  }
});

test("aszimmetrikus atomnak viewB-je van, szimmetrikusnak nincs szüksége rá", () => {
  for (const atom of RELATION_ATOMS) {
    const symmetricShape =
      atom.a.dim === atom.b.dim && atom.a.pole === atom.b.pole;
    if (symmetricShape) {
      assert.ok(atom.symmetric, `${atom.id}: azonos pólus-pár symmetric jelölés nélkül`);
    } else {
      assert.ok(atom.viewB, `${atom.id}: aszimmetrikus atom viewB nélkül`);
    }
  }
});

test("vezető-kiegészítő: mind a 6 dimenzió × 2 pólus kitöltve", () => {
  for (const dim of HEXACO_ORDER) {
    for (const pole of POLES) {
      assertLocalized(
        LEADER_SUPPLEMENTS[dim as HexacoCode][pole],
        `LEADER_SUPPLEMENTS.${dim}.${pole}`,
      );
    }
  }
});

test("findAtom irányfüggetlen, a tükrözött nézőpont a viewB-t adja", () => {
  const direct = findAtom(
    { dim: "C", pole: "high" },
    { dim: "C", pole: "low" },
  );
  const mirrored = findAtom(
    { dim: "C", pole: "low" },
    { dim: "C", pole: "high" },
  );
  assert.ok(direct && mirrored);
  assert.equal(direct.atom.id, mirrored.atom.id);
  assert.equal(direct.mirrored, false);
  assert.equal(mirrored.mirrored, true);

  const directBlocks = atomBlocksFor(direct.atom, direct.mirrored);
  const mirroredBlocks = atomBlocksFor(mirrored.atom, mirrored.mirrored);
  assert.notEqual(directBlocks, mirroredBlocks);
  assert.equal(mirroredBlocks, mirrored.atom.viewB);

  // Szimmetrikus atomnál mindkét irány ugyanazt a nézetet adja.
  const symA = findAtom({ dim: "O", pole: "high" }, { dim: "O", pole: "high" });
  assert.ok(symA);
  assert.equal(atomBlocksFor(symA.atom, symA.mirrored), symA.atom.view);
});
