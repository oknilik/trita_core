import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDraftNarrativePrefill,
  serializeTeamReport,
  type TeamReportAggregates,
} from "@/lib/team-report";

const baseRecord = {
  id: "rep_1",
  teamId: "team_1",
  status: "PUBLISHED",
  title: "Q3 csapatkép",
  aggregates: { memberCount: 5 },
  summary: "Összefoglaló",
  strengths: null,
  risks: null,
  recommendations: null,
  interviewFindings: "Interjú-tanulságok",
  leadershipGuide: "Vezetési javaslatok",
  actionItems: [
    { title: "Kickoff workshop", description: "Normák tisztázása", timeframe: "30" },
    { title: "hiányos elem", timeframe: "60" },
  ],
  internalNotes: "BIZALMAS tanácsadói jegyzet",
  publishedAt: new Date("2026-07-10T10:00:00Z"),
  createdAt: new Date("2026-07-09T10:00:00Z"),
  updatedAt: new Date("2026-07-10T10:00:00Z"),
};

test("internal notes are stripped for non-consultant serialization", () => {
  const serialized = serializeTeamReport(baseRecord, { includeInternalNotes: false });
  assert.equal(serialized.internalNotes, null);
  assert.equal(serialized.summary, "Összefoglaló");
  assert.equal(serialized.interviewFindings, "Interjú-tanulságok");
});

test("internal notes survive consultant serialization", () => {
  const serialized = serializeTeamReport(baseRecord, { includeInternalNotes: true });
  assert.equal(serialized.internalNotes, "BIZALMAS tanácsadói jegyzet");
});

test("action items: malformed entries dropped, valid kept", () => {
  const serialized = serializeTeamReport(baseRecord, { includeInternalNotes: false });
  assert.deepEqual(serialized.actionItems, [
    { title: "Kickoff workshop", description: "Normák tisztázása", timeframe: "30" },
  ]);
  assert.equal(serialized.leadershipGuide, "Vezetési javaslatok");
});

test("non-array actionItems serialize to null", () => {
  const serialized = serializeTeamReport(
    { ...baseRecord, actionItems: { rogue: true } },
    { includeInternalNotes: false },
  );
  assert.equal(serialized.actionItems, null);
});

const richAggregates: TeamReportAggregates = {
  generatedAt: "2026-07-13T10:00:00Z",
  memberCount: 5,
  completedCount: 4,
  completionPct: 80,
  dimensionAverages: { INTE: 62, RESO: 45, TEMP: 58, ADAP: 51, THOR: 70, OPEN: 40 },
  dimensionSpread: { INTE: 8, RESO: 14, TEMP: 9, ADAP: 6, THOR: 18, OPEN: 7 },
  pattern: { label: "Végrehajtó mag", confidence: "medium" },
  roleDistribution: {
    counts: { IM: 3, CO: 1 },
    secondaryCounts: { TW: 2, ME: 1 },
    questionnaireCount: 1,
    estimateCount: 3,
  },
  roleGaps: ["PL", "SH"],
  evidence: { quality: "partial", observerEdgeCount: 0, estimatedEdgeCount: 6 },
  dynamics: {
    alignedCount: 1,
    complementaryCount: 2,
    frictionCount: 3,
    topFrictionDims: ["THOR", "RESO"],
    source: "profile_estimate",
  },
};

test("prefill: rich aggregates produce every narrative field + action items", () => {
  const prefill = buildDraftNarrativePrefill(richAggregates);
  assert.ok(prefill);
  assert.ok(prefill!.summary.includes("6 tagpárból"));
  assert.ok(prefill!.strengths.startsWith("• "));
  // friction 50% → norma-kockázat + ajánlás
  assert.ok(prefill!.risks.includes("munkastílus-különbség"));
  assert.ok(prefill!.recommendations.includes("működési normák"));
  // szerep-hiány bekerül név szerint
  assert.ok(prefill!.risks.includes("Ötletgazda"));
  // observer hiányzik → visszajelzés-kör ajánlás + akció
  assert.ok(prefill!.recommendations.includes("observer"));
  const titles = prefill!.actionItems.map((item) => item.title);
  assert.ok(titles.includes("Csapatkép-átbeszélő workshop"));
  assert.ok(titles.includes("Működési normák rögzítése"));
  assert.ok(titles.includes("Szerep-tisztázás"));
  assert.ok(titles.includes("Kollégai visszajelzés-kör"));
  assert.ok(titles.includes("Utánkövetés és riport-frissítés"));
  for (const item of prefill!.actionItems) {
    assert.ok(["30", "60", "90"].includes(item.timeframe));
  }
});

test("prefill: no dimension averages returns null", () => {
  const prefill = buildDraftNarrativePrefill({
    ...richAggregates,
    dimensionAverages: null,
  });
  assert.equal(prefill, null);
});

test("unknown status normalizes to DRAFT", () => {
  const serialized = serializeTeamReport(
    { ...baseRecord, status: "weird" },
    { includeInternalNotes: false },
  );
  assert.equal(serialized.status, "DRAFT");
});
