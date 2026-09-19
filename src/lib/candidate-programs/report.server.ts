import "server-only";
import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { extractDimensionScores } from "@/lib/scoring";
import {
  CandidateProgramError,
  candidateOrgEnabled,
  candidateBaseline,
} from "./service.server";
import { readComparisons } from "./comparisons";
import { MAX_CANDIDATE_COMPARISONS } from "./limits";
import { readCandidateProgram } from "./core";
import type { Prisma } from "@prisma/client";
export const candidateReportMutation = z
  .object({
    action: z.enum([
      "save",
      "review",
      "share",
      "revoke",
      "addTeam",
      "removeTeam",
      "annotateTeam",
    ]),
    expectedRevision: z.number().int().min(1),
    reportId: z.string().min(1).optional(),
    teamId: z.string().min(1).optional(),
    connection: z.string().max(2000).optional(),
    difference: z.string().max(2000).optional(),
    prompt: z.string().max(2000).optional(),
    candidateSummary: z.string().max(12000).optional(),
    managerSummary: z.string().max(12000).optional(),
    internalNotes: z.string().max(20000).optional(),
    audience: z.enum(["candidate", "manager"]).optional(),
  })
  .strict();
export async function mutateCandidateReport(
  orgId: string,
  inviteId: string,
  actorId: string,
  input: z.infer<typeof candidateReportMutation>,
) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "CandidateInvite" WHERE "id" = ${inviteId} FOR UPDATE`;
    const invite = await tx.candidateInvite.findUnique({
      where: { id: inviteId },
      include: { report: true, result: true },
    });
    if (
      !invite ||
      invite.orgId !== orgId ||
      !(await candidateOrgEnabled(orgId, tx)) ||
      invite.status === "CANCELED"
    )
      throw new CandidateProgramError("NOT_FOUND", 404);
    const r = invite.report,
      p = readCandidateProgram(invite.programSnapshot);
    if (!r || !p || !invite.result)
      throw new CandidateProgramError("REPORT_NOT_READY");
    if (r.revision !== input.expectedRevision)
      throw new CandidateProgramError("REVISION_CONFLICT");
    const comparisons = readComparisons(r.comparisons, p);
    if (!comparisons) throw new CandidateProgramError("PROGRAM_UNSUPPORTED");
    if (["addTeam", "removeTeam", "annotateTeam"].includes(input.action)) {
      if (!input.teamId) throw new CandidateProgramError("INVALID_INPUT", 400);
      let next = comparisons;
      if (input.action === "addTeam") {
        if (
          !input.reportId ||
          comparisons.length >= MAX_CANDIDATE_COMPARISONS ||
          comparisons.some((c) => c.teamId === input.teamId)
        )
          throw new CandidateProgramError("INVALID_INPUT", 400);
        // Freeze exactly the authorized published source, never accept client aggregates.
        await tx.$queryRaw`SELECT "id" FROM "TeamReport" WHERE "id" = ${input.reportId} FOR SHARE`;
        const baseline = await candidateBaseline(
          orgId,
          input.teamId,
          input.reportId,
          tx,
        );
        const team = await tx.team.findFirst({
          where: { id: input.teamId, orgId },
          select: { name: true },
        });
        if (!baseline || !team)
          throw new CandidateProgramError("BASELINE_INVALID", 400);
        next = [
          ...comparisons,
          {
            ...baseline,
            teamName: team.name,
            connection: "",
            difference: "",
            prompt: "",
          },
        ];
      } else {
        if (!comparisons.some((c) => c.teamId === input.teamId))
          throw new CandidateProgramError("NOT_FOUND", 404);
        next =
          input.action === "removeTeam"
            ? comparisons.filter((c) => c.teamId !== input.teamId)
            : comparisons.map((c) =>
                c.teamId !== input.teamId
                  ? c
                  : {
                      ...c,
                      connection: input.connection ?? c.connection,
                      difference: input.difference ?? c.difference,
                      prompt: input.prompt ?? c.prompt,
                    },
              );
      }
      return tx.candidateReport.update({
        where: { id: r.id },
        data: {
          comparisons: next,
          revision: { increment: 1 },
          reviewedRevision: null,
          reviewedAt: null,
          reviewedById: null,
        },
      });
    }
    if (input.action === "save")
      return tx.candidateReport.update({
        where: { id: r.id },
        data: {
          candidateSummary: input.candidateSummary ?? r.candidateSummary,
          managerSummary: input.managerSummary ?? r.managerSummary,
          internalNotes: input.internalNotes ?? r.internalNotes,
          revision: { increment: 1 },
          reviewedRevision: null,
          reviewedAt: null,
          reviewedById: null,
        },
      });
    if (
      input.candidateSummary !== undefined ||
      input.managerSummary !== undefined ||
      input.internalNotes !== undefined
    )
      throw new CandidateProgramError("SAVE_REQUIRED");
    if (input.action === "revoke") {
      await tx.candidateReportShare.updateMany({
        where: { reportId: r.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return r;
    }
    if (input.action === "review") {
      if (
        invite.teamRoleState === "PENDING" ||
        !r.candidateSummary.trim() ||
        !r.managerSummary.trim()
      )
        throw new CandidateProgramError("REPORT_NOT_READY");
      return tx.candidateReport.update({
        where: { id: r.id },
        data: {
          reviewedRevision: r.revision,
          reviewedAt: new Date(),
          reviewedById: actorId,
        },
      });
    }
    if (!input.audience || r.reviewedRevision !== r.revision)
      throw new CandidateProgramError("REVIEW_REQUIRED");
    // A withdrawn or changed source blocks new shares; stored snapshots never drift.
    for (const source of [...comparisons].sort((a, b) =>
      a.reportId.localeCompare(b.reportId),
    )) {
      await tx.$queryRaw`SELECT "id" FROM "TeamReport" WHERE "id" = ${source.reportId} FOR SHARE`;
      if (
        !(await tx.teamReport.findFirst({
          where: {
            id: source.reportId,
            orgId,
            teamId: source.teamId,
            status: "PUBLISHED",
            revision: source.revision,
          },
        }))
      )
        throw new CandidateProgramError("BASELINE_UNAVAILABLE");
    }
    const token = crypto.randomBytes(32).toString("hex");
    const snapshot = {
      name: invite.name,
      position: invite.position,
      revision: r.revision,
      measuredAt: invite.completedAt?.toISOString(),
      dimensions: extractDimensionScores(invite.result.scores),
      summary:
        input.audience === "candidate" ? r.candidateSummary : r.managerSummary,
    };
    // Deliberate whitelist: no email, answers, internal notes, team identities or baseline.
    await tx.candidateReportShare.create({
      data: {
        reportId: r.id,
        token,
        audience: input.audience,
        revision: r.revision,
        expiresAt: new Date(Date.now() + 30 * 86400000),
        snapshot: snapshot as Prisma.InputJsonValue,
      },
    });
    return { ...r, sharePath: `/apply/report/${token}` };
  });
}
