import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { InvitationStatus } from "@prisma/client";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });

  if (!profile) {
    return NextResponse.json({ pendingInvites: 0, completedObserver: 0 });
  }

  const now = new Date();

  const [pendingInvites, completedObserver] = await Promise.all([
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

  return NextResponse.json({ pendingInvites, completedObserver });
}
