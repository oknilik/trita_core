import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { activateCampaignAtomically } from "@/lib/campaign-steps";
import { CAMPAIGN_PRESETS } from "@/lib/campaign-steps-core";
import { saveOperatingResponse } from "@/lib/team-operating-style/service.server";
import { loadTeamStyleSnapshot } from "@/lib/team-operating-style/snapshot.server";
import { ITEMS, OPERATING_STYLE_VERSION } from "@/lib/team-operating-style/questions";
import { calculateTeamPattern } from "@/lib/team-pattern";

// Run with the existing dedicated integration DB harness, never a production DB.
test("operating round activation, concurrent retry, roster, scope and immutable report snapshot", async () => {
  assert.equal(process.env.TRITA_INTEGRATION_TEST_DB, "1", "Use the dedicated integration test DB harness");
  const ids = [0, 1, 2].map(() => `tos_${randomUUID()}`);
  const orgId = `tos_org_${randomUUID()}`, teamId = `tos_team_${randomUUID()}`, campaignId = `tos_campaign_${randomUUID()}`;
  try {
    for (const id of ids) await prisma.userProfile.create({ data: { id, username: "Operating fixture" } });
    await prisma.organization.create({ data: { id: orgId, name: "Operating fixture", ownerId: ids[0] } });
    await prisma.team.create({ data: { id: teamId, orgId, name: "Operating fixture", ownerId: ids[0] } });
    for (const userId of ids) {
      await prisma.organizationMember.create({ data: { orgId, userId, role: "ORG_MEMBER" } });
      await prisma.teamMember.create({ data: { teamId, userId } });
    }
    await prisma.campaign.create({ data: { id: campaignId, orgId, createdBy: ids[0], name: "Operating fixture",
      type: "TEAM_OPERATING_STYLE", steps: [...CAMPAIGN_PRESETS.SCAN_STYLE_V1.steps], presetId: "SCAN_STYLE_V1",
      teamId, teamIds: [teamId], requireFreshResults: true, stepIntervalHours: 0,
      participants: { create: ids.map((userId) => ({ userId })) },
    } });
    const activation = await activateCampaignAtomically(campaignId);
    assert.equal(activation.outcome, "activated");
    const round = await prisma.teamOperatingRound.findUniqueOrThrow({ where: { campaignId } });
    assert.deepEqual([...round.eligibleUserIds].sort(), [...ids].sort());
    assert.equal(round.referenceEnd.getTime() - round.referenceStart.getTime(), 28 * 86400_000);
    const answers = Object.fromEntries(ITEMS.map((q) => [q.id, q.pole === "left" ? 5 : 1]));
    const body = { campaignId, instrumentVersion: OPERATING_STYLE_VERSION, intent: "submit", answers };
    await saveOperatingResponse(ids[0], { ...body, intent: "draft", answers: { INF1: 5 } });
    const retries = await Promise.all([saveOperatingResponse(ids[0], body), saveOperatingResponse(ids[0], body)]);
    assert.equal(retries.filter((r) => r.replayed).length, 1);
    assert.equal(await prisma.teamOperatingResponse.count({ where: { roundId: round.id, userId: ids[0] } }), 1);
    assert.equal((await prisma.campaignParticipant.findUniqueOrThrow({ where: { campaignId_userId: { campaignId, userId: ids[0] } } })).currentStep, 1);
    await assert.rejects(saveOperatingResponse(ids[0], { ...body, answers: { ...answers, INF1: 4 } }), /ALREADY_SUBMITTED/);
    for (const userId of ids.slice(1)) await saveOperatingResponse(userId, body);
    const personality = calculateTeamPattern(ids.map((userId) => ({ userId, scores: { H: 80, A: 80, X: 80, C: 80, O: 80, E: 50 } })));
    const snapshot = await loadTeamStyleSnapshot(teamId, campaignId, personality, ids);
    assert.equal(snapshot.operating?.pattern?.code, "0000");
    assert.equal(snapshot.comparison?.compositionCode, personality?.patternCode);
    assert.ok(snapshot.sameRespondents);
    assert.ok(!ids.some((id) => JSON.stringify(snapshot).includes(id)));
    assert.equal((await loadTeamStyleSnapshot(teamId, "other-campaign", personality, ids)).operating, null);
    await prisma.campaign.update({ where: { id: campaignId }, data: { status: "CLOSED" } });
    await assert.rejects(saveOperatingResponse(ids[0], body), /CAMPAIGN_NOT_ACTIVE/);
    // JSON snapshot remains unchanged even after underlying rows are removed for retention.
    const frozen = JSON.stringify(snapshot);
    await prisma.teamOperatingResponse.deleteMany({ where: { roundId: round.id } });
    assert.equal(JSON.stringify(snapshot), frozen);
    assert.equal((await loadTeamStyleSnapshot(teamId, campaignId, personality, ids)).operating?.pattern, null);
  } finally {
    await prisma.campaign.deleteMany({ where: { id: campaignId } });
    await prisma.team.deleteMany({ where: { id: teamId } });
    await prisma.organization.deleteMany({ where: { id: orgId } });
    await prisma.userProfile.deleteMany({ where: { id: { in: ids } } });
  }
});
