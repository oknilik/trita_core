import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import type { Metadata } from "next";
import { FadeIn } from "@/components/landing/FadeIn";
import { AdminStatCard } from "@/app/admin/_components/AdminStatCard";
import { AdminTableSection } from "@/app/admin/_components/AdminTableSection";
import { AdminMetricsGrid } from "@/app/admin/_components/AdminMetricsGrid";
import { AdminReminderSection } from "@/app/admin/_components/AdminReminderSection";
import { AdminDraftReminderSection } from "@/app/admin/_components/AdminDraftReminderSection";
import { AdminPageTabs } from "@/app/admin/_components/AdminPageTabs";
import { getTestConfig } from "@/lib/questions";
import type { TestType } from "@prisma/client";

export const dynamic = "force-dynamic";

const RESEARCH_TARGET = 50;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: t("meta.adminTitle", locale),
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
  };
}

export default async function AdminPage() {
  await requireAdmin(); // Auth check
  const locale = await getServerLocale();

  // Parallel data fetching
  const [userStats, assessmentStats, invitationStats, feedbackStats, surveyStats, progressStats, demographicsStats] =
    await Promise.all([
      // User metrics
      (async () => {
        const currentYear = new Date().getFullYear();

        const total = await prisma.userProfile.count({
          where: { deleted: false },
        });
        const new7d = await prisma.userProfile.count({
          where: {
            deleted: false,
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        });
        const new30d = await prisma.userProfile.count({
          where: {
            deleted: false,
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        });

        // Age statistics
        const ageStats = await prisma.userProfile.aggregate({
          where: {
            deleted: false,
            birthYear: { not: null },
          },
          _avg: { birthYear: true },
          _min: { birthYear: true },
          _max: { birthYear: true },
        });

        const avgAge = ageStats._avg.birthYear
          ? Math.round(currentYear - ageStats._avg.birthYear)
          : null;
        const minAge = ageStats._max.birthYear
          ? currentYear - ageStats._max.birthYear
          : null; // max year = youngest
        const maxAge = ageStats._min.birthYear
          ? currentYear - ageStats._min.birthYear
          : null; // min year = oldest

        // Calculate median age
        const birthYears = await prisma.userProfile.findMany({
          where: {
            deleted: false,
            birthYear: { not: null },
          },
          select: { birthYear: true },
        });

        let medianAge = null;
        if (birthYears.length > 0) {
          const sortedBirthYears = birthYears
            .map((u: { birthYear: number | null }) => u.birthYear!)
            .sort((a: number, b: number) => a - b);
          const mid = Math.floor(sortedBirthYears.length / 2);
          const medianBirthYear =
            sortedBirthYears.length % 2 === 0
              ? (sortedBirthYears[mid - 1] + sortedBirthYears[mid]) / 2
              : sortedBirthYears[mid];
          medianAge = Math.round(currentYear - medianBirthYear);
        }

        return { total, new7d, new30d, avgAge, medianAge, minAge, maxAge };
      })(),

      // Assessment metrics
      (async () => {
        const total = await prisma.assessmentResult.count();
        const byTestType = await prisma.assessmentResult.groupBy({
          by: ["testType"],
          _count: { id: true },
          orderBy: { _count: { id: "desc" } },
        });
        const observerTotal = await prisma.observerAssessment.count();
        const byUserTestType = await prisma.userProfile.groupBy({
          by: ["testType"],
          _count: { id: true },
          where: { deleted: false, testType: { not: null } },
          orderBy: { _count: { id: "desc" } },
        });
        // Observer breakdown by test type (via invitation relation)
        const [obsHexaco, obsHexacoMod, obsBigFive, avgConfidence, obsByRelationship] =
          await Promise.all([
            prisma.observerAssessment.count({ where: { invitation: { testType: "HEXACO" } } }),
            prisma.observerAssessment.count({ where: { invitation: { testType: "HEXACO_MODIFIED" } } }),
            prisma.observerAssessment.count({ where: { invitation: { testType: "BIG_FIVE" } } }),
            prisma.observerAssessment.aggregate({ _avg: { confidence: true } }),
            prisma.observerAssessment.groupBy({
              by: ["relationshipType"],
              _count: { id: true },
              orderBy: { _count: { id: "desc" } },
            }),
          ]);
        const observerByTestType = [
          { testType: "HEXACO", count: obsHexaco },
          { testType: "HEXACO_MODIFIED", count: obsHexacoMod },
          { testType: "BIG_FIVE", count: obsBigFive },
        ];
        const avgObserverConfidence = avgConfidence._avg.confidence
          ? Math.round(avgConfidence._avg.confidence * 10) / 10
          : null;
        return { total, byTestType, observerTotal, byUserTestType, observerByTestType, avgObserverConfidence, obsByRelationship };
      })(),

      // Invitation metrics — only live (PENDING + COMPLETED), excluding CANCELED/EXPIRED
      (async () => {
        const total = await prisma.observerInvitation.count({
          where: { status: { in: ["PENDING", "COMPLETED"] } },
        });
        const byStatus = await prisma.observerInvitation.groupBy({
          by: ["status"],
          _count: { id: true },
          where: { status: { in: ["PENDING", "COMPLETED"] } },
        });
        const [pendingEmail, completedEmail] = await Promise.all([
          prisma.observerInvitation.count({
            where: { status: "PENDING", observerEmail: { not: null } },
          }),
          prisma.observerInvitation.count({
            where: { status: "COMPLETED", observerEmail: { not: null } },
          }),
        ]);
        return { total, byStatus, pendingEmail, completedEmail };
      })(),

      // Feedback metrics
      (async () => {
        const satisfactionCount = await prisma.satisfactionFeedback.count();
        const interestedInUpdatesCount = await prisma.satisfactionFeedback.count({
          where: { interestedInUpdates: true },
        });
        const avgScores = await prisma.satisfactionFeedback.aggregate({
          _avg: {
            agreementScore: true,
            observerFeedbackUsefulness: true,
            siteUsefulness: true,
          },
        });
        const dimensionCount = await prisma.dimensionFeedback.count();

        // Dimension feedback by test type
        const [dimensionAvgBigFive, dimensionAvgHexaco, dimensionAvgHexacoMod] = await Promise.all([
          prisma.dimensionFeedback.groupBy({
            by: ["dimensionCode"],
            _avg: { accuracyRating: true },
            _count: { id: true },
            where: { assessmentResult: { testType: "BIG_FIVE" } },
            orderBy: { _avg: { accuracyRating: "desc" } },
          }),
          prisma.dimensionFeedback.groupBy({
            by: ["dimensionCode"],
            _avg: { accuracyRating: true },
            _count: { id: true },
            where: { assessmentResult: { testType: "HEXACO" } },
            orderBy: { _avg: { accuracyRating: "desc" } },
          }),
          prisma.dimensionFeedback.groupBy({
            by: ["dimensionCode"],
            _avg: { accuracyRating: true },
            _count: { id: true },
            where: { assessmentResult: { testType: "HEXACO_MODIFIED" } },
            orderBy: { _avg: { accuracyRating: "desc" } },
          }),
        ]);

        return {
          satisfactionCount,
          interestedInUpdatesCount,
          avgScores,
          dimensionCount,
          dimensionAvgBigFive,
          dimensionAvgHexaco,
          dimensionAvgHexacoMod,
        };
      })(),

      // Research survey metrics
      (async () => {
        const count = await prisma.researchSurvey.count();
        const byPriorTest = await prisma.researchSurvey.groupBy({
          by: ["priorTest"],
          _count: { id: true },
          orderBy: { _count: { id: "desc" } },
        });
        const byHas360 = await prisma.researchSurvey.groupBy({
          by: ["has360Process"],
          _count: { id: true },
        });
        const avgs = await prisma.researchSurvey.aggregate({
          _avg: {
            selfAccuracy: true,
            personalityImportance: true,
            observerUsefulness: true,
          },
        });
        return { count, byPriorTest, byHas360, avgs };
      })(),

      // Research progress + completion funnel + feature interest
      (async () => {
        const [onboardedCount, featureInterest, inviterGroups] = await Promise.all([
          prisma.userProfile.count({ where: { deleted: false, onboardedAt: { not: null } } }),
          prisma.featureInterest.groupBy({
            by: ["featureKey"],
            _count: { id: true },
            orderBy: { featureKey: "asc" },
          }),
          prisma.observerInvitation.groupBy({
            by: ["inviterId"],
            where: { status: "COMPLETED" },
            _count: { id: true },
          }),
        ]);
        const usersWithTwoPlusObservers = inviterGroups.filter(
          (g: { _count: { id: number } }) => g._count.id >= 2
        ).length;
        return { onboardedCount, featureInterest, usersWithTwoPlusObservers };
      })(),

      // Demographics
      (async () => {
        const [byGender, byEducation, byOccupationStatus, byCountry] = await Promise.all([
          prisma.userProfile.groupBy({
            by: ["gender"],
            _count: { id: true },
            where: { deleted: false, gender: { not: null } },
            orderBy: { _count: { id: "desc" } },
          }),
          prisma.userProfile.groupBy({
            by: ["education"],
            _count: { id: true },
            where: { deleted: false, education: { not: null } },
            orderBy: { _count: { id: "desc" } },
          }),
          prisma.userProfile.groupBy({
            by: ["occupationStatus"],
            _count: { id: true },
            where: { deleted: false, occupationStatus: { not: null } },
            orderBy: { _count: { id: "desc" } },
          }),
          prisma.userProfile.groupBy({
            by: ["country"],
            _count: { id: true },
            where: { deleted: false, country: { not: null } },
            orderBy: { _count: { id: "desc" } },
            take: 10,
          }),
        ]);
        return { byGender, byEducation, byOccupationStatus, byCountry };
      })(),
    ]);

  // Freeform feedback (latest 15)
  const freeformFeedbacks = await prisma.satisfactionFeedback.findMany({
    where: { freeformFeedback: { not: null } },
    select: { freeformFeedback: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  // Pending reminders (3+ days, email invites only)
  const [pendingReminders, recentlyCompletedInvitations, incompleteDrafts, recentlyCompletedDrafts] = await Promise.all([
  prisma.observerInvitation.findMany({
    where: {
      status: "PENDING",
      observerEmail: { not: null },
      expiresAt: { gt: new Date() },
      createdAt: { lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
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

  // Recently completed invitations (completed in last 7 days — show as gray "Már kész")
  prisma.observerInvitation.findMany({
    where: {
      status: "COMPLETED",
      observerEmail: { not: null },
      completedAt: { gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      createdAt: { lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
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
      updatedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
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

  // Recently completed drafts (user finished since last page load — show as gray "Már kész")
  prisma.assessmentDraft.findMany({
    where: {
      updatedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000), gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
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

  // Question counts per test type (for progress display)
  const questionCounts: Record<string, number> = {
    HEXACO: getTestConfig("HEXACO" as TestType).questions.length,
    HEXACO_MODIFIED: getTestConfig("HEXACO_MODIFIED" as TestType).questions.length,
    BIG_FIVE: getTestConfig("BIG_FIVE" as TestType).questions.length,
  };

  // Calculate metrics
  const growthRate =
    userStats.total > 0
      ? Math.round((userStats.new30d / userStats.total) * 100)
      : 0;

  const completedInvites =
    invitationStats.byStatus.find((s: { status: string; _count: { id: number } }) => s.status === "COMPLETED")?._count
      .id ?? 0;
  const conversionRate =
    invitationStats.total > 0
      ? Math.round((completedInvites / invitationStats.total) * 100)
      : 0;

  const pendingInvites =
    invitationStats.byStatus.find((s: { status: string; _count: { id: number } }) => s.status === "PENDING")?._count
      .id ?? 0;
  const pendingLink = pendingInvites - invitationStats.pendingEmail;
  const completedLink = completedInvites - invitationStats.completedEmail;

  const selfCount = assessmentStats.total;
  const observerCount = assessmentStats.observerTotal;

  // Format survey averages
  const avgSelfAccuracy = surveyStats.avgs._avg.selfAccuracy
    ? Math.round(surveyStats.avgs._avg.selfAccuracy * 10) / 10
    : null;
  const avgPersonalityImportance = surveyStats.avgs._avg.personalityImportance
    ? Math.round(surveyStats.avgs._avg.personalityImportance * 10) / 10
    : null;
  const avgSurveyObserverUsefulness = surveyStats.avgs._avg.observerUsefulness
    ? Math.round(surveyStats.avgs._avg.observerUsefulness * 10) / 10
    : null;

  // Format average scores
  const avgAgreement = feedbackStats.avgScores._avg.agreementScore
    ? Math.round(feedbackStats.avgScores._avg.agreementScore * 10) / 10
    : null;
  const avgObserverUsefulness =
    feedbackStats.avgScores._avg.observerFeedbackUsefulness
      ? Math.round(
          feedbackStats.avgScores._avg.observerFeedbackUsefulness * 10
        ) / 10
      : null;
  const avgSiteUsefulness = feedbackStats.avgScores._avg.siteUsefulness
    ? Math.round(feedbackStats.avgScores._avg.siteUsefulness * 10) / 10
    : null;

  // Research target progress per test type
  const testTypeOrder = ["HEXACO", "HEXACO_MODIFIED", "BIG_FIVE"];
  const researchProgress = testTypeOrder.map((type) => {
    const count =
      assessmentStats.byTestType.find(
        (t: { testType: string | null; _count: { id: number } }) => t.testType === type
      )?._count.id ?? 0;
    return { type, count, pct: Math.min(Math.round((count / RESEARCH_TARGET) * 100), 100) };
  });

  // Funnel steps
  const funnelSteps = [
    { label: "Regisztrált", count: userStats.total },
    { label: "Onboarded", count: progressStats.onboardedCount },
    { label: "Teszt kitöltve", count: assessmentStats.total },
    { label: "Survey kitöltve", count: surveyStats.count },
    { label: "Van 2+ observer", count: progressStats.usersWithTwoPlusObservers },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-purple-50/40 to-white px-4 py-8 md:px-6">
      <div className="mx-auto max-w-7xl">
        {/* Hero */}
        <FadeIn>
          <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
            {t("admin.title", locale)}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {t("admin.subtitle", locale)}
          </p>
        </FadeIn>

        {/* KPI Cards */}
        <FadeIn delay={0.1}>
          <AdminMetricsGrid>
            <AdminStatCard
              title={t("admin.totalUsers", locale)}
              value={userStats.total}
              subtitle={
                userStats.avgAge !== null
                  ? `${t("admin.avgAge", locale)}: ${userStats.avgAge} | ${t("admin.medianAge", locale)}: ${userStats.medianAge} | ${t("admin.ageRange", locale)}: ${userStats.minAge}-${userStats.maxAge}`
                  : `${t("admin.new7days", locale)}: ${userStats.new7d} | ${t("admin.new30days", locale)}: ${userStats.new30d}`
              }
              color="#6366F1"
              icon="👥"
              trend={{ value: growthRate, period: "30d" }}
            />
            <AdminStatCard
              title={t("admin.totalAssessments", locale)}
              value={assessmentStats.total}
              subtitle={`Self: ${selfCount} | Observer: ${observerCount}`}
              color="#8B5CF6"
              icon="📋"
            />
            <AdminStatCard
              title="Összes élő meghívó"
              value={invitationStats.total}
              subtitle={`${t("admin.conversionRate", locale)}: ${conversionRate}%`}
              color="#10B981"
              icon="✉️"
            />
            <AdminStatCard
              title={t("admin.totalFeedback", locale)}
              value={feedbackStats.satisfactionCount + feedbackStats.dimensionCount}
              subtitle={`Satisfaction: ${feedbackStats.satisfactionCount} | Dimension: ${feedbackStats.dimensionCount} | Opt-in: ${feedbackStats.interestedInUpdatesCount}`}
              color="#F59E0B"
              icon="💬"
            />
          </AdminMetricsGrid>
        </FadeIn>

        <AdminPageTabs
          reminderCount={
            pendingReminders.filter((inv) => {
              if (!inv.lastReminderSentAt) return true;
              return Date.now() - new Date(inv.lastReminderSentAt).getTime() >= 3 * 24 * 60 * 60 * 1000;
            }).length +
            incompleteDrafts.filter((d) => {
              if (!d.lastDraftReminderSentAt) return true;
              return Date.now() - new Date(d.lastDraftReminderSentAt).getTime() >= 3 * 24 * 60 * 60 * 1000;
            }).length
          }
          remindersContent={
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
            </>
          }
          overviewContent={
            <>
        {/* Research Target Progress */}
        <FadeIn delay={0.15}>
          <div className="mt-8 rounded-xl border border-gray-100 bg-white p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Kutatási célszámok</h2>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
                Cél: {RESEARCH_TARGET} / teszttípus
              </span>
            </div>
            <div className="space-y-5">
              {researchProgress.map(({ type, count, pct }) => (
                <div key={type}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-gray-700">{type}</span>
                    <span className="text-sm font-bold text-gray-900">
                      {count} / {RESEARCH_TARGET}
                      <span className="ml-2 text-xs font-normal text-gray-400">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Completion Funnel */}
        <FadeIn delay={0.18}>
          <div className="mt-8 rounded-xl border border-gray-100 bg-white p-6 md:p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Completion funnel</h2>
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:gap-0">
              {funnelSteps.map((step, i) => {
                const pct = funnelSteps[0].count > 0
                  ? Math.round((step.count / funnelSteps[0].count) * 100)
                  : 0;
                const isLast = i === funnelSteps.length - 1;
                return (
                  <div key={step.label} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-xs font-semibold text-gray-500 text-center">{step.label}</span>
                    <span className="text-2xl font-bold text-gray-900">{step.count}</span>
                    <span className="text-xs text-gray-400">{pct}%</span>
                    {!isLast && (
                      <span className="hidden md:block text-gray-300 text-xl self-center mt-1">→</span>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Drop-off bars */}
            <div className="mt-4 grid grid-cols-1 gap-1 md:grid-cols-5">
              {funnelSteps.map((step, i) => {
                const pct = funnelSteps[0].count > 0
                  ? Math.round((step.count / funnelSteps[0].count) * 100)
                  : 0;
                const colors = ["#6366F1", "#8B5CF6", "#A78BFA", "#10B981", "#0EA5E9"];
                return (
                  <div key={step.label} className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: colors[i] }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </FadeIn>

        {/* Test Type Breakdown */}
        <FadeIn delay={0.2}>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <AdminTableSection
              title={t("admin.assessmentsTitle", locale)}
              description="Assessment results by test type"
              rows={assessmentStats.byTestType.map((item: { testType: string | null; _count: { id: number } }) => ({
                label: item.testType ?? "Unknown",
                value: item._count.id,
                color: "#8B5CF6",
              }))}
            />
            <AdminTableSection
              title="Assigned Test Types"
              description="Users assigned per test type"
              rows={assessmentStats.byUserTestType.map((item: { testType: string | null; _count: { id: number } }) => ({
                label: item.testType ?? "Unknown",
                value: item._count.id,
                color: "#6366F1",
              }))}
            />
          </div>
        </FadeIn>

        {/* Observer breakdown by test type + relationship */}
        <FadeIn delay={0.25}>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <AdminTableSection
              title="Observer kitöltések teszttípusonként"
              description={`Összes: ${assessmentStats.observerTotal}${assessmentStats.avgObserverConfidence !== null ? ` · Átlag konfidencia: ${assessmentStats.avgObserverConfidence}/5` : ""}`}
              rows={assessmentStats.observerByTestType.map((item: { testType: string; count: number }) => ({
                label: item.testType,
                value: item.count,
                color: "#10B981",
              }))}
            />
            <AdminTableSection
              title="Observer kapcsolat típusa"
              description="Kapcsolat megoszlása az observer kitöltők között"
              rows={assessmentStats.obsByRelationship.map((item: { relationshipType: string; _count: { id: number } }) => ({
                label: item.relationshipType,
                value: item._count.id,
                color: "#6366F1",
              }))}
            />
          </div>
        </FadeIn>

        {/* Invitation Status Breakdown */}
        <FadeIn delay={0.3}>
          <AdminTableSection
            title={t("admin.invitationsTitle", locale)}
            rows={invitationStats.byStatus.map((item: { status: string; _count: { id: number } }) => {
              const statusColors: Record<string, string> = {
                COMPLETED: "#10B981",
                PENDING: "#F59E0B",
              };
              const emailCount = item.status === "PENDING" ? invitationStats.pendingEmail : item.status === "COMPLETED" ? invitationStats.completedEmail : null;
              const linkCount = item.status === "PENDING" ? pendingLink : item.status === "COMPLETED" ? completedLink : null;
              return {
                label: t(`common.status${item.status.charAt(0)}${item.status.slice(1).toLowerCase()}`, locale),
                value: item._count.id,
                subtitle: emailCount !== null ? `Email: ${emailCount} | Link: ${linkCount}` : undefined,
                color: statusColors[item.status] ?? "#6366F1",
              };
            })}
          />
        </FadeIn>

        {/* Demographics */}
        <FadeIn delay={0.32}>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <AdminTableSection
              title="Nem megoszlása"
              description={`${demographicsStats.byGender.reduce((s: number, g: { _count: { id: number } }) => s + g._count.id, 0)} kitöltő adott meg nemet`}
              rows={demographicsStats.byGender.map((item: { gender: string | null; _count: { id: number } }) => ({
                label: item.gender ?? "–",
                value: item._count.id,
                color: "#8B5CF6",
              }))}
            />
            <AdminTableSection
              title="Iskolai végzettség"
              description="Onboarding-ban megadott végzettség"
              rows={demographicsStats.byEducation.map((item: { education: string | null; _count: { id: number } }) => ({
                label: item.education ?? "–",
                value: item._count.id,
                color: "#6366F1",
              }))}
            />
            <AdminTableSection
              title="Foglalkozási státusz"
              description="Munkavégzési státusz megoszlása"
              rows={demographicsStats.byOccupationStatus.map((item: { occupationStatus: string | null; _count: { id: number } }) => ({
                label: item.occupationStatus ?? "–",
                value: item._count.id,
                color: "#F59E0B",
              }))}
            />
            <AdminTableSection
              title="Top 10 ország"
              description="Legtöbb kitöltő szerint"
              rows={demographicsStats.byCountry.map((item: { country: string | null; _count: { id: number } }) => ({
                label: item.country ?? "–",
                value: item._count.id,
                color: "#10B981",
              }))}
            />
          </div>
        </FadeIn>

        {/* Feature interest (fake door) */}
        <FadeIn delay={0.34}>
          <div className="mt-8 rounded-xl border border-gray-100 bg-white p-6 md:p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Feature interest (fake door)</h2>
            {progressStats.featureInterest.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {progressStats.featureInterest.map((item: { featureKey: string; _count: { id: number } }) => (
                  <div key={item.featureKey} className="rounded-lg border border-indigo-100 bg-indigo-50 p-4">
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{item.featureKey}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{item._count.id}</p>
                    <p className="text-xs text-gray-400 mt-1">érdeklődő</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Még nincs adat.</p>
            )}
          </div>
        </FadeIn>

        {/* Research Survey Stats */}
        <FadeIn delay={0.4}>
          <div className="mt-8 rounded-xl border border-gray-100 bg-white p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Research Survey</h2>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
                {surveyStats.count} responses
              </span>
            </div>

            {/* Averages */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
              <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4">
                <p className="text-sm font-semibold text-gray-600">Self-accuracy (Avg)</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {avgSelfAccuracy !== null ? `${avgSelfAccuracy}/5` : "–"}
                </p>
              </div>
              <div className="rounded-lg border border-purple-100 bg-purple-50 p-4">
                <p className="text-sm font-semibold text-gray-600">Personality importance (Avg)</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {avgPersonalityImportance !== null ? `${avgPersonalityImportance}/5` : "–"}
                </p>
              </div>
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-gray-600">Observer usefulness (Avg)</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {avgSurveyObserverUsefulness !== null ? `${avgSurveyObserverUsefulness}/5` : "–"}
                </p>
              </div>
            </div>

            {/* Prior test & 360 distributions */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Prior personality test</h3>
                <div className="space-y-2">
                  {surveyStats.byPriorTest.length > 0 ? (
                    surveyStats.byPriorTest.map((item: { priorTest: string; _count: { id: number } }) => (
                      <div key={item.priorTest} className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700 uppercase">{item.priorTest}</span>
                        <span className="text-gray-900">
                          {item._count.id}
                          <span className="ml-1 text-gray-400">
                            ({surveyStats.count > 0 ? Math.round((item._count.id / surveyStats.count) * 100) : 0}%)
                          </span>
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500">No data yet</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Has 360 process</h3>
                <div className="space-y-2">
                  {surveyStats.byHas360.filter((item: { has360Process: string | null }) => item.has360Process !== null).length > 0 ? (
                    surveyStats.byHas360
                      .filter((item: { has360Process: string | null; _count: { id: number } }) => item.has360Process !== null)
                      .map((item: { has360Process: string | null; _count: { id: number } }) => (
                        <div key={item.has360Process} className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-700 uppercase">{item.has360Process}</span>
                          <span className="text-gray-900">{item._count.id}</span>
                        </div>
                      ))
                  ) : (
                    <p className="text-xs text-gray-500">No data yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Feedback Insights */}
        <FadeIn delay={0.5}>
          <div className="mt-8 rounded-xl border border-gray-100 bg-white p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {t("admin.feedbackTitle", locale)}
              </h2>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
                {feedbackStats.satisfactionCount} responses · {feedbackStats.interestedInUpdatesCount} opt-in
              </span>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4">
                <p className="text-sm font-semibold text-gray-600">
                  Agreement (Avg)
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {avgAgreement !== null ? `${avgAgreement}/5` : "–"}
                </p>
              </div>
              <div className="rounded-lg border border-purple-100 bg-purple-50 p-4">
                <p className="text-sm font-semibold text-gray-600">
                  Observer Usefulness (Avg)
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {avgObserverUsefulness !== null ? `${avgObserverUsefulness}/5` : "–"}
                </p>
              </div>
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-gray-600">
                  Site Usefulness (Avg)
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {avgSiteUsefulness !== null ? `${avgSiteUsefulness}/5` : "–"}
                </p>
              </div>
            </div>

            {/* Dimension Accuracy by Test Type */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Dimension Accuracy by Test Type
              </h3>

              {/* Big Five */}
              <div className="mb-6">
                <h4 className="text-xs font-semibold text-indigo-600 mb-2">
                  Big Five
                </h4>
                <div className="space-y-2">
                  {feedbackStats.dimensionAvgBigFive.length > 0 ? (
                    feedbackStats.dimensionAvgBigFive.map((dim: { dimensionCode: string; _avg: { accuracyRating: number | null }; _count: { id: number } }) => (
                      <div
                        key={dim.dimensionCode}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="font-medium text-gray-700">
                          {dim.dimensionCode}
                        </span>
                        <span className="text-gray-900">
                          {dim._avg.accuracyRating
                            ? Math.round(dim._avg.accuracyRating * 10) / 10
                            : 0}
                          /5 ({dim._count.id} ratings)
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500">No feedback yet.</p>
                  )}
                </div>
              </div>

              {/* HEXACO */}
              <div className="mb-6">
                <h4 className="text-xs font-semibold text-purple-600 mb-2">
                  HEXACO
                </h4>
                <div className="space-y-2">
                  {feedbackStats.dimensionAvgHexaco.length > 0 ? (
                    feedbackStats.dimensionAvgHexaco.map((dim: { dimensionCode: string; _avg: { accuracyRating: number | null }; _count: { id: number } }) => (
                      <div
                        key={dim.dimensionCode}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="font-medium text-gray-700">
                          {dim.dimensionCode}
                        </span>
                        <span className="text-gray-900">
                          {dim._avg.accuracyRating
                            ? Math.round(dim._avg.accuracyRating * 10) / 10
                            : 0}
                          /5 ({dim._count.id} ratings)
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500">No feedback yet.</p>
                  )}
                </div>
              </div>

              {/* HEXACO Modified */}
              <div>
                <h4 className="text-xs font-semibold text-emerald-600 mb-2">
                  HEXACO Modified
                </h4>
                <div className="space-y-2">
                  {feedbackStats.dimensionAvgHexacoMod.length > 0 ? (
                    feedbackStats.dimensionAvgHexacoMod.map((dim: { dimensionCode: string; _avg: { accuracyRating: number | null }; _count: { id: number } }) => (
                      <div
                        key={dim.dimensionCode}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="font-medium text-gray-700">
                          {dim.dimensionCode}
                        </span>
                        <span className="text-gray-900">
                          {dim._avg.accuracyRating
                            ? Math.round(dim._avg.accuracyRating * 10) / 10
                            : 0}
                          /5 ({dim._count.id} ratings)
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500">No feedback yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Freeform feedback */}
            {freeformFeedbacks.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Szöveges visszajelzések (legutóbbi {freeformFeedbacks.length})
                </h3>
                <div className="space-y-3">
                  {freeformFeedbacks.map((fb: { freeformFeedback: string | null; createdAt: Date }, i: number) => (
                    <div key={i} className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                      <p className="text-sm text-gray-700">{fb.freeformFeedback}</p>
                      <p className="mt-1 text-xs text-gray-400">
                        {fb.createdAt.toLocaleDateString("hu-HU")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </FadeIn>
            </>
          }
        />
      </div>
    </main>
  );
}
