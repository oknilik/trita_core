import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canManageTeam } from "@/lib/team-auth";

const patchSchema = z.object({
  role: z.enum(["member", "manager"]),
});

// PATCH /api/team/[id]/members/[userId] — update team member role
export async function PATCH(
  req: Request,
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
  if (!team?.orgId) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const orgMembership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId: team.orgId, userId: profile.id } },
    select: { role: true },
  });
  if (!orgMembership) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const canManage = await canManageTeam(profile.id, teamId, orgMembership.role);
  if (!canManage) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  if (targetUserId === profile.id) {
    return NextResponse.json({ error: "CANNOT_CHANGE_SELF" }, { status: 400 });
  }

  const body = patchSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const targetMember = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: targetUserId } },
    select: { role: true },
  });
  if (!targetMember) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const updated = await prisma.teamMember.update({
    where: { teamId_userId: { teamId, userId: targetUserId } },
    data: { role: body.data.role },
    select: { id: true, role: true, userId: true },
  });

  return NextResponse.json({ member: updated });
}

// DELETE /api/team/[id]/members/[userId] — remove a member from the team
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

  const orgMembership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId: team.orgId, userId: profile.id } },
    select: { role: true },
  });
  if (!orgMembership) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const canManage = await canManageTeam(profile.id, teamId, orgMembership.role);
  if (!canManage) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

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
