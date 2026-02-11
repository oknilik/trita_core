import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getTestConfig } from "@/lib/questions";
import { assignTestType } from "@/lib/assignTestType";
import type { ScoreResult } from "@/lib/scoring";
import { InvitationStatus, type TestType } from "@prisma/client";
import { RadarChart } from "@/components/dashboard/RadarChart";
import { DimensionCard } from "@/components/dashboard/DimensionCard";
import { DimensionHighlights } from "@/components/dashboard/DimensionHighlights";
import { InviteSection } from "@/components/dashboard/InviteSection";
import { ObserverComparison } from "@/components/dashboard/ObserverComparison";
import { RetakeButton } from "@/components/dashboard/RetakeButton";
import { FadeIn } from "@/components/landing/FadeIn";
import { getServerLocale } from "@/lib/i18n-server";
import { t, tf } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return { title: t("meta.dashboardTitle", locale) };
}

function getInsight(
  dimensionCode: string,
  score: number,
  insights: { low: string; mid: string; high: string }
): string {
  const level = score < 40 ? "low" : score < 70 ? "mid" : "high";
  return insights[level];
}

export default async function DashboardPage() {
  const locale = await getServerLocale();
  const user = await currentUser();
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

  // Check for in-progress assessment draft
  const draft = profile
    ? await prisma.assessmentDraft.findUnique({
        where: { userProfileId: profile.id },
        select: { answers: true, testType: true },
      })
    : null;
  const draftAnsweredCount = draft
    ? Object.keys(draft.answers as Record<string, number>).length
    : 0;

  const [latestResult, sentInvitations, receivedInvitations, completedObserverAssessments, confidenceStats] =
    profile
      ? await Promise.all([
          prisma.assessmentResult.findFirst({
            where: { userProfileId: profile.id },
            orderBy: { createdAt: "desc" },
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
        ])
      : [null, [], [], [], { _avg: { confidence: null } }];

  const scores = latestResult?.scores as ScoreResult | undefined;
  let testType = profile?.testType as TestType | null;
  if (testType === "MBTI" && profile) {
    testType = await assignTestType(profile.id);
  }
  const config = testType ? getTestConfig(testType, locale) : null;

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
      <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-6 px-4 py-10">
        <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 p-6 pb-14 md:p-8 md:pb-16">
          <Image
            src="/doodles/unboxing.svg"
            alt=""
            aria-hidden
            width={192}
            height={192}
            className="pointer-events-none absolute -bottom-6 -right-6 h-40 w-40 object-contain opacity-10 brightness-0 invert md:h-48 md:w-48"
          />
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
              className="mt-5 inline-flex min-h-[48px] items-center rounded-xl bg-indigo-600 px-8 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-xl"
            >
              {t("actions.continueTest", locale)}
            </Link>
          </section>
        ) : (
          <section className="flex flex-col items-center rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 p-10 text-center">
            <Image
              src="/doodles/plant.svg"
              alt=""
              aria-hidden
              width={144}
              height={112}
              className="h-28 w-36 object-contain"
            />
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              {t("dashboard.noResultTitle", locale)}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {tf("dashboard.noResultBody", locale, { testName: emptyTestName })}
            </p>
            <Link
              href="/assessment"
              className="mt-6 inline-flex min-h-[48px] items-center rounded-xl bg-indigo-600 px-8 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-xl"
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
      }))
    : null;


  const sorted = displayScores
    ? [...displayScores].sort((a, b) => b.score - a.score)
    : null;
  const strongest = sorted?.[0];
  const weakest = sorted?.[sorted.length - 1];

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
  const stepsCompleted = 1 + (hasInvites ? 1 : 0) + (hasObserverFeedback ? 1 : 0);
  const progressPct = Math.round((stepsCompleted / 3) * 100);
  const avgConfidence =
    confidenceStats._avg.confidence != null
      ? Math.round(confidenceStats._avg.confidence * 10) / 10
      : null;

  const observerComparison =
    completedObservers.length > 0 && isLikert && displayScores
      ? (() => {
          const avgScores: Record<string, number> = {};
          for (const dim of config.dimensions) {
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
            dimensions: config.dimensions.map((dim) => ({
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
  const nextStep = !hasInvites
    ? {
        title: t("dashboard.nextStepInviteTitle", locale),
        body: t("dashboard.nextStepInviteBody", locale),
        cta: t("dashboard.nextStepInviteCta", locale),
        href: "#invite",
      }
    : !hasObserverFeedback
      ? {
          title: t("dashboard.nextStepWaitTitle", locale),
          body: tf("dashboard.nextStepWaitBody", locale, { count: pendingInvites.length }),
          cta: t("dashboard.nextStepManageInvitesCta", locale),
          href: "#invite",
        }
      : {
          title: t("dashboard.nextStepCompareTitle", locale),
          body: t("dashboard.nextStepCompareBody", locale),
          cta: t("dashboard.nextStepCompareCta", locale),
          href: observerComparison ? "#comparison" : "#results",
        };
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-6 px-4 py-10">
      {/* ── Continue draft banner ── */}
      {draft && draftTotalQuestions > 0 && (
        <FadeIn>
          <section className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white p-6 md:p-8">
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
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-amber-500 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
              >
                {t("actions.continueTest", locale)}
              </Link>
            </div>
          </section>
        </FadeIn>
      )}

      {/* ── Guided journey ── */}
      <FadeIn delay={0.05}>
        <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-white p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
                {t("dashboard.guidedTag", locale)}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-900">
                {t("dashboard.nextStepTitle", locale)}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {t("dashboard.guidedPraise", locale)}
              </p>
            </div>
            <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
              <p className="text-xs text-gray-500">{t("dashboard.journeyProgress", locale)}</p>
              <p className="text-lg font-semibold text-gray-900">{stepsCompleted}/3</p>
            </div>
          </div>

          <div className="mt-5">
            <div className="h-2 w-full overflow-hidden rounded-full bg-indigo-100">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-gray-500">
              <span className={stepsCompleted >= 1 ? "text-indigo-600" : ""}>
                {t("dashboard.journeyStepSelf", locale)}
              </span>
              <span className={stepsCompleted >= 2 ? "text-indigo-600" : ""}>
                {t("dashboard.journeyStepInvite", locale)}
              </span>
              <span className={stepsCompleted >= 3 ? "text-indigo-600" : ""}>
                {t("dashboard.journeyStepFeedback", locale)}
              </span>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-indigo-100 bg-white p-4 md:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">{nextStep.title}</p>
                <p className="mt-1 text-sm text-gray-600">{nextStep.body}</p>
              </div>
              <Link
                href={nextStep.href}
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                {nextStep.cta}
              </Link>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ── Chart overview + highlights ── */}
      <FadeIn delay={0.1}>
        <section id="results" className="rounded-2xl border border-gray-100 bg-white p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-gray-900">
            {tf("dashboard.profileOverview", locale, { testName: config.name })}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isLikert
              ? tf("dashboard.overviewLikert", locale, { count: config.dimensions.length })
              : t("dashboard.overviewMbti", locale)}
          </p>

          {/* Likert: radar chart + strongest/weakest sidebar */}
          {displayScores && (
            <div className="mt-6 grid items-start gap-6 md:grid-cols-[1fr_13rem]">
              <div className="flex items-center justify-center">
                <div className="h-64 w-64 md:h-72 md:w-72">
                  <RadarChart
                    dimensions={displayScores.map((d) => ({
                      code: d.code,
                      color: d.color,
                      score: d.score,
                    }))}
                  />
                </div>
              </div>

              {strongest && weakest && (
                <DimensionHighlights
                  strongest={{
                    label: strongest.label,
                    labelByLocale: strongest.labelByLocale,
                    score: strongest.score,
                  }}
                  weakest={{
                    label: weakest.label,
                    labelByLocale: weakest.labelByLocale,
                    score: weakest.score,
                  }}
                />
              )}
            </div>
          )}

        </section>
      </FadeIn>


      {/* ── Detailed dimension cards (Likert) ── */}
      {displayScores && (
        <FadeIn delay={0.15}>
          <section className="rounded-2xl border border-gray-100 bg-white p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-gray-900">
              {t("dashboard.detailedTitle", locale)}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t("dashboard.detailedBody", locale)}
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {displayScores.map((item, idx) => {
                const dimConfig = config.dimensions.find((d) => d.code === item.code);
                return (
                  <DimensionCard
                    key={item.code}
                    code={item.code}
                    label={item.label}
                    labelByLocale={dimConfig?.labelByLocale}
                    color={item.color}
                    score={item.score}
                    insight={item.insight}
                    description={dimConfig?.description ?? ""}
                    descriptionByLocale={dimConfig?.descriptionByLocale}
                    insights={dimConfig?.insights ?? { low: "", mid: "", high: "" }}
                    insightsByLocale={dimConfig?.insightsByLocale}
                    delay={idx * 0.08}
                  />
                );
              })}
            </div>
          </section>
        </FadeIn>
      )}

      {/* ── Observer comparison ── */}
      {observerComparison && (
        <FadeIn delay={0.1}>
          <div id="comparison">
            <ObserverComparison
              dimensions={observerComparison.dimensions}
              observerCount={observerComparison.count}
              avgConfidence={avgConfidence}
            />
          </div>
        </FadeIn>
      )}

      {/* ── Invite section ── */}
      <FadeIn delay={0.1}>
        <div id="invite" className="relative overflow-hidden rounded-2xl">
          <Image
            src="/doodles/swinging.svg"
            alt=""
            aria-hidden
            width={144}
            height={144}
            className="pointer-events-none absolute -right-4 -top-4 h-28 w-28 object-contain opacity-15 md:h-36 md:w-36"
          />
          <InviteSection
            initialInvitations={sentInvitations.map((inv) => ({
              id: inv.id,
              token: inv.token,
              status: inv.status,
              createdAt: inv.createdAt.toISOString(),
              completedAt: inv.completedAt?.toISOString() ?? null,
              observerEmail: inv.observerEmail ?? null,
            }))}
          />
        </div>
      </FadeIn>

      {/* ── Received invitations ── */}
      {receivedInvitations.length > 0 && (
        <FadeIn delay={0.1}>
          <section className="rounded-2xl border border-gray-100 bg-white p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-gray-900">
              {t("dashboard.invitesReceivedTitle", locale)}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t("dashboard.invitesReceivedBody", locale)}
            </p>
            <div className="mt-6 flex flex-col gap-2">
              {receivedInvitations.map((inv) => {
                const inviterName =
                  inv.inviter?.username ?? t("common.inviterFallback", locale);
                const isPending = inv.status === "PENDING";
                const isExpired = inv.expiresAt < new Date();
                return (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          inv.status === "COMPLETED"
                            ? "bg-emerald-500"
                            : inv.status === "CANCELED" || isExpired
                              ? "bg-gray-300"
                              : "bg-amber-400"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {inviterName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {inv.status === "COMPLETED"
                            ? t("common.statusCompleted", locale)
                            : inv.status === "CANCELED"
                              ? t("common.statusCanceled", locale)
                              : isExpired
                                ? t("common.statusExpired", locale)
                                : t("common.statusPending", locale)}
                        </p>
                      </div>
                    </div>
                    {isPending && !isExpired && (
                      <Link
                        href={`/observe/${inv.token}`}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        {t("actions.openFill", locale)}
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </FadeIn>
      )}

      {/* ── Retake CTA ── */}
      <FadeIn delay={0.1}>
        <section className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 md:p-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <RetakeButton />
          </div>
          <Image
            src="/doodles/running.svg"
            alt=""
            aria-hidden
            width={160}
            height={160}
            className="pointer-events-none absolute -bottom-6 -right-2 h-32 w-32 object-contain opacity-20 md:h-40 md:w-40"
          />
        </section>
      </FadeIn>
    </main>
  );
}
