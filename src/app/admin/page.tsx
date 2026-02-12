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
        return { total, new7d, new30d };
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
        const dimensionAvg = await prisma.dimensionFeedback.groupBy({
          by: ["dimensionCode"],
          _avg: { accuracyRating: true },
          _count: { id: true },
          orderBy: { _avg: { accuracyRating: "desc" } },
        });
        return { satisfactionCount, avgScores, dimensionCount, dimensionAvg };
      })(),
    ]);

  // Calculate metrics
  const growthRate =
    userStats.total > 0
      ? Math.round((userStats.new30d / userStats.total) * 100)
      : 0;

  const completedInvites =
    invitationStats.byStatus.find((s) => s.status === "COMPLETED")?._count
      .id ?? 0;
  const conversionRate =
    invitationStats.total > 0
      ? Math.round((completedInvites / invitationStats.total) * 100)
      : 0;

  const selfCount =
    assessmentStats.selfVsObserver.find((s) => s.isSelfAssessment)?._count
      .id ?? 0;
  const observerCount =
    assessmentStats.selfVsObserver.find((s) => !s.isSelfAssessment)?._count
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
              subtitle={`${t("admin.new7days", locale)}: ${userStats.new7d} | ${t("admin.new30days", locale)}: ${userStats.new30d}`}
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

            {/* Top Dimensions */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-900">
                Top Dimension Accuracy
              </h3>
              <div className="mt-4 space-y-2">
                {feedbackStats.dimensionAvg.slice(0, 6).map((dim) => (
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
                ))}
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </main>
  );
}
