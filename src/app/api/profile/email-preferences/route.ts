import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Életciklus-email beállítás (reflexiós utókövetés és hasonlók).
// A tranzakcionális emaileket (meghívók, eredmény-értesítők) nem érinti.

const updateSchema = z.object({
  lifecycleEmailsOptOut: z.boolean(),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "FORBIDDEN" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { lifecycleEmailsOptOut: true },
  });
  if (!profile) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  return NextResponse.json({ lifecycleEmailsOptOut: profile.lifecycleEmailsOptOut });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "FORBIDDEN" }, { status: 401 });

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  await prisma.userProfile.update({
    where: { id: profile.id },
    data: { lifecycleEmailsOptOut: parsed.data.lifecycleEmailsOptOut },
  });

  return NextResponse.json({ ok: true, lifecycleEmailsOptOut: parsed.data.lifecycleEmailsOptOut });
}
