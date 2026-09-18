import type { Prisma } from "@prisma/client";
import { parseProgram, completionMap } from "./core";
/** Caller owns the Campaign lock and has just stored the invitation and response. */
export async function reconcileProgramObserver(tx: Prisma.TransactionClient, campaignId: string, userId: string, snapshot: unknown) {
  const program = parseProgram(snapshot);
  if (!program) return;
  const responses = await tx.observerAssessment.count({ where: { invitation: { campaignId, inviterId: userId, status: "COMPLETED" } } });
  if (responses < program.policy.observerResponsesPerParticipant) return;
  const p = await tx.campaignParticipant.findUnique({ where: { campaignId_userId: { campaignId, userId } } });
  if (!p || completionMap(p.stepCompletions).OBSERVER_360) return;
  await tx.campaignParticipant.update({ where: { id: p.id }, data: { stepCompletions: { ...completionMap(p.stepCompletions), __program: 1, OBSERVER_360: new Date().toISOString() } as Prisma.InputJsonValue } });
}
