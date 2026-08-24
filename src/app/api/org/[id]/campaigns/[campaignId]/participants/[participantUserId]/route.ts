import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canManageMeasurements } from "@/lib/measurement-auth";
import {
  resolveOrgCapabilityDecision,
  resolveOrgPolicySnapshot,
} from "@/lib/policy-service";
import { lockCampaignForParticipantMutation } from "@/lib/campaign-steps";

export async function DELETE(
  _req: Request,
  {
    params,
  }: {
    params: Promise<{ id: string; campaignId: string; participantUserId: string }>;
  },
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id: orgId, campaignId, participantUserId } = await params;
  const profile = await prisma.userProfile.findUnique({
    where: { clerkId },
    select: { id: true, email: true, isConsultant: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const [membership, campaign] = await Promise.all([
    prisma.organizationMember.findUnique({
      where: { orgId_userId: { orgId, userId: profile.id } },
      select: { role: true, leftAt: true },
    }),
    prisma.campaign.findFirst({
      where: { id: campaignId, orgId },
      select: { id: true, status: true },
    }),
  ]);
  if (!membership || membership.leftAt || !campaign) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  if (!canManageMeasurements(membership.role, profile.email, profile.isConsultant)) {
    return NextResponse.json({ error: "CONSULTANT_ONLY" }, { status: 403 });
  }
  const snapshot = await resolveOrgPolicySnapshot({ orgId, orgRole: membership.role });
  const decision = resolveOrgCapabilityDecision(snapshot, "manage");
  if (!decision.allowed) {
    return NextResponse.json({ error: "CAPABILITY_DENIED" }, { status: 403 });
  }

  const removed = await prisma.$transaction(async (tx) => {
    const locked = await lockCampaignForParticipantMutation(
      tx,
      campaignId,
      orgId,
    );
    if (!locked) return null;
    return tx.campaignParticipant.deleteMany({
      where: { campaignId, userId: participantUserId },
    });
  });
  if (!removed) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (removed.count === 0) {
    return NextResponse.json({ error: "PARTICIPANT_NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
