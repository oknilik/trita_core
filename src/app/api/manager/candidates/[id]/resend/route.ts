import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasOrgRole } from "@/lib/auth";
import { canManageTeam } from "@/lib/team-auth";
import { sendCandidateInviteEmail } from "@/lib/emails";
import { resolveOrgCapabilityDecision, resolveOrgPolicySnapshot } from "@/lib/policy-service";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://trita.app";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, username: true, email: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;

  const invite = await prisma.candidateInvite.findUnique({
    where: { id },
    select: {
      id: true,
      managerId: true,
      teamId: true,
      status: true,
      expiresAt: true,
      email: true,
      token: true,
      position: true,
      team: { select: { orgId: true } },
    },
  });

  if (!invite) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  let orgMembershipRole: string | null = null;
  if (invite.team?.orgId) {
    const orgMembership = await prisma.organizationMember.findFirst({
      where: { userId: profile.id, orgId: invite.team.orgId },
      select: { role: true },
    });
    orgMembershipRole = orgMembership?.role ?? null;
    const evaluateSnapshot = await resolveOrgPolicySnapshot({
      orgId: invite.team.orgId,
      orgRole: orgMembershipRole,
      teamId: invite.teamId,
      hasTeamMembership: Boolean(invite.teamId),
      hasOrgMembership: Boolean(orgMembershipRole),
    });
    const evaluateDecision = resolveOrgCapabilityDecision(
      evaluateSnapshot,
      "candidateEvaluate",
    );
    if (!evaluateDecision.allowed) {
      return NextResponse.json(
        {
          error: "CAPABILITY_DENIED",
          reason: evaluateDecision.reason,
          upgradeHint: evaluateDecision.upgradeHint?.code ?? null,
        },
        { status: 403 },
      );
    }
  }

  let canResend = invite.managerId === profile.id;
  if (!canResend && invite.teamId && orgMembershipRole) {
    canResend = hasOrgRole(orgMembershipRole, "ORG_ADMIN")
      || await canManageTeam(profile.id, invite.teamId, orgMembershipRole);
  }
  if (!canResend) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  if (invite.status !== "PENDING") return NextResponse.json({ error: "ALREADY_USED" }, { status: 409 });
  if (!invite.email) return NextResponse.json({ error: "NO_EMAIL" }, { status: 400 });
  if (invite.expiresAt < new Date()) return NextResponse.json({ error: "EXPIRED" }, { status: 409 });

  const managerName = profile.username ?? profile.email ?? "Manager";
  const emailSent = await sendCandidateInviteEmail({
    to: invite.email,
    managerName,
    token: invite.token,
    position: invite.position ?? undefined,
    applyUrl: `${APP_URL}/apply/${invite.token}`,
  });

  return NextResponse.json({ ok: true, emailSent });
}
