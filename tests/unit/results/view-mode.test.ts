import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_RESULTS_VIEW_MODE,
  isResultsViewMode,
  resolveResultsViewMode,
} from "@/lib/results/view-mode";

// Az eredmény-nézet feloldása. A sorrend nem ízlés kérdése: a mélylinkelt
// `?tab=` azért üti a tárolt preferenciát, mert az egyszerű nézetben nincs
// fülsáv — enélkül a `?tab=comparison#invitations` alakú linkek (értesítő
// e-mailek, journey-CTA-k, súgó) zsákutcába futnának.

test("alapértelmezés: az egyszerű nézet", () => {
  assert.equal(DEFAULT_RESULTS_VIEW_MODE, "simple");
  assert.equal(resolveResultsViewMode({}), "simple");
});

test("a tárolt preferencia dönt, ha nincs URL-paraméter", () => {
  assert.equal(resolveResultsViewMode({ stored: "full" }), "full");
  assert.equal(resolveResultsViewMode({ stored: "simple" }), "simple");
});

test("a ?view= üti a tárolt preferenciát (megosztható link)", () => {
  assert.equal(resolveResultsViewMode({ param: "simple", stored: "full" }), "simple");
  assert.equal(resolveResultsViewMode({ param: "full", stored: "simple" }), "full");
});

test("a mélylinkelt ?tab= részletes nézetet nyit, akkor is, ha a preferencia egyszerű", () => {
  assert.equal(
    resolveResultsViewMode({ tab: "comparison", stored: "simple" }),
    "full",
  );
  // A ?view= viszont a ?tab=-ot is üti — az explicit kérés az erősebb.
  assert.equal(
    resolveResultsViewMode({ param: "simple", tab: "comparison", stored: "full" }),
    "simple",
  );
});

test("ismeretlen érték nem hibázik, csak visszaesik", () => {
  assert.equal(resolveResultsViewMode({ param: "kompakt", stored: "legacy" }), "simple");
  assert.equal(resolveResultsViewMode({ param: ["full", "simple"] }), "full");
  assert.ok(!isResultsViewMode("kompakt"));
  assert.ok(isResultsViewMode("full"));
});
