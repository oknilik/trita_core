import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const ResultClaritySchema = z.object({
  rating: z.number().int().min(1).max(5),
}).strict();

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = ResultClaritySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "PROFILE_NOT_FOUND" }, { status: 404 });

  await prisma.feedback.upsert({
    where: {
      userProfileId_kind_targetKey: {
        userProfileId: profile.id,
        kind: "result_clarity",
        targetKey: "summary",
      },
    },
    create: {
      userProfileId: profile.id,
      kind: "result_clarity",
      targetKey: "summary",
      rating: parsed.data.rating,
    },
    update: { rating: parsed.data.rating },
  });

  return NextResponse.json({ ok: true });
}
