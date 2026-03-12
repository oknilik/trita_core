import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({ inviteId: z.string().min(1) });

// POST /api/team/join — add authenticated user to team + org via invite token
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const invite = await prisma.teamPendingInvite.findUnique({
    where: { id: body.data.inviteId },
    select: {
      id: true,
      teamId: true,
      email: true,
      team: { select: { orgId: true } },
    },
  });
  if (!invite || !invite.team.orgId) {
    return NextResponse.json({ error: "INVITE_NOT_FOUND" }, { status: 404 });
  }

  const { teamId } = invite;
  const orgId = invite.team.orgId;

  // 1-org enforcement
  const existingOrg = await prisma.organizationMember.findUnique({
    where: { userId: profile.id },
  });
  if (existingOrg) {
    return NextResponse.json({ error: "ALREADY_IN_ORG" }, { status: 409 });
  }

  // Email-specific invites (not the reusable open-link type) are consumed on join.
  const isEmailInvite = invite.email !== "__open__";

  await prisma.$transaction([
    prisma.organizationMember.create({
      data: { orgId, userId: profile.id, role: "ORG_MEMBER" },
    }),
    prisma.teamMember.upsert({
      where: { teamId_userId: { teamId, userId: profile.id } },
      create: { teamId, userId: profile.id, role: "member" },
      update: {},
    }),
    // Delete email-specific pending invites after accepting — open link invites
    // (email === "__open__") are reusable and must not be deleted.
    ...(isEmailInvite
      ? [prisma.teamPendingInvite.delete({ where: { id: invite.id } })]
      : []),
  ]);

  return NextResponse.json({ ok: true });
}
