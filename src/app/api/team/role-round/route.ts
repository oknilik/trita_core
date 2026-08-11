import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { canManageTeam } from "@/lib/team-auth";
import { canManageMeasurements } from "@/lib/measurement-auth";

/**
 * POST /api/team/role-round
 * Body: { teamId: string, active: boolean }
 *
 * Manager toggles the Team role round for a team.
 * When activated, team members see the TeamRole assessment as a next action.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, email: true, isConsultant: true },
  });
  if (!profile) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  let teamId: string;
  let active: boolean;
  try {
    const body = await req.json();
    teamId = body.teamId;
    active = Boolean(body.active);
    if (!teamId || typeof teamId !== "string") {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { orgId: true },
  });
  if (!team?.orgId) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const membership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId: team.orgId, userId: profile.id } },
    select: { role: true },
  });
  if (!membership) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const canManage = await canManageTeam(profile.id, teamId, membership.role);
  if (!canManage) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  // Mérést (szerep-kört) csak tanácsadó indít/zár.
  if (!canManageMeasurements(membership.role, profile.email, profile.isConsultant)) {
    return NextResponse.json({ error: "CONSULTANT_ONLY" }, { status: 403 });
  }

  await prisma.team.update({
    where: { id: teamId },
    data: {
      teamRoleRoundActive: active,
      teamRoleRoundStartedAt: active ? new Date() : null,
    },
  });

  return NextResponse.json({ ok: true, active });
}

/**
 * GET /api/team/role-round?teamId=xxx
 *
 * Returns Team role round status and per-member completion.
 */
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const teamId = req.nextUrl.searchParams.get("teamId");
  if (!teamId) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: {
      orgId: true,
      teamRoleRoundActive: true,
      teamRoleRoundStartedAt: true,
      members: {
        select: {
          userId: true,
          user: {
            select: {
              username: true,
              teamRoleScores: {
                orderBy: { createdAt: "desc" },
                take: 1,
                select: { source: true, updatedAt: true },
              },
            },
          },
        },
      },
    },
  });
  if (!team?.orgId) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  // Tagság + kezelés-jogosultság (mint a POST-nál). Korábban a GET CSAK
  // bejelentkezést kért, így bármely belépett user bármely csapat teljes
  // rosszterét + kitöltési státuszát lekérhette (cross-org info-szivárgás,
  // motor-audit).
  const membership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId: team.orgId, userId: profile.id } },
    select: { role: true },
  });
  if (!membership) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  if (!(await canManageTeam(profile.id, teamId, membership.role))) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const memberStatus = team.members.map((m) => ({
    userId: m.userId,
    name: m.user.username ?? "?",
    hasQuestionnaire: m.user.teamRoleScores[0]?.source === "questionnaire",
    hasEstimate: m.user.teamRoleScores[0]?.source === "estimate",
    completedAt: m.user.teamRoleScores[0]?.updatedAt?.toISOString() ?? null,
  }));

  return NextResponse.json({
    active: team.teamRoleRoundActive,
    startedAt: team.teamRoleRoundStartedAt?.toISOString() ?? null,
    totalMembers: memberStatus.length,
    completedCount: memberStatus.filter((m) => m.hasQuestionnaire).length,
    estimateCount: memberStatus.filter((m) => m.hasEstimate && !m.hasQuestionnaire).length,
    members: memberStatus,
  });
}
