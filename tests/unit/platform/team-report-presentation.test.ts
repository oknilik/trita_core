import assert from "node:assert/strict";
import test from "node:test";
import { extractNarrativeHighlights } from "../../../src/lib/team-report-presentation";

test("extractNarrativeHighlights keeps at most three bullet items", () => {
  assert.deepEqual(
    extractNarrativeHighlights("• Első\n- Második\n* Harmadik\n• Negyedik"),
    ["Első", "Második", "Harmadik"],
  );
});

test("extractNarrativeHighlights falls back to sentences", () => {
  assert.deepEqual(
    extractNarrativeHighlights("Első mondat. Második mondat! Harmadik? Negyedik."),
    ["Első mondat.", "Második mondat!", "Harmadik?"],
  );
});

test("extractNarrativeHighlights handles missing content and custom limits", () => {
  assert.deepEqual(extractNarrativeHighlights(null), []);
  assert.deepEqual(extractNarrativeHighlights("Egy. Kettő.", 1), ["Egy."]);
});
