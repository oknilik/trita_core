import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendTeamInviteEmail } from "@/lib/emails";
import { getServerLocale } from "@/lib/i18n-server";
import { resolveOrgCapabilityDecision, resolveTeamPolicySnapshot } from "@/lib/policy-service";
import { hasOrgRole } from "@/lib/org-roles";

const inviteSchema = z.object({
  email: z.string().email(),
});

// POST /api/team/[id]/invite — add a member to the team by email
// - Csak admin-paritás (teamInviteEmail capability: ORG_ADMIN / ORG_CONSULTANT) —
//   az e-mailes meghívó org-tagságot is keletkeztet (előbb csendben org-tag,
//   aztán team-tag; racionalizálási döntés, 2026-07-22). A manager a
//   szervezeti taglistából ad hozzá tagot (POST /api/team/[id]/members).
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

  // Org team: centralized capability check for invite
  const membership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId: team.orgId, userId: profile.id } },
    select: { role: true },
  });
  if (!membership) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  const policySnapshot = await resolveTeamPolicySnapshot({
    orgId: team.orgId,
    orgRole: membership.role,
    teamId,
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
  // kikapcsolása ne engedje az e-mailes meghívót admin-paritás alatt.
  if (!hasOrgRole(membership.role, "ORG_ADMIN")) {
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

  const existingOrgMembership = await prisma.organizationMember.findFirst({
    where: { userId: targetUser.id, orgId: team.orgId, leftAt: null },
    select: { id: true },
  });

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
