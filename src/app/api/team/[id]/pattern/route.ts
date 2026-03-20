import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { canAccessTeam } from "@/lib/team-auth";
import { calculateTeamPattern, type HexacoScores } from "@/lib/team-pattern";
import type { ScoreResult } from "@/lib/scoring";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "FORBIDDEN" }, { status: 401 });

  const { id: teamId } = await params;

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, orgId: true },
  });
  if (!team) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const orgMembership = team.orgId
    ? await prisma.organizationMember.findUnique({
        where: { orgId_userId: { orgId: team.orgId, userId: profile.id } },
        select: { role: true },
      })
    : null;
  if (!orgMembership) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const hasAccess = await canAccessTeam(profile.id, teamId, orgMembership.role);
  if (!hasAccess) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  // Fetch team members with their latest self-assessment
  const teamMembers = await prisma.teamMember.findMany({
    where: { teamId },
    select: {
      user: {
        select: {
          id: true,
          assessmentResults: {
            where: { isSelfAssessment: true },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { scores: true },
          },
        },
      },
    },
  });

  const totalMembers = teamMembers.length;

  // Build the members array for calculateTeamPattern — only those with HEXACO scores
  const membersWithScores: Array<{ userId: string; scores: HexacoScores }> = [];

  for (const tm of teamMembers) {
    const ar = tm.user.assessmentResults[0];
    if (!ar) continue;

    const dims = (ar.scores as ScoreResult).dimensions;
    if (
      dims.H === undefined || dims.E === undefined || dims.X === undefined ||
      dims.A === undefined || dims.C === undefined || dims.O === undefined
    ) {
      continue;
    }

    membersWithScores.push({
      userId: tm.user.id,
      scores: {
        H: dims.H,
        E: dims.E,
        X: dims.X,
        A: dims.A,
        C: dims.C,
        O: dims.O,
      },
    });
  }

  const coreResult = calculateTeamPattern(membersWithScores);

  if (!coreResult) {
    return NextResponse.json({
      patternResult: null,
      totalMembers,
      membersWithAssessment: membersWithScores.length,
      missingMembers: totalMembers - membersWithScores.length,
      insufficientData: true,
      minimumRequired: 3,
    });
  }

  // Merge API-level meta fields
  const result = {
    ...coreResult,
    memberCount:          totalMembers,
    membersWithAssessment: membersWithScores.length,
    missingMembers:       totalMembers - membersWithScores.length,
  };

  return NextResponse.json({ patternResult: result });
}
