import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";
import { isPortfolioSurfaceActive } from "@/lib/portfolio-parking";

export const dynamic = "force-dynamic";

/**
 * GET /api/notifications — list recent notifications (max 20, non-dismissed).
 *
 * Az olvasatlan-számlálót is visszaadja, így a panel megnyitása után a kliens
 * nem indít külön unread-count hívást.
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const hiddenTypes: NotificationType[] = [
    ...(!isPortfolioSurfaceActive("hiring")
      ? [NotificationType.CANDIDATE_COMPLETED, NotificationType.LOW_CANDIDATE_CREDITS]
      : []),
    ...(!isPortfolioSurfaceActive("crm")
      ? [NotificationType.CRM_NEXT_ACTION_DUE, NotificationType.CRM_QUOTE_EXPIRING]
      : []),
  ];
  const visibleTypeFilter = hiddenTypes.length > 0 ? { type: { notIn: hiddenTypes } } : {};

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { user: { clerkId: userId }, dismissed: false, ...visibleTypeFilter },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        type: true,
        category: true,
        priority: true,
        titleKey: true,
        bodyKey: true,
        vars: true,
        link: true,
        read: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({
      where: { user: { clerkId: userId }, read: false, dismissed: false, ...visibleTypeFilter },
    }),
  ]);

  return NextResponse.json({
    notifications: notifications.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
    })),
    unreadCount,
  });
}
