import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";
import { isPortfolioSurfaceActive } from "@/lib/portfolio-parking";

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

  const hiddenTypes: NotificationType[] = [
    ...(!isPortfolioSurfaceActive("hiring")
      ? [NotificationType.CANDIDATE_COMPLETED, NotificationType.LOW_CANDIDATE_CREDITS]
      : []),
    ...(!isPortfolioSurfaceActive("crm")
      ? [NotificationType.CRM_NEXT_ACTION_DUE, NotificationType.CRM_QUOTE_EXPIRING]
      : []),
  ];

  const count = await prisma.notification.count({
    where: {
      user: { clerkId: userId },
      read: false,
      dismissed: false,
      ...(hiddenTypes.length > 0 ? { type: { notIn: hiddenTypes } } : {}),
    },
  });

  return NextResponse.json(
    { count },
    { headers: { "Cache-Control": "no-store" } },
  );
}
