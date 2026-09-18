import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { canViewRawTeamResults } from "@/lib/team-auth";
import { isPlatformAdminEmail } from "@/lib/measurement-auth";
import { getLatestPublishedReport } from "@/lib/team-report";
import { operatingIdentity } from "@/lib/team-operating-style/identity";

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
        select: { role: true, leftAt: true },
      })
    : null;

  // A kapu a lap (team/[id]/page.tsx canViewRaw) tanácsadói feltételével
  // AZONOS: ORG_CONSULTANT szerep VAGY tanácsadói fiók VAGY platform-admin.
  // Korábban canAccessTeam (bármely tag / org admin) volt — miközben a lap
  // ugyanezt az aggregátumot tanácsadói körre szűkíti, curl-lel bárki
  // elérte a patternCode/tengely/confidence adatot.
  const canViewRaw =
    canViewRawTeamResults(orgMembership?.leftAt ? null : orgMembership?.role) ||
    profile.isConsultant ||
    isPlatformAdminEmail(profile.email);
  if (!canViewRaw) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  // Surface the same published measurement as the team overview. Never derive
  // an operating type from personality scores or expose respondent-level data.
  const report = await getLatestPublishedReport(teamId);
  const snapshot = report?.aggregates?.teamStyle;
  const hu = operatingIdentity(snapshot, "hu");
  const en = operatingIdentity(snapshot, "en");
  return NextResponse.json({ operatingPattern: {
    code: hu.code, status: hu.status, label: { hu: hu.label, en: en.label },
    referenceStart: snapshot?.operating?.referenceStart ?? null,
    referenceEnd: snapshot?.operating?.referenceEnd ?? null,
    source: "published_report",
  } });
}
