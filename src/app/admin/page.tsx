import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import type { Metadata } from "next";
import { Suspense } from "react";
import { FadeIn } from "@/components/landing/FadeIn";
import { AdminStatCard } from "@/app/admin/_components/AdminStatCard";
import { AdminTableSection } from "@/app/admin/_components/AdminTableSection";
import { AdminMetricsGrid } from "@/app/admin/_components/AdminMetricsGrid";
import { AdminReminderSection } from "@/app/admin/_components/AdminReminderSection";
import { AdminTabNav } from "@/app/admin/_components/AdminTabNav";

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

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAdmin();
  const locale = await getServerLocale();
  const { tab } = await searchParams;
  const activeTab = tab === "research" || tab === "reminders" ? tab : "overview";

  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000);

  // Reminders tab — only fetch what's needed
  if (activeTab === "reminders") {
    const pendingReminders = await prisma.observerInvitation.findMany({
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
    });

    return (
      <main className="min-h-dvh bg-[#faf9f6] px-4 py-10 md:px-6">
        <div className="mx-auto max-w-7xl">
          <FadeIn>
            <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a]">// admin</p>
            <h1 className="mt-1 font-playfair text-3xl text-[#1a1814] md:text-4xl">
              {t("admin.title", locale)}
            </h1>
            <p className="mt-2 text-sm text-[#5a5650]">
              {t("admin.subtitle", locale)}
            </p>
          </FadeIn>

          <FadeIn delay={0.05}>
            <Suspense>
              <AdminTabNav />
            </Suspense>
          </FadeIn>

          <FadeIn delay={0.1}>
            <AdminReminderSection
              invitations={pendingReminders.map((inv) => ({
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
              }))}
            />
          </FadeIn>
        </div>
      </main>
    );
  }

  // Overview + Research: fetch all data in parallel
  const [userStats, assessmentStats, invitationStats, feedbackStats, surveyStats] =
    await Promise.all([
      (async () => {
        const currentYear = new Date().getFullYear();

        const total = await prisma.userProfile.count({
          where: { deleted: false },
        });
        const new7d = await prisma.userProfile.count({
          where: { deleted: false, createdAt: { gte: sevenDaysAgo } },
        });
        const new30d = await prisma.userProfile.count({
          where: { deleted: false, createdAt: { gte: thirtyDaysAgo } },
        });

        const ageStats = await prisma.userProfile.aggregate({
          where: { deleted: false, birthYear: { not: null } },
          _avg: { birthYear: true },
          _min: { birthYear: true },
          _max: { birthYear: true },
        });

        const avgAge = ageStats._avg.birthYear
          ? Math.round(currentYear - ageStats._avg.birthYear)
          : null;
        const minAge = ageStats._max.birthYear
          ? currentYear - ageStats._max.birthYear
          : null;
        const maxAge = ageStats._min.birthYear
          ? currentYear - ageStats._min.birthYear
          : null;

        const birthYears = await prisma.userProfile.findMany({
          where: { deleted: false, birthYear: { not: null } },
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
        return { total, byTestType, observerTotal, byUserTestType };
      })(),

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
        const dimensionAvgHexaco = await prisma.dimensionFeedback.groupBy({
          by: ["dimensionCode"],
          _avg: { accuracyRating: true },
          _count: { id: true },
          where: { assessmentResult: { testType: "HEXACO" } },
          orderBy: { _avg: { accuracyRating: "desc" } },
        });
        return { satisfactionCount, avgScores, dimensionCount, dimensionAvgHexaco };
      })(),

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

  // Derived metrics
  const growthRate =
    userStats.total > 0
      ? Math.round((userStats.new30d / userStats.total) * 100)
      : 0;

  const completedInvites =
    invitationStats.byStatus.find(
      (s: { status: string; _count: { id: number } }) => s.status === "COMPLETED"
    )?._count.id ?? 0;
  const conversionRate =
    invitationStats.total > 0
      ? Math.round((completedInvites / invitationStats.total) * 100)
      : 0;

  const pendingInvites =
    invitationStats.byStatus.find(
      (s: { status: string; _count: { id: number } }) => s.status === "PENDING"
    )?._count.id ?? 0;
  const pendingLink = pendingInvites - invitationStats.pendingEmail;
  const completedLink = completedInvites - invitationStats.completedEmail;

  const selfCount = assessmentStats.total;
  const observerCount = assessmentStats.observerTotal;

  const avgSelfAccuracy = surveyStats.avgs._avg.selfAccuracy
    ? Math.round(surveyStats.avgs._avg.selfAccuracy * 10) / 10
    : null;
  const avgPersonalityImportance = surveyStats.avgs._avg.personalityImportance
    ? Math.round(surveyStats.avgs._avg.personalityImportance * 10) / 10
    : null;
  const avgSurveyObserverUsefulness = surveyStats.avgs._avg.observerUsefulness
    ? Math.round(surveyStats.avgs._avg.observerUsefulness * 10) / 10
    : null;

  const avgAgreement = feedbackStats.avgScores._avg.agreementScore
    ? Math.round(feedbackStats.avgScores._avg.agreementScore * 10) / 10
    : 0;
  const avgObserverUsefulness = feedbackStats.avgScores._avg.observerFeedbackUsefulness
    ? Math.round(feedbackStats.avgScores._avg.observerFeedbackUsefulness * 10) / 10
    : 0;
  const avgSiteUsefulness = feedbackStats.avgScores._avg.siteUsefulness
    ? Math.round(feedbackStats.avgScores._avg.siteUsefulness * 10) / 10
    : 0;

  return (
    <main className="min-h-dvh bg-[#faf9f6] px-4 py-10 md:px-6">
      <div className="mx-auto max-w-7xl">
        <FadeIn>
          <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a]">// admin</p>
          <h1 className="mt-1 font-playfair text-3xl text-[#1a1814] md:text-4xl">
            {t("admin.title", locale)}
          </h1>
          <p className="mt-2 text-sm text-[#5a5650]">
            {t("admin.subtitle", locale)}
          </p>
        </FadeIn>

        <FadeIn delay={0.05}>
          <Suspense>
            <AdminTabNav />
          </Suspense>
        </FadeIn>

        {/* ── Overview tab ── */}
        {activeTab === "overview" && (
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
                trend={{ value: growthRate, period: "30d" }}
              />
              <AdminStatCard
                title={t("admin.totalAssessments", locale)}
                value={assessmentStats.total}
                subtitle={`Self: ${selfCount} | Observer: ${observerCount}`}
              />
              <AdminStatCard
                title="Összes élő meghívó"
                value={invitationStats.total}
                subtitle={`${t("admin.conversionRate", locale)}: ${conversionRate}%`}
              />
              <AdminStatCard
                title={t("admin.totalFeedback", locale)}
                value={feedbackStats.satisfactionCount + feedbackStats.dimensionCount}
                subtitle={`Satisfaction: ${feedbackStats.satisfactionCount} | Dimension: ${feedbackStats.dimensionCount}`}
              />
            </AdminMetricsGrid>
          </FadeIn>
        )}

        {/* ── Research tab ── */}
        {activeTab === "research" && (
          <>
            {/* Test Type Breakdown */}
            <FadeIn delay={0.1}>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <AdminTableSection
                  title={t("admin.assessmentsTitle", locale)}
                  description="Assessment results by test type"
                  rows={assessmentStats.byTestType.map(
                    (item: { testType: string | null; _count: { id: number } }) => ({
                      label: item.testType ?? "Unknown",
                      value: item._count.id,
                    })
                  )}
                />
                <AdminTableSection
                  title="Assigned Test Types"
                  description="Users assigned per test type"
                  rows={assessmentStats.byUserTestType.map(
                    (item: { testType: string | null; _count: { id: number } }) => ({
                      label: item.testType ?? "Unknown",
                      value: item._count.id,
                    })
                  )}
                />
              </div>
            </FadeIn>

            {/* Invitation Status */}
            <FadeIn delay={0.2}>
              <div className="mt-6">
                <AdminTableSection
                  title={t("admin.invitationsTitle", locale)}
                  rows={invitationStats.byStatus.map(
                    (item: { status: string; _count: { id: number } }) => {
                      const statusColors: Record<string, string> = {
                        COMPLETED: "#c8410a",
                        PENDING: "#c8410a",
                      };
                      const emailCount =
                        item.status === "PENDING"
                          ? invitationStats.pendingEmail
                          : item.status === "COMPLETED"
                            ? invitationStats.completedEmail
                            : null;
                      const linkCount =
                        item.status === "PENDING"
                          ? pendingLink
                          : item.status === "COMPLETED"
                            ? completedLink
                            : null;
                      return {
                        label: t(
                          `common.status${item.status.charAt(0)}${item.status.slice(1).toLowerCase()}`,
                          locale
                        ),
                        value: item._count.id,
                        subtitle:
                          emailCount !== null
                            ? `Email: ${emailCount} | Link: ${linkCount}`
                            : undefined,
                        color: statusColors[item.status] ?? "#6366F1",
                      };
                    }
                  )}
                />
              </div>
            </FadeIn>

            {/* Research Survey Stats */}
            <FadeIn delay={0.3}>
              <div className="mt-6 rounded-xl border border-[#e8e4dc] bg-white p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="font-mono text-xs uppercase tracking-widest text-[#a09a90]">
                    Research Survey
                  </h2>
                  <span className="rounded-full bg-[#e8e4dc] px-2.5 py-0.5 text-xs font-semibold text-[#3d3a35]">
                    {surveyStats.count} responses
                  </span>
                </div>

                <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-[#e8e4dc] bg-[#faf9f6] p-4">
                    <p className="font-mono text-xs uppercase tracking-widest text-[#a09a90]">
                      Self-accuracy (Avg)
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#1a1814]">
                      {avgSelfAccuracy !== null ? `${avgSelfAccuracy}/5` : "–"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#e8e4dc] bg-[#faf9f6] p-4">
                    <p className="font-mono text-xs uppercase tracking-widest text-[#a09a90]">
                      Personality importance (Avg)
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#1a1814]">
                      {avgPersonalityImportance !== null
                        ? `${avgPersonalityImportance}/5`
                        : "–"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#e8e4dc] bg-[#faf9f6] p-4">
                    <p className="font-mono text-xs uppercase tracking-widest text-[#a09a90]">
                      Observer usefulness (Avg)
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#1a1814]">
                      {avgSurveyObserverUsefulness !== null
                        ? `${avgSurveyObserverUsefulness}/5`
                        : "–"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="mb-3 font-mono text-xs uppercase tracking-widest text-[#a09a90]">
                      Prior personality test
                    </h3>
                    <div className="space-y-2">
                      {surveyStats.byPriorTest.length > 0 ? (
                        surveyStats.byPriorTest.map(
                          (item: { priorTest: string; _count: { id: number } }) => (
                            <div
                              key={item.priorTest}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="font-medium uppercase text-[#3d3a35]">
                                {item.priorTest}
                              </span>
                              <span className="text-[#1a1814]">
                                {item._count.id}
                                <span className="ml-1 text-[#a09a90]">
                                  (
                                  {surveyStats.count > 0
                                    ? Math.round(
                                        (item._count.id / surveyStats.count) * 100
                                      )
                                    : 0}
                                  %)
                                </span>
                              </span>
                            </div>
                          )
                        )
                      ) : (
                        <p className="text-xs text-[#a09a90]">No data yet</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-3 font-mono text-xs uppercase tracking-widest text-[#a09a90]">
                      Has 360 process
                    </h3>
                    <div className="space-y-2">
                      {surveyStats.byHas360.filter(
                        (item: { has360Process: string | null }) =>
                          item.has360Process !== null
                      ).length > 0 ? (
                        surveyStats.byHas360
                          .filter(
                            (item: {
                              has360Process: string | null;
                              _count: { id: number };
                            }) => item.has360Process !== null
                          )
                          .map(
                            (item: {
                              has360Process: string | null;
                              _count: { id: number };
                            }) => (
                              <div
                                key={item.has360Process}
                                className="flex items-center justify-between text-sm"
                              >
                                <span className="font-medium uppercase text-[#3d3a35]">
                                  {item.has360Process}
                                </span>
                                <span className="text-[#1a1814]">
                                  {item._count.id}
                                </span>
                              </div>
                            )
                          )
                      ) : (
                        <p className="text-xs text-[#a09a90]">No data yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* Feedback Insights */}
            <FadeIn delay={0.4}>
              <div className="mt-6 rounded-xl border border-[#e8e4dc] bg-white p-6">
                <h2 className="mb-5 font-mono text-xs uppercase tracking-widest text-[#a09a90]">
                  {t("admin.feedbackTitle", locale)}
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-[#e8e4dc] bg-[#faf9f6] p-4">
                    <p className="font-mono text-xs uppercase tracking-widest text-[#a09a90]">
                      Agreement (Avg)
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#1a1814]">
                      {avgAgreement}/5
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#e8e4dc] bg-[#faf9f6] p-4">
                    <p className="font-mono text-xs uppercase tracking-widest text-[#a09a90]">
                      Observer Usefulness (Avg)
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#1a1814]">
                      {avgObserverUsefulness}/5
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#e8e4dc] bg-[#faf9f6] p-4">
                    <p className="font-mono text-xs uppercase tracking-widest text-[#a09a90]">
                      Site Usefulness (Avg)
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#1a1814]">
                      {avgSiteUsefulness}/5
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="mb-4 font-mono text-xs uppercase tracking-widest text-[#a09a90]">
                    Dimension Accuracy — HEXACO
                  </h3>
                  <div className="space-y-2">
                    {feedbackStats.dimensionAvgHexaco.length > 0 ? (
                      feedbackStats.dimensionAvgHexaco.map(
                        (dim: {
                          dimensionCode: string;
                          _avg: { accuracyRating: number | null };
                          _count: { id: number };
                        }) => (
                          <div
                            key={dim.dimensionCode}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="font-medium text-[#3d3a35]">
                              {dim.dimensionCode}
                            </span>
                            <span className="text-[#1a1814]">
                              {dim._avg.accuracyRating
                                ? Math.round(dim._avg.accuracyRating * 10) / 10
                                : 0}
                              /5{" "}
                              <span className="text-[#a09a90]">
                                ({dim._count.id})
                              </span>
                            </span>
                          </div>
                        )
                      )
                    ) : (
                      <p className="text-xs text-[#a09a90]">No feedback yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </FadeIn>
          </>
        )}
      </div>
    </main>
  );
}
