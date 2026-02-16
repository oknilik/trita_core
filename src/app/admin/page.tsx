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
  return { title: t("meta.adminTitle", locale) };
}

export default async function AdminPage() {
  await requireAdmin(); // Auth check
  const locale = await getServerLocale();

  // Parallel data fetching
  const [userStats, assessmentStats, invitationStats, feedbackStats] =
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
        return { total, byTestType, selfVsObserver };
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
          <AdminTableSection
            title={t("admin.assessmentsTitle", locale)}
            description={t("admin.byTestType", locale)}
            rows={assessmentStats.byTestType.map((item) => ({
              label: item.testType ?? "Unknown",
              value: item._count.id,
              color: "#8B5CF6",
            }))}
          />
        </FadeIn>

        {/* Invitation Status Breakdown */}
        <FadeIn delay={0.3}>
          <AdminTableSection
            title={t("admin.invitationsTitle", locale)}
            rows={invitationStats.byStatus.map((item) => {
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

        {/* Feedback Insights */}
        <FadeIn delay={0.4}>
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
                    feedbackStats.dimensionAvgBigFive.map((dim) => (
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
                    feedbackStats.dimensionAvgHexaco.map((dim) => (
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
                    feedbackStats.dimensionAvgHexacoMod.map((dim) => (
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
