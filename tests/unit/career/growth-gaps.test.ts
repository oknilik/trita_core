import test from "node:test";
import assert from "node:assert/strict";
import {
  collectGrowthGaps,
  type FitComponentLike,
} from "@/lib/career/growth-content";

// A fejlődési terv gyűjtője a motor H-padló-kizárását is alkalmazza
// (2026-08-11, fix): a note === "h-floor" komponens geometriailag "over", de
// az alignment 100 — eltérésként gyűjtve a magas becsületesség-alázatú
// felhasználót arra coacholta volna, hogy legyen KEVÉSBÉ őszinte.

function section(components: FitComponentLike[]) {
  return { atLevel: [[{ components }]], afterTraining: [] };
}

test("H-padlós 'over' komponens NEM kerül a fejlődési tervbe", () => {
  const gaps = collectGrowthGaps(
    section([
      { dim: "H", position: "over", weight: 0.3, note: "h-floor" },
      { dim: "X", position: "under", weight: 0.25 },
    ]),
  );
  assert.equal(gaps.length, 1);
  assert.equal(gaps[0].dim, "X");
  assert.equal(gaps[0].pole, "under");
  assert.ok(
    !gaps.some((gap) => gap.dim === "H" && gap.pole === "over"),
    "a magas becsületesség-alázat 'legyél kevésbé őszinte' kártyát kapott",
  );
});

test("nem-padlós H eltérés változatlanul gyűjthető", () => {
  // A kizárás a NOTE-hoz kötött, nem a dimenzióhoz: egy magas H-célú szerep
  // alatt maradó user jogos 'under' jelzést kap.
  const gaps = collectGrowthGaps(
    section([{ dim: "H", position: "under", weight: 0.3 }]),
  );
  assert.equal(gaps.length, 1);
  assert.equal(gaps[0].dim, "H");
});

test("gyűjtési szabályok: 'in' és kis súly kimarad, gyakoriság rendez", () => {
  const gaps = collectGrowthGaps(
    section([
      { dim: "C", position: "in", weight: 0.4 },
      { dim: "O", position: "under", weight: 0.1 }, // súly < 0.15
      { dim: "X", position: "under", weight: 0.2 },
      { dim: "X", position: "under", weight: 0.2 },
      { dim: "A", position: "over", weight: 0.2 },
    ]),
  );
  assert.equal(gaps.length, 2);
  assert.equal(gaps[0].dim, "X");
  assert.equal(gaps[0].count, 2);
  assert.equal(gaps[1].dim, "A");
});
