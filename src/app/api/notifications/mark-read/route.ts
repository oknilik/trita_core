import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const schema = z.union([
  z.object({ ids: z.array(z.string().min(1)) }),
  z.object({ all: z.literal(true) }),
]);

/** POST /api/notifications/mark-read — mark specific or all as read */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  if ("all" in body.data) {
    await prisma.notification.updateMany({
      where: { userId: profile.id, read: false },
      data: { read: true },
    });
  } else {
    await prisma.notification.updateMany({
      where: { id: { in: body.data.ids }, userId: profile.id },
      data: { read: true },
    });
  }

  return NextResponse.json({ ok: true });
}
