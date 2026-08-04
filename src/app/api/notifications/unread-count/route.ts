import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/notifications/unread-count — lightweight polling endpoint.
 *
 * Egyetlen query: a clerkId-ra a relation-filteren át szűrünk, így nem kell
 * külön UserProfile-lookup (a poll a leggyakoribb hívás az appban).
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ count: 0 });

  const count = await prisma.notification.count({
    where: { user: { clerkId: userId }, read: false, dismissed: false },
  });

  return NextResponse.json(
    { count },
    { headers: { "Cache-Control": "no-store" } },
  );
}
