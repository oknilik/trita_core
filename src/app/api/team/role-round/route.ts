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
    select: { role: true, leftAt: true },
  });
  if (!membership || membership.leftAt) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

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

// A korábbi GET /api/team/role-round?teamId=xxx handler 2026-08-11-én
// TÖRÖLVE (halott route-eltakarítás, motor-audit-v4): egyetlen hívója sem
// volt (a TeamRoleRoundCard csak a POST-ot használja, a tab-nézet szerver-
// oldalon számol), és az estimateCount-ja a DB-beli source === "estimate"
// sorokra épült, amit egyetlen írási út sem perzisztál (a submit mindig
// "questionnaire"-t ír) — így a szám definíció szerint mindig 0 volt. A
// kanonikus státusz-számítás a resolveDisplayRoleScores /
// hasCompleteTritanDims megjelenítési szabálya (TeamRoleTabView).
