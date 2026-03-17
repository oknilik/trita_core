import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const currentYear = new Date().getFullYear();

const onboardingSchema = z.object({
  username: z.string().min(2).max(20),
  birthYear: z.number().int().min(currentYear - 100).max(currentYear - 16),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]),
  country: z.string().min(1).max(100).optional(),
  consentedAt: z.string().datetime().optional(),
  avatarUrl: z.string().max(500).optional(),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: {
      email: true,
      username: true,
      birthYear: true,
      gender: true,
      country: true,
      avatarUrl: true,
      role: true,
      orgMemberships: {
        select: {
          role: true,
          org: { select: { id: true, name: true } },
        },
      },
      teamMemberships: {
        select: {
          team: { select: { id: true, name: true } },
        },
      },
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
      ...(parsed.data.country && { country: parsed.data.country }),
      ...(parsed.data.avatarUrl && { avatarUrl: parsed.data.avatarUrl }),
      ...(parsed.data.consentedAt && {
        consentedAt: new Date(parsed.data.consentedAt),
        onboardedAt: new Date(),
      }),
    },
  });

  return NextResponse.json({ ok: true });
}
