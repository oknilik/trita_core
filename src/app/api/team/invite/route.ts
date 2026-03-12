import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hasOrgRole } from "@/lib/auth";

const schema = z.object({ teamId: z.string().min(1) });

// Sentinel email used for open/reusable invite links (email is required by schema)
const OPEN_INVITE_SENTINEL = "__open__";

// POST /api/team/invite — generate a reusable invite link for a team
// Only ORG_ADMIN or ORG_MANAGER of the team's org may call this
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

  const team = await prisma.team.findUnique({
    where: { id: body.data.teamId },
    select: { id: true, orgId: true },
  });
  if (!team || !team.orgId) {
    return NextResponse.json({ error: "TEAM_NOT_FOUND" }, { status: 404 });
  }

  const membership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId: team.orgId, userId: profile.id } },
    select: { role: true },
  });
  if (!membership || !hasOrgRole(membership.role, "ORG_MANAGER")) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  // Upsert: keep existing token if already generated for this team
  const invite = await prisma.teamPendingInvite.upsert({
    where: { teamId_email: { teamId: team.id, email: OPEN_INVITE_SENTINEL } },
    update: {},
    create: { teamId: team.id, email: OPEN_INVITE_SENTINEL },
    select: { id: true },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://trita.io";
  return NextResponse.json({ inviteUrl: `${baseUrl}/join/${invite.id}`, inviteId: invite.id });
}
