import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveOrgMembership } from "@/lib/org-context";
import { getOrgSubscription, getPlanTier } from "@/lib/subscription";
import { addCredits } from "@/lib/candidate-credits";
import { isConsultantSurface } from "@/lib/measurement-auth";
import { isCandidateGatingEnabled } from "@/lib/operating-mode";

// DELETE /api/manager/candidates/[id] — revoke a PENDING candidate invite.
// Guard (2026-07-23): csak a tanácsadói kör (ORG_CONSULTANT / platform-
// tanácsadó / trita-admin) — a meghívó orgjának hatókörében.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, email: true, isConsultant: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;

  const invite = await prisma.candidateInvite.findUnique({
    where: { id },
    select: {
      id: true,
      managerId: true,
      orgId: true,
      teamId: true,
      status: true,
      name: true,
      email: true,
      position: true,
      team: { select: { orgId: true } },
    },
  });

  if (!invite) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const inviteOrgId = invite.orgId ?? invite.team?.orgId ?? null;
  const orgMembership = inviteOrgId
    ? await prisma.organizationMember.findFirst({
        where: { userId: profile.id, orgId: inviteOrgId },
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

  await prisma.candidateInvite.update({
    where: { id },
    data: { status: "CANCELED" },
  });

  // Kredit-visszatérítés csak élő gating mellett (operating-mode kapcsoló)
  if (isCandidateGatingEnabled()) {
    const orgId =
      inviteOrgId ??
      (await getActiveOrgMembership(profile.id))?.orgId ??
      null;
    if (orgId) {
      const sub = await getOrgSubscription(orgId);
      const tier = getPlanTier(sub);
      const isUnlimited = tier === "org" || tier === "scale";
      if (!isUnlimited && sub) {
        const label = invite.name ?? invite.email ?? "unknown";
        await addCredits({
          orgId,
          amount: 1,
          actorId: profile.id,
          note: `Visszavonás: ${label}${invite.position ? ` (${invite.position})` : ""}`,
        });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
