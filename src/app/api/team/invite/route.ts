import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { resolveOrgCapabilityDecision, resolveTeamPolicySnapshot } from "@/lib/policy-service";
import { hasOrgRole } from "@/lib/org-roles";

const schema = z.object({ teamId: z.string().min(1) });

// Sentinel email used for open/reusable invite links (email is required by schema)
const OPEN_INVITE_SENTINEL = "__open__";

// POST /api/team/invite — generate a reusable invite link for a team
// Csak admin-paritás (teamInviteEmail): a nyílt link ugyanúgy szervezeten
// kívülit hoz be (org-tagságot keletkeztet), mint az e-mailes meghívó —
// a manager a szervezeti taglistából ad hozzá tagot.
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
    select: { role: true, leftAt: true },
  });
  if (!membership || membership.leftAt) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  const policySnapshot = await resolveTeamPolicySnapshot({
    orgId: team.orgId,
    orgRole: membership.role,
    teamId: team.id,
    profileId: profile.id,
  });
  const inviteDecision = resolveOrgCapabilityDecision(policySnapshot, "teamInviteEmail");
  if (!inviteDecision.allowed) {
    return NextResponse.json(
      {
        error: "CAPABILITY_DENIED",
        reason: inviteDecision.reason,
        upgradeHint: inviteDecision.upgradeHint?.code ?? null,
      },
      { status: 403 },
    );
  }

  // Kemény szerep-háló (defense-in-depth): a policy-enforcement kill-switch
  // kikapcsolása ne engedje a nyílt linket admin-paritás alatt.
  if (!hasOrgRole(membership.role, "ORG_ADMIN")) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  // Upsert: keep existing token if already generated for this team
  const invite = await prisma.teamPendingInvite.upsert({
    where: { teamId_email: { teamId: team.id, email: OPEN_INVITE_SENTINEL } },
    update: {},
    create: {
      teamId: team.id,
      email: OPEN_INVITE_SENTINEL,
      token: crypto.randomBytes(16).toString("hex"),
    },
    select: { token: true },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://trita.io";
  return NextResponse.json({ inviteUrl: `${baseUrl}/join/${invite.token}`, inviteId: invite.token });
}
