import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendCandidateInviteEmail } from "@/lib/emails";
import { canManageTeam, getManageableTeamIds } from "@/lib/team-auth";
import { getOrgSubscription, getPlanTier, hasCandidateAccess } from "@/lib/subscription";
import { useCredit } from "@/lib/candidate-credits";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://trita.app";

const bodySchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).max(100),
  position: z.string().max(100).optional(),
  teamId: z.string().optional(),
  inviteLocale: z.enum(["hu", "en"]).optional(),
});

// POST /api/manager/candidates — create a candidate invite link (+ optionally send email)
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, username: true, email: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const { email, name, position, teamId, inviteLocale } = parsed.data;

  // Verify the caller can manage the given team
  let orgId: string | null = null;
  if (teamId) {
    const orgMembership = await prisma.organizationMember.findFirst({
      where: { userId: profile.id, org: { teams: { some: { id: teamId } } } },
      select: { role: true, orgId: true },
    });
    if (!orgMembership) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    const allowed = await canManageTeam(profile.id, teamId, orgMembership.role);
    if (!allowed) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    orgId = orgMembership.orgId;
  } else {
    const orgMembership = await prisma.organizationMember.findUnique({
      where: { userId: profile.id },
      select: { orgId: true, role: true },
    });
    if (!orgMembership) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    // Must manage at least one team in the org (team-level role check)
    const manageableIds = await getManageableTeamIds(profile.id, orgMembership.orgId, orgMembership.role);
    if (manageableIds.length === 0) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    orgId = orgMembership.orgId;
  }

  // Credit check + atomic decrement for non-unlimited tiers
  if (orgId) {
    const sub = await getOrgSubscription(orgId);
    if (!hasCandidateAccess(sub)) {
      return NextResponse.json({ error: "NO_CANDIDATE_CREDITS" }, { status: 402 });
    }
    const tier = getPlanTier(sub);
    const isUnlimited = tier === "org" || tier === "scale";
    if (!isUnlimited) {
      const candidateLabel = name ?? email ?? "unknown";
      const newBalance = await useCredit({
        orgId,
        actorId: profile.id,
        note: `Jelölt: ${candidateLabel}${position ? ` (${position})` : ""}`,
      });
      if (newBalance === null) {
        return NextResponse.json({ error: "NO_CANDIDATE_CREDITS" }, { status: 402 });
      }
    }
  }

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const invite = await prisma.candidateInvite.create({
    data: {
      managerId: profile.id,
      teamId: teamId ?? null,
      email: email ?? null,
      name: name ?? null,
      position: position ?? null,
      expiresAt,
    },
    select: { id: true, token: true, email: true, name: true, position: true },
  });

  // Send email if address was provided
  let emailSent = false;
  if (email) {
    const managerName = profile.username ?? profile.email ?? "Manager";
    emailSent = await sendCandidateInviteEmail({
      to: email,
      managerName,
      token: invite.token,
      position: position ?? undefined,
      applyUrl: `${APP_URL}/apply/${invite.token}`,
      locale: inviteLocale,
    });
  }

  return NextResponse.json({ invite, emailSent }, { status: 201 });
}
