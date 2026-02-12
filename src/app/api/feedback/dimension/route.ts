import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTestConfig } from "@/lib/questions";

const DimensionFeedbackSchema = z.object({
  assessmentResultId: z.string().cuid(),
  dimensionCode: z.string().min(1).max(3),
  accuracyRating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

type DimensionFeedbackPayload = z.infer<typeof DimensionFeedbackSchema>;

export async function POST(req: Request) {
  // 1. Authenticate user
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  // 2. Validate payload
  let payload: DimensionFeedbackPayload;
  try {
    const body = await req.json();
    payload = DimensionFeedbackSchema.parse(body);
  } catch (error) {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  }

  // 3. Get user profile
  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "PROFILE_NOT_FOUND" }, { status: 404 });
  }

  // 4. Verify assessment belongs to user
  const assessment = await prisma.assessmentResult.findFirst({
    where: {
      id: payload.assessmentResultId,
      userProfileId: profile.id,
    },
    select: { id: true, testType: true },
  });
  if (!assessment) {
    return NextResponse.json(
      { error: "ASSESSMENT_NOT_FOUND" },
      { status: 404 }
    );
  }

  // 5. Validate dimension code matches test type
  if (assessment.testType) {
    const config = getTestConfig(assessment.testType);
    const validDimensionCodes = config.dimensions.map((d) => d.code);
    if (!validDimensionCodes.includes(payload.dimensionCode)) {
      return NextResponse.json(
        { error: "INVALID_DIMENSION_CODE" },
        { status: 400 }
      );
    }
  }

  // 6. Upsert feedback (allow updates)
  const feedback = await prisma.dimensionFeedback.upsert({
    where: {
      assessmentResultId_dimensionCode: {
        assessmentResultId: payload.assessmentResultId,
        dimensionCode: payload.dimensionCode,
      },
    },
    create: {
      assessmentResultId: payload.assessmentResultId,
      dimensionCode: payload.dimensionCode,
      accuracyRating: payload.accuracyRating,
      comment: payload.comment?.trim() || null,
    },
    update: {
      accuracyRating: payload.accuracyRating,
      comment: payload.comment?.trim() || null,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true, feedbackId: feedback.id });
}
