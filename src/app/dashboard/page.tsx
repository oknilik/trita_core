import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getTestConfig } from "@/lib/questions";
import { hasOrgRole } from "@/lib/auth";
import { getOrgSubscription, trialDaysLeft as calcTrialDaysLeft } from "@/lib/subscription";

import type { ScoreResult } from "@/lib/scoring";
import { InvitationStatus, type TestType } from "@prisma/client";
import { FadeIn } from "@/components/landing/FadeIn";
import { getServerLocale } from "@/lib/i18n-server";
import { t, tf } from "@/lib/i18n";
import { DashboardAutoRefresh } from "@/components/dashboard/DashboardAutoRefresh";
import { HashScroll } from "@/components/dashboard/HashScroll";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { DiscardDraftButton } from "@/components/dashboard/DiscardDraftButton";
import { RadarChart } from "@/components/dashboard/RadarChart";

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
    },
  });

  // Safety: if profile is marked deleted but clerkId wasn't cleared (race condition),
  // treat it as no profile so the user goes through onboarding fresh.
  if (profile?.deleted) redirect("/onboarding");

  if (profile && !profile.onboardedAt) {
    // Org-flow users don't have onboardedAt set — check org membership before redirecting
    const orgMembership = await prisma.organizationMember.findUnique({
      where: { userId: profile.id },
    });
    if (!orgMembership) redirect("/onboarding");
  }

  const displayName =
    profile?.username ||
    profile?.email ||
    t("common.userFallback", locale);

  // --- ADMIN BRANCH ---
  // If the user is an ORG_ADMIN or ORG_MANAGER, render the admin dashboard instead.
  if (profile) {
    const orgMembership = await prisma.organizationMember.findUnique({
      where: { userId: profile.id },
      select: { role: true, orgId: true },
    });

    if (orgMembership && hasOrgRole(orgMembership.role, "ORG_MANAGER")) {
      const sub = await getOrgSubscription(orgMembership.orgId);
      const daysLeft = calcTrialDaysLeft(sub);
      const resolvedAdminParams = await searchParams;
      const checkoutSuccess = resolvedAdminParams?.checkout === "success";
      const portalUpdated = resolvedAdminParams?.portal === "updated";
      const { AdminDashboard } = await import("./AdminDashboard");
      return (
        <>
          <div className="flex flex-col gap-2 mx-4 mt-4">
            {(checkoutSuccess || portalUpdated) && (
              <div className="flex items-center gap-3 rounded-xl border border-[#1a5c3a]/30 bg-[#f0fdf4] px-5 py-3.5">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#1a5c3a]">
                  // siker
                </span>
                <span className="text-sm text-[#1a5c3a]">
                  {checkoutSuccess
                    ? "Az előfizetés aktiválva. Köszönjük!"
                    : "A számlázási adatok frissítve."}
                </span>
              </div>
            )}
            {!checkoutSuccess && daysLeft !== null && daysLeft <= 7 && (
              <div className="flex items-center justify-between gap-4 rounded-xl border border-[#c8410a]/30 bg-[#fef3ec] px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#c8410a]">
                    // trial
                  </span>
                  <span className="text-sm text-[#5a5650]">
                    {daysLeft === 0
                      ? "A trial ma lejár."
                      : `${daysLeft} nap van hátra a trialból.`}
                    {" "}Aktiváld az előfizetést a hozzáférés megtartásához.
                  </span>
                </div>
                <a
                  href="/billing/upgrade"
                  className="flex-shrink-0 rounded-lg bg-[#c8410a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#a33408]"
                >
                  Aktiválás →
                </a>
              </div>
            )}
          </div>
          <AdminDashboard />
        </>
      );
    }
  }
  // --- END ADMIN BRANCH ---

  // Parallel database queries for better performance
  const [
    draft,
    latestResult,
    sentInvitations,
    receivedInvitations,
    completedObserverAssessments,
    confidenceStats,
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
        ])
      : [null, null, [], [], [], { _avg: { confidence: null } }];

  const draftAnsweredCount = draft
    ? Object.keys(draft.answers as Record<string, number>).length
    : 0;

  const dimensionFeedback = latestResult?.dimensionFeedback ?? [];

  const scores = latestResult?.scores as ScoreResult | undefined;
  const testType = profile?.testType as TestType | null;
  const config = testType ? getTestConfig(testType, locale) : null;
  const profileOverviewTestName =
    config?.name ?? "test";

  // Total question count for draft progress display
  const draftTotalQuestions = config
    ? config.questions.length
    : draft?.testType
      ? getTestConfig(draft.testType as TestType, locale).questions.length
      : 0;

  /* ───── Empty state ───── */
  if (!profile || !latestResult || !scores || !config) {
    const isHu = locale !== "en";

    const previewDimensions = [
      { code: "H", color: "#c8410a", score: 62 },
      { code: "E", color: "#1a5c3a", score: 55 },
      { code: "X", color: "#3d5c6a", score: 70 },
      { code: "A", color: "#7a5c3a", score: 48 },
      { code: "C", color: "#5a4060", score: 65 },
      { code: "O", color: "#3a6050", score: 58 },
    ];

    const featureCards = isHu
      ? [
          {
            icon: "◆",
            title: "Erősségeid",
            desc: "Megtudod miben vagy természetesen jó, és hogyan hasznosíthatod ezt a munkában és kapcsolatokban.",
            color: "#c8410a",
          },
          {
            icon: "◎",
            title: "Fejlődési irányok",
            desc: "Látod hol érdemes tudatosan fejleszteni magadat – konkrét, személyre szabott szempontok alapján.",
            color: "#1a5c3a",
          },
          {
            icon: "◈",
            title: "Observer összehasonlítás",
            desc: "Kitöltés után meghívhatsz másokat, hogy ők is értékeljenek. Megmutatja hol látnak másképp.",
            color: "#3d5c6a",
          },
        ]
      : [
          {
            icon: "◆",
            title: "Your strengths",
            desc: "Find out what you're naturally good at and how to leverage it in work and relationships.",
            color: "#c8410a",
          },
          {
            icon: "◎",
            title: "Growth areas",
            desc: "See where it's worth developing yourself intentionally — based on concrete, personalized insights.",
            color: "#1a5c3a",
          },
          {
            icon: "◈",
            title: "Observer comparison",
            desc: "After completing, invite others to rate you too. See where they perceive you differently.",
            color: "#3d5c6a",
          },
        ];

    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col gap-6 px-4 py-10 md:py-14">
        <FadeIn>

          {/* ── Hero card ── */}
          <section className="rounded-2xl border border-[#e0ddd6] bg-white p-8 md:p-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-10">

              {/* Left: text + CTA */}
              <div className="flex flex-1 flex-col gap-5">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#c8410a]">
                    {isHu ? "// következő lépés" : "// next step"}
                  </p>
                  <h2 className="mt-2 font-playfair text-[26px] leading-snug text-[#1a1814]">
                    {isHu
                      ? "Ismerd meg magadat – és azt, hogyan látnak mások."
                      : "Know yourself — and how others see you."}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-[#5a5650]">
                    {isHu
                      ? "A trita személyiségfelmérés megmutatja hol vagy erős, hol van fejlődési tér, és hogyan kommunikálsz másokkal. Nem teszt – tükör."
                      : "The trita personality assessment shows where you're strong, where you can grow, and how you come across to others. Not a test — a mirror."}
                  </p>
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                  {[
                    { icon: "⏱", text: isHu ? "~12 perc" : "~12 min" },
                    { icon: "◎", text: isHu ? "60 kérdés" : "60 questions" },
                    { icon: "◈", text: isHu ? "6 dimenzió" : "6 dimensions" },
                  ].map((item) => (
                    <span key={item.text} className="flex items-center gap-1.5 text-sm text-[#5a5650]">
                      <span className="font-mono text-[#c8410a]">{item.icon}</span>
                      {item.text}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                {draft && draftTotalQuestions > 0 ? (
                  <div className="flex flex-col gap-3">
                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-xs text-[#5a5650]">
                          {isHu
                            ? `${draftAnsweredCount} / ${draftTotalQuestions} kérdés megválaszolva`
                            : `${draftAnsweredCount} / ${draftTotalQuestions} questions answered`}
                        </span>
                        <span className="font-mono text-xs text-[#c8410a]">
                          {Math.round((draftAnsweredCount / draftTotalQuestions) * 100)}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e0ddd6]">
                        <div
                          className="h-full rounded-full bg-[#c8410a] transition-all"
                          style={{ width: `${Math.round((draftAnsweredCount / draftTotalQuestions) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Link
                        href="/assessment"
                        className="inline-flex min-h-[48px] items-center rounded-lg bg-[#c8410a] px-6 text-sm font-semibold text-white transition hover:bg-[#a33408]"
                      >
                        {isHu ? "Folytatás →" : "Continue →"}
                      </Link>
                      <DiscardDraftButton />
                    </div>
                  </div>
                ) : (
                  <Link
                    href="/assessment"
                    className="inline-flex min-h-[48px] w-fit items-center rounded-lg bg-[#c8410a] px-8 text-sm font-semibold text-white transition hover:-translate-y-px hover:bg-[#a33408]"
                  >
                    {isHu ? "Felmérés indítása →" : "Start assessment →"}
                  </Link>
                )}
              </div>

              {/* Right: blurred radar chart preview */}
              <div className="relative flex flex-shrink-0 flex-col items-center gap-2 md:w-[220px]">
                <div className="relative w-[200px]">
                  <div
                    className="pointer-events-none absolute inset-0 z-10 rounded-xl"
                    style={{ backdropFilter: "blur(5px)", WebkitBackdropFilter: "blur(5px)" }}
                  />
                  <div className="opacity-40">
                    <RadarChart dimensions={previewDimensions} uid="preview" />
                  </div>
                </div>
                <p className="z-10 text-center text-xs text-[#a09a90]">
                  {isHu ? "A te radar diagramod kitöltés után" : "Your radar chart after completing"}
                </p>
              </div>

            </div>
          </section>

          {/* ── Feature cards ── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {featureCards.map((card) => (
              <div
                key={card.title}
                className="rounded-xl border border-[#e0ddd6] bg-white p-5 transition-shadow hover:shadow-sm"
              >
                <div
                  className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg text-sm"
                  style={{ background: `${card.color}14`, color: card.color }}
                >
                  {card.icon}
                </div>
                <h3 className="mb-1.5 text-sm font-semibold text-[#1a1814]">{card.title}</h3>
                <p className="text-xs leading-relaxed text-[#7a756e]">{card.desc}</p>
              </div>
            ))}
          </div>

          {/* ── Observer teaser ── */}
          <div className="flex items-center justify-between gap-4 rounded-xl border border-[#e0ddd6] bg-[#faf9f6] px-6 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#a09a90]">
                {isHu ? "// következő szint" : "// next level"}
              </span>
              <span className="text-sm text-[#5a5650]">
                {isHu
                  ? "Kitöltés után mások is értékelhetnek téged – a különbséget te is látni fogod."
                  : "After completing, others can rate you too — you'll see the difference."}
              </span>
            </div>
            <span className="flex-shrink-0 font-mono text-xs text-[#c8410a]">
              {isHu ? "hamarosan →" : "coming →"}
            </span>
          </div>

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
    <div className="bg-gradient-to-b from-[#faf9f6] via-white to-white">
      <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-8 md:gap-12 px-4 py-10">
      <HashScroll />
      <DashboardAutoRefresh
        pendingInvites={pendingInvites.length}
        completedObserver={completedObservers.length}
      />
      {/* ── Continue draft banner ── */}
      {draft && draftTotalQuestions > 0 && (
        <FadeIn>
          <section className="rounded border border-[#e0ddd6] bg-white p-8 md:p-10">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#1a1814]">
                  {t("dashboard.continueDraftTitle", locale)}
                </h2>
                <p className="mt-1 text-sm text-[#5a5650]">
                  {tf("dashboard.continueDraftBody", locale, {
                    answered: draftAnsweredCount,
                    total: draftTotalQuestions,
                  })}
                </p>
                <div className="mt-3 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-[#e0ddd6]">
                  <div
                    className="h-full rounded-full bg-[#c8410a] transition-all"
                    style={{
                      width: `${Math.round((draftAnsweredCount / draftTotalQuestions) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Link
                  href="/assessment"
                  className="inline-flex min-h-[48px] items-center justify-center rounded bg-[#c8410a] px-8 text-sm font-medium text-white transition hover:-translate-y-px hover:bg-[#a33408]"
                >
                  {t("actions.continueTest", locale)}
                </Link>
                <DiscardDraftButton />
              </div>
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
      </main>
    </div>
  );
}
