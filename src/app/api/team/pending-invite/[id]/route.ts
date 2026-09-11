import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveOrgCapabilityDecision, resolveTeamPolicySnapshot } from "@/lib/policy-service";

// DELETE /api/team/pending-invite/[id] — cancel a pending team invite
// Requires the resolved teamManage capability in this team.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const invite = await prisma.teamPendingInvite.findUnique({
    where: { id },
    select: { id: true, teamId: true, team: { select: { orgId: true } } },
  });
  if (!invite) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  if (!invite.team.orgId) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const membership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId: invite.team.orgId, userId: profile.id } },
    select: { role: true, leftAt: true },
  });
  if (!membership || membership.leftAt) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const snapshot = await resolveTeamPolicySnapshot({
    orgId: invite.team.orgId,
    orgRole: membership.role,
    teamId: invite.teamId,
    profileId: profile.id,
  });
  const decision = resolveOrgCapabilityDecision(snapshot, "teamManage");
  if (!decision.allowed) {
    return NextResponse.json({ error: "CAPABILITY_DENIED", reason: decision.reason }, { status: 403 });
  }

  await prisma.teamPendingInvite.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
