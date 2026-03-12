import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hasOrgRole } from "@/lib/auth";
import { sendTeamInviteEmail } from "@/lib/emails";
import { getServerLocale } from "@/lib/i18n-server";

const inviteSchema = z.object({
  email: z.string().email(),
});

// POST /api/team/[id]/invite — add a member to the team by email
// - Org team: requires ORG_MANAGER+ in the team's org
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id: teamId } = await params;

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, ownerId: true, orgId: true, name: true },
  });
  if (!team) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  if (!team.orgId) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  // Org team: verify ORG_MANAGER+ in the team's org
  const membership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId: team.orgId, userId: profile.id } },
    select: { role: true },
  });
  if (!membership || !hasOrgRole(membership.role, "ORG_MANAGER")) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = inviteSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const email = body.data.email.toLowerCase();

  const targetUser = await prisma.userProfile.findFirst({
    where: { email, deleted: false },
    select: { id: true },
  });

  if (!targetUser) {
    const existingPending = await prisma.teamPendingInvite.findUnique({
      where: { teamId_email: { teamId, email } },
    });
    if (existingPending) {
      return NextResponse.json({ error: "ALREADY_MEMBER" }, { status: 409 });
    }

    const invite = await prisma.teamPendingInvite.create({
      data: { teamId, email },
      select: { id: true },
    });

    const locale = await getServerLocale();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://trita.io";
    await sendTeamInviteEmail({
      to: email,
      teamName: team.name,
      signUpUrl: `${appUrl}/join/${invite.id}`,
      locale: (locale === "hu" || locale === "en") ? locale : "en",
    });

    return NextResponse.json({ pending: true }, { status: 201 });
  }

  const existing = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: targetUser.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "ALREADY_MEMBER" }, { status: 409 });
  }

  // Check org membership — 1-org constraint
  const existingOrgMembership = await prisma.organizationMember.findUnique({
    where: { userId: targetUser.id },
  });
  if (existingOrgMembership && existingOrgMembership.orgId !== team.orgId) {
    return NextResponse.json({ error: "ALREADY_IN_ORG" }, { status: 409 });
  }

  const [member] = await prisma.$transaction([
    prisma.teamMember.create({
      data: { teamId, userId: targetUser.id },
      select: { id: true, userId: true, joinedAt: true },
    }),
    ...(existingOrgMembership
      ? []
      : [prisma.organizationMember.create({
          data: { orgId: team.orgId, userId: targetUser.id, role: "ORG_MEMBER" },
        })]),
  ]);

  return NextResponse.json({ member }, { status: 201 });
}
