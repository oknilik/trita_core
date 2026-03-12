import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hasOrgRole, getUserOrgMembership } from "@/lib/auth";

const patchSchema = z.object({
  teamId: z.string().nullable(),
});

// PATCH /api/manager/candidates/[id] — update candidate team assignment
// Allowed: the user who created the invite (managerId), whether legacy MANAGER or ORG_MANAGER+
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const isLegacyManager = profile.role === "MANAGER";
  const orgMembership = isLegacyManager ? null : await getUserOrgMembership(profile.id);
  const isOrgManager = !!orgMembership && hasOrgRole(orgMembership.role, "ORG_MANAGER");

  if (!isLegacyManager && !isOrgManager) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const invite = await prisma.candidateInvite.findUnique({
    where: { id },
    select: { id: true, managerId: true },
  });
  if (!invite || invite.managerId !== profile.id) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const body = patchSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const { teamId } = body.data;

  if (teamId) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { ownerId: true, orgId: true },
    });
    if (!team) return NextResponse.json({ error: "TEAM_NOT_FOUND" }, { status: 404 });

    if (team.orgId) {
      const membership = orgMembership?.orgId === team.orgId
        ? orgMembership
        : await prisma.organizationMember.findUnique({
            where: { orgId_userId: { orgId: team.orgId, userId: profile.id } },
            select: { orgId: true, role: true },
          });
      if (!membership || !hasOrgRole(membership.role, "ORG_MANAGER")) {
        return NextResponse.json({ error: "TEAM_NOT_FOUND" }, { status: 404 });
      }
    } else {
      if (team.ownerId !== profile.id) {
        return NextResponse.json({ error: "TEAM_NOT_FOUND" }, { status: 404 });
      }
    }
  }

  await prisma.candidateInvite.update({
    where: { id },
    data: { teamId },
  });

  return NextResponse.json({ ok: true });
}
