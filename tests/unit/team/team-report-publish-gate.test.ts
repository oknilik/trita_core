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
