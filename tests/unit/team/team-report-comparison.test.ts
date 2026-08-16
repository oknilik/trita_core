import assert from "node:assert/strict";
import test from "node:test";
import { compareTeamReports } from "../../../src/lib/team-report-comparison";
import type {
  SerializedTeamReport,
  TeamReportAggregates,
} from "../../../src/lib/team-report";

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
  layers: Partial<TeamReportAggregates> = {},
): SerializedTeamReport {
  return {
    id: String(completionPct), teamId: "team", status: "PUBLISHED", title: null,
    aggregates: {
      generatedAt: "2026-08-12", memberCount: 5, completedCount: 5, completionPct,
      dimensionAverages: dimensions, dimensionSpread: null, pattern: null,
      comparisonBasis: { version: 1, contributors },
      roleDistribution: null, roleGaps: null, evidence: null, dynamics: null,
      psychSafety: { index: safety, band: "mid", count: 5, spread: 0, itemMeans: {}, weakItemIds: [], campaignName: "Pulse", campaignStatus: "CLOSED", measuredAt: "2026-08-12" },
      ...layers,
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
  same.aggregates!.psychSafety!.itemMeans = { PS1: 3.2 };
  same.aggregates!.psychSafety!.weakItemIds = ["PS1"];
  const result = compareTeamReports(same, same);

  assert.equal(result.psychSafetyDelta, 0);
  assert.equal(result.psychSafetySignificant, false);
  assert.equal(result.dimensionChanges.filter((item) => item.significant).length, 0);
  assert.equal(result.stableCoreDimensionChanges.filter((item) => item.significant).length, 0);
  assert.deepEqual(
    result.psychSafetyItemChanges.map((item) => [item.delta, item.significant]),
    [[0, false]],
  );
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

test("a változékony mért rétegeket külön összehasonlítja", () => {
  const contributors = ["a", "b", "c", "d", "e"].map((key) => ({
    key,
    dimensions: { H: 50 },
  }));
  const previous = report(100, { H: 50 }, 55, contributors, {
    psychSafety: {
      index: 55,
      band: "mid",
      count: 10,
      spread: 12,
      itemMeans: { PS1: 2, PS2: 3.5 },
      weakItemIds: ["PS1"],
      campaignName: "Első pulse",
      campaignStatus: "CLOSED",
      measuredAt: "2026-06-01",
    },
    evidence: { quality: "sufficient", measuredEdgeCount: 4, estimatedEdgeCount: 0 },
    trustHighlights: {
      source: "trust_round",
      measuredPairCount: 4,
      possiblePairCount: 10,
      coveragePct: 40,
      hubs: ["Anna"],
      isolated: ["Béla", "Csilla"],
    },
    roleDistribution: {
      counts: {},
      questionnaireCount: 2,
      estimateCount: 3,
    },
    roleGaps: ["OG", "HA"],
    peerRoles: {
      ratedCount: 4,
      memberCount: 5,
      topRoleCounts: {},
      mismatchCount: 3,
      comparedCount: 4,
    },
    feedbackCulture: {
      memberCount: 5,
      coveredCount: 4,
      alignedCount: 2,
      gapCount: 2,
    },
  });
  const current = report(100, { H: 50 }, 68, contributors, {
    psychSafety: {
      index: 68,
      band: "mid",
      count: 10,
      spread: 10,
      itemMeans: { PS1: 4, PS2: 3.8 },
      weakItemIds: [],
      campaignName: "Második pulse",
      campaignStatus: "CLOSED",
      measuredAt: "2026-08-01",
    },
    evidence: { quality: "sufficient", measuredEdgeCount: 7, estimatedEdgeCount: 0 },
    trustHighlights: {
      source: "trust_round",
      measuredPairCount: 7,
      possiblePairCount: 10,
      coveragePct: 70,
      hubs: ["Anna", "Dani"],
      isolated: ["Csilla"],
    },
    roleDistribution: {
      counts: {},
      questionnaireCount: 4,
      estimateCount: 1,
    },
    roleGaps: ["HA"],
    peerRoles: {
      ratedCount: 4,
      memberCount: 5,
      topRoleCounts: {},
      mismatchCount: 1,
      comparedCount: 4,
    },
    feedbackCulture: {
      memberCount: 5,
      coveredCount: 4,
      alignedCount: 3,
      gapCount: 1,
    },
  });
  previous.actionItems = [
    {
      title: "Kényes témák fóruma",
      description: "",
      timeframe: "30",
      status: "done",
      targetMetric: { kind: "psych_safety_item", itemId: "PS1" },
    },
    {
      title: "Segítségkérés rutinja",
      description: "",
      timeframe: "30",
      status: "in_progress",
      targetMetric: { kind: "psych_safety_item", itemId: "PS2" },
    },
    {
      title: "Peremre került tagok bevonása",
      description: "",
      timeframe: "60",
      targetMetric: { kind: "trust_isolated_count" },
    },
    {
      title: "Ötletgazda szerep pótlása",
      description: "",
      timeframe: "60",
      targetMetric: { kind: "role_gap", roleCode: "OG" },
    },
  ];

  const result = compareTeamReports(current, previous);
  assert.deepEqual(
    result.psychSafetyItemChanges.map((item) => [
      item.id,
      item.delta,
      item.significant,
      item.weakness,
    ]),
    [
      ["PS1", 2, true, "resolved"],
      ["PS2", 0.3, false, "not_weak"],
    ],
  );
  assert.deepEqual(result.trustNetwork, {
    measuredPairs: { previous: 4, current: 7, delta: 3 },
    coveragePct: { previous: 40, current: 70, delta: 30 },
    hubCount: { previous: 1, current: 2, delta: 1 },
    isolatedCount: { previous: 2, current: 1, delta: -1 },
  });
  assert.deepEqual(result.roleCoverage, {
    coveredRoles: { previous: 7, current: 8, delta: 1 },
    gapCount: { previous: 2, current: 1, delta: -1 },
    questionnaireCount: { previous: 2, current: 4, delta: 2 },
    resolvedGaps: ["OG"],
    newGaps: [],
  });
  assert.deepEqual(result.externalPerspective, {
    coveredCount: { previous: 4, current: 4, delta: 0 },
    gapCount: { previous: 2, current: 1, delta: -1 },
    gapSharePct: { previous: 50, current: 25, delta: -25 },
  });
  assert.deepEqual(result.peerRolePerspective, {
    comparedCount: { previous: 4, current: 4, delta: 0 },
    mismatchCount: { previous: 3, current: 1, delta: -2 },
    mismatchSharePct: { previous: 75, current: 25, delta: -50 },
  });
  assert.deepEqual(
    result.actionOutcomes.map((outcome) => ({
      title: outcome.title,
      metric: outcome.metric,
      gate: outcome.gate,
      significant: outcome.significant,
      direction: outcome.direction,
    })),
    [
      {
        title: "Kényes témák fóruma",
        metric: { previous: 2, current: 4, delta: 2 },
        gate: "measurement_error",
        significant: true,
        direction: "improved",
      },
      {
        title: "Segítségkérés rutinja",
        metric: { previous: 3.5, current: 3.8, delta: 0.3 },
        gate: "measurement_error",
        significant: false,
        direction: "no_clear_change",
      },
      {
        title: "Peremre került tagok bevonása",
        metric: { previous: 2, current: 1, delta: -1 },
        gate: "descriptive",
        significant: null,
        direction: "improved",
      },
      {
        title: "Ötletgazda szerep pótlása",
        metric: { previous: 1, current: 0, delta: -1 },
        gate: "categorical",
        significant: null,
        direction: "improved",
      },
    ],
  );
});

test("régi snapshot változékony rétegek nélkül is kompatibilis", () => {
  const result = compareTeamReports(
    report(100, { H: 50 }, 60),
    report(100, { H: 50 }, 60),
  );
  assert.equal(result.trustNetwork, null);
  assert.equal(result.roleCoverage, null);
  assert.equal(result.externalPerspective, null);
  assert.equal(result.peerRolePerspective, null);
  assert.deepEqual(result.psychSafetyItemChanges, []);
});

test("az első mért bizalmi kör adatgyűjtési akciója 0-ról kap lefedettségi kimenetet", () => {
  const previous = report(100, { H: 50 }, 60, undefined, {
    evidence: { quality: "partial", measuredEdgeCount: 0, estimatedEdgeCount: 4 },
  });
  previous.actionItems = [{
    title: "Mért bizalmi kör",
    description: "",
    timeframe: "60",
    targetMetric: { kind: "trust_coverage" },
  }];
  const current = report(100, { H: 50 }, 60, undefined, {
    evidence: { quality: "sufficient", measuredEdgeCount: 5, estimatedEdgeCount: 0 },
    trustHighlights: {
      source: "trust_round",
      measuredPairCount: 5,
      possiblePairCount: 10,
      coveragePct: 50,
      hubs: [],
      isolated: [],
    },
  });

  const [outcome] = compareTeamReports(current, previous).actionOutcomes;
  assert.deepEqual(outcome.metric, { previous: 0, current: 50, delta: 50 });
  assert.equal(outcome.gate, "descriptive");
  assert.equal(outcome.significant, null);
  assert.equal(outcome.direction, "improved");
});
