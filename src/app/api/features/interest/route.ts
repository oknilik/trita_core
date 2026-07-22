import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  featureKey: z.enum(["team", "comm", "360"]),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ keys: [] });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });

  if (!profile) return NextResponse.json({ keys: [] });

  const interests = await prisma.feedback.findMany({
    where: { userProfileId: profile.id, kind: "feature_interest" },
    select: { targetKey: true },
  });

  return NextResponse.json({ keys: interests.map((i) => i.targetKey) });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // DB-írás user-inputból — rate limit az abúzus ellen
  const rateLimited = await checkRateLimit("api", userId);
  if (rateLimited) return rateLimited;

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const key = {
    userProfileId_kind_targetKey: {
      userProfileId: profile.id,
      kind: "feature_interest",
      targetKey: parsed.data.featureKey,
    },
  };

  const existing = await prisma.feedback.findUnique({ where: key });

  if (existing) {
    await prisma.feedback.delete({ where: key });
    return NextResponse.json({ ok: true, action: "removed" });
  } else {
    await prisma.feedback.create({
      data: {
        userProfileId: profile.id,
        kind: "feature_interest",
        targetKey: parsed.data.featureKey,
      },
    });
    return NextResponse.json({ ok: true, action: "added" });
  }
}
