import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { resolveOrgCapabilityDecision, resolveTeamPolicySnapshot } from "@/lib/policy-service";
import { hasOrgRole, isTeamManagerRole } from "@/lib/org-roles";
import { getRequestLogger } from "@/lib/logger.server";

const schema = z.object({ userId: z.string().min(1) });

// POST /api/team/[id]/members — meglévő SZERVEZETI tag hozzáadása a csapathoz.
//
// A racionalizálási döntés (2026-07-22) szerinti manager-út: az ORG_MANAGER
// (aki a csapat team-managere) a szervezet taglistájából ad hozzá tagot —
// e-mailes meghívót (ami org-tagságot keletkeztetne) csak admin-paritás
// küldhet (POST /api/team/[id]/invite, teamInviteEmail capability).
//
// Guard: teamManage capability (admin/consultant mindig; manager a saját
// csapatában). A cél-user KÖTELEZŐEN aktív org-tag — ez a szerver-oldali
// kikényszerítése a „csak szervezeti listából" szabálynak.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const log = await getRequestLogger("team");
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id: teamId } = await params;

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: clerkUserId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { orgId: true, name: true },
  });
  if (!team?.orgId) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const orgMembership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId: team.orgId, userId: profile.id } },
    select: { role: true },
  });
  if (!orgMembership) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const snapshot = await resolveTeamPolicySnapshot({
    orgId: team.orgId,
    orgRole: orgMembership.role,
    teamId,
    profileId: profile.id,
  });
  const decision = resolveOrgCapabilityDecision(snapshot, "teamManage");
  if (!decision.allowed) {
    return NextResponse.json(
      {
        error: "CAPABILITY_DENIED",
        reason: decision.reason,
        upgradeHint: decision.upgradeHint?.code ?? null,
      },
      { status: 403 },
    );
  }

  // Kemény szerep-háló (defense-in-depth): a policy-enforcement kill-switch
  // kikapcsolása ne nyissa ki a tag-hozzáadást bármely org-tagnak. Két
  // menedzser-szint: admin-paritás, VAGY team-manager a csapatban
  // (org-szereptől függetlenül — ORG_MEMBER is lehet team-manager).
  const roleAllows =
    hasOrgRole(orgMembership.role, "ORG_ADMIN") ||
    isTeamManagerRole(snapshot.subject.teamRole ?? null);
  if (!roleAllows) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  const targetUserId = body.data.userId;

  // A cél-user aktív org-tag kell legyen (tanácsadó nem adható csapatba).
  const targetOrgMembership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId: team.orgId, userId: targetUserId } },
    select: { role: true, leftAt: true },
  });
  if (
    !targetOrgMembership ||
    targetOrgMembership.leftAt !== null ||
    targetOrgMembership.role === "ORG_CONSULTANT"
  ) {
    return NextResponse.json({ error: "TARGET_NOT_ORG_MEMBER" }, { status: 403 });
  }

  const existing = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: targetUserId } },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: "ALREADY_MEMBER" }, { status: 409 });
  }

  const member = await prisma.teamMember.create({
    data: { teamId, userId: targetUserId, role: "member" },
    select: { id: true, userId: true, role: true, joinedAt: true },
  });

  // A felvett user értesítése (fire-and-forget) — eddig "egyszer csak benne
  // volt" a csapatban, jelzés nélkül.
  import("@/lib/notifications").then(({ handleTeamMemberAdded }) =>
    handleTeamMemberAdded({ teamId, teamName: team.name, userId: targetUserId }).catch(
      (err: unknown) => log.error({ event: "notification.team_member_added_failed", err }, "Team member added notification failed"),
    ),
  );

  return NextResponse.json({ member }, { status: 201 });
}
