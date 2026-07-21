import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/observer/colleagues
 *
 * A bejelentkezett user AKTÍV szervezetének tagjai observer-meghívóhoz:
 * kollégalista a csapattársakkal elöl. Kihagyjuk: saját magát, a
 * tanácsadókat (ORG_CONSULTANT — nem értékelő kolléga), és jelezzük,
 * kire van már aktív meghívó.
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, activeOrgId: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (!profile.activeOrgId) return NextResponse.json({ colleagues: [] });

  const membership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId: profile.activeOrgId, userId: profile.id } },
    select: { role: true, leftAt: true },
  });
  if (!membership || membership.leftAt) {
    return NextResponse.json({ colleagues: [] });
  }

  const [members, myTeams, activeInvites] = await Promise.all([
    prisma.organizationMember.findMany({
      where: {
        orgId: profile.activeOrgId,
        leftAt: null,
        role: { not: "ORG_CONSULTANT" },
        userId: { not: profile.id },
      },
      select: {
        userId: true,
        user: { select: { id: true, username: true, email: true } },
      },
    }),
    prisma.teamMember.findMany({
      where: { userId: profile.id, team: { orgId: profile.activeOrgId } },
      select: { teamId: true },
    }),
    prisma.observerInvitation.findMany({
      where: {
        inviterId: profile.id,
        status: { in: ["AWAITING_APPROVAL", "PENDING", "COMPLETED"] },
        observerProfileId: { not: null },
      },
      select: { observerProfileId: true },
    }),
  ]);

  const myTeamIds = myTeams.map((t) => t.teamId);
  const teammateIds = new Set(
    myTeamIds.length > 0
      ? (
          await prisma.teamMember.findMany({
            where: { teamId: { in: myTeamIds } },
            select: { userId: true },
          })
        ).map((m) => m.userId)
      : [],
  );
  const invitedIds = new Set(activeInvites.map((i) => i.observerProfileId));

  const colleagues = members
    .map((m) => ({
      userId: m.userId,
      name: m.user.username ?? m.user.email ?? m.user.id,
      isTeammate: teammateIds.has(m.userId),
      alreadyInvited: invitedIds.has(m.userId),
    }))
    .sort((a, b) => {
      if (a.isTeammate !== b.isTeammate) return a.isTeammate ? -1 : 1;
      return a.name.localeCompare(b.name, "hu");
    });

  return NextResponse.json({ colleagues });
}
