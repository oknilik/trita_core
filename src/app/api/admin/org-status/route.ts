import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasOrgRole } from "@/lib/auth";

// GET /api/admin/org-status
// Returns org, team, member, and assessment status for the admin dashboard.
// Only accessible by ORG_ADMIN or ORG_MANAGER.
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  // Must be org member with manager+ role
  const orgMembership = await prisma.organizationMember.findUnique({
    where: { userId: profile.id },
    select: { orgId: true, role: true },
  });
  if (!orgMembership || !hasOrgRole(orgMembership.role, "ORG_MANAGER")) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const orgId = orgMembership.orgId;

  // Parallel fetch
  const [org, teams, allOrgMembers] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, name: true, status: true, createdAt: true },
    }),
    prisma.team.findMany({
      where: { orgId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        members: {
          select: {
            userId: true,
            role: true,
            user: {
              select: {
                id: true,
                username: true,
                onboardedAt: true,
              },
            },
          },
        },
      },
    }),
    prisma.organizationMember.findMany({
      where: { orgId },
      select: {
        userId: true,
        role: true,
        joinedAt: true,
        user: {
          select: {
            id: true,
            username: true,
            onboardedAt: true,
          },
        },
      },
    }),
  ]);

  if (!org) return NextResponse.json({ error: "ORG_NOT_FOUND" }, { status: 404 });

  // Gather all member user IDs
  const memberUserIds = allOrgMembers.map((m) => m.userId);

  // Fetch assessment results for all members
  const assessmentResults = await prisma.assessmentResult.findMany({
    where: { userProfileId: { in: memberUserIds } },
    select: {
      userProfileId: true,
      scores: true,
      testType: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    distinct: ["userProfileId"],
  });

  const resultsByUserId = new Map(assessmentResults.map((r) => [r.userProfileId, r]));

  // Fetch pending invites for teams (open invite tokens)
  const teamIds = teams.map((t) => t.id);
  const openInvites = await prisma.teamPendingInvite.findMany({
    where: { teamId: { in: teamIds }, email: "__open__" },
    select: { id: true, teamId: true },
  });
  const inviteByTeamId = new Map(openInvites.map((inv) => [inv.teamId, inv.id]));

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://trita.io";

  // Build member list (per team)
  const teamsWithMembers = teams.map((team) => ({
    id: team.id,
    name: team.name,
    createdAt: team.createdAt.toISOString(),
    inviteUrl: inviteByTeamId.has(team.id)
      ? `${baseUrl}/join/${inviteByTeamId.get(team.id)}`
      : null,
    members: team.members.map((tm) => {
      const result = resultsByUserId.get(tm.userId);
      const orgMember = allOrgMembers.find((m) => m.userId === tm.userId);
      return {
        userId: tm.userId,
        username: tm.user.username ?? "–",
        role: tm.role,
        joinedAt: orgMember?.joinedAt?.toISOString() ?? null,
        assessmentDone: !!result,
        assessmentScore: result
          ? (() => {
              const scores = result.scores as Record<string, unknown>;
              if (scores.type === "likert" && scores.dimensions) {
                const dims = scores.dimensions as Record<string, number>;
                const vals = Object.values(dims);
                return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
              }
              return null;
            })()
          : null,
        assessmentAt: result?.createdAt.toISOString() ?? null,
      };
    }),
  }));

  const totalMembers = memberUserIds.length;
  const completedCount = assessmentResults.length;
  const adminHasAssessment = resultsByUserId.has(profile.id);
  const firstTeam = teams[0] ?? null;
  const firstTeamInviteUrl = firstTeam && inviteByTeamId.has(firstTeam.id)
    ? `${baseUrl}/join/${inviteByTeamId.get(firstTeam.id)}`
    : null;

  return NextResponse.json({
    org: {
      id: org.id,
      name: org.name,
      status: org.status,
      createdAt: org.createdAt.toISOString(),
    },
    teams: teamsWithMembers,
    stats: {
      totalMembers,
      completedCount,
      pendingCount: totalMembers - completedCount,
      teamMapUnlocked: completedCount >= 3,
      adminHasAssessment,
      firstTeamInviteUrl,
    },
  });
}
