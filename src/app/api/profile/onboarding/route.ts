import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  COMPANY_SIZE_VALUES,
  OCCUPATION_STATUS_VALUES,
  STUDY_LEVEL_VALUES,
  UNEMPLOYMENT_DURATION_VALUES,
  WORK_SCHEDULE_VALUES,
  requiresStudyLevel,
  requiresWorkFields,
} from "@/lib/onboarding-options";

// Dynamic validation based on current year
const currentYear = new Date().getFullYear();

const onboardingSchema = z.object({
  username: z.string().min(2).max(12),
  birthYear: z.number().int().min(currentYear - 100).max(currentYear - 16),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]),
  education: z.enum([
    "primary",
    "secondary",
    "bachelor",
    "master",
    "doctorate",
    "other",
  ]),
  occupationStatus: z.enum(OCCUPATION_STATUS_VALUES),
  workSchedule: z.enum(WORK_SCHEDULE_VALUES).optional(),
  companySize: z.enum(COMPANY_SIZE_VALUES).optional(),
  studyLevel: z.enum(STUDY_LEVEL_VALUES).optional(),
  unemploymentDuration: z.enum(UNEMPLOYMENT_DURATION_VALUES).optional(),
  country: z.string().min(1).max(100),
  consentedAt: z.string().datetime().optional(),
}).superRefine((data, ctx) => {
  if (requiresWorkFields(data.occupationStatus)) {
    if (!data.workSchedule) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["workSchedule"],
        message: "Required when user is working",
      });
    }
    if (!data.companySize) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["companySize"],
        message: "Required when user is working",
      });
    }
  }

  if (requiresStudyLevel(data.occupationStatus) && !data.studyLevel) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["studyLevel"],
      message: "Required when user is studying",
    });
  }

});

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: {
      username: true,
      birthYear: true,
      gender: true,
      education: true,
      occupationStatus: true,
      workSchedule: true,
      companySize: true,
      studyLevel: true,
      unemploymentDuration: true,
      country: true,
    },
  });

  return NextResponse.json(profile ?? {});
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  await prisma.userProfile.updateMany({
    where: { clerkId: userId },
    data: {
      username: parsed.data.username,
      birthYear: parsed.data.birthYear,
      gender: parsed.data.gender,
      education: parsed.data.education,
      occupationStatus: parsed.data.occupationStatus,
      workSchedule: requiresWorkFields(parsed.data.occupationStatus)
        ? parsed.data.workSchedule
        : null,
      companySize: requiresWorkFields(parsed.data.occupationStatus)
        ? parsed.data.companySize
        : null,
      studyLevel: requiresStudyLevel(parsed.data.occupationStatus)
        ? parsed.data.studyLevel
        : null,
      unemploymentDuration: parsed.data.occupationStatus === "unemployed"
        ? parsed.data.unemploymentDuration
        : null,
      country: parsed.data.country,
      ...(parsed.data.consentedAt && {
        consentedAt: new Date(parsed.data.consentedAt),
        onboardedAt: new Date(),
      }),
    },
  });

  return NextResponse.json({ ok: true });
}
