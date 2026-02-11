import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const draftSchema = z.object({
  answers: z.record(z.string(), z.number().int().min(1).max(5)),
  currentPage: z.number().int().min(0),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, testType: true },
  });
  if (!profile?.testType) {
    return NextResponse.json({ error: "No test type assigned" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = draftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await prisma.assessmentDraft.upsert({
    where: { userProfileId: profile.id },
    create: {
      userProfileId: profile.id,
      testType: profile.testType,
      answers: parsed.data.answers,
      currentPage: parsed.data.currentPage,
    },
    update: {
      answers: parsed.data.answers,
      currentPage: parsed.data.currentPage,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) {
    return NextResponse.json({ ok: true });
  }

  await prisma.assessmentDraft.deleteMany({
    where: { userProfileId: profile.id },
  });

  return NextResponse.json({ ok: true });
}
