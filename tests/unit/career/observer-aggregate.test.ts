import test from "node:test";
import assert from "node:assert/strict";
import { MIN_RATERS_FOR_ANONYMOUS_AGGREGATE } from "@/lib/anonymity";
import { aggregateObserverDims } from "@/lib/career/observer-aggregate";

// Per-dimenzió anonimitás-padló (2026-08-11, fix): a karrier-inputba egy
// dimenzió csak akkor kerül observer-átlagként, ha arra a DIMENZIÓRA
// legalább a padlónyi értékelő adott pontot. A korábbi bucket.n > 0 egyetlen
// értékelő válaszát is átlagként adta tovább — a member-dossier helperek
// per-érték padlója alatt.

test("padló alatti dimenzió KIMARAD az aggregátumból", () => {
  assert.equal(MIN_RATERS_FOR_ANONYMOUS_AGGREGATE, 3, "a padló-konstans elmozdult");
  // 3 kitöltés, de a C-ra csak EGY értékelő adott pontot.
  const { dims, raterCount } = aggregateObserverDims([
    { X: 60, E: 40, C: 95 },
    { X: 70, E: 50 },
    { X: 80, E: 60 },
  ]);
  assert.equal(raterCount, 3);
  assert.equal(dims.X, 70, "a padlót elérő dimenzió átlaga hibás");
  assert.equal(dims.E, 50);
  assert.equal(
    "C" in dims,
    false,
    "egyetlen értékelő C-pontja 'observer-átlagként' szivárgott be",
  );
});

test("két értékelő dimenziója sem elég – a padló per-dimenzió, nem per-kitöltés", () => {
  const { dims, raterCount } = aggregateObserverDims([
    { X: 60, O: 30 },
    { X: 70, O: 50 },
    { X: 80 },
  ]);
  assert.equal(raterCount, 3);
  assert.equal(dims.X, 70);
  assert.equal("O" in dims, false, "n=2 dimenzió átjutott a padlón");
});

test("üres és pont nélküli kitöltések: nulla rater, üres aggregátum", () => {
  assert.deepEqual(aggregateObserverDims([]), { dims: {}, raterCount: 0 });
  const { dims, raterCount } = aggregateObserverDims([{}, {}]);
  assert.equal(raterCount, 0, "pont nélküli kitöltés raternek számított");
  assert.deepEqual(dims, {});
});
