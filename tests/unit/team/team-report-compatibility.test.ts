import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  hasCompleteReportDimensions,
  normalizeReportDimensions,
  normalizeTeamReportAggregates,
  reportPatternLabel,
} from "@/lib/team-report-compatibility";

const legacy = { INTE: 65, RESO: 48, TEMP: 72, ADAP: 51, THOR: 80, OPEN: 62 };
const canonical = { H: 65, E: 48, X: 72, A: 51, C: 80, O: 62 };

describe("published report read compatibility", () => {
  it("normalizes the historical six-axis shape without altering the stored snapshot", () => {
    const stored = {
      generatedAt: "2026-07-30T12:00:00Z",
      dimensionAverages: legacy,
      dimensionSpread: { INTE: 8, RESO: 5, TEMP: 7, ADAP: 6, THOR: 3, OPEN: 10 },
      pattern: { label: "Ismeretlen minta — vegyes", confidence: "közepes" },
    };
    const before = structuredClone(stored);
    const read = normalizeTeamReportAggregates(stored)!;
    assert.deepEqual(read.dimensionAverages, canonical);
    assert.deepEqual(read.dimensionSpread, { H: 8, E: 5, X: 7, A: 6, C: 3, O: 10 });
    assert.equal(read.pattern, stored.pattern, "historical interpretation is retained, not regenerated");
    assert.deepEqual(stored, before);
    assert.equal(hasCompleteReportDimensions(read.dimensionAverages), true);
  });

  it("retains canonical values and canonical precedence in mixed snapshots", () => {
    assert.deepEqual(normalizeReportDimensions(canonical), canonical);
    assert.deepEqual(normalizeReportDimensions({ ...legacy, H: 90 }), { ...canonical, H: 90 });
  });

  it("does not render an empty or partial six-axis radar", () => {
    for (const value of [null, {}, [], { OTHER: 80 }, { H: NaN }]) {
      assert.equal(normalizeReportDimensions(value), null);
    }
    assert.equal(hasCompleteReportDimensions(normalizeReportDimensions({ H: 75 })), false);
    assert.equal(hasCompleteReportDimensions(null), false);
  });

  it("uses a UI fallback only for old engine placeholders", () => {
    assert.equal(reportPatternLabel("Ismeretlen minta — vegyes"), null);
    assert.equal(reportPatternLabel("Unknown pattern – homogeneous"), null);
    assert.equal(reportPatternLabel("Összetartó felfedezők"), "Összetartó felfedezők");
  });
});
