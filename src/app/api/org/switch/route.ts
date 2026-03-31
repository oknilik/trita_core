import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { setActiveOrgContext } from "@/lib/org-context";

const schema = z.object({
  inviteId: z.string().min(1),
});

// POST /api/org/switch — non-destructive org context switch via team invite
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
  const isEmailInvite = invite.email !== "__open__";

  await prisma.$transaction([
    prisma.organizationMember.upsert({
      where: { orgId_userId: { orgId, userId: profile.id } },
      create: { orgId, userId: profile.id, role: "ORG_MEMBER" },
      update: { leftAt: null },
    }),
    prisma.teamMember.upsert({
      where: { teamId_userId: { teamId, userId: profile.id } },
      create: { teamId, userId: profile.id, role: "member" },
      update: {},
    }),
    ...(isEmailInvite
      ? [prisma.teamPendingInvite.delete({ where: { id: invite.id } })]
      : []),
  ]);
  await setActiveOrgContext(profile.id, orgId);

  return NextResponse.json({ ok: true, nextPath: "/dashboard" });
}
