import "server-only";
import { HEXACO_ORDER } from "@/lib/hexaco";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { calculateScores, extractDimensionScores } from "@/lib/scoring";
import {
  readCandidateProgram,
  validCandidateAnswers,
  type CandidateProgram,
} from "./core";
import { isConsultantSurface } from "@/lib/measurement-auth";
import { isValidTeamRoleSelectionSet } from "@/lib/team-role-questions";
export class CandidateProgramError extends Error {
  constructor(
    public code: string,
    public status = 409,
  ) {
    super(code);
  }
}
export async function candidateOrgEnabled(
  orgId: string | null,
  db: Prisma.TransactionClient = prisma,
) {
  return Boolean(
    orgId &&
      (await db.organization.findFirst({
        where: { id: orgId, candidateProgramsEnabled: true, status: "ACTIVE" },
        select: { id: true },
      })),
  );
}
export async function requireCandidateConsultant(
  clerkId: string | null,
  orgId: string,
) {
  if (!clerkId) throw new CandidateProgramError("UNAUTHORIZED", 401);
  if (!(await candidateOrgEnabled(orgId)))
    throw new CandidateProgramError("FEATURE_PARKED", 404);
  const user = await prisma.userProfile.findUnique({
    where: { clerkId },
    select: { id: true, email: true, isConsultant: true },
  });
  if (!user) throw new CandidateProgramError("UNAUTHORIZED", 401);
  const member = await prisma.organizationMember.findFirst({
    where: { userId: user.id, orgId, leftAt: null },
    select: { role: true },
  });
  if (
    !member ||
    !isConsultantSurface(member.role, user.email, user.isConsultant)
  )
    throw new CandidateProgramError("FORBIDDEN", 403);
  return user.id;
}
export async function loadCandidate(
  token: string,
  db: Prisma.TransactionClient = prisma,
) {
  const invite = await db.candidateInvite.findUnique({
    where: { token },
    include: { result: true },
  });
  if (!invite || !(await candidateOrgEnabled(invite.orgId, db)))
    throw new CandidateProgramError("INVALID_TOKEN", 404);
  const program = readCandidateProgram(invite.programSnapshot);
  // Pre-program tokens remain inactive. No implicit migration or reactivation.
  if (!program) throw new CandidateProgramError("PROGRAM_UNSUPPORTED", 404);
  if (!["PENDING", "COMPLETED", "CANCELED"].includes(invite.status))
    throw new CandidateProgramError("EXPIRED");
  if (invite.status === "CANCELED") throw new CandidateProgramError("REVOKED");
  if (invite.expiresAt <= new Date())
    throw new CandidateProgramError("EXPIRED");
  return { invite, program };
}
async function lockCandidate(token: string, tx: Prisma.TransactionClient) {
  await tx.$queryRaw`SELECT "id" FROM "CandidateInvite" WHERE "token" = ${token} FOR UPDATE`;
  return loadCandidate(token, tx);
}
export async function saveCandidateDraft(
  token: string,
  input: {
    expectedRevision: number;
    answers: Record<string, number>;
    acknowledge?: boolean;
  },
) {
  return prisma.$transaction(async (tx) => {
    const { invite, program } = await lockCandidate(token, tx);
    if (invite.status !== "PENDING")
      throw new CandidateProgramError("ALREADY_USED");
    if (invite.draftRevision !== input.expectedRevision)
      throw new CandidateProgramError("DRAFT_CHANGED");
    if (!validCandidateAnswers(program, input.answers))
      throw new CandidateProgramError("INVALID_INPUT", 400);
    if (!invite.acknowledgedAt && !input.acknowledge)
      throw new CandidateProgramError("ACKNOWLEDGEMENT_REQUIRED");
    const updated = await tx.candidateInvite.update({
      where: { id: invite.id },
      data: {
        draftAnswers: input.answers,
        draftRevision: { increment: 1 },
        acknowledgedAt: invite.acknowledgedAt ?? new Date(),
        draftStartedAt: invite.draftStartedAt ?? new Date(),
        draftAnsweredCount: Object.keys(input.answers).length,
      },
    });
    return { revision: updated.draftRevision };
  });
}
export async function submitCandidate(
  token: string,
  input: { expectedRevision: number; answers: Record<string, number> },
) {
  return prisma.$transaction(async (tx) => {
    const { invite, program } = await lockCandidate(token, tx);
    if (invite.result && invite.status === "COMPLETED")
      return {
        ok: true,
        teamRoleState: invite.teamRoleState,
        completedInviteId: null,
      }; // response-loss retry
    if (
      invite.status !== "PENDING" ||
      invite.draftRevision !== input.expectedRevision
    )
      throw new CandidateProgramError("DRAFT_CHANGED");
    if (!invite.acknowledgedAt)
      throw new CandidateProgramError("ACKNOWLEDGEMENT_REQUIRED");
    if (!validCandidateAnswers(program, input.answers, true))
      throw new CandidateProgramError("MISSING_ANSWER", 400);
    const answers = program.questionIds.map((questionId) => ({
      questionId,
      value: input.answers[String(questionId)],
    }));
    const scores = calculateScores("TRITAN", answers);
    await tx.candidateResult.create({
      data: {
        inviteId: invite.id,
        testType: "TRITAN",
        scores: {
          ...scores,
          answers,
          questionCount: answers.length,
        } as Prisma.InputJsonValue,
      },
    });
    await tx.candidateInvite.update({
      where: { id: invite.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        draftAnswers: Prisma.DbNull,
        draftAnsweredCount: answers.length,
        draftRevision: { increment: 1 },
      },
    });
    await tx.candidateReport.create({ data: { inviteId: invite.id } });
    return {
      ok: true,
      teamRoleState: invite.teamRoleState,
      completedInviteId: invite.id,
    };
  });
}
export async function completeCandidateRole(
  token: string,
  selections: Record<string, number> | null,
) {
  return prisma.$transaction(async (tx) => {
    const { invite, program } = await lockCandidate(token, tx);
    if (!program.includeTeamRole || !invite.result)
      throw new CandidateProgramError("STEP_LOCKED");
    if (invite.teamRoleState !== "PENDING") return { ok: true };
    if (selections && !isValidTeamRoleSelectionSet(selections))
      throw new CandidateProgramError("INVALID_SELECTIONS", 400);
    if (selections)
      await tx.candidateResult.update({
        where: { id: invite.result.id },
        data: { teamRoleSelections: selections },
      });
    await tx.candidateInvite.update({
      where: { id: invite.id },
      data: { teamRoleState: selections ? "COMPLETED" : "SKIPPED" },
    });
    return { ok: true };
  });
}
export async function candidateBaseline(
  orgId: string,
  teamId: string | undefined,
  reportId: string | undefined,
  db: Prisma.TransactionClient = prisma,
): Promise<CandidateProgram["baseline"]> {
  if (!reportId) return null;
  if (!teamId) throw new CandidateProgramError("BASELINE_INVALID", 400);
  const r = await db.teamReport.findFirst({
    where: {
      id: reportId,
      orgId,
      teamId,
      status: "PUBLISHED",
      campaign: {
        status: "CLOSED",
        OR: [
          { programKey: "TEAM_SCAN" },
          { programKey: null, presetId: "SCAN_STYLE_V1" },
        ],
      },
    },
  });
  const a = r?.aggregates as {
    dimensionAverages?: Record<string, number>;
    completedCount?: number;
  } | null;
  const dimensions = extractDimensionScores(a?.dimensionAverages ?? {});
  if (
    !r?.publishedAt ||
    !dimensions ||
    !HEXACO_ORDER.every(
      (d) =>
        Number.isFinite(dimensions[d]) &&
        dimensions[d] >= 0 &&
        dimensions[d] <= 100,
    ) ||
    !Number.isInteger(a?.completedCount) ||
    (a?.completedCount ?? 0) < 3
  )
    throw new CandidateProgramError("BASELINE_INVALID", 400);
  return {
    reportId: r.id,
    teamId,
    revision: r.revision,
    publishedAt: r.publishedAt.toISOString(),
    count: a!.completedCount!,
    dimensions,
  };
}
