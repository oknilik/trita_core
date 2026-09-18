import test from "node:test";
import assert from "node:assert/strict";
import {
  validateTeamReportForPublish,
  type TeamReportAggregates,
} from "@/lib/team-report";

function validAggregates(): TeamReportAggregates {
  return {
    assessmentCampaignId: "campaign-1",
    generatedAt: new Date(0).toISOString(),
    memberCount: 4,
    completedCount: 4,
    completionPct: 100,
    dimensionAverages: { H: 60, E: 50, X: 55, A: 65, C: 70, O: 58 },
    dimensionSpread: { H: 5, E: 5, X: 5, A: 5, C: 5, O: 5 },
    pattern: null,
    roleDistribution: null,
    roleGaps: null,
    evidence: { quality: "sufficient", measuredEdgeCount: 6, estimatedEdgeCount: 0 },
    dynamics: null,
    trustHighlights: null,
    psychSafety: {
      index: 4.2,
      band: "high",
      count: 4,
      spread: 0.4,
      itemMeans: {},
      weakItemIds: [],
      campaignName: "Pilot",
      campaignStatus: "CLOSED",
      measuredAt: new Date(0).toISOString(),
    },
    peerRoles: null,
    feedbackCulture: null,
  };
}

const validInput = (): Parameters<typeof validateTeamReportForPublish>[0] => ({
  campaignId: "campaign-1",
  aggregates: validAggregates(),
  title: "Team Scan riport",
  summary: "A csapat működési mintázatának összefoglalása.",
  recommendations: "A következő 30 nap fókusza.",
  actionItems: [
    {
      title: "Heti retrospektív",
      description: "Hetente harminc perc közös visszatekintés.",
      timeframe: "30",
      targetMetric: { kind: "psych_safety_index" },
    },
  ],
});

test("a publikálási kapu átengedi a kampányhű, teljes riportot", () => {
  assert.equal(validateTeamReportForPublish(validInput()), null);
});

test("a publikálási kapu elutasítja a másik kampány aggregátumát", () => {
  const input = validInput();
  input.aggregates!.assessmentCampaignId = "campaign-2";
  assert.equal(validateTeamReportForPublish(input), "REPORT_CAMPAIGN_MISMATCH");
});

test("a publikálási kapu target metric nélküli akciót nem fogad el", () => {
  const input = validInput();
  input.actionItems = [
    { title: "Beszéljük át", description: "Közös egyeztetés.", timeframe: "30" },
  ];
  assert.equal(validateTeamReportForPublish(input), "REPORT_TARGET_ACTION_REQUIRED");
});

test("a publikálási kapu anonimitási minimum alatti pulse-t nem fogad el", () => {
  const input = validInput();
  input.aggregates!.psychSafety = null;
  assert.equal(validateTeamReportForPublish(input), "REPORT_PULSE_DATA_INSUFFICIENT");
});

test("an operating measurement needs three usable responses and 60% coverage per axis", async () => {
  const { calculateOperatingStyle } = await import("@/lib/team-operating-style/scoring");
  const { ITEMS, OPERATING_STYLE_VERSION } = await import("@/lib/team-operating-style/questions");
  const input = validInput();
  const operating = { ...calculateOperatingStyle({ teamId: "team", roundId: "round", instrumentVersion: OPERATING_STYLE_VERSION,
    eligibleRespondentIds: ["a", "b", "c", "d", "e", "f"],
    responses: ["a", "b", "c"].map((respondentId) => ({ respondentId, answers: Object.fromEntries(ITEMS.map((q) => [q.id, 3])) })),
  }), referenceStart: "2026-08-19", referenceEnd: "2026-09-16" };
  input.aggregates!.teamStyle = { version: 1, operating, composition: null, sameRespondents: false, comparison: null };
  assert.equal(validateTeamReportForPublish(input), "REPORT_OPERATING_DATA_INSUFFICIENT");
  for (const axis of Object.values(operating.axes)) axis.coverage = 1;
  assert.equal(validateTeamReportForPublish(input), null);
  operating.axes.information.status = "insufficient_data";
  assert.equal(validateTeamReportForPublish(input), "REPORT_OPERATING_DATA_INSUFFICIENT");
});
