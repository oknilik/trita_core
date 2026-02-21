import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const surveySchema = z.object({
  selfAccuracy: z.number().int().min(1).max(5),
  priorTest: z.enum(["mbti", "bigfive", "other", "none"]),
  positionLevel: z.enum(["junior", "middle", "senior", "independent"]).optional(),
  studyField: z.enum(["business", "stem", "humanities", "health", "other"]).optional(),
  industry: z.string().optional(),
  motivation: z.string().min(1),
  sharingIntent: z.string().min(1),
  feedbackSources: z.string().optional(),
  has360Process: z.enum(["yes", "no", "unknown"]).optional(),
  personalityImportance: z.number().int().min(1).max(5).optional(),
  observerUsefulness: z.number().int().min(1).max(5).optional(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = surveySchema.safeParse(body);
  if (!parsed.success) {
    return new NextResponse("Invalid payload", { status: 400 });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) {
    return new NextResponse("Profile not found", { status: 404 });
  }

  await prisma.researchSurvey.upsert({
    where: { userProfileId: profile.id },
    create: { userProfileId: profile.id, ...parsed.data },
    update: { ...parsed.data },
  });

  return NextResponse.json({ ok: true });
}
