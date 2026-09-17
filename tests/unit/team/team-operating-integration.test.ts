import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateTeamPattern } from "@/lib/team-pattern";
import { calculateOperatingStyle } from "@/lib/team-operating-style/scoring";
import { AXES, ITEMS, OPERATING_STYLE_VERSION } from "@/lib/team-operating-style/questions";
import { compareTeamPatterns, snapshotComposition } from "@/lib/team-operating-style/comparison";
import { presentTeamStyle } from "@/lib/team-operating-style/presentation";
import { OperatingSubmissionSchema, sameOperatingAnswers } from "@/lib/team-operating-style/submission";
import { CAMPAIGN_PRESETS, getCampaignStepLink, normalizeCampaignSteps } from "@/lib/campaign-steps-core";
import { getCampaignActivationPreconditionFailure } from "@/lib/campaign-activation-core";

function op(code: string) {
  return calculateOperatingStyle({ teamId: "team", roundId: "round", instrumentVersion: OPERATING_STYLE_VERSION,
    eligibleRespondentIds: ["a", "b", "c"], responses: ["a", "b", "c"].map((respondentId) => ({ respondentId,
      answers: Object.fromEntries(ITEMS.map((q) => [q.id, (code[AXES.indexOf(q.axis)] === "0") === (q.pole === "left") ? 5 : 1])),
    })) });
}
function comp(code: string) {
  return snapshotComposition(calculateTeamPattern(["a", "b", "c"].map((userId) => ({ userId, scores: {
    H: code[1] === "1" ? 90 : 10, A: code[1] === "1" ? 90 : 10,
    X: code[0] === "1" ? 90 : 10, C: code[2] === "1" ? 90 : 10, O: code[3] === "1" ? 90 : 10, E: 50,
  } }))));
}

test("all 16 × 16 combinations retain both distinct pattern identities and four discussion contexts", () => {
  const identities = new Set();
  for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) {
    const operating = op(i.toString(2).padStart(4, "0"));
    const composition = comp(j.toString(2).padStart(4, "0"))!;
    const comparison = compareTeamPatterns(operating, composition)!;
    assert.equal(comparison.operatingCode, operating.pattern!.code);
    assert.equal(comparison.compositionCode, composition.code);
    assert.equal(comparison.prompts.length, 4);
    identities.add(`${comparison.operatingCode}:${comparison.compositionCode}`);
    const snapshot = { version: 1 as const, operating: { ...operating, referenceStart: "2026-08-19", referenceEnd: "2026-09-16" }, composition, sameRespondents: true, comparison };
    for (const locale of ["hu", "en"] as const) {
      const sections = presentTeamStyle(snapshot, locale);
      assert.equal(sections.length, 3);
      assert.equal(sections[1].heading, composition.name);
      assert.equal(sections[2].prompts.length, 4);
      assert.doesNotMatch(JSON.stringify(sections), /tos\.|undefined|NaN|respondentId/);
    }
  }
  assert.equal(identities.size, 256);
});

test("missing/uncertain behavior data is not synthesized from personality", () => {
  const sections = presentTeamStyle(undefined, "hu", "Régi mintázat");
  assert.equal(sections[1].heading, "Régi mintázat");
  assert.equal(sections[2].prompts.length, 0);
  assert.equal(compareTeamPatterns(null, comp("1111")), null);
  const operating = op("0000"); operating.pattern = null; operating.axes.information.status = "insufficient_data";
  assert.equal(compareTeamPatterns(operating, comp("1111")), null);
});

test("the versioned preset adds behavior without changing Scan v1", () => {
  assert.deepEqual(CAMPAIGN_PRESETS.SCAN_V1.steps, ["SELF_ASSESSMENT", "TRUST_360", "PSYCH_SAFETY"]);
  assert.deepEqual(normalizeCampaignSteps([...CAMPAIGN_PRESETS.SCAN_STYLE_V1.steps]), CAMPAIGN_PRESETS.SCAN_STYLE_V1.steps);
  assert.equal(getCampaignStepLink("TEAM_OPERATING_STYLE", "c/x"), "/assessment/team-operating-style?campaignId=c%2Fx");
  assert.equal(CAMPAIGN_PRESETS.SCAN_STYLE_V1.requireFreshResults, true);
  for (const teamIds of [[], ["a", "b"]]) assert.equal(getCampaignActivationPreconditionFailure({
    presetId: "SCAN_STYLE_V1", steps: [...CAMPAIGN_PRESETS.SCAN_STYLE_V1.steps], teamIds,
    participantUserIds: ["a", "b", "c"], targetMemberUserIds: ["a", "b", "c"],
  }), "OPERATING_STYLE_SINGLE_TEAM_REQUIRED");
});

test("submission requires explicit answers including N/A, while drafts can be partial", () => {
  const body = { campaignId: "c", instrumentVersion: OPERATING_STYLE_VERSION, answers: {}, intent: "draft" };
  assert.ok(OperatingSubmissionSchema.safeParse(body).success);
  assert.ok(!OperatingSubmissionSchema.safeParse({ ...body, intent: "submit" }).success);
  const answers = Object.fromEntries(ITEMS.map((q) => [q.id, null]));
  assert.ok(OperatingSubmissionSchema.safeParse({ ...body, intent: "submit", answers }).success);
  assert.ok(sameOperatingAnswers(answers, answers));
  assert.ok(!sameOperatingAnswers(answers, { ...answers, INF1: 3 }));
  assert.ok(!OperatingSubmissionSchema.safeParse({ ...body, teamId: "other" }).success);
  assert.ok(!OperatingSubmissionSchema.safeParse({ ...body, instrumentVersion: "old" }).success);
});


test("comparison questions respond to the composition profile as well as operating poles", () => {
  const high = compareTeamPatterns(op("0000"), comp("1111"))!;
  const low = compareTeamPatterns(op("0000"), comp("0000"))!;
  for (let i = 0; i < 4; i++) assert.notEqual(high.prompts[i].support.hu, low.prompts[i].support.hu);
});


test("co-occurring poles still yield dimensional comparisons, including older frozen snapshots", () => {
  const operating = calculateOperatingStyle({ teamId: "team", roundId: "round", instrumentVersion: OPERATING_STYLE_VERSION,
    eligibleRespondentIds: ["a", "b", "c"], responses: ["a", "b", "c"].map((respondentId) => ({ respondentId,
      answers: Object.fromEntries(ITEMS.map((q) => [q.id, 5])),
    })) });
  assert.equal(operating.pattern, null);
  assert.equal(operating.patternUnavailableReason, "pole_cooccurrence");
  const composition = comp("1111")!;
  assert.equal(compareTeamPatterns(operating, composition)?.operatingCode, null);
  const snapshot = { version: 1 as const, operating: { ...operating, referenceStart: "2026-08-19", referenceEnd: "2026-09-16" },
    composition, comparison: null, sameRespondents: true };
  for (const locale of ["hu", "en"] as const) {
    const section = presentTeamStyle(snapshot, locale)[2];
    assert.equal(section.prompts.length, 4);
    assert.doesNotMatch(JSON.stringify(section), /NaN|undefined|tos\./);
  }
  operating.axes.information.coverage = 0.5;
  assert.equal(compareTeamPatterns(operating, composition), null);
  operating.axes.information.coverage = 1;
  operating.patternUnavailableReason = "different_cohorts";
  assert.equal(compareTeamPatterns(operating, composition), null);
});
