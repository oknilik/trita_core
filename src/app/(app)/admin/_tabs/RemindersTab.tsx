import { FadeIn } from "@/components/landing/FadeIn";
import { prisma } from "@/lib/prisma";
import { AdminReminderSection } from "@/app/(app)/admin/_components/AdminReminderSection";
import { AdminLifecycleSection } from "@/app/(app)/admin/_components/AdminLifecycleSection";

// Kérés-idejű időbélyegek a szűrő-ablakokhoz — szándékos.
function getFilterWindows() {
  const now = Date.now();
  return {
    sevenDaysAgo: new Date(now - 7 * 24 * 60 * 60 * 1000),
    fourDaysAgo: new Date(now - 4 * 24 * 60 * 60 * 1000),
  };
}

// Emlékeztetők fül — observer-meghívó és teszt-piszkozat emlékeztetők
export async function RemindersTab() {
  const { sevenDaysAgo, fourDaysAgo } = getFilterWindows();

  const [pendingReminders, recentlyCompletedInvitations] =
    await Promise.all([
      prisma.observerInvitation.findMany({
        where: {
          status: "PENDING",
          observerEmail: { not: null },
          expiresAt: { gt: new Date() },
          createdAt: { lt: fourDaysAgo },
        },
        select: {
          id: true,
          observerEmail: true,
          observerName: true,
          createdAt: true,
          reminderCount: true,
          lastReminderSentAt: true,
          inviter: { select: { username: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
      }),

      // Recently completed invitations (last 7 days — shown as gray "Már kész")
      prisma.observerInvitation.findMany({
        where: {
          status: "COMPLETED",
          observerEmail: { not: null },
          completedAt: { gt: sevenDaysAgo },
          createdAt: { lt: fourDaysAgo },
        },
        select: {
          id: true,
          observerEmail: true,
          observerName: true,
          createdAt: true,
          reminderCount: true,
          lastReminderSentAt: true,
          inviter: { select: { username: true, email: true } },
        },
        orderBy: { completedAt: "desc" },
        take: 5,
      }),

    ]);

  return (
    <>
      <AdminLifecycleSection />

      <FadeIn delay={0.05}>
        <AdminReminderSection
          invitations={[
            ...pendingReminders.map((inv) => ({
              id: inv.id,
              observerEmail: inv.observerEmail!,
              observerName: inv.observerName,
              createdAt: inv.createdAt.toISOString(),
              reminderCount: inv.reminderCount,
              lastReminderSentAt: inv.lastReminderSentAt?.toISOString() ?? null,
              inviter: {
                username: inv.inviter.username,
                email: inv.inviter.email ?? "",
              },
            })),
            ...recentlyCompletedInvitations.map((inv) => ({
              id: inv.id,
              observerEmail: inv.observerEmail!,
              observerName: inv.observerName,
              createdAt: inv.createdAt.toISOString(),
              reminderCount: inv.reminderCount,
              lastReminderSentAt: inv.lastReminderSentAt?.toISOString() ?? null,
              inviter: {
                username: inv.inviter.username,
                email: inv.inviter.email ?? "",
              },
              completedMeanwhile: true as const,
            })),
          ]}
        />
      </FadeIn>
    </>
  );
}
