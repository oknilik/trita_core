import assert from "node:assert/strict";
import test from "node:test";
import { compareTeamReports } from "../../../src/lib/team-report-comparison";
import type { SerializedTeamReport } from "../../../src/lib/team-report";

type Contributor = { key: string; dimensions: Record<string, number> };

function report(
  completionPct: number,
  dimensions: Record<string, number>,
  safety: number,
  contributors: Contributor[] = [
    { key: "a", dimensions },
    { key: "b", dimensions },
    { key: "c", dimensions },
    { key: "d", dimensions },
    { key: "e", dimensions },
  ],
): SerializedTeamReport {
  return {
    id: String(completionPct), teamId: "team", status: "PUBLISHED", title: null,
    aggregates: {
      generatedAt: "2026-08-12", memberCount: 5, completedCount: 5, completionPct,
      dimensionAverages: dimensions, dimensionSpread: null, pattern: null,
      comparisonBasis: { version: 1, contributors },
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
  assert.equal(result.psychSafetySignificant, false);
  assert.deepEqual(
    result.dimensionChanges.map((item) => [item.code, item.delta, item.significant]),
    [["X", 15, true], ["H", 5, false]],
  );
  assert.deepEqual(result.composition, {
    status: "comparable",
    common: 5,
    joined: 0,
    left: 0,
    overlapPct: 100,
    reason: null,
  });
  assert.deepEqual(
    result.stableCoreDimensionChanges.map((item) => [item.code, item.delta, item.significant]),
    [["X", 15, true], ["H", 5, false]],
  );
});

test("azonos riport önmagával összevetve nem ad mérési hibán túli változást", () => {
  const same = report(80, { H: 55, E: 48, X: 61, A: 52, C: 64, O: 70 }, 68);
  const result = compareTeamReports(same, same);

  assert.equal(result.psychSafetyDelta, 0);
  assert.equal(result.psychSafetySignificant, false);
  assert.equal(result.dimensionChanges.filter((item) => item.significant).length, 0);
  assert.equal(result.stableCoreDimensionChanges.filter((item) => item.significant).length, 0);
});

test("nagy pszichológiai-biztonság elmozdulás átmegy a konzervatív prior-kapun", () => {
  const result = compareTeamReports(
    report(100, { H: 60 }, 80),
    report(100, { H: 60 }, 60),
  );

  assert.equal(result.psychSafetyDelta, 20);
  assert.equal(result.psychSafetySignificant, true);
});

test("összetétel-változásnál figyelmeztet és nem képez stabilmag-deltát", () => {
  const previousContributors = ["a", "b", "c", "d", "e"].map((key) => ({
    key,
    dimensions: { H: 50 },
  }));
  const currentContributors = ["a", "b", "x", "y", "z"].map((key) => ({
    key,
    dimensions: { H: key === "a" || key === "b" ? 50 : 80 },
  }));
  const result = compareTeamReports(
    report(100, { H: 68 }, 70, currentContributors),
    report(100, { H: 50 }, 70, previousContributors),
  );

  assert.deepEqual(result.composition, {
    status: "changed",
    common: 2,
    joined: 3,
    left: 3,
    overlapPct: 40,
    reason: "too_few_common",
  });
  assert.equal(result.stableCoreDimensionChanges.length, 0);
});

test("a stabil mag kiszűri a belépő által okozott teljescsapat-eltolódást", () => {
  const previousContributors = [
    { key: "a", dimensions: { H: 40 } },
    { key: "b", dimensions: { H: 50 } },
    { key: "c", dimensions: { H: 60 } },
  ];
  const currentContributors = [
    ...previousContributors,
    { key: "d", dimensions: { H: 100 } },
  ];
  const result = compareTeamReports(
    report(100, { H: 63 }, 70, currentContributors),
    report(100, { H: 50 }, 70, previousContributors),
  );

  assert.equal(result.dimensionChanges[0].delta, 13);
  assert.deepEqual(result.composition, {
    status: "comparable",
    common: 3,
    joined: 1,
    left: 0,
    overlapPct: 100,
    reason: null,
  });
  assert.deepEqual(
    result.stableCoreDimensionChanges.map((item) => [item.code, item.delta, item.significant]),
    [["H", 0, false]],
  );
});

test("régi snapshot comparisonBasis nélkül is olvasható, de fail-closed", () => {
  const current = report(100, { H: 70 }, 70);
  const previous = report(100, { H: 50 }, 70);
  delete previous.aggregates!.comparisonBasis;

  const result = compareTeamReports(current, previous);
  assert.equal(result.composition.status, "unknown");
  assert.equal(result.composition.reason, "missing_basis");
  assert.equal(result.stableCoreDimensionChanges.length, 0);
});
