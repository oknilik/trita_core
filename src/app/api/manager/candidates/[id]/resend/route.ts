import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendCandidateInviteEmail } from "@/lib/emails";
import { isConsultantSurface } from "@/lib/measurement-auth";
import { getServerLocale } from "@/lib/i18n-server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://trita.io";

// POST /api/manager/candidates/[id]/resend — jelölt-meghívó újraküldése.
// Guard (2026-07-23): csak a tanácsadói kör (ORG_CONSULTANT / platform-
// tanácsadó / trita-admin) — a meghívó orgjának hatókörében.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, username: true, email: true, isConsultant: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const rateLimitResponse = await checkRateLimit("contact", `candidate-resend:${profile.id}`);
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await params;

  const invite = await prisma.candidateInvite.findUnique({
    where: { id },
    select: {
      id: true,
      managerId: true,
      orgId: true,
      teamId: true,
      status: true,
      expiresAt: true,
      email: true,
      token: true,
      position: true,
      team: { select: { orgId: true } },
    },
  });

  if (!invite) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const inviteOrgId = invite.orgId ?? invite.team?.orgId ?? null;
  // leftAt: null – a szervezetből kilépett (volt) tag nem küldhet újra meghívót.
  const orgMembership = inviteOrgId
    ? await prisma.organizationMember.findFirst({
        where: { userId: profile.id, orgId: inviteOrgId, leftAt: null },
        select: { role: true },
      })
    : null;
  const allowed = isConsultantSurface(
    orgMembership?.role ?? null,
    profile.email,
    profile.isConsultant,
  );
  if (!allowed) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  if (invite.status !== "PENDING") return NextResponse.json({ error: "ALREADY_USED" }, { status: 409 });
  if (!invite.email) return NextResponse.json({ error: "NO_EMAIL" }, { status: 400 });
  if (invite.expiresAt < new Date()) return NextResponse.json({ error: "EXPIRED" }, { status: 409 });

  const managerName = profile.username ?? profile.email ?? "Manager";
  const emailSent = await sendCandidateInviteEmail({
    to: invite.email,
    managerName,
    token: invite.token,
    position: invite.position ?? undefined,
    applyUrl: `${APP_URL}/apply/${invite.token}`,
    // A CandidateInvite nem tárol nyelvet; az újraküldést indító menedzser
    // felületi nyelve ugyanaz, amit a létrehozáskor is átadott.
    locale: await getServerLocale(),
  });

  return NextResponse.json({ ok: true, emailSent });
}
