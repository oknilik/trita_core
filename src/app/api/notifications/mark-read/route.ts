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

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  // Tulajdonos-ellenőrzés a relation-filteren: nem kell külön profil-lookup.
  const owner = { user: { clerkId: userId } };
  if ("all" in body.data) {
    await prisma.notification.updateMany({
      where: { ...owner, read: false },
      data: { read: true, readAt: new Date() },
    });
  } else {
    await prisma.notification.updateMany({
      where: { ...owner, id: { in: body.data.ids }, read: false },
      data: { read: true, readAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true });
}
