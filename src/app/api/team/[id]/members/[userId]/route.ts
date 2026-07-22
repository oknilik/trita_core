import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { resolveOrgCapabilityDecision, resolveTeamPolicySnapshot } from "@/lib/policy-service";
import { hasOrgRole, isTeamManagerRole } from "@/lib/org-roles";

const patchSchema = z.object({
  role: z.enum(["member", "manager"]),
});

// Közös guard: a hívó teamManage capability-je az adott csapatra.
// (Admin/consultant mindig; ORG_MANAGER csak team-manager szereppel a
// csapatban; előfizetés-kapuzással — a capability-réteg az egyetlen
// igazságforrás, a korábbi canManageTeam + "manage" kettős check helyett.)
async function requireTeamManage(
  clerkUserId: string,
  teamId: string,
): Promise<
  | { ok: true; profileId: string; orgId: string }
  | { ok: false; response: NextResponse }
> {
  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: clerkUserId },
    select: { id: true },
  });
  if (!profile) {
    return { ok: false, response: NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }) };
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { orgId: true },
  });
  if (!team?.orgId) {
    return { ok: false, response: NextResponse.json({ error: "NOT_FOUND" }, { status: 404 }) };
  }

  const orgMembership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId: team.orgId, userId: profile.id } },
    select: { role: true },
  });
  if (!orgMembership) {
    return { ok: false, response: NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }) };
  }

  const snapshot = await resolveTeamPolicySnapshot({
    orgId: team.orgId,
    orgRole: orgMembership.role,
    teamId,
    profileId: profile.id,
  });
  const decision = resolveOrgCapabilityDecision(snapshot, "teamManage");
  if (!decision.allowed) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "CAPABILITY_DENIED",
          reason: decision.reason,
          upgradeHint: decision.upgradeHint?.code ?? null,
        },
        { status: 403 },
      ),
    };
  }

  // Kemény szerep-háló (defense-in-depth): a policy-enforcement kill-switch
  // kikapcsolása ne nyissa ki a tag-kezelést bármely org-tagnak. Két
  // menedzser-szint: admin-paritás, VAGY team-manager a csapatban
  // (org-szereptől függetlenül — ORG_MEMBER is lehet team-manager).
  const roleAllows =
    hasOrgRole(orgMembership.role, "ORG_ADMIN") ||
    isTeamManagerRole(snapshot.subject.teamRole ?? null);
  if (!roleAllows) {
    return { ok: false, response: NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }) };
  }

  return { ok: true, profileId: profile.id, orgId: team.orgId };
}

// PATCH /api/team/[id]/members/[userId] — update team member role
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id: teamId, userId: targetUserId } = await params;

  const guard = await requireTeamManage(clerkUserId, teamId);
  if (!guard.ok) return guard.response;

  if (targetUserId === guard.profileId) {
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

  const guard = await requireTeamManage(clerkUserId, teamId);
  if (!guard.ok) return guard.response;

  if (targetUserId === guard.profileId) {
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
