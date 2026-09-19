import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { createCandidateProgram } from "@/lib/candidate-programs/core";
import {
  saveCandidateDraft,
  submitCandidate,
  loadCandidate,
  completeCandidateRole,
  requireCandidateConsultant,
} from "@/lib/candidate-programs/service.server";
import { createProgramSnapshot } from "@/lib/programs/core";
import { mutateCandidateReport } from "@/lib/candidate-programs/report.server";

test("candidate: gated program, cross-device revisions, optional skip, immutable audience shares", async () => {
  assert.equal(process.env.TRITA_INTEGRATION_TEST_DB, "1");
  const id = `candidate_${randomUUID()}`;
  const program = createCandidateProgram(true);
  try {
    await prisma.userProfile.create({ data: { id, clerkId: id } });
    await prisma.organization.create({
      data: {
        id,
        name: "Candidate integration",
        ownerId: id,
        candidateProgramsEnabled: true,
      },
    });
    await prisma.organizationMember.create({
      data: { orgId: id, userId: id, role: "ORG_CONSULTANT" },
    });
    await prisma.candidateInvite.create({
      data: {
        id,
        token: id,
        orgId: id,
        managerId: id,
        name: "Candidate",
        status: "PENDING",
        expiresAt: new Date(Date.now() + 86400000),
        programSnapshot: program,
        includeTeamRole: true,
        teamRoleState: "PENDING",
      },
    });
    assert.equal(await requireCandidateConsultant(id, id), id);
    await assert.rejects(
      requireCandidateConsultant("other", id),
      /UNAUTHORIZED/,
    );
    const first = { [program.questionIds[0]]: 4 };
    await assert.rejects(
      saveCandidateDraft(id, { expectedRevision: 0, answers: first }),
      /ACKNOWLEDGEMENT/,
    );
    const races = await Promise.allSettled([
      saveCandidateDraft(id, {
        expectedRevision: 0,
        answers: first,
        acknowledge: true,
      }),
      saveCandidateDraft(id, {
        expectedRevision: 0,
        answers: { [program.questionIds[0]]: 2 },
        acknowledge: true,
      }),
    ]);
    assert.equal(races.filter((r) => r.status === "fulfilled").length, 1);
    const loaded = await loadCandidate(id);
    assert.equal(loaded.invite.draftRevision, 1);
    await assert.rejects(
      submitCandidate(id, { expectedRevision: 1, answers: first }),
      /MISSING_ANSWER/,
    );
    const answers = Object.fromEntries(program.questionIds.map((q) => [q, 4]));
    await submitCandidate(id, { expectedRevision: 1, answers });
    await submitCandidate(id, { expectedRevision: 1, answers }); // response-loss retry
    assert.equal(
      await prisma.candidateResult.count({ where: { inviteId: id } }),
      1,
    );
    assert.equal((await loadCandidate(id)).invite.teamRoleState, "PENDING");
    await assert.rejects(
      saveCandidateDraft(id, { expectedRevision: 2, answers }),
      /ALREADY_USED/,
    );
    await assert.rejects(
      mutateCandidateReport(id, id, id, {
        action: "review",
        expectedRevision: 1,
      }),
      /NOT_READY/,
    );
    await completeCandidateRole(id, null);
    await completeCandidateRole(id, null);
    assert.equal((await loadCandidate(id)).invite.teamRoleState, "SKIPPED");
    const saved = await mutateCandidateReport(id, id, id, {
      action: "save",
      expectedRevision: 1,
      candidateSummary: "Candidate summary",
      managerSummary: "Client summary",
      internalNotes: "PRIVATE NOTES",
    });
    await assert.rejects(
      mutateCandidateReport(id, id, id, {
        action: "share",
        audience: "candidate",
        expectedRevision: saved.revision,
      }),
      /REVIEW_REQUIRED/,
    );
    await mutateCandidateReport(id, id, id, {
      action: "review",
      expectedRevision: saved.revision,
    });
    await mutateCandidateReport(id, id, id, {
      action: "share",
      audience: "candidate",
      expectedRevision: saved.revision,
    });
    await mutateCandidateReport(id, id, id, {
      action: "share",
      audience: "manager",
      expectedRevision: saved.revision,
    });
    const shares = await prisma.candidateReportShare.findMany({
      where: { report: { inviteId: id } },
    });
    assert.equal(shares.length, 2);
    const candidate = shares.find((s) => s.audience === "candidate")!;
    assert.equal(
      (candidate.snapshot as { summary: string }).summary,
      "Candidate summary",
    );
    assert.equal(JSON.stringify(candidate.snapshot).includes("PRIVATE"), false);
    assert.equal(
      JSON.stringify(candidate.snapshot).includes("Client summary"),
      false,
    );
    assert.equal("answers" in (candidate.snapshot as object), false);
    const changed = await mutateCandidateReport(id, id, id, {
      action: "save",
      expectedRevision: saved.revision,
      candidateSummary: "New summary",
    });
    await assert.rejects(
      mutateCandidateReport(id, id, id, {
        action: "share",
        audience: "candidate",
        expectedRevision: changed.revision,
      }),
      /REVIEW_REQUIRED/,
    );
    assert.deepEqual(
      (
        await prisma.candidateReportShare.findUniqueOrThrow({
          where: { id: candidate.id },
        })
      ).snapshot,
      candidate.snapshot,
    );
    await mutateCandidateReport(id, id, id, {
      action: "revoke",
      expectedRevision: changed.revision,
    });
    assert.equal(
      await prisma.candidateReportShare.count({
        where: { report: { inviteId: id }, revokedAt: null },
      }),
      0,
    );
    await prisma.organization.update({
      where: { id },
      data: { candidateProgramsEnabled: false },
    });
    await assert.rejects(loadCandidate(id), /INVALID_TOKEN/);
    await prisma.organization.update({
      where: { id },
      data: { candidateProgramsEnabled: true },
    });
    await prisma.candidateInvite.update({
      where: { id },
      data: { status: "CANCELED" },
    });
    await assert.rejects(
      submitCandidate(id, { expectedRevision: 2, answers }),
      /REVOKED/,
    );
  } finally {
    await prisma.candidateReport.deleteMany({ where: { inviteId: id } });
    await prisma.candidateResult.deleteMany({ where: { inviteId: id } });
    await prisma.candidateInvite.deleteMany({ where: { id } });
    await prisma.organization.deleteMany({ where: { id } });
    await prisma.userProfile.deleteMany({ where: { id } });
  }
});

test("candidate baseline is scoped, frozen and withdrawn sources block new shares", async () => {
  assert.equal(process.env.TRITA_INTEGRATION_TEST_DB, "1");
  const { candidateBaseline } = await import(
    "@/lib/candidate-programs/service.server"
  );
  const id = `candidate_baseline_${randomUUID()}`;
  const dimensions = { H: 50, E: 50, X: 50, A: 50, C: 50, O: 50 };
  try {
    await prisma.userProfile.create({ data: { id, clerkId: id } });
    await prisma.organization.create({
      data: {
        id,
        name: "Baseline test",
        ownerId: id,
        candidateProgramsEnabled: true,
      },
    });
    await prisma.team.create({
      data: { id, name: "Team", ownerId: id, orgId: id },
    });
    await prisma.campaign.create({
      data: {
        id,
        orgId: id,
        name: "Scan",
        createdBy: id,
        status: "CLOSED",
        programKey: "TEAM_SCAN",
        programVersion: 1,
        programSnapshot: createProgramSnapshot("TEAM_SCAN"),
      },
    });
    await prisma.teamReport.create({
      data: {
        id,
        teamId: id,
        orgId: id,
        campaignId: id,
        createdById: id,
        status: "PUBLISHED",
        publishedAt: new Date(),
        aggregates: {
          dimensionAverages: dimensions,
          completedCount: 4,
          internalNotes: "private",
          members: [{ name: "private" }],
        },
      },
    });
    await assert.rejects(
      candidateBaseline("other", id, id),
      /BASELINE_INVALID/,
    );
    const baseline = await candidateBaseline(id, id, id);
    assert.equal(baseline?.count, 4);
    assert.equal(JSON.stringify(baseline).includes("private"), false);
    const program = createCandidateProgram(false, "Interview focus", baseline);
    await prisma.candidateInvite.create({
      data: {
        id,
        token: id,
        orgId: id,
        managerId: id,
        expiresAt: new Date(Date.now() + 86400000),
        acknowledgedAt: new Date(),
        programSnapshot: program,
      },
    });
    await submitCandidate(id, {
      expectedRevision: 0,
      answers: Object.fromEntries(program.questionIds.map((q) => [q, 4])),
    });
    const report = await mutateCandidateReport(id, id, id, {
      action: "save",
      expectedRevision: 1,
      candidateSummary: "Candidate",
      managerSummary: "Client",
    });
    await mutateCandidateReport(id, id, id, {
      action: "review",
      expectedRevision: report.revision,
    });
    await prisma.teamReport.update({
      where: { id },
      data: {
        revision: 2,
        aggregates: {
          dimensionAverages: { ...dimensions, H: 80 },
          completedCount: 4,
        },
      },
    });
    assert.deepEqual((await loadCandidate(id)).program.baseline, baseline);
    await assert.rejects(
      mutateCandidateReport(id, id, id, {
        action: "share",
        expectedRevision: report.revision,
        audience: "candidate",
      }),
      /BASELINE_UNAVAILABLE/,
    );
  } finally {
    await prisma.candidateReport.deleteMany({ where: { inviteId: id } });
    await prisma.candidateResult.deleteMany({ where: { inviteId: id } });
    await prisma.candidateInvite.deleteMany({ where: { id } });
    await prisma.teamReport.deleteMany({ where: { id } });
    await prisma.campaign.deleteMany({ where: { id } });
    await prisma.team.deleteMany({ where: { id } });
    await prisma.organization.deleteMany({ where: { id } });
    await prisma.userProfile.deleteMany({ where: { id } });
  }
});

test("multiple team snapshots are scoped, revisioned, annotated and excluded from shares", async () => {
  assert.equal(process.env.TRITA_INTEGRATION_TEST_DB, "1");
  const id = `multi_${randomUUID()}`;
  const { readComparisons } = await import(
    "@/lib/candidate-programs/comparisons"
  );
  const program = createCandidateProgram();
  const dims = { H: 50, E: 55, X: 60, A: 45, C: 70, O: 65 };
  try {
    await prisma.userProfile.create({ data: { id, clerkId: id } });
    await prisma.organization.create({
      data: { id, name: "Multi", ownerId: id, candidateProgramsEnabled: true },
    });
    await prisma.campaign.create({
      data: {
        id,
        orgId: id,
        name: "Scan",
        createdBy: id,
        status: "CLOSED",
        programKey: "TEAM_SCAN",
        programVersion: 1,
        programSnapshot: createProgramSnapshot("TEAM_SCAN"),
      },
    });
    for (const suffix of ["a", "b"]) {
      await prisma.team.create({
        data: {
          id: id + suffix,
          orgId: id,
          ownerId: id,
          name: "Team " + suffix,
        },
      });
      await prisma.teamReport.create({
        data: {
          id: id + suffix,
          teamId: id + suffix,
          orgId: id,
          campaignId: id,
          createdById: id,
          status: "PUBLISHED",
          publishedAt: new Date(),
          aggregates: {
            completedCount: 4,
            dimensionAverages: dims,
            members: ["SECRET"],
          },
        },
      });
    }
    await prisma.candidateInvite.create({
      data: {
        id,
        token: id,
        orgId: id,
        managerId: id,
        expiresAt: new Date(Date.now() + 86400000),
        acknowledgedAt: new Date(),
        programSnapshot: program,
      },
    });
    await submitCandidate(id, {
      expectedRevision: 0,
      answers: Object.fromEntries(program.questionIds.map((q) => [q, 4])),
    });
    await assert.rejects(
      mutateCandidateReport("other", id, id, {
        action: "addTeam",
        expectedRevision: 1,
        teamId: id + "a",
        reportId: id + "a",
      }),
      /NOT_FOUND/,
    );
    await assert.rejects(
      mutateCandidateReport(id, id, id, {
        action: "addTeam",
        expectedRevision: 1,
        teamId: id + "b",
        reportId: id + "a",
      }),
      /BASELINE_INVALID/,
    );
    const race = await Promise.allSettled(
      ["a", "b"].map((s) =>
        mutateCandidateReport(id, id, id, {
          action: "addTeam",
          expectedRevision: 1,
          teamId: id + s,
          reportId: id + s,
        }),
      ),
    );
    assert.equal(race.filter((r) => r.status === "fulfilled").length, 1);
    let row = await prisma.candidateReport.findUniqueOrThrow({
      where: { inviteId: id },
    });
    const first = readComparisons(row.comparisons, program)!;
    const missing = first[0].teamId === id + "a" ? "b" : "a";
    row = await mutateCandidateReport(id, id, id, {
      action: "addTeam",
      expectedRevision: row.revision,
      teamId: id + missing,
      reportId: id + missing,
    });
    await assert.rejects(
      mutateCandidateReport(id, id, id, {
        action: "addTeam",
        expectedRevision: row.revision,
        teamId: id + missing,
        reportId: id + missing,
      }),
      /INVALID_INPUT/,
    );
    row = await mutateCandidateReport(id, id, id, {
      action: "save",
      expectedRevision: row.revision,
      candidateSummary: "Candidate",
      managerSummary: "Client",
    });
    await mutateCandidateReport(id, id, id, {
      action: "review",
      expectedRevision: row.revision,
    });
    row = await mutateCandidateReport(id, id, id, {
      action: "annotateTeam",
      expectedRevision: row.revision,
      teamId: id + "a",
      connection: "Consultant observation",
      difference: "Discuss",
      prompt: "Example?",
    });
    assert.equal(row.reviewedRevision, null);
    const comparisons = readComparisons(row.comparisons, program)!;
    assert.equal(comparisons.length, 2);
    assert.equal(
      comparisons.find((c) => c.teamId === id + "a")!.connection,
      "Consultant observation",
    );
    assert.equal(JSON.stringify(comparisons).includes("SECRET"), false);
    await mutateCandidateReport(id, id, id, {
      action: "review",
      expectedRevision: row.revision,
    });
    await mutateCandidateReport(id, id, id, {
      action: "share",
      expectedRevision: row.revision,
      audience: "manager",
    });
    const share = await prisma.candidateReportShare.findFirstOrThrow({
      where: { reportId: row.id },
    });
    assert.equal(
      JSON.stringify(share.snapshot).includes("Consultant observation"),
      false,
    );
    assert.equal("comparisons" in (share.snapshot as object), false);
    await prisma.teamReport.update({
      where: { id: id + "b" },
      data: { status: "DRAFT", revision: 2 },
    });
    await assert.rejects(
      mutateCandidateReport(id, id, id, {
        action: "share",
        expectedRevision: row.revision,
        audience: "candidate",
      }),
      /BASELINE_UNAVAILABLE/,
    );
    assert.deepEqual(
      readComparisons(
        (
          await prisma.candidateReport.findUniqueOrThrow({
            where: { id: row.id },
          })
        ).comparisons,
        program,
      ),
      comparisons,
    );
    row = await mutateCandidateReport(id, id, id, {
      action: "removeTeam",
      expectedRevision: row.revision,
      teamId: id + "b",
    });
    assert.equal(row.reviewedRevision, null);
    row = await mutateCandidateReport(id, id, id, {
      action: "removeTeam",
      expectedRevision: row.revision,
      teamId: id + "a",
    });
    assert.deepEqual(row.comparisons, []);
  } finally {
    await prisma.candidateReport.deleteMany({ where: { inviteId: id } });
    await prisma.candidateResult.deleteMany({ where: { inviteId: id } });
    await prisma.candidateInvite.deleteMany({ where: { id } });
    await prisma.teamReport.deleteMany({ where: { orgId: id } });
    await prisma.team.deleteMany({ where: { orgId: id } });
    await prisma.campaign.deleteMany({ where: { id } });
    await prisma.organization.deleteMany({ where: { id } });
    await prisma.userProfile.deleteMany({ where: { id } });
  }
});
