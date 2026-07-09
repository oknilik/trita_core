import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** GET /api/notifications/unread-count — lightweight polling endpoint */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ count: 0 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ count: 0 });

  const count = await prisma.notification.count({
    where: { userId: profile.id, read: false, dismissed: false },
  });

  return NextResponse.json({ count });
}
