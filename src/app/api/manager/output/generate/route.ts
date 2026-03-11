import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateManagerOutput } from "@/lib/manager-engine";

const schema = z
  .object({
    clientId: z.string().min(1),
    locale: z.enum(["hu", "en", "de"]).optional().default("hu"),
  })
  .strict();

// POST /api/manager/output/generate
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const manager = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true },
  });

  if (!manager || manager.role !== "MANAGER") {
    return NextResponse.json({ error: "NOT_A_MANAGER" }, { status: 403 });
  }

  const { clientId, locale } = parsed.data;

  // Verify active coach–client relationship
  const relationship = await prisma.managerClientRelationship.findUnique({
    where: { managerId_clientId: { managerId: manager.id, clientId } },
    select: { status: true },
  });

  if (!relationship || relationship.status !== "ACTIVE") {
    return NextResponse.json({ error: "NOT_YOUR_CLIENT" }, { status: 403 });
  }

  // Fetch client's latest self-assessment
  const latestAssessment = await prisma.assessmentResult.findFirst({
    where: { userProfileId: clientId, isSelfAssessment: true },
    orderBy: { createdAt: "desc" },
    select: { testType: true, scores: true },
  });

  if (!latestAssessment) {
    return NextResponse.json({ error: "NO_ASSESSMENT" }, { status: 400 });
  }

  const rawScores = latestAssessment.scores as Record<string, unknown>;
  const selfScores = rawScores.dimensions as Record<string, number>;
  const selfFacets = rawScores.facets as Record<string, Record<string, number>> | undefined;
  const selfAspects = rawScores.aspects as Record<string, Record<string, number>> | undefined;

  if (!selfScores || Object.keys(selfScores).length === 0) {
    return NextResponse.json({ error: "INVALID_SCORES" }, { status: 400 });
  }

  // Fetch observer avg scores (same logic as /api/manager/clients/[id])
  const completedObservers = await prisma.observerAssessment.findMany({
    where: {
      invitation: { inviterId: clientId, status: "COMPLETED" },
    },
    select: { scores: true },
  });

  let observerAvgScores: Record<string, number> | null = null;
  if (completedObservers.length >= 1) {
    const dimKeys = Object.keys(selfScores);
    const sums: Record<string, number> = {};
    for (const obs of completedObservers) {
      const s = (obs.scores as Record<string, unknown>).dimensions as Record<string, number>;
      if (!s) continue;
      for (const key of dimKeys) {
        sums[key] = (sums[key] ?? 0) + (s[key] ?? 0);
      }
    }
    observerAvgScores = Object.fromEntries(
      dimKeys.map((k) => [k, Math.round(sums[k] / completedObservers.length)])
    );
  }

  try {
    const result = await generateManagerOutput({
      managerId: manager.id,
      clientId,
      testType: latestAssessment.testType as string,
      selfScores,
      observerAvgScores,
      selfFacets,
      selfAspects,
      locale,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Coach output generation failed:", err);
    return NextResponse.json({ error: "GENERATION_FAILED" }, { status: 500 });
  }
}
