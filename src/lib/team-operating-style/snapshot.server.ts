import { prisma } from "@/lib/prisma";
import type { TeamPatternResult } from "@/lib/team-pattern";
import { OPERATING_STYLE_VERSION } from "./questions";
import { AnswerSchema, calculateOperatingStyle } from "./scoring";
import { compareTeamPatterns, snapshotComposition, type TeamStyleSnapshot } from "./comparison";

/** Called only by the authorized report builder. Explicit campaign, never latest-round fallback. */
export async function loadTeamStyleSnapshot(teamId: string, campaignId: string | undefined,
  pattern: TeamPatternResult | null, compositionRespondentIds: string[]): Promise<TeamStyleSnapshot> {
  const composition = snapshotComposition(pattern);
  const round = campaignId ? await prisma.teamOperatingRound.findFirst({
    where: { campaignId, teamId }, include: { responses: { where: { submittedAt: { not: null } } } },
  }) : null;
  if (!round) return { version: 1, operating: null, composition, comparison: null, sameRespondents: null };
  if (round.instrumentVersion !== OPERATING_STYLE_VERSION) throw new Error("UNSUPPORTED_OPERATING_VERSION");
  const operating = { ...calculateOperatingStyle({ teamId, roundId: round.id,
    instrumentVersion: OPERATING_STYLE_VERSION, eligibleRespondentIds: round.eligibleUserIds,
    responses: round.responses.map((r) => ({ respondentId: r.userId, answers: AnswerSchema.parse(r.answers) })),
  }), referenceStart: round.referenceStart.toISOString(), referenceEnd: round.referenceEnd.toISOString() };
  return { version: 1, operating, composition,
    sameRespondents: JSON.stringify(round.responses.map((r) => r.userId).sort()) === JSON.stringify([...compositionRespondentIds].sort()),
    comparison: compareTeamPatterns(operating, composition),
  };
}
