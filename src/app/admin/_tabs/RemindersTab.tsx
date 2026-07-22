import { FadeIn } from "@/components/landing/FadeIn";
import { prisma } from "@/lib/prisma";
import { getTestConfig } from "@/lib/questions";
import { AdminReminderSection } from "@/app/admin/_components/AdminReminderSection";
import { AdminDraftReminderSection } from "@/app/admin/_components/AdminDraftReminderSection";

// Kérés-idejű időbélyegek a szűrő-ablakokhoz — szándékos.
function getFilterWindows() {
  const now = Date.now();
  return {
    sevenDaysAgo: new Date(now - 7 * 24 * 60 * 60 * 1000),
    thirtyDaysAgo: new Date(now - 30 * 24 * 60 * 60 * 1000),
    threeDaysAgo: new Date(now - 3 * 24 * 60 * 60 * 1000),
    oneDayAgo: new Date(now - 24 * 60 * 60 * 1000),
  };
}

// Emlékeztetők fül — observer-meghívó és teszt-piszkozat emlékeztetők
export async function RemindersTab() {
  const { sevenDaysAgo, thirtyDaysAgo, threeDaysAgo, oneDayAgo } = getFilterWindows();

  const [pendingReminders, recentlyCompletedInvitations, incompleteDrafts, recentlyCompletedDrafts] =
    await Promise.all([
      prisma.observerInvitation.findMany({
        where: {
          status: "PENDING",
          observerEmail: { not: null },
          expiresAt: { gt: new Date() },
          createdAt: { lt: threeDaysAgo },
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
          createdAt: { lt: threeDaysAgo },
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

      // Incomplete drafts (no completed assessment, 1+ day old, user has email)
      prisma.assessmentDraft.findMany({
        where: {
          updatedAt: { lt: oneDayAgo },
          userProfile: {
            deleted: false,
            email: { not: null },
            assessmentResults: { none: {} },
          },
        },
        select: {
          id: true,
          testType: true,
          answers: true,
          currentPage: true,
          updatedAt: true,
          draftReminderCount: true,
          lastDraftReminderSentAt: true,
          userProfile: { select: { email: true, username: true, locale: true } },
        },
        orderBy: { updatedAt: "asc" },
      }),

      // Recently completed drafts (finished meanwhile — shown as gray "Már kész")
      prisma.assessmentDraft.findMany({
        where: {
          updatedAt: { lt: oneDayAgo, gt: thirtyDaysAgo },
          userProfile: {
            deleted: false,
            email: { not: null },
            assessmentResults: { some: {} },
          },
        },
        select: {
          id: true,
          testType: true,
          answers: true,
          currentPage: true,
          updatedAt: true,
          draftReminderCount: true,
          lastDraftReminderSentAt: true,
          userProfile: { select: { email: true, username: true, locale: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
    ]);

  // Question counts per test type (for progress display) — egyetlen aktív instrumentum
  const questionCounts: Record<string, number> = {
    TRITAN: getTestConfig("TRITAN").questions.length,
  };

  return (
    <>
      <AdminDraftReminderSection
        drafts={[
          ...incompleteDrafts.map((d) => ({
            id: d.id,
            email: d.userProfile.email!,
            username: d.userProfile.username,
            testType: d.testType,
            answeredCount: Object.keys(d.answers as Record<string, number>).length,
            totalCount: questionCounts[d.testType] ?? 0,
            updatedAt: d.updatedAt.toISOString(),
            draftReminderCount: d.draftReminderCount,
            lastDraftReminderSentAt: d.lastDraftReminderSentAt?.toISOString() ?? null,
          })),
          ...recentlyCompletedDrafts.map((d) => ({
            id: d.id,
            email: d.userProfile.email!,
            username: d.userProfile.username,
            testType: d.testType,
            answeredCount: Object.keys(d.answers as Record<string, number>).length,
            totalCount: questionCounts[d.testType] ?? 0,
            updatedAt: d.updatedAt.toISOString(),
            draftReminderCount: d.draftReminderCount,
            lastDraftReminderSentAt: d.lastDraftReminderSentAt?.toISOString() ?? null,
            completedMeanwhile: true as const,
          })),
        ]}
      />

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
