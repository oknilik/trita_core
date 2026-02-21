import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import type { Metadata } from "next";
import { FadeIn } from "@/components/landing/FadeIn";
import { AdminStatCard } from "@/app/admin/_components/AdminStatCard";
import { AdminTableSection } from "@/app/admin/_components/AdminTableSection";
import { AdminMetricsGrid } from "@/app/admin/_components/AdminMetricsGrid";

export const dynamic = "force-dynamic";

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
  const [userStats, assessmentStats, invitationStats, feedbackStats, surveyStats] =
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
        const selfVsObserver = await prisma.assessmentResult.groupBy({
          by: ["isSelfAssessment"],
          _count: { id: true },
        });
        const byUserTestType = await prisma.userProfile.groupBy({
          by: ["testType"],
          _count: { id: true },
          where: { deleted: false, testType: { not: null } },
          orderBy: { _count: { id: "desc" } },
        });
        return { total, byTestType, selfVsObserver, byUserTestType };
      })(),

      // Invitation metrics
      (async () => {
        const total = await prisma.observerInvitation.count();
        const byStatus = await prisma.observerInvitation.groupBy({
          by: ["status"],
          _count: { id: true },
        });
        return { total, byStatus };
      })(),

      // Feedback metrics
      (async () => {
        const satisfactionCount = await prisma.satisfactionFeedback.count();
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
    ]);

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

  const selfCount =
    assessmentStats.selfVsObserver.find((s: { isSelfAssessment: boolean; _count: { id: number } }) => s.isSelfAssessment)?._count
      .id ?? 0;
  const observerCount =
    assessmentStats.selfVsObserver.find((s: { isSelfAssessment: boolean; _count: { id: number } }) => !s.isSelfAssessment)?._count
      .id ?? 0;

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
    : 0;
  const avgObserverUsefulness =
    feedbackStats.avgScores._avg.observerFeedbackUsefulness
      ? Math.round(
          feedbackStats.avgScores._avg.observerFeedbackUsefulness * 10
        ) / 10
      : 0;
  const avgSiteUsefulness = feedbackStats.avgScores._avg.siteUsefulness
    ? Math.round(feedbackStats.avgScores._avg.siteUsefulness * 10) / 10
    : 0;

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-4 py-8 md:px-6">
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
              title={t("admin.totalInvitations", locale)}
              value={invitationStats.total}
              subtitle={`${t("admin.conversionRate", locale)}: ${conversionRate}%`}
              color="#10B981"
              icon="✉️"
            />
            <AdminStatCard
              title={t("admin.totalFeedback", locale)}
              value={feedbackStats.satisfactionCount + feedbackStats.dimensionCount}
              subtitle={`Satisfaction: ${feedbackStats.satisfactionCount} | Dimension: ${feedbackStats.dimensionCount}`}
              color="#F59E0B"
              icon="💬"
            />
          </AdminMetricsGrid>
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

        {/* Invitation Status Breakdown */}
        <FadeIn delay={0.3}>
          <AdminTableSection
            title={t("admin.invitationsTitle", locale)}
            rows={invitationStats.byStatus.map((item: { status: string; _count: { id: number } }) => {
              const statusColors: Record<string, string> = {
                COMPLETED: "#10B981",
                PENDING: "#F59E0B",
                EXPIRED: "#6B7280",
                CANCELED: "#EF4444",
              };
              return {
                label: t(`common.status${item.status.charAt(0)}${item.status.slice(1).toLowerCase()}`, locale),
                value: item._count.id,
                color: statusColors[item.status] ?? "#6366F1",
              };
            })}
          />
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
            <h2 className="text-xl font-semibold text-gray-900">
              {t("admin.feedbackTitle", locale)}
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4">
                <p className="text-sm font-semibold text-gray-600">
                  Agreement (Avg)
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {avgAgreement}/5
                </p>
              </div>
              <div className="rounded-lg border border-purple-100 bg-purple-50 p-4">
                <p className="text-sm font-semibold text-gray-600">
                  Observer Usefulness (Avg)
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {avgObserverUsefulness}/5
                </p>
              </div>
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-gray-600">
                  Site Usefulness (Avg)
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {avgSiteUsefulness}/5
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
                    <p className="text-xs text-gray-500">No feedback yet</p>
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
                    <p className="text-xs text-gray-500">No feedback yet</p>
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
                    <p className="text-xs text-gray-500">No feedback yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </main>
  );
}
