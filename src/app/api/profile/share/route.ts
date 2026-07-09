import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * POST /api/profile/share
 * Generates (or returns existing) share token for the user's latest assessment.
 */
export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const result = await prisma.assessmentResult.findFirst({
    where: { userProfileId: profile.id, isSelfAssessment: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, shareToken: true },
  });
  if (!result) return NextResponse.json({ error: "NO_RESULT" }, { status: 404 });

  // Return existing token if already generated
  if (result.shareToken) {
    return NextResponse.json({ token: result.shareToken });
  }

  // Generate new token
  const token = crypto.randomBytes(16).toString("hex");
  await prisma.assessmentResult.update({
    where: { id: result.id },
    data: { shareToken: token },
  });

  return NextResponse.json({ token });
}
