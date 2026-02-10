import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizeLocale } from "@/lib/i18n";

const localeSchema = z.object({
  locale: z.string().min(2),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  const body = await req.json().catch(() => ({}));
  const parsed = localeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const locale = normalizeLocale(parsed.data.locale);
  if (userId) {
    await prisma.userProfile.updateMany({
      where: { clerkId: userId },
      data: { locale },
    });
  }

  const res = NextResponse.json({ locale });
  res.cookies.set("trita_locale", locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  return res;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ locale: null });
  }
  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { locale: true },
  });
  return NextResponse.json({ locale: profile?.locale ?? null });
}
