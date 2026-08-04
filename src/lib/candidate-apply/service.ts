import "server-only";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getActiveOrgMembership } from "@/lib/org-context";
import { getPlanTier } from "@/lib/subscription";
import { useCredit as consumeCredit } from "@/lib/candidate-credits";
import { resolveOrgCapabilityDecision, resolveOrgPolicySnapshot } from "@/lib/policy-service";
import { isConsultantSurface } from "@/lib/measurement-auth";
import { isCandidateGatingEnabled } from "@/lib/operating-mode";

export interface CreateCandidateApplyInviteInput {
  clerkId: string;
  email?: string;
  name: string;
  position?: string;
  teamId?: string;
  includeTeamRole?: boolean;
}

export interface CreateCandidateApplyInviteResult {
  invite: {
    id: string;
    token: string;
    email: string | null;
    name: string | null;
    position: string | null;
  };
  manager: {
    id: string;
    username: string | null;
    email: string | null;
  };
}

export type CandidateApplyServiceErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CAPABILITY_DENIED"
  | "NO_CANDIDATE_CREDITS";

export class CandidateApplyServiceError extends Error {
  readonly code: CandidateApplyServiceErrorCode;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: CandidateApplyServiceErrorCode,
    status: number,
    details?: Record<string, unknown>,
  ) {
    super(code);
    this.name = "CandidateApplyServiceError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export async function createCandidateApplyInvite(
  input: CreateCandidateApplyInviteInput,
): Promise<CreateCandidateApplyInviteResult> {
  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: input.clerkId },
    select: { id: true, username: true, email: true, isConsultant: true },
  });
  if (!profile) {
    throw new CandidateApplyServiceError("UNAUTHORIZED", 401);
  }

  // Jelölt-kezelés (2026-07-23): csak a tanácsadói kör — ORG_CONSULTANT
  // szerep, platform-tanácsadó vagy trita-admin (isConsultantSurface).
  let orgId: string | null = null;
  let orgRole: string | null = null;
  if (input.teamId) {
    const orgMembership = await prisma.organizationMember.findFirst({
      where: { userId: profile.id, org: { teams: { some: { id: input.teamId } } } },
      select: { role: true, orgId: true },
    });
    if (!orgMembership) {
      throw new CandidateApplyServiceError("FORBIDDEN", 403);
    }
    orgId = orgMembership.orgId;
    orgRole = orgMembership.role;
  } else {
    const orgMembership = await getActiveOrgMembership(profile.id);
    if (!orgMembership) {
      throw new CandidateApplyServiceError("FORBIDDEN", 403);
    }
    orgId = orgMembership.orgId;
    orgRole = orgMembership.role;
  }

  if (!orgId || !orgRole) {
    throw new CandidateApplyServiceError("FORBIDDEN", 403);
  }
  if (!isConsultantSurface(orgRole, profile.email, profile.isConsultant)) {
    throw new CandidateApplyServiceError("FORBIDDEN", 403);
  }

  // Kredit/előfizetés-kapu — kapcsolóval kivezetve (operating-mode,
  // CANDIDATE_GATING_ENABLED). Visszakapcsoláskor változatlanul élesedik.
  if (isCandidateGatingEnabled()) {
    const policySnapshot = await resolveOrgPolicySnapshot({
      orgId,
      orgRole,
      teamId: input.teamId,
      hasTeamMembership: Boolean(input.teamId),
    });
    const evaluateDecision = resolveOrgCapabilityDecision(
      policySnapshot,
      "candidateEvaluate",
    );
    if (!evaluateDecision.allowed) {
      throw new CandidateApplyServiceError("CAPABILITY_DENIED", 403, {
        reason: evaluateDecision.reason,
        upgradeHint: evaluateDecision.upgradeHint?.code ?? null,
      });
    }

    const sub = policySnapshot.subscription;
    const tier = getPlanTier(sub);
    const isUnlimited = tier === "org" || tier === "scale";
    if (!isUnlimited) {
      const candidateLabel = input.name ?? input.email ?? "unknown";
      const newBalance = await consumeCredit({
        orgId,
        actorId: profile.id,
        note: `Jelölt: ${candidateLabel}${input.position ? ` (${input.position})` : ""}`,
      });
      if (newBalance === null) {
        throw new CandidateApplyServiceError("NO_CANDIDATE_CREDITS", 402);
      }
    }
  }

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const invite = await prisma.candidateInvite.create({
    data: {
      // Kriptográfiailag véletlen bearer token — a séma cuid() defaultja
      // részben megjósolható, publikus apply-linkhez nem elég erős.
      token: crypto.randomBytes(16).toString("hex"),
      managerId: profile.id,
      orgId,
      teamId: input.teamId ?? null,
      email: input.email ?? null,
      name: input.name ?? null,
      position: input.position ?? null,
      includeTeamRole: input.includeTeamRole ?? false,
      expiresAt,
    },
    select: { id: true, token: true, email: true, name: true, position: true },
  });

  return {
    invite,
    manager: profile,
  };
}

