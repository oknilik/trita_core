import "server-only";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getActiveOrgMembership } from "@/lib/org-context";
import { getPlanTier } from "@/lib/subscription";
import { useCredit as consumeCredit } from "@/lib/candidate-credits";
import { resolveOrgCapabilityDecision, resolveOrgPolicySnapshot } from "@/lib/policy-service";
import { isConsultantSurface } from "@/lib/measurement-auth";
import { isCandidateGatingEnabled } from "@/lib/operating-mode";
import {
  CandidateInviteScopeError,
  resolveInviteOrgScope,
} from "./org-scope";

export interface CreateCandidateApplyInviteInput {
  clerkId: string;
  email?: string;
  name: string;
  position?: string;
  /**
   * A hiring lap orgja — a meghívó KIMONDOTT hatóköre (2026-08-11, fix).
   * Ha meg van adva, a meghívó EZ alá az org alá kerül, a hívó szerepét
   * ebben az orgban ellenőrizzük, és a teamId-nek is ide kell tartoznia.
   * Nélküle (örökölt kliens) a korábbi lépcső él: team orgja → aktív org.
   */
  orgId?: string;
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
  | "ORG_SCOPE_MISMATCH"
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
  //
  // ORG-HATÓKÖR (2026-08-11, fix): a hívó KIMONDOTT orgId-ja a hatókör — a
  // korábbi aktív-org fallback team nélkül a LÉTREHOZÓ aktív orgja alá
  // iktatta a meghívót, akkor is, ha a tanácsadó egy másik org hiring lapján
  // állt. A döntési szabály a resolveInviteOrgScope-ban él (tisztán tesztelt);
  // itt csak a bemeneteit olvassuk fel. Minden tagság-lekérés leftAt: null
  // szűréssel fut — a kilépett tag nem hozhat létre meghívót.
  const [team, requestedOrgMembership, teamOrgMembership, activeMembership] =
    await Promise.all([
      input.teamId
        ? prisma.team.findUnique({
            where: { id: input.teamId },
            select: { orgId: true },
          })
        : Promise.resolve(null),
      input.orgId
        ? prisma.organizationMember.findFirst({
            where: { userId: profile.id, orgId: input.orgId, leftAt: null },
            select: { role: true, orgId: true },
          })
        : Promise.resolve(null),
      input.teamId && !input.orgId
        ? prisma.organizationMember.findFirst({
            where: {
              userId: profile.id,
              leftAt: null,
              org: { teams: { some: { id: input.teamId } } },
            },
            select: { role: true, orgId: true },
          })
        : Promise.resolve(null),
      !input.orgId && !input.teamId
        ? getActiveOrgMembership(profile.id)
        : Promise.resolve(null),
    ]);

  let orgId: string;
  let orgRole: string;
  try {
    const scope = resolveInviteOrgScope({
      requestedOrgId: input.orgId ?? null,
      teamOrgId: team?.orgId ?? null,
      teamRequested: Boolean(input.teamId),
      requestedOrgMembership,
      teamOrgMembership,
      activeMembership: activeMembership
        ? { orgId: activeMembership.orgId, role: activeMembership.role }
        : null,
    });
    orgId = scope.orgId;
    orgRole = scope.role;
  } catch (error) {
    if (error instanceof CandidateInviteScopeError) {
      throw new CandidateApplyServiceError(error.code, error.status);
    }
    throw error;
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

