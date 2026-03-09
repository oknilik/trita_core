import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/coach/clients/[id] — kliens teljes profilja + legújabb assessment + observer comparison
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params;

  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const coach = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true },
  });

  if (!coach || coach.role !== "COACH") {
    return NextResponse.json({ error: "NOT_A_COACH" }, { status: 403 });
  }

  // Verify the coach–client relationship is active
  const relationship = await prisma.coachClientRelationship.findUnique({
    where: { coachId_clientId: { coachId: coach.id, clientId } },
    select: { status: true },
  });

  if (!relationship || relationship.status !== "ACTIVE") {
    return NextResponse.json({ error: "NOT_YOUR_CLIENT" }, { status: 403 });
  }

  // Fetch client profile + latest self-assessment + completed observer assessments
  const [client, latestAssessment, completedObservers] = await Promise.all([
    prisma.userProfile.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        email: true,
        username: true,
        country: true,
        occupation: true,
        onboardedAt: true,
      },
    }),

    prisma.assessmentResult.findFirst({
      where: { userProfileId: clientId, isSelfAssessment: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        testType: true,
        scores: true,
        createdAt: true,
      },
    }),

    prisma.observerAssessment.findMany({
      where: {
        invitation: {
          inviterId: clientId,
          status: "COMPLETED",
        },
      },
      select: {
        scores: true,
        confidence: true,
        relationshipType: true,
        createdAt: true,
      },
    }),
  ]);

  if (!client) {
    return NextResponse.json({ error: "CLIENT_NOT_FOUND" }, { status: 404 });
  }

  // Build observer comparison: average scores per dimension across all observers
  let observerAvgScores: Record<string, number> | null = null;
  let avgConfidence: number | null = null;

  if (completedObservers.length >= 1) {
    const scoresJson = latestAssessment?.scores as Record<string, unknown> | null;
    const dimKeys = Object.keys(
      (scoresJson?.dimensions as Record<string, number>) ?? {}
    );

    if (dimKeys.length > 0) {
      const sums: Record<string, number> = {};
      let confidenceSum = 0;
      let confidenceCount = 0;

      for (const obs of completedObservers) {
        const obsJson = obs.scores as Record<string, unknown>;
        const s = (obsJson?.dimensions as Record<string, number>) ?? {};
        for (const key of dimKeys) {
          sums[key] = (sums[key] ?? 0) + (s[key] ?? 0);
        }
        if (obs.confidence != null) {
          confidenceSum += obs.confidence;
          confidenceCount++;
        }
      }

      observerAvgScores = Object.fromEntries(
        dimKeys.map((k) => [k, Math.round(sums[k] / completedObservers.length)])
      );

      if (confidenceCount > 0) {
        avgConfidence = Math.round((confidenceSum / confidenceCount) * 10) / 10;
      }
    }
  }

  return NextResponse.json({
    client,
    latestAssessment,
    observerCount: completedObservers.length,
    observerAvgScores,
    avgConfidence,
  });
}
