import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasOrgRole } from "@/lib/auth";

// POST /api/org/[id]/campaigns/[campaignId]/remind
// Counts participants who have not completed a self-assessment.
// Returns { ok: true, remindedCount: number }.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; campaignId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id: orgId, campaignId } = await params;

  // Resolve profile
  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  // Check org membership + role
  const membership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId: profile.id } },
    select: { role: true },
  });
  if (!membership) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  if (!hasOrgRole(membership.role, "ORG_MANAGER")) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  // Check campaign exists and is ACTIVE
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId, orgId },
    select: {
      id: true,
      status: true,
      participants: { select: { userId: true } },
    },
  });
  if (!campaign) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (campaign.status !== "ACTIVE") {
    return NextResponse.json({ error: "CAMPAIGN_NOT_ACTIVE" }, { status: 400 });
  }

  const participantUserIds = campaign.participants.map((p) => p.userId);

  if (participantUserIds.length === 0) {
    return NextResponse.json({ ok: true, remindedCount: 0 });
  }

  // Fetch participants who have completed a self-assessment
  const selfDoneResults = await prisma.assessmentResult.findMany({
    where: {
      userProfileId: { in: participantUserIds },
      isSelfAssessment: true,
    },
    select: { userProfileId: true },
    distinct: ["userProfileId"],
  });

  const selfDoneSet = new Set(
    selfDoneResults.map((r) => r.userProfileId).filter(Boolean) as string[]
  );

  const notStartedCount = participantUserIds.filter((id) => !selfDoneSet.has(id)).length;

  // In a real implementation, you would send reminder emails here.
  // For now we just count and return.

  return NextResponse.json({ ok: true, remindedCount: notStartedCount });
}
