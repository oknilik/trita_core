import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { HEXACO_ORDER } from "@/lib/hexaco";
import { resolveGlyphPair } from "@/lib/type-glyph";
import { isSecondaryUncertain } from "@/lib/personality-type";
import { candidateOrgEnabled } from "./service.server";

export const CANDIDATE_LEADER_ROLES = ["ORG_ADMIN", "ORG_MANAGER"];
const code = z.enum(["H", "E", "X", "A", "C", "O"]);
const artwork = z.object({
  primaryCode: code,
  secondaryCode: code,
  secondaryUncertain: z.boolean(),
});
const publicFields = z.object({
  name: z.string().nullable(),
  position: z.string().nullable(),
  summary: z.string(),
  measuredAt: z.string().optional(),
  revision: z.number().int(),
});
const snapshotV2 = publicFields.extend({
  v: z.literal(2),
  artwork: artwork.nullable(),
  recipientUserId: z.string().optional(),
});

/** Freeze only the illustration grammar, never score-derived intensity or values. */
export function candidateArtwork(dimensions: Record<string, number> | null) {
  if (
    !dimensions ||
    !HEXACO_ORDER.every(
      (c) =>
        Number.isFinite(dimensions[c]) &&
        dimensions[c] >= 0 &&
        dimensions[c] <= 100,
    )
  )
    return null;
  const values = HEXACO_ORDER.map((code) => ({
    code,
    score: dimensions[code],
  }));
  const pair = resolveGlyphPair(values);
  return pair
    ? {
        primaryCode: pair.primaryCode,
        secondaryCode: pair.secondaryCode,
        secondaryUncertain: isSecondaryUncertain(values),
      }
    : null;
}

/** Server-only projection also strips numerical data from legacy candidate links. */
export function readCandidateShareSnapshot(value: unknown, audience: string) {
  if (audience !== "candidate" && audience !== "manager") return null;
  const parsed = snapshotV2.safeParse(value);
  if (parsed.success) {
    if (audience === "manager" && !parsed.data.recipientUserId) return null;
    return parsed.data;
  }
  if (
    audience !== "candidate" ||
    !value ||
    typeof value !== "object" ||
    "v" in value
  )
    return null;
  const legacy = publicFields
    .extend({ dimensions: z.record(z.string(), z.number()) })
    .safeParse(value);
  if (!legacy.success) return null;
  const { dimensions, ...fields } = legacy.data;
  return {
    ...fields,
    v: 2 as const,
    artwork: candidateArtwork(dimensions),
    recipientUserId: undefined,
  };
}

export async function loadCandidateShare(
  token: string,
  clerkId: string | null,
) {
  const share = await prisma.candidateReportShare.findUnique({
    where: { token },
    include: {
      report: {
        include: { invite: { select: { orgId: true, status: true } } },
      },
    },
  });
  if (
    !share ||
    !share.report.invite.orgId ||
    share.revokedAt ||
    share.expiresAt <= new Date() ||
    share.report.invite.status === "CANCELED" ||
    !(await candidateOrgEnabled(share.report.invite.orgId))
  )
    return null;
  const data = readCandidateShareSnapshot(share.snapshot, share.audience);
  if (!data) return null;
  if (share.audience === "manager") {
    if (!clerkId || !data.recipientUserId) return null;
    const recipient = await prisma.organizationMember.findFirst({
      where: {
        orgId: share.report.invite.orgId,
        userId: data.recipientUserId,
        leftAt: null,
        role: { in: CANDIDATE_LEADER_ROLES },
        user: { clerkId, deleted: false },
      },
      select: { id: true },
    });
    if (!recipient) return null;
  }
  // Recipient identity remains on the server, not in the display model.
  const display = { ...publicFields.parse(data), artwork: data.artwork };
  return { audience: share.audience, data: display };
}
