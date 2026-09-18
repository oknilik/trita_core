import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { createProgramSnapshot, participantActivities, completionMap } from "@/lib/programs/core";
import { activateCampaignAtomically, advanceCampaignStepForUser } from "@/lib/campaign-steps";
import { saveOperatingResponse } from "@/lib/team-operating-style/service.server";
import { recordAnonymousPsychSafetyResponse } from "@/lib/psych-safety-submit.server";
import { guardProgramSubmission } from "@/lib/programs/submission.server";
import { reconcileProgramObserver } from "@/lib/programs/observer.server";
import { ITEMS, OPERATING_STYLE_VERSION } from "@/lib/team-operating-style/questions";
import { buildTeamReportAggregates } from "@/lib/team-report";
import { programDataError } from "@/lib/programs/report";
import { mutateProgramReport } from "@/lib/programs/report-lifecycle.server";
import { loadBaseline } from "@/lib/programs/baseline.server";
import { PSYCH_SAFETY_ITEMS } from "@/lib/psych-safety";
import type { Prisma } from "@prisma/client";

test("Team Scan → parallel submissions → review/publish → pinned Follow-up; concurrent writes and scopes", async () => {
  assert.equal(process.env.TRITA_INTEGRATION_TEST_DB, "1");
  const orgId = `program_org_${randomUUID()}`, teamId = `program_team_${randomUUID()}`;
  const ids = [0,1,2].map(() => `program_user_${randomUUID()}`);
  const scanId = `program_scan_${randomUUID()}`, followId = `program_follow_${randomUUID()}`;
  const scan = createProgramSnapshot("TEAM_SCAN");
  const scores = { H: 60, E: 50, X: 65, A: 55, C: 70, O: 60 };
  const op = (campaignId: string) => ({ campaignId, instrumentVersion: OPERATING_STYLE_VERSION, intent: "submit", answers: Object.fromEntries(ITEMS.map(q => [q.id, q.pole === "left" ? 5 : 1])) });
  async function pulse(campaignId: string, userId: string) {
    const p = await prisma.campaignParticipant.findUniqueOrThrow({ where: { campaignId_userId: { campaignId, userId } } });
    return recordAnonymousPsychSafetyResponse({ participantId: p.id, profileId: userId, campaignId, teamId, submittedOn: new Date("2026-09-18"), answers: Object.fromEntries(PSYCH_SAFETY_ITEMS.map(i => [i.id, 4])) });
  }
  try {
    for (const id of ids) await prisma.userProfile.create({ data: { id, username: "Program fixture" } });
    await prisma.organization.create({ data: { id: orgId, name: "Program fixture", ownerId: ids[0] } });
    await prisma.team.create({ data: { id: teamId, orgId, name: "Program fixture", ownerId: ids[0] } });
    for (const userId of ids) {
      await prisma.organizationMember.create({ data: { orgId, userId, role: "ORG_MEMBER" } });
      await prisma.teamMember.create({ data: { teamId, userId } });
    }
    await prisma.campaign.create({ data: { id: scanId, orgId, createdBy: ids[0], name: "Team Scan", type: "SELF_ASSESSMENT", steps: participantActivities(scan).map(a => a.key), teamId, teamIds: [teamId], programKey: scan.key, programVersion: scan.version, programSnapshot: scan, requireFreshResults: true, participants: { create: ids.map(userId => ({ userId })) } } });
    await activateCampaignAtomically(scanId);
    await assert.rejects(saveOperatingResponse(ids[0], op(scanId)), /STEP_LOCKED/);
    for (const userId of ids) await prisma.$transaction(async tx => {
      await guardProgramSubmission(tx, scanId, userId, "SELF_ASSESSMENT");
      await tx.assessmentResult.create({ data: { userProfileId: userId, campaignId: scanId, scores, testType: "TRITAN" } });
      await advanceCampaignStepForUser(userId, "SELF_ASSESSMENT", { campaignId: scanId, db: tx, emitNotifications: false });
    });
    // Independent activities commit together, without overwriting either completion.
    await Promise.all([saveOperatingResponse(ids[0], op(scanId)), pulse(scanId, ids[0])]);
    const after = await prisma.campaignParticipant.findUniqueOrThrow({ where: { campaignId_userId: { campaignId: scanId, userId: ids[0] } } });
    assert.ok(completionMap(after.stepCompletions).TEAM_OPERATING_STYLE);
    assert.ok(completionMap(after.stepCompletions).PSYCH_SAFETY);
    assert.equal(after.nextStepOpensAt, null);
    assert.equal(await prisma.observerAssessment.count({ where: { invitation: { campaignId: scanId } } }), 0);
    for (const userId of ids.slice(1)) { await saveOperatingResponse(userId, op(scanId)); await pulse(scanId, userId); }
    assert.equal(programDataError((await buildTeamReportAggregates(teamId, { assessmentCampaignId: scanId }))!), "REPORT_OBSERVER_DATA_INSUFFICIENT");
    // A different campaign's responses do not satisfy this campaign's observer requirement.
    for (const userId of ids) await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "Campaign" WHERE "id" = ${scanId} FOR UPDATE`;
      for (let i=0;i<3;i++) await tx.observerInvitation.create({ data: { inviterId: userId, campaignId: scanId, testType: "TRITAN", status: "COMPLETED", completedAt: new Date(), expiresAt: new Date(Date.now()+86400000), assessment: { create: { relationshipType: "COLLEAGUE", knownDuration: "1-3", scores } } } });
      await reconcileProgramObserver(tx, scanId, userId, scan);
    });
    const aggregates = (await buildTeamReportAggregates(teamId, { assessmentCampaignId: scanId }))!;
    assert.equal(programDataError(aggregates), null);
    await prisma.campaign.update({ where: { id: scanId }, data: { status: "CLOSED", closedAt: new Date() } });
    const report = await prisma.teamReport.create({ data: { teamId, campaignId: scanId, orgId, createdById: ids[0], title: "Scan", summary: "Summary", recommendations: "Actions", actionItems: [{ title: "Try", description: "Practice", timeframe: "30", targetMetric: { kind: "psych_safety_index" } }], aggregates: aggregates as unknown as Prisma.InputJsonValue } });
    const input = { reportId: report.id, teamId, actorId: ids[0], fields: {} };
    await assert.rejects(mutateProgramReport({ ...input, action: "publish", expectedRevision: 1 }), /REVIEW_REQUIRED/);
    let reviewed = await mutateProgramReport({ ...input, action: "review", expectedRevision: 1 });
    const edited = await mutateProgramReport({ ...input, action: "save", expectedRevision: reviewed.revision, fields: { summary: "Edited" } });
    await assert.rejects(mutateProgramReport({ ...input, action: "publish", expectedRevision: edited.revision }), /REVIEW_REQUIRED/);
    reviewed = await mutateProgramReport({ ...input, action: "review", expectedRevision: edited.revision });
    const published = await mutateProgramReport({ ...input, action: "publish", expectedRevision: reviewed.revision });
    assert.equal(published.status, "PUBLISHED");
    assert.deepEqual(published.aggregates, reviewed.aggregates);
    const baseline = await loadBaseline(orgId, teamId, scanId); assert.ok(baseline);
    assert.equal(await loadBaseline("other", teamId, scanId), null);
    const follow = createProgramSnapshot("FOLLOW_UP");
    await prisma.campaign.create({ data: { id: followId, orgId, createdBy: ids[0], name: "Follow-up", teamId, teamIds: [teamId], type: "TEAM_OPERATING_STYLE", steps: participantActivities(follow).map(a => a.key), programKey: follow.key, programVersion: 1, programSnapshot: follow, baselineCampaignId: scanId, baselineReportSnapshot: baseline, participants: { create: ids.map(userId => ({ userId })) } } });
    await activateCampaignAtomically(followId);
    for (const userId of ids) { await saveOperatingResponse(userId, op(followId)); await pulse(followId, userId); }
    assert.equal(await prisma.assessmentResult.count({ where: { campaignId: followId } }), 0);
    assert.equal(await prisma.observerInvitation.count({ where: { campaignId: followId } }), 0);
    const followAgg = (await buildTeamReportAggregates(teamId, { assessmentCampaignId: followId }))!;
    assert.equal(programDataError(followAgg), null);
    assert.deepEqual(followAgg.dimensionAverages, published.aggregates!.dimensionAverages);
    assert.equal(followAgg.program?.operatingChanges?.length, 4);
    assert.equal(followAgg.program?.psychSafetyChange?.delta, 0);
    assert.equal(followAgg.program?.baseline?.revision, published.revision);
    await mutateProgramReport({ ...input, action: "unpublish", expectedRevision: published.revision });
    assert.deepEqual((await buildTeamReportAggregates(teamId, { assessmentCampaignId: followId }))!.dimensionAverages, followAgg.dimensionAverages);
    await prisma.campaign.update({ where: { id: followId }, data: { status: "CLOSED", closedAt: new Date() } });
    const followReport = await prisma.teamReport.create({ data: { teamId, orgId, campaignId: followId, createdById: ids[0], title: "Follow-up", summary: "Changes", recommendations: "Actions", actionItems: report.actionItems as Prisma.InputJsonValue, aggregates: followAgg as unknown as Prisma.InputJsonValue } });
    const followInput = { reportId: followReport.id, teamId, actorId: ids[0], fields: {} };
    await assert.rejects(mutateProgramReport({ ...followInput, action: "review", expectedRevision: 1, fields: { summary: null } }), /NARRATIVE_INCOMPLETE/);
    const followReviewed = await mutateProgramReport({ ...followInput, action: "review", expectedRevision: 1 });
    const race = await Promise.allSettled([
      mutateProgramReport({ ...followInput, action: "save", expectedRevision: followReviewed.revision, fields: { summary: "Concurrent edit" } }),
      mutateProgramReport({ ...followInput, action: "publish", expectedRevision: followReviewed.revision }),
    ]);
    assert.equal(race.filter(r => r.status === "fulfilled").length, 1);
    const raced = await prisma.teamReport.findUniqueOrThrow({ where: { id: followReport.id } });
    if (raced.status === "PUBLISHED") assert.equal(raced.summary, "Changes");
    else {
      assert.equal(raced.reviewedRevision, null);
      const approved = await mutateProgramReport({ ...followInput, action: "review", expectedRevision: raced.revision });
      const result = await mutateProgramReport({ ...followInput, action: "publish", expectedRevision: approved.revision });
      assert.equal(result.status, "PUBLISHED");
    }
    await prisma.campaign.update({ where: { id: followId }, data: { status: "ACTIVE" } }); // fixture-only: test idempotent retries before cleanup
    const duplicate = await Promise.all([pulse(followId, ids[0]), pulse(followId, ids[0])]);
    assert.ok(duplicate.every(x => !x.created));
    assert.equal(await prisma.psychSafetyResponse.count({ where: { campaignId: followId } }), 3);
  } finally {
    await prisma.teamReport.deleteMany({ where: { teamId } });
    await prisma.campaign.deleteMany({ where: { id: followId } });
    await prisma.campaign.deleteMany({ where: { id: scanId } });
    await prisma.observerAssessment.deleteMany({ where: { invitation: { inviterId: { in: ids } } } });
    await prisma.observerInvitation.deleteMany({ where: { inviterId: { in: ids } } });
    await prisma.assessmentResult.deleteMany({ where: { userProfileId: { in: ids } } });
    await prisma.team.deleteMany({ where: { id: teamId } });
    await prisma.organization.deleteMany({ where: { id: orgId } });
    await prisma.userProfile.deleteMany({ where: { id: { in: ids } } });
  }
});


test("Journey skips unsupported and malformed snapshots while retaining valid programs", async () => {
  assert.equal(process.env.TRITA_INTEGRATION_TEST_DB, "1");
  const { loadProgramJourney } = await import("@/lib/programs/journey.server");
  const userId = `journey_user_${randomUUID()}`;
  const orgId = `journey_org_${randomUUID()}`;
  const campaignIds = [0, 1, 2].map(() => `journey_campaign_${randomUUID()}`);
  const program = createProgramSnapshot("TEAM_SCAN");
  try {
    await prisma.userProfile.create({ data: { id: userId, username: "Journey fixture" } });
    await prisma.organization.create({ data: { id: orgId, name: "Journey fixture", ownerId: userId } });
    const snapshots = [program, { ...program, version: 999 }, { version: 1 }];
    for (const [index, snapshot] of snapshots.entries()) {
      await prisma.campaign.create({ data: {
        id: campaignIds[index], orgId, createdBy: userId, name: `Journey ${index}`,
        status: "ACTIVE", type: "SELF_ASSESSMENT", steps: ["SELF_ASSESSMENT"],
        programKey: "TEAM_SCAN", programVersion: snapshot.version, programSnapshot: snapshot,
        participants: { create: { userId } },
      } });
    }
    const journeys = await loadProgramJourney(userId, orgId);
    assert.deepEqual(journeys.map(journey => journey.campaignId), [campaignIds[0]]);
    assert.equal(journeys[0].activities.find(activity => activity.key === "SELF_ASSESSMENT")?.state, "AVAILABLE");
    await prisma.campaign.update({ where: { id: campaignIds[0] }, data: { programSnapshot: { version: 999 } } });
    assert.deepEqual(await loadProgramJourney(userId, orgId), []);
    assert.deepEqual(await loadProgramJourney(userId, null), []);
  } finally {
    await prisma.campaign.deleteMany({ where: { id: { in: campaignIds } } });
    await prisma.organization.deleteMany({ where: { id: orgId } });
    await prisma.userProfile.deleteMany({ where: { id: userId } });
  }
});
