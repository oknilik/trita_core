import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const onboardingSchema = z.object({
  username: z.string().min(1).max(80),
  birthYear: z.number().int().min(1940).max(2010),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]),
  education: z.enum([
    "primary",
    "secondary",
    "bachelor",
    "master",
    "doctorate",
    "other",
  ]),
  country: z.string().min(1).max(100),
  consentedAt: z.string().datetime().optional(),
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
      country: parsed.data.country,
      ...(parsed.data.consentedAt && {
        consentedAt: new Date(parsed.data.consentedAt),
        onboardedAt: new Date(),
      }),
    },
  });

  return NextResponse.json({ ok: true });
}
