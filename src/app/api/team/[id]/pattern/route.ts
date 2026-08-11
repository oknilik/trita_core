import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { canViewRawTeamResults } from "@/lib/team-auth";
import { isPlatformAdminEmail } from "@/lib/measurement-auth";
import { calculateTeamPattern, type TritanScores } from "@/lib/team-pattern";
import { extractDimensionScores } from "@/lib/scoring";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "FORBIDDEN" }, { status: 401 });

  const { id: teamId } = await params;

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, email: true, isConsultant: true },
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

  // A kapu a lap (team/[id]/page.tsx canViewRaw) tanácsadói feltételével
  // AZONOS: ORG_CONSULTANT szerep VAGY tanácsadói fiók VAGY platform-admin.
  // Korábban canAccessTeam (bármely tag / org admin) volt — miközben a lap
  // ugyanezt az aggregátumot tanácsadói körre szűkíti, curl-lel bárki
  // elérte a patternCode/tengely/confidence adatot.
  const canViewRaw =
    canViewRawTeamResults(orgMembership?.role) ||
    profile.isConsultant ||
    isPlatformAdminEmail(profile.email);
  if (!canViewRaw) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

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

  // Build the members array for calculateTeamPattern — only those with TRITAN scores
  const membersWithScores: Array<{ userId: string; scores: TritanScores }> = [];

  for (const tm of teamMembers) {
    const ar = tm.user.assessmentResults[0];
    if (!ar) continue;

    // A tárolt score-JSON KANONIKUS olvasója (extractDimensionScores) —
    // ugyanaz az olvasási szabály, mint a team-stats.ts-ben: a beágyazott és
    // a lapos alakot is kezeli, és az örökség-kulcsokat (INTE/RESO/…)
    // HEXACO-betűre fordítja. Nyers `scores.dimensions` mellett minden
    // 2026-08-11 előtti kitöltő kiesett a mintázat-számításból.
    // Hiányos score-JSON NEM dönti el az egész endpointot: a tagot
    // kihagyjuk, ahogy a team-stats.ts loader is.
    const dims = extractDimensionScores(ar.scores);
    if (
      !dims ||
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

  // FONTOS (motor-audit): a per-tag, NEVESÍTETT eltérés-lista (styleDistances:
  // [{userId, tensionAxes}]) NEM kerülhet ki ezen a route-on. A kapu csak
  // canAccessTeam (bármely tag), a lap viszont átirányítja a nem-konzultánst,
  // és a publikált report is csak anonim darabszámot mutat — így ez a route
  // különben bárkinek kiadná, ki tér el melyik tengelyen. Az egyetlen kliens-
  // fogyasztó (AdvisoryPageClient) csak a patternCode/patternName/diversitySuffix-et
  // használja, ezért a nyers per-tag mezőt kiszűrjük.
  const safeCore = { ...coreResult };
  delete (safeCore as Record<string, unknown>).styleDistances;

  const result = {
    ...safeCore,
    memberCount:          totalMembers,
    membersWithAssessment: membersWithScores.length,
    missingMembers:       totalMembers - membersWithScores.length,
  };

  return NextResponse.json({ patternResult: result });
}
