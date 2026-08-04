import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/** DELETE /api/notifications/[id] — soft dismiss a notification */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;

  // Tulajdonos-ellenőrzés a relation-filteren: nem kell külön profil-lookup.
  await prisma.notification.updateMany({
    where: { id, user: { clerkId: userId } },
    data: { dismissed: true, dismissedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
