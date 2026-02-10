import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getTestConfig } from "@/lib/questions";
import type { ScoreResult } from "@/lib/scoring";
import { InvitationStatus, type TestType } from "@prisma/client";
import { RadarChart } from "@/components/dashboard/RadarChart";
import { MBTIChart } from "@/components/dashboard/MBTIChart";
import { DimensionCard } from "@/components/dashboard/DimensionCard";
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

  const displayName =
    user.fullName || user.firstName || user.username || t("common.userFallback", locale);
  const email = user.primaryEmailAddress?.emailAddress;
  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: user.id },
    select: {
      id: true,
      testType: true,
    },
  });

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
              inviter: { select: { name: true } },
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
  const testType = profile?.testType as TestType | null;
  const config = testType ? getTestConfig(testType, locale) : null;

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
      </main>
    );
  }

  /* ───── Results state ───── */
  const dateLocale = locale === "de" ? "de-DE" : locale === "en" ? "en-US" : "hu-HU";
  const formattedDate = latestResult.createdAt.toLocaleDateString(dateLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const isLikert = scores.type === "likert";
  const isMBTI = scores.type === "mbti";

  const displayScores = isLikert
    ? config.dimensions.map((dim) => ({
        code: dim.code,
        label: dim.label,
        color: dim.color,
        score: scores.dimensions[dim.code] ?? 0,
        insight: getInsight(dim.code, scores.dimensions[dim.code] ?? 0, dim.insights),
      }))
    : null;

  const mbtiData = isMBTI
    ? {
        typeCode: scores.typeCode,
        dichotomies: config.dimensions.map((dim) => ({
          code: dim.code,
          label: dim.label,
          color: dim.color,
          poleA: dim.code[0],
          poleB: dim.code[1],
          percentage: scores.dichotomies[dim.code] ?? 50,
        })),
      }
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
              color: dim.color,
              selfScore: displayScores.find((d) => d.code === dim.code)?.score ?? 0,
              observerScore: avgScores[dim.code],
            })),
          };
        })()
      : completedObservers.length > 0 && isMBTI && mbtiData
        ? (() => {
            const avgDichotomies: Record<string, number> = {};
            for (const dim of config.dimensions) {
              let sum = 0;
              let count = 0;
              for (const obs of completedObservers) {
                if (obs.type === "mbti" && obs.dichotomies[dim.code] != null) {
                  sum += obs.dichotomies[dim.code];
                  count += 1;
                }
              }
              avgDichotomies[dim.code] = count > 0 ? Math.round(sum / count) : 50;
            }
            return {
              count: completedObservers.length,
              dimensions: config.dimensions.map((dim) => {
                const selfPct = mbtiData.dichotomies.find((d) => d.code === dim.code)?.percentage ?? 50;
                return {
                  code: dim.code,
                  label: dim.label,
                  color: dim.color,
                  selfScore: selfPct >= 50 ? selfPct : 100 - selfPct,
                  observerScore: avgDichotomies[dim.code] >= 50 ? avgDichotomies[dim.code] : 100 - avgDichotomies[dim.code],
                };
              }),
            };
          })()
        : null;
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-6 px-4 py-10">
      {/* ── Header ── */}
      <FadeIn>
        <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 p-6 pb-14 md:p-8 md:pb-16">
          <Image
            src="/doodles/unboxing.svg"
            alt=""
            aria-hidden
            width={192}
            height={192}
            className="pointer-events-none absolute -bottom-6 -right-6 h-40 w-40 object-contain opacity-10 brightness-0 invert md:h-48 md:w-48"
          />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
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
            <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs text-indigo-200">{t("dashboard.latestEvaluation", locale)}</p>
              <p className="text-base font-semibold text-white">
                {formattedDate}
              </p>
            </div>
          </div>
          <svg className="absolute inset-x-0 bottom-0 h-8 w-full text-white md:h-10" viewBox="0 0 1200 60" preserveAspectRatio="none" fill="currentColor">
            <path d="M0,28 C150,48 350,8 600,28 C850,48 1050,8 1200,28 L1200,60 L0,60 Z" />
          </svg>
        </header>
      </FadeIn>

      {/* ── Chart overview + highlights ── */}
      <FadeIn delay={0.1}>
        <section className="rounded-2xl border border-gray-100 bg-white p-6 md:p-8">
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
                <div className="flex flex-row gap-3 md:flex-col">
                  <div className="flex-1 rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                      {t("dashboard.strongest", locale)}
                    </p>
                    <p className="mt-2 text-sm font-bold text-gray-900">{strongest.label}</p>
                    <p className="text-3xl font-bold text-emerald-600">{strongest.score}%</p>
                  </div>
                  <div className="flex-1 rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                      {t("dashboard.weakest", locale)}
                    </p>
                    <p className="mt-2 text-sm font-bold text-gray-900">{weakest.label}</p>
                    <p className="text-3xl font-bold text-amber-600">{weakest.score}%</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MBTI chart */}
          {mbtiData && (
            <div className="mx-auto mt-6 max-w-md">
              <MBTIChart
                dichotomies={mbtiData.dichotomies}
                typeCode={mbtiData.typeCode}
                locale={locale}
              />
            </div>
          )}
        </section>
      </FadeIn>

      {/* ── MBTI dimension insights ── */}
      {mbtiData && (
        <FadeIn delay={0.15}>
          <div className="grid gap-4 md:grid-cols-2">
            {mbtiData.dichotomies.map((d, idx) => {
              const dominant = d.percentage >= 50 ? d.poleA : d.poleB;
              const dimConfig = config.dimensions.find((dim) => dim.code === d.code);
              const score = d.percentage >= 50 ? d.percentage : 100 - d.percentage;
              const insight = dimConfig
                ? getInsight(d.code, score, dimConfig.insights)
                : "";

              return (
                <DimensionCard
                  key={d.code}
                  code={dominant}
                  label={d.label}
                  color={d.color}
                  score={score}
                  insight={insight}
                  description={dimConfig?.description ?? ""}
                  insights={dimConfig?.insights ?? { low: "", mid: "", high: "" }}
                  delay={idx * 0.08}
                />
              );
            })}
          </div>
        </FadeIn>
      )}

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
                    color={item.color}
                    score={item.score}
                    insight={item.insight}
                    description={dimConfig?.description ?? ""}
                    insights={dimConfig?.insights ?? { low: "", mid: "", high: "" }}
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
          <ObserverComparison
            dimensions={observerComparison.dimensions}
            observerCount={observerComparison.count}
            avgConfidence={avgConfidence}
            locale={locale}
          />
        </FadeIn>
      )}

      {/* ── Invite section ── */}
      <FadeIn delay={0.1}>
        <div className="relative overflow-hidden rounded-2xl">
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
                const inviterName = inv.inviter?.name ?? t("common.inviterFallback", locale);
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
