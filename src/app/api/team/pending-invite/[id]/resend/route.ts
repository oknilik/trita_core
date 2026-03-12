import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasOrgRole } from "@/lib/auth";
import { sendTeamInviteEmail } from "@/lib/emails";
import { getServerLocale } from "@/lib/i18n-server";

// POST /api/team/pending-invite/[id]/resend — resend invite email to a pending member
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const invite = await prisma.teamPendingInvite.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      team: { select: { id: true, name: true, orgId: true } },
    },
  });
  if (!invite) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  if (!invite.team.orgId) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const membership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId: invite.team.orgId, userId: profile.id } },
    select: { role: true },
  });
  if (!membership || !hasOrgRole(membership.role, "ORG_MANAGER")) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const locale = await getServerLocale();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://trita.io";
  const joinPath = `/join/${invite.id}`;
  await sendTeamInviteEmail({
    to: invite.email,
    teamName: invite.team.name,
    signUpUrl: `${appUrl}/sign-up?redirect_url=${encodeURIComponent(joinPath)}`,
    locale: (locale === "hu" || locale === "en") ? locale : "en",
  });

  return NextResponse.json({ ok: true });
}
