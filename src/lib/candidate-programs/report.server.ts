import "server-only";
import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { extractDimensionScores } from "@/lib/scoring";
import { CandidateProgramError, candidateOrgEnabled } from "./service.server";
import { readCandidateProgram } from "./core";
import type { Prisma } from "@prisma/client";
export const candidateReportMutation = z
  .object({
    action: z.enum(["save", "review", "share", "revoke"]),
    expectedRevision: z.number().int().min(1),
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
    // A withdrawn source cannot authorize a new share. No silently substituted baseline.
    if (
      p.baseline &&
      !(await tx.teamReport.findFirst({
        where: {
          id: p.baseline.reportId,
          orgId,
          teamId: p.baseline.teamId,
          status: "PUBLISHED",
          revision: p.baseline.revision,
        },
      }))
    )
      throw new CandidateProgramError("BASELINE_UNAVAILABLE");
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
