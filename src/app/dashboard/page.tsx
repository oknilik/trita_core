import { auth } from "@clerk/nextjs/server";
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
import { JourneyProgress } from "@/components/dashboard/JourneyProgress";
import { ResearchSurvey } from "@/components/dashboard/ResearchSurvey";
import { UpcomingFeaturesCTA } from "@/components/dashboard/UpcomingFeaturesCTA";

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
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [locale, { userId }] = await Promise.all([
    getServerLocale(),
    auth(),
  ]);
  if (!userId) redirect("/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      testType: true,
      username: true,
      email: true,
      onboardedAt: true,
      deleted: true,
      occupationStatus: true,
    },
  });

  // Safety: if profile is marked deleted but clerkId wasn't cleared (race condition),
  // treat it as no profile so the user goes through onboarding fresh.
  if (profile?.deleted) redirect("/onboarding");

  if (profile && !profile.onboardedAt) {
    redirect("/onboarding");
  }

  const displayName =
    profile?.username ||
    profile?.email ||
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
    researchSurvey,
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
              dimensionFeedback: {
                select: {
                  dimensionCode: true,
                  accuracyRating: true,
                  comment: true,
                },
              },
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
          prisma.researchSurvey.findUnique({
            where: { userProfileId: profile.id },
            select: { id: true },
          }),
        ])
      : [null, null, [], [], [], { _avg: { confidence: null } }, null, null];

  const draftAnsweredCount = draft
    ? Object.keys(draft.answers as Record<string, number>).length
    : 0;

  const dimensionFeedback = latestResult?.dimensionFeedback ?? [];

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
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-8 md:gap-12 px-4 py-10">
        <FadeIn>
          <section className="relative rounded-2xl border border-indigo-100/50 bg-gradient-to-br from-indigo-50/80 via-white to-white p-8 md:p-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
                {t("dashboard.guidedTag", locale)}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-1 w-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  {t("dashboard.nextStepTitle", locale)}
                </h2>
              </div>
              <p className="mt-3 text-sm text-gray-600">
                {t("dashboard.guidedPraise", locale)}
              </p>
            </div>
            <JourneyProgress
              locale={locale}
              initialHasInvites={false}
              initialPendingInvites={0}
              hasObserverFeedback={false}
              selfCompleted={false}
              hasDraft={Boolean(draft)}
              draftAnsweredCount={draftAnsweredCount}
              draftTotalQuestions={draftTotalQuestions}
            />
          </section>
        </FadeIn>
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
  const hasObserverFeedback = completedObservers.length >= 2;
  const feedbackSubmitted = Boolean(satisfactionFeedback);
  const surveySubmitted = Boolean(researchSurvey);
  const journeyComplete = Boolean(latestResult) && hasInvites && hasObserverFeedback;
  const avgConfidence =
    confidenceStats._avg.confidence != null
      ? Math.round(confidenceStats._avg.confidence * 10) / 10
      : null;

  const observerComparison =
    completedObservers.length >= 2 && isLikert && displayScores
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

  // Facet-level divergences between self and observer assessments (for heatmap)
  const facetDivergences =
    completedObservers.length >= 2 && isLikert
      ? (() => {
          type FacetDiv = {
            dimCode: string; dimLabel: string; dimColor: string;
            subCode: string; subLabel: string; subType: "facet" | "aspect";
            selfScore: number; observerScore: number; delta: number;
          };
          const entries: FacetDiv[] = [];
          const mainDims = config.dimensions.filter((d) => d.code !== "I");

          for (const dim of mainDims) {
            const dimLabel = dim.labelByLocale?.[locale] ?? dim.label;
            for (const subType of ["facets", "aspects"] as const) {
              const subs = dim[subType];
              if (!subs) continue;
              for (const sub of subs) {
                const selfScore = scores[subType]?.[dim.code]?.[sub.code] ?? null;
                if (selfScore == null) continue;
                let sum = 0;
                let count = 0;
                for (const obs of completedObservers) {
                  const v = obs.type === "likert" ? obs[subType]?.[dim.code]?.[sub.code] : undefined;
                  if (v != null) { sum += v; count++; }
                }
                if (count === 0) continue;
                const observerScore = Math.round(sum / count);
                entries.push({
                  dimCode: dim.code,
                  dimLabel,
                  dimColor: dim.color,
                  subCode: sub.code,
                  subLabel: sub.label,
                  subType: subType === "facets" ? "facet" : "aspect",
                  selfScore: Math.round(selfScore),
                  observerScore,
                  delta: observerScore - Math.round(selfScore),
                });
              }
            }
          }
          return entries;
        })()
      : [];

  // Resolve active tab from URL search params
  type TabId = "results" | "comparison" | "invites";
  const resolvedSearchParams = await searchParams;
  const rawTab = typeof resolvedSearchParams?.tab === "string" ? resolvedSearchParams.tab : "results";
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
        rawDimensions={isLikert ? scores.dimensions : {}}
        testType={latestResult.testType ?? ""}
        observerComparison={observerComparison}
        facetDivergences={facetDivergences}
        completedObserversCount={completedObservers.length}
        avgConfidence={avgConfidence}
        hasObserverFeedback={hasObserverFeedback}
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

      {/* ── Research survey — shown after full journey, until submitted ── */}
      {journeyComplete && !surveySubmitted && (
        <FadeIn>
          <ResearchSurvey
            locale={locale}
            hasObserverFeedback={hasObserverFeedback}
            occupationStatus={profile.occupationStatus ?? null}
          />
        </FadeIn>
      )}

      {/* ── Upcoming features validation — fake door test ── */}
      {journeyComplete && (
        <FadeIn>
          <UpcomingFeaturesCTA locale={locale} />
        </FadeIn>
      )}
      </main>
    </div>
  );
}
