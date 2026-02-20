import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getTestConfig } from "@/lib/questions";

import type { ScoreResult } from "@/lib/scoring";
import { InvitationStatus, type TestType } from "@prisma/client";
import { FadeIn } from "@/components/landing/FadeIn";
import { getServerLocale } from "@/lib/i18n-server";
import { t, tf } from "@/lib/i18n";
import { DashboardAutoRefresh } from "@/components/dashboard/DashboardAutoRefresh";
import { HashScroll } from "@/components/dashboard/HashScroll";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: t("meta.dashboardTitle", locale),
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

function getInsight(
  dimensionCode: string,
  score: number,
  insights: { low: string; mid: string; high: string }
): string {
  const level = score < 40 ? "low" : score < 70 ? "mid" : "high";
  return insights[level];
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const locale = await getServerLocale();
  let user;
  try {
    user = await currentUser();
  } catch {
    redirect("/sign-in");
  }
  if (!user) redirect("/sign-in");

  const email = user.primaryEmailAddress?.emailAddress;
  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: user.id },
    select: {
      id: true,
      testType: true,
      username: true,
      email: true,
      onboardedAt: true,
    },
  });

  if (profile && !profile.onboardedAt) {
    redirect("/onboarding");
  }

  const displayName =
    profile?.username ||
    user.username ||
    profile?.email ||
    email ||
    t("common.userFallback", locale);

  // Parallel database queries for better performance
  const [
    draft,
    latestResult,
    sentInvitations,
    receivedInvitations,
    completedObserverAssessments,
    confidenceStats,
    satisfactionFeedback,
  ] =
    profile
      ? await Promise.all([
          // Check for in-progress assessment draft
          prisma.assessmentDraft.findUnique({
            where: { userProfileId: profile.id },
            select: { answers: true, testType: true },
          }),
          prisma.assessmentResult.findFirst({
            where: { userProfileId: profile.id },
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              scores: true,
              testType: true,
              isSelfAssessment: true,
              createdAt: true,
            },
          }),
          prisma.observerInvitation.findMany({
            where: { inviterId: profile.id },
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              token: true,
              status: true,
              createdAt: true,
              expiresAt: true,
              completedAt: true,
              observerEmail: true,
              assessment: {
                select: {
                  relationshipType: true,
                },
              },
            },
          }),
          prisma.observerInvitation.findMany({
            where: { observerProfileId: profile.id },
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              token: true,
              status: true,
              createdAt: true,
              expiresAt: true,
              completedAt: true,
              inviter: { select: { username: true } },
            },
          }),
          prisma.observerAssessment.findMany({
            where: {
              invitation: {
                inviterId: profile.id,
                status: InvitationStatus.COMPLETED,
              },
            },
            select: {
              scores: true,
            },
          }),
          prisma.observerAssessment.aggregate({
            where: {
              invitation: {
                inviterId: profile.id,
                status: InvitationStatus.COMPLETED,
              },
              confidence: { not: null },
            },
            _avg: { confidence: true },
          }),
          prisma.satisfactionFeedback.findUnique({
            where: { userProfileId: profile.id },
            select: { id: true },
          }),
        ])
      : [null, null, [], [], [], { _avg: { confidence: null } }, null];

  const draftAnsweredCount = draft
    ? Object.keys(draft.answers as Record<string, number>).length
    : 0;

  // Fetch dimension feedback separately (needs latestResult.id)
  const dimensionFeedback =
    profile && latestResult
      ? await prisma.dimensionFeedback.findMany({
          where: { assessmentResultId: latestResult.id },
          select: {
            dimensionCode: true,
            accuracyRating: true,
            comment: true,
          },
        })
      : [];

  // Create feedback lookup map
  const feedbackMap = new Map(
    dimensionFeedback.map((f) => [f.dimensionCode, f])
  );

  const scores = latestResult?.scores as ScoreResult | undefined;
  const testType = profile?.testType as TestType | null;
  const config = testType ? getTestConfig(testType, locale) : null;
  const profileOverviewTestName =
    testType === "HEXACO_MODIFIED" ? "HEXACO" : (config?.name ?? "test");

  // Total question count for draft progress display
  const draftTotalQuestions = config
    ? config.questions.length
    : draft?.testType
      ? getTestConfig(draft.testType as TestType, locale).questions.length
      : 0;

  /* ───── Empty state ───── */
  if (!profile || !latestResult || !scores || !config) {
    const emptyTestName = config?.name ?? "test";
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-8 md:gap-12 px-4 py-10">
        <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 animate-gradient p-8 pb-16 md:p-12 md:pb-20">
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">
              {t("dashboard.personalTag", locale)}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-white md:text-4xl">
              {displayName}
            </h1>
            <p className="mt-2 text-sm text-indigo-100">
              {email ?? t("common.emailMissing", locale)}
            </p>
          </div>
          <svg className="absolute inset-x-0 bottom-0 h-8 w-full text-white md:h-10" viewBox="0 0 1200 60" preserveAspectRatio="none" fill="currentColor">
            <path d="M0,28 C150,48 350,8 600,28 C850,48 1050,8 1200,28 L1200,60 L0,60 Z" />
          </svg>
        </header>

        {draft && draftTotalQuestions > 0 ? (
          <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-white p-6 md:p-8">
            <h2 className="text-xl font-semibold text-gray-900">
              {t("dashboard.continueDraftTitle", locale)}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {tf("dashboard.continueDraftBody", locale, {
                answered: draftAnsweredCount,
                total: draftTotalQuestions,
              })}
            </p>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-indigo-100">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{
                  width: `${Math.round((draftAnsweredCount / draftTotalQuestions) * 100)}%`,
                }}
              />
            </div>
            <Link
              href="/assessment"
              className="group mt-6 inline-flex min-h-[52px] md:min-h-[48px] items-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all duration-300 hover:shadow-xl hover:scale-105"
            >
              {t("actions.continueTest", locale)}
            </Link>
          </section>
        ) : (
          <section className="flex flex-col items-center rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 p-10 text-center">
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              {t("dashboard.noResultTitle", locale)}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {tf("dashboard.noResultBody", locale, { testName: emptyTestName })}
            </p>
            <Link
              href="/assessment"
              className="group mt-8 inline-flex min-h-[52px] md:min-h-[48px] items-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all duration-300 hover:shadow-xl hover:scale-105"
            >
              {t("actions.startTest", locale)}
            </Link>
          </section>
        )}
      </main>
    );
  }

  /* ───── Results state ───── */
  const isLikert = scores.type === "likert";

  const displayScores = isLikert
    ? config.dimensions.map((dim) => ({
        code: dim.code,
        label: dim.label,
        labelByLocale: dim.labelByLocale,
        color: dim.color,
        score: scores.dimensions[dim.code] ?? 0,
        insight: getInsight(dim.code, scores.dimensions[dim.code] ?? 0, dim.insights),
        inverted: dim.inverted ?? false,
        facets: dim.facets?.map((f) => ({
          code: f.code,
          label: f.label,
          score: scores.facets?.[dim.code]?.[f.code] ?? 0,
        })),
        aspects: dim.aspects?.map((a) => ({
          code: a.code,
          label: a.label,
          score: scores.aspects?.[dim.code]?.[a.code] ?? 0,
        })),
      }))
    : null;


  // Interstitial dimensions (e.g., Altruism "I") are excluded from main factor scoring
  const mainScores = displayScores?.filter((d) => d.code !== "I") ?? null;
  const altruismScore = displayScores?.find((d) => d.code === "I") ?? null;

  // Observer comparison data
  const completedObservers = completedObserverAssessments.map(
    (entry) => entry.scores as ScoreResult
  );
  const now = new Date();
  const pendingInvites = sentInvitations.filter(
    (inv) => inv.status === "PENDING" && inv.expiresAt > now
  );
  const hasInvites = sentInvitations.length > 0;
  const hasObserverFeedback = completedObservers.length > 0;
  const feedbackSubmitted = Boolean(satisfactionFeedback);
  const avgConfidence =
    confidenceStats._avg.confidence != null
      ? Math.round(confidenceStats._avg.confidence * 10) / 10
      : null;

  const observerComparison =
    completedObservers.length > 0 && isLikert && displayScores
      ? (() => {
          const mainDims = config.dimensions.filter((d) => d.code !== "I");
          const avgScores: Record<string, number> = {};
          for (const dim of mainDims) {
            let sum = 0;
            let count = 0;
            for (const obs of completedObservers) {
              if (obs.type === "likert" && obs.dimensions[dim.code] != null) {
                sum += obs.dimensions[dim.code];
                count += 1;
              }
            }
            avgScores[dim.code] = count > 0 ? Math.round(sum / count) : 0;
          }
          return {
            count: completedObservers.length,
            dimensions: mainDims.map((dim) => ({
              code: dim.code,
              label: dim.label,
              labelByLocale: dim.labelByLocale,
              color: dim.color,
              selfScore: displayScores.find((d) => d.code === dim.code)?.score ?? 0,
              observerScore: avgScores[dim.code],
            })),
          };
        })()
      : null;

  // Resolve active tab from URL search params
  type TabId = "results" | "comparison" | "invites";
  const rawTab = typeof searchParams?.tab === "string" ? searchParams.tab : "results";
  const activeTab: TabId = (["results", "comparison", "invites"] as const).includes(
    rawTab as TabId,
  )
    ? (rawTab as TabId)
    : "results";

  return (
    <div className="bg-gradient-to-b from-indigo-50/70 via-white to-white">
      <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-8 md:gap-12 px-4 py-10">
      <HashScroll />
      <DashboardAutoRefresh
        pendingInvites={pendingInvites.length}
        completedObserver={completedObservers.length}
      />
      {/* ── Continue draft banner ── */}
      {draft && draftTotalQuestions > 0 && (
        <FadeIn>
          <section className="rounded-2xl border border-amber-200/50 bg-gradient-to-br from-amber-50/80 via-white to-white glass-effect p-8 md:p-12">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {t("dashboard.continueDraftTitle", locale)}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  {tf("dashboard.continueDraftBody", locale, {
                    answered: draftAnsweredCount,
                    total: draftTotalQuestions,
                  })}
                </p>
                <div className="mt-3 h-2 w-full max-w-xs overflow-hidden rounded-full bg-amber-100">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all"
                    style={{
                      width: `${Math.round((draftAnsweredCount / draftTotalQuestions) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              <Link
                href="/assessment"
                className="group inline-flex min-h-[52px] md:min-h-[48px] items-center justify-center rounded-xl bg-amber-500 px-8 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-amber-600 hover:scale-105"
              >
                {t("actions.continueTest", locale)}
              </Link>
            </div>
          </section>
        </FadeIn>
      )}

      {/* ── Tab navigation ── */}
      <DashboardTabs
        activeTab={activeTab}
        mainScores={mainScores}
        altruismScore={altruismScore}
        dimConfigs={Object.fromEntries(
          config.dimensions.map((d) => [
            d.code,
            {
              description: d.description ?? "",
              descriptionByLocale: d.descriptionByLocale,
              insights: d.insights ?? { low: "", mid: "", high: "" },
              insightsByLocale: d.insightsByLocale,
              labelByLocale: d.labelByLocale,
            },
          ]),
        )}
        assessmentResultId={latestResult.id}
        feedbackMap={Object.fromEntries(
          dimensionFeedback.map((f) => [f.dimensionCode, f]),
        )}
        profileOverviewTestName={profileOverviewTestName}
        isLikert={isLikert}
        hasDraft={Boolean(draft)}
        observerComparison={observerComparison}
        avgConfidence={avgConfidence}
        hasObserverFeedback={hasObserverFeedback}
        feedbackSubmitted={feedbackSubmitted}
        sentInvitations={sentInvitations.map((inv) => ({
          id: inv.id,
          token: inv.token,
          status: inv.status,
          createdAt: inv.createdAt.toISOString(),
          completedAt: inv.completedAt?.toISOString() ?? null,
          observerEmail: inv.observerEmail ?? null,
          relationship: inv.assessment?.relationshipType ?? null,
        }))}
        receivedInvitations={receivedInvitations.map((inv) => ({
          id: inv.id,
          token: inv.token,
          status: inv.status,
          createdAt: inv.createdAt.toISOString(),
          expiresAt: inv.expiresAt.toISOString(),
          completedAt: inv.completedAt?.toISOString() ?? null,
          inviterUsername: inv.inviter?.username ?? null,
        }))}
        hasInvites={hasInvites}
        pendingInvitesCount={pendingInvites.length}
      />
      </main>
    </div>
  );
}
