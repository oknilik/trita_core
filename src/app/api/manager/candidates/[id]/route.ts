import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgSubscription, getPlanTier } from "@/lib/subscription";
import { addCredits } from "@/lib/candidate-credits";

// DELETE /api/manager/candidates/[id] — revoke a PENDING candidate invite
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;

  const invite = await prisma.candidateInvite.findUnique({
    where: { id },
    select: {
      id: true,
      managerId: true,
      status: true,
      name: true,
      email: true,
      position: true,
      team: { select: { orgId: true } },
    },
  });

  if (!invite) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (invite.managerId !== profile.id) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  if (invite.status !== "PENDING") return NextResponse.json({ error: "ALREADY_USED" }, { status: 409 });

  // Determine orgId: via team, or via manager's org membership
  const orgId =
    invite.team?.orgId ??
    (
      await prisma.organizationMember.findUnique({
        where: { userId: profile.id },
        select: { orgId: true },
      })
    )?.orgId ??
    null;

  await prisma.candidateInvite.update({
    where: { id },
    data: { status: "CANCELED" },
  });

  // Refund 1 credit for non-unlimited tiers
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

  return NextResponse.json({ ok: true });
}
