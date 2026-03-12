import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasOrgRole } from "@/lib/auth";

// DELETE /api/team/[id]/members/[userId] — remove a member from the team
// Requires ORG_MANAGER+ in the team's org; cannot remove yourself
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id: teamId, userId: targetUserId } = await params;

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: clerkUserId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { orgId: true },
  });
  if (!team || !team.orgId) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const membership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId: team.orgId, userId: profile.id } },
    select: { role: true },
  });
  if (!membership || !hasOrgRole(membership.role, "ORG_MANAGER")) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  if (targetUserId === profile.id) {
    return NextResponse.json({ error: "CANNOT_REMOVE_SELF" }, { status: 400 });
  }

  const teamMember = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: targetUserId } },
  });
  if (!teamMember) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  await prisma.teamMember.delete({
    where: { teamId_userId: { teamId, userId: targetUserId } },
  });

  return NextResponse.json({ ok: true });
}
