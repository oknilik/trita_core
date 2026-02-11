import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { getTestConfig } from "@/lib/questions";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, testType: true },
  });

  if (!profile || !profile.testType) {
    return NextResponse.json({ error: "NO_TEST_TYPE" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(0, Number(searchParams.get("page") ?? 0));
  const perPageRaw = Number(searchParams.get("perPage") ?? 5);
  const perPage = Number.isFinite(perPageRaw)
    ? Math.min(Math.max(perPageRaw, 1), 10)
    : 5;

  const locale = await getServerLocale();
  const config = getTestConfig(profile.testType, locale);

  const start = page * perPage;
  const end = start + perPage;
  const slice = config.questions.slice(start, end);

  const questions = slice.map((q) => ({
    id: q.id,
    text: q.text,
  }));

  return NextResponse.json({
    page,
    perPage,
    total: config.questions.length,
    questions,
  });
}
