import assert from "node:assert/strict";
import test from "node:test";
import { compareTeamReports } from "../../../src/lib/team-report-comparison";
import type { SerializedTeamReport } from "../../../src/lib/team-report";

function report(completionPct: number, dimensions: Record<string, number>, safety: number): SerializedTeamReport {
  return {
    id: String(completionPct), teamId: "team", status: "PUBLISHED", title: null,
    aggregates: {
      generatedAt: "2026-08-12", memberCount: 5, completedCount: 5, completionPct,
      dimensionAverages: dimensions, dimensionSpread: null, pattern: null,
      roleDistribution: null, roleGaps: null, evidence: null, dynamics: null,
      psychSafety: { index: safety, band: "mid", count: 5, spread: 0, itemMeans: {}, weakItemIds: [], campaignName: "Pulse", campaignStatus: "CLOSED", measuredAt: "2026-08-12" },
    },
    summary: null, strengths: null, risks: null, recommendations: null,
    interviewFindings: null, leadershipGuide: null, actionItems: null,
    internalNotes: null, translationsEn: null, publishedAt: "2026-08-12T00:00:00.000Z",
    createdAt: "2026-08-12T00:00:00.000Z", updatedAt: "2026-08-12T00:00:00.000Z",
  };
}

test("comparison computes round deltas and ranks dimension movement", () => {
  const result = compareTeamReports(
    report(90, { H: 60, X: 75 }, 72.5),
    report(70, { H: 55, X: 60 }, 68),
  );
  assert.equal(result.completionDelta, 20);
  assert.equal(result.psychSafetyDelta, 4.5);
  assert.deepEqual(result.dimensionChanges.map((item) => [item.code, item.delta]), [["X", 15], ["H", 5]]);
});
