import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/coach/clients — coach kliens lista
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true },
  });

  if (!profile || profile.role !== "COACH") {
    return NextResponse.json({ error: "NOT_A_COACH" }, { status: 403 });
  }

  const relationships = await prisma.coachClientRelationship.findMany({
    where: { coachId: profile.id, status: "ACTIVE" },
    orderBy: { startedAt: "desc" },
    select: {
      id: true,
      startedAt: true,
      status: true,
      client: {
        select: {
          id: true,
          email: true,
          username: true,
          assessmentResults: {
            where: { isSelfAssessment: true },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              testType: true,
              scores: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  const clients = relationships.map((r) => ({
    relationshipId: r.id,
    startedAt: r.startedAt,
    status: r.status,
    client: {
      id: r.client.id,
      email: r.client.email,
      username: r.client.username,
      latestAssessment: r.client.assessmentResults[0] ?? null,
    },
  }));

  return NextResponse.json({ clients });
}
