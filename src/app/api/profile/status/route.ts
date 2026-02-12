import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { InvitationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, onboardedAt: true },
  });

  if (!profile) {
    return NextResponse.json({
      onboarded: false,
      hasDraft: false,
      hasResult: false,
      sentInvites: 0,
      pendingInvites: 0,
      completedObserver: 0,
    });
  }

  const now = new Date();

  const [draft, latestResult, sentInvites, pendingInvites, completedObserver] =
    await Promise.all([
      prisma.assessmentDraft.findUnique({
        where: { userProfileId: profile.id },
        select: { id: true },
      }),
      prisma.assessmentResult.findFirst({
        where: { userProfileId: profile.id },
        select: { id: true },
      }),
      prisma.observerInvitation.count({
        where: { inviterId: profile.id },
      }),
      prisma.observerInvitation.count({
        where: {
          inviterId: profile.id,
          status: InvitationStatus.PENDING,
          expiresAt: { gt: now },
        },
      }),
      prisma.observerAssessment.count({
        where: {
          invitation: {
            inviterId: profile.id,
            status: InvitationStatus.COMPLETED,
          },
        },
      }),
    ]);

  return NextResponse.json({
    onboarded: Boolean(profile.onboardedAt),
    hasDraft: Boolean(draft),
    hasResult: Boolean(latestResult),
    sentInvites,
    pendingInvites,
    completedObserver,
  });
}
