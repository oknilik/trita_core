import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveTeamPolicySnapshot } from "@/lib/policy-service";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const [{ userId }, { id: teamId }] = await Promise.all([
    auth(),
    params,
  ]);
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { orgId: true },
  });
  if (!profile || !team?.orgId) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  const membership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId: team.orgId, userId: profile.id } },
    select: { role: true, leftAt: true },
  });
  if (!membership || membership.leftAt) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  const snapshot = await resolveTeamPolicySnapshot({
    orgId: team.orgId, orgRole: membership.role, teamId, profileId: profile.id,
  });
  if (!snapshot.policy.capabilities.has("teamManage")) {
    return NextResponse.json({ error: "CAPABILITY_DENIED" }, { status: 403 });
  }

  // Old clients send an unversioned full array, which cannot be safely merged.
  // Published report snapshots and their legacy event history stay untouched.
  return NextResponse.json({
    error: "ACTION_TRACKING_MOVED",
    destination: `/team/${teamId}?tab=commitments`,
  }, { status: 410 });
}
