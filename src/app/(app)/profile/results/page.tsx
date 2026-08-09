import { requireOnboardedByClerkId } from "@/lib/onboarding-guard";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { isConsultingLed } from "@/lib/operating-mode";
import { TeamInterestBanner } from "@/components/results/TeamInterestBanner";
import type { CareerBackground } from "@/lib/industry-fit";
import { computeCareerForProfile } from "@/lib/career/service";
import { isCareerModuleHidden } from "@/lib/career/module-visibility";
import { CAREER_MODULE_READY } from "@/lib/career/module-state";
import { getTestConfig } from "@/lib/questions";
import { getServerLocale } from "@/lib/i18n-server";
import { getSelfAccessLevel, type SelfAccess } from "@/lib/access";
import type { ScoreResult } from "@/lib/scoring";
import { InvitationStatus, type TestType } from "@prisma/client";
import { resolvePersonalityTypeFromScores } from "@/lib/personality-type";
import { resolveObserverFlowStatus } from "@/lib/observer-flow";
import { getJourneySnapshotForProfileId } from "@/lib/journey/service";
import { createSelfDashboardIA } from "@/lib/dashboard/ia-contract";
import { BLOCK1, BLOCK8 } from "@/lib/profile-content";
import { DIMENSION_STRENGTH_VERBS, DIMENSION_WEAK_VERBS } from "@/lib/dimension-insights";
import { buildWorkstyleContent } from "@/lib/workstyle-content";
import { buildSimpleSummary } from "@/lib/results/simple-summary";
import { resolveResultsViewMode } from "@/lib/results/view-mode";
import { t, type Locale } from "@/lib/i18n";

import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { aggregatePeerRoleScores } from "@/lib/team-role-peer";
import type { TeamRoleSelections } from "@/lib/team-role-questions";
import { DashboardAutoRefresh } from "@/components/dashboard/DashboardAutoRefresh";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";
import { getButtonClassName } from "@/components/ui/primitives/Button";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: locale === "hu" ? "Profilod | trita" : "Your profile | trita",
    robots: { index: false },
  };
}

type ProfileLevel = "start" | "plus";

function toProfileLevel(level: SelfAccess): ProfileLevel {
  return level === "full" ? "plus" : "start";
}

function getInsight(
  score: number,
  insights: { low: string; mid: string; high: string },
): string {
  const range = score < 40 ? "low" : score < 70 ? "mid" : "high";
  return insights[range];
}

type TabId = "results" | "workstyle" | "comparison" | "invites";

export default async function ProfileResultsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [locale, { userId }] = await Promise.all([getServerLocale(), auth()]);
  if (!userId) redirect("/sign-in");

  await requireOnboardedByClerkId(userId);

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      username: true,
      email: true,
      careerBackground: true,
      resultsViewMode: true,
    },
  });
  if (!profile) redirect("/sign-in");

  const [
    latestResult,
    accessLevelRaw,
    completedObserverAssessments,
    sentInvitationsRaw,
    receivedInvitationsRaw,
    draft,
    satisfactionFeedbackRecord,
    journeySnapshot,
    careerHiddenMembership,
  ] = await Promise.all([
    prisma.assessmentResult.findFirst({
      where: { userProfileId: profile.id, isSelfAssessment: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, scores: true, testType: true, createdAt: true },
    }),
    getSelfAccessLevel(profile.id),
    prisma.observerAssessment.findMany({
      where: {
        invitation: {
          inviterId: profile.id,
          status: InvitationStatus.COMPLETED,
        },
      },
      select: { scores: true },
    }),
    prisma.observerInvitation.findMany({
      where: { inviterId: profile.id },
      select: {
        id: true,
        token: true,
        status: true,
        createdAt: true,
        completedAt: true,
        observerEmail: true,
        observerName: true,
        observerType: true,
        assessment: { select: { relationshipType: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.observerInvitation.findMany({
      where: { observerProfileId: profile.id },
      select: {
        id: true,
        token: true,
        status: true,
        createdAt: true,
        expiresAt: true,
        completedAt: true,
        inviter: { select: { username: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.assessmentDraft.findUnique({
      where: { userProfileId: profile.id },
      select: { answers: true, testType: true },
    }),
    prisma.feedback.findFirst({
      where: { userProfileId: profile.id, kind: "satisfaction" },
      select: { id: true },
    }),
    getJourneySnapshotForProfileId(profile.id, {
      locale,
      entryPoint: "profile_results_page",
    }),
    // Org-szintű karrier-modul kapcsoló — közös szabály a /career oldallal
    // és a navigációval (module-visibility.ts). Itt már csak a PDF
    // karrier-blokkjára hat, a fül 2026-07-31 óta külön oldal.
    isCareerModuleHidden(profile.id),
  ]);

  // Karrier-illeszkedés: a szerveren, EGY forrásból — a fül kezdeti nézete és
  // a PDF-export ugyanezt az eredményt kapja. A wizard-változásokat a kliens a
  // /api/career/fit végponton számoltatja újra.
  const storedCareerBackground = profile.careerBackground as
    | (CareerBackground & { status?: string })
    | null;
  const careerResult =
    !CAREER_MODULE_READY || careerHiddenMembership || !storedCareerBackground?.status
      ? null
      : await computeCareerForProfile(profile.id, {
          limit: 18,
          currentIndustry: storedCareerBackground.currentIndustry ?? null,
          status: storedCareerBackground.status as "studying" | "working" | "switching" | null,
          industries: storedCareerBackground.interests ?? [],
        });

  if (!latestResult) {
    // If there's a draft in progress, show a "continue" page instead of redirecting
    // This prevents a redirect loop when user clicks "Continue later"
    const hasDraft = journeySnapshot.state.completionSummary.self.hasDraft || Boolean(draft);
    if (hasDraft) {
      return (
        <main className="-mx-4 -my-8 flex min-h-[80dvh] flex-col items-center justify-center bg-[var(--color-surface-canvas)] px-6 py-16 text-center">
          <div className="w-full max-w-sm">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-surface-self-accent-soft)]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-action-primary-bg)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <h1 className="font-fraunces text-2xl tracking-tight text-[var(--color-text-primary)] md:text-3xl">
              {t("results.draftInProgressTitle", locale)}
            </h1>
            <p className="mx-auto mt-3 max-w-xs text-body leading-relaxed text-[var(--color-text-muted)]">
              {t("results.draftInProgressBody", locale)}
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[12px] leading-relaxed text-[var(--color-text-muted)]">
              {t("results.draftInProgressHint", locale)}
            </p>
            <Link
              href="/assessment"
              className={getButtonClassName({
                size: "lg",
                className:
                  "mt-8 rounded-xl px-8 text-body shadow-md shadow-[var(--color-action-primary-bg)]/20 hover:-translate-y-px hover:brightness-[1.06]",
              })}
            >
              {t("results.draftInProgressCta", locale)}
            </Link>
          </div>
        </main>
      );
    }
    // Nincs eredmény és nincs draft: NEM kényszerítünk a tesztre —
    // barátságos indítóképernyő teljes navigációval (profil, blog,
    // kijelentkezés elérhető marad). A teszt ajánlott, nem kötelező.
    return (
      <main className="-mx-4 -my-8 flex min-h-[80dvh] flex-col items-center justify-center bg-[var(--color-surface-canvas)] px-6 py-16 text-center">
        <div className="w-full max-w-sm">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-surface-self-accent-soft)]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-action-primary-bg)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
            </svg>
          </div>
          <h1 className="font-fraunces text-2xl tracking-tight text-[var(--color-text-primary)] md:text-3xl">
            {t("results.nextStepTestTitle", locale)}
          </h1>
          <p className="mx-auto mt-3 max-w-xs text-body leading-relaxed text-[var(--color-text-muted)]">
            {t("results.nextStepTestBody", locale)}
          </p>
          <Link
            href="/assessment"
            className={getButtonClassName({
              size: "lg",
              className:
                "mt-8 rounded-xl px-8 text-body shadow-md shadow-[var(--color-action-primary-bg)]/20 hover:-translate-y-px hover:brightness-[1.06]",
            })}
          >
            {t("actions.startTest", locale)}
          </Link>
        </div>
      </main>
    );
  }

  const scores = latestResult.scores as ScoreResult;
  if (scores.type !== "likert") redirect(journeySnapshot.resolution.destination);

  const testType = latestResult.testType as TestType;
  const config = getTestConfig(testType, locale);
  const accessLevel = toProfileLevel(accessLevelRaw);

  // ── Draft info ─────────────────────────────────────────────────────────────
  const feedbackSubmitted = Boolean(satisfactionFeedbackRecord);
  const pendingInvitesCount = journeySnapshot.state.completionSummary.self.pendingInvites;
  const selfDashboardVm = createSelfDashboardIA({
    locale,
    displayName: profile.username ?? profile.email ?? "You",
    currentStage: journeySnapshot.state.currentStage,
    completionSummary: journeySnapshot.state.completionSummary,
    nextBestAction: journeySnapshot.nextBestAction,
    blockingReasons: journeySnapshot.state.blockingReasons,
    generatedAt: journeySnapshot.generatedAt,
  });

  // ── Build serialized dimensions ────────────────────────────────────────────
  const completedObservers = completedObserverAssessments.map(
    (e) => e.scores as ScoreResult,
  );
  const hasObserverData = completedObservers.length >= 2;

  const mainDimCodes = config.dimensions
    .filter((d) => d.code !== "I")
    .map((d) => d.code);

  const observerAvg: Record<string, number> = {};
  if (hasObserverData) {
    for (const code of mainDimCodes) {
      let sum = 0;
      let count = 0;
      for (const obs of completedObservers) {
        if (obs.type === "likert" && obs.dimensions[code] != null) {
          sum += obs.dimensions[code];
          count++;
        }
      }
      observerAvg[code] = count > 0 ? Math.round(sum / count) : 0;
    }
  }

  const dimensions = config.dimensions.map((dim) => {
    const score = scores.dimensions[dim.code] ?? 0;
    const insights = (dim.insightsByLocale?.[locale] ?? dim.insights) as {
      low: string;
      mid: string;
      high: string;
    };
    return {
      code: dim.code,
      label: (dim.labelByLocale?.[locale] ?? dim.label) as string,
      labelByLocale: dim.labelByLocale,
      color: dim.color,
      score,
      insight: getInsight(score, insights),
      description: (dim.descriptionByLocale?.[locale] ?? dim.description) as string,
      descriptionByLocale: dim.descriptionByLocale,
      insights: dim.insights,
      insightsByLocale: dim.insightsByLocale,
      observerScore: hasObserverData ? (observerAvg[dim.code] ?? undefined) : undefined,
      facets: (dim.facets ?? []).map((f) => ({
        code: f.code,
        label: (f.labelByLocale?.[locale] ?? f.label) as string,
        score: scores.facets?.[dim.code]?.[f.code] ?? 0,
      })),
      aspects: (dim.aspects ?? []).map((a) => ({
        code: a.code,
        label: (a.labelByLocale?.[locale] ?? a.label) as string,
        score: scores.aspects?.[dim.code]?.[a.code] ?? 0,
      })),
    };
  });

  // ── Growth focus ───────────────────────────────────────────────────────────
  const mainDimensions = dimensions.filter((d) => d.code !== "I");

  interface GrowthItem {
    code: string;
    label: string;
    score: number;
    dimCode: string;
    dimLabel: string;
    dimColor: string;
  }

  const allFacets: GrowthItem[] = [];
  for (const dim of mainDimensions) {
    for (const f of dim.facets) {
      allFacets.push({
        code: f.code,
        label: f.label,
        score: f.score,
        dimCode: dim.code,
        dimLabel: dim.label,
        dimColor: dim.color,
      });
    }
  }
  const growthItems = allFacets
    .filter((f) => f.score < 60)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  const growthFallback: GrowthItem[] = mainDimensions
    .filter((d) => d.score < 60)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((d) => ({
      code: d.code,
      label: d.label,
      score: d.score,
      dimCode: d.code,
      dimLabel: d.label,
      dimColor: d.color,
    }));

  const growthFocusItems = growthItems.length >= 1 ? growthItems : growthFallback;

  // ── Serialize invitations ──────────────────────────────────────────────────
  // ── Csapatszerep: mért self-eredmény + kampányból érkező társ-visszajelzés ─
  const [teamRoleScoreRecord, teamRoleObservationsRaw] = await Promise.all([
    prisma.teamRoleScore.findFirst({
      where: { userProfileId: profile.id },
      orderBy: { createdAt: "desc" },
      select: { scores: true, source: true },
    }),
    prisma.teamRoleObservation.findMany({
      where: { aboutUserId: profile.id },
      orderBy: { updatedAt: "asc" },
      select: { raterUserId: true, selections: true },
    }),
  ]);
  const teamRoleMeasuredScores =
    teamRoleScoreRecord?.source === "questionnaire"
      ? (teamRoleScoreRecord.scores as Record<string, number>)
      : null;
  // Raterenként a legfrissebb kör számít (ismételt körök felülírnak).
  const latestByRater = new Map<string, TeamRoleSelections>();
  for (const obs of teamRoleObservationsRaw) {
    latestByRater.set(obs.raterUserId, obs.selections as TeamRoleSelections);
  }
  const peerAggregate = aggregatePeerRoleScores([...latestByRater.values()]);
  const teamRolePeer =
    peerAggregate.raterCount > 0
      ? {
          raterCount: peerAggregate.raterCount,
          scores: peerAggregate.scores as Record<string, number> | null,
          topRoles: peerAggregate.topRoles.map((r) => ({ role: r.role as string, score: r.score })),
        }
      : null;

  const sentInvitations = sentInvitationsRaw.map((inv) => ({
    id: inv.id,
    token: inv.token,
    status: inv.status,
    createdAt: inv.createdAt.toISOString(),
    completedAt: inv.completedAt?.toISOString() ?? null,
    observerEmail: inv.observerEmail ?? null,
    observerName: inv.observerName ?? null,
    observerType: inv.observerType as string,
    relationship: inv.assessment?.relationshipType ?? null,
  }));

  const receivedInvitations = receivedInvitationsRaw.map((inv) => ({
    id: inv.id,
    token: inv.token,
    status: inv.status,
    createdAt: inv.createdAt.toISOString(),
    expiresAt: inv.expiresAt.toISOString(),
    completedAt: inv.completedAt?.toISOString() ?? null,
    inviterUsername: inv.inviter?.username ?? null,
  }));

  // ── Active tab from searchParams ───────────────────────────────────────────
  const resolvedParams = await searchParams;
  const tabParam = resolvedParams?.tab;
  // Fül-dieta (UX-audit #22): 5 fül → 3. A régi linkek nem törnek:
  // workstyle → results (szekcióként ott él), invites → comparison
  // (a meghívó-kezelés a Külső kép fül része).
  // A karrier külön oldal lett — a régi `?tab=career` linkek (könyvjelző,
  // korábbi e-mail) ne fussanak zsákutcába.
  if (tabParam === "career") redirect("/career");

  const initialTab: TabId =
    tabParam === "comparison" ? "comparison" :
    tabParam === "invites" ? "comparison" :
    tabParam === "workstyle" ? "results" :
    "results";

  // Az /assessment kész eredménnyel ide irányít (?retake=true) — a néma
  // redirect helyett explicit sáv magyarázza, mi történt, és innen
  // indítható az újratöltés (design-akciólista #12).
  const showRetakeBanner = resolvedParams?.retake === "true";

  const displayName =
    profile.username ?? profile.email ?? t("common.userFallback", locale);

  // ── Hero data ──────────────────────────────────────────────────────────────
  const isHu = locale === "hu";
  const highDims = mainDimensions.filter((d) => d.score >= 70);
  const lowDims = mainDimensions.filter((d) => d.score < 40);

  // Személyiség-típus címke a top-2 dimenzióból — a közös archetípus-
  // nyelvtannal (melléknév + főnév, pl. „Energikus újító"); a korábbi
  // mechanikus összefűzés („Innovátor Energikus") kivezetve.
  const personalityType =
    resolvePersonalityTypeFromScores(
      mainDimensions.map((d) => ({ code: d.code, score: d.score })),
      locale === "hu" ? "hu" : "en",
    ) ?? t("results.uniqueProfile", locale);

  // Observer-folyamat állapota (self/csapat szétválasztás): org-tagnál a
  // meghívó-tab állapot-kártyát mutat, az összevetés küszöbhöz kötött.
  const observerFlow = await resolveObserverFlowStatus(profile.id);

  // Hero insight — behavior-based sentence (not dimension names)
  const heroInsight = (() => {
    const sorted = [...mainDimensions].sort((a, b) => b.score - a.score);
    const strongest = sorted[0];
    const weakest = sorted[sorted.length - 1];
    if (!strongest || !weakest) return "";

    const s = DIMENSION_STRENGTH_VERBS[strongest.code]?.[locale] ?? strongest.label;
    const w = DIMENSION_WEAK_VERBS[weakest.code]?.[locale] ?? weakest.label.toLowerCase();
    return isHu
      ? `${s} — ${w}.`
      : `${s} — ${w}.`;
  })();

  // PDF-riport összefoglaló sorai (a képernyőn az accordion a próza gazdája)
  const strengths = highDims.length > 0
    ? highDims.map((d) => d.label.toLowerCase()).join(", ") + t("results.strengthsSuffix", locale)
    : t("results.balancedProfile", locale);

  const watchAreas = lowDims.length > 0
    ? t("results.watchPrefix", locale) + lowDims.map((d) => d.label.toLowerCase()).join(", ") + t("results.watchSuffix", locale)
    : t("results.noLowDim", locale);

  // ── Plus content (profile engine narratives) ──────────────────────────────
  const lang = (locale === "en" ? "en" : "hu") as Locale;
  const dimScores = Object.fromEntries(mainDimensions.map((d) => [d.code, d.score]));
  const workstyle = buildWorkstyleContent(dimScores, testType, lang);

  const plusContent = accessLevel !== "start" ? {
    introText: BLOCK1[lang],
    howYouWork: workstyle.howYouWork,
    pressure: workstyle.pressure,
    pressureParts: workstyle.pressureParts,
    growthTip: workstyle.growthTip,
    growthPlan: workstyle.growthPlan,
    collaboration: workstyle.collaboration,
    envItems: workstyle.envItems,
    roleFit: workstyle.roleFit,
    takeaways: workstyle.takeaways,
    closingText: BLOCK8[lang],
  } : undefined;

  // ── Egyszerű nézet ─────────────────────────────────────────────────────────
  // Ugyanazokból a pontszámokból dolgozik, mint a részletes kép — nincs új
  // mérés és nincs új DB-hívás. A nézetmodell szerver-oldalon áll össze, hogy
  // a szöveg-táblák ne kerüljenek a kliens-bundle-be.
  const simpleSummary = buildSimpleSummary({
    dimensions: mainDimensions.map((d) => ({
      code: d.code,
      label: d.label,
      score: d.score,
    })),
    locale: lang,
  });

  // Nézet-mód: ?view= → mélylinkelt ?tab= → tárolt preferencia → egyszerű.
  const viewMode = resolveResultsViewMode({
    param: resolvedParams?.view,
    tab: tabParam,
    stored: profile.resultsViewMode,
  });

  return (
    <PlatformPageShell
      surface="self"
      contentClassName="max-w-4xl gap-10 px-4 py-10 md:gap-14"
    >
      <DashboardAutoRefresh
        pendingInvites={pendingInvitesCount}
        completedObserver={completedObservers.length}
      />
      {/* A ProfileTabs belső ritmusával (gap-8 md:gap-12) azonos térköz a
          tabokon kívüli elemeknek (pl. csapat-érdeklődés banner) is. */}
      <div className="flex flex-col gap-8 md:gap-12">
        {showRetakeBanner && (
          <section className="flex flex-col gap-3 rounded-[18px] border border-sage/35 bg-sage/5 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">
                {locale === "hu"
                  ? "A mérésed már készen van — ezt az eredményt látod itt."
                  : "Your assessment is already complete — this is that result."}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-body">
                {locale === "hu"
                  ? "Ha újra kitöltöd, a mostani profilod frissül az új válaszaid alapján."
                  : "If you retake it, your profile will be updated based on your new answers."}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/assessment?confirmed=true"
                className={getButtonClassName({ variant: "primary", size: "sm" })}
              >
                {locale === "hu" ? "Újratöltés indítása" : "Start retake"}
              </Link>
              <Link
                href="/profile/results"
                className={getButtonClassName({ variant: "ghost", size: "sm" })}
              >
                {locale === "hu" ? "Maradok az eredményeknél" : "Keep my results"}
              </Link>
            </div>
          </section>
        )}
        <ProfileTabs
          name={displayName}
          assessmentDate={latestResult.createdAt.toISOString()}
          accessLevel={accessLevel}
          initialTab={initialTab}
          dimensions={dimensions}
          growthFocusItems={growthFocusItems}
          hasObserverData={hasObserverData}
          observerCount={completedObservers.length}
          observerFlow={observerFlow}
          sentInvitations={sentInvitations}
          receivedInvitations={receivedInvitations}
          feedbackSubmitted={feedbackSubmitted}
          personalityType={personalityType}
          heroInsight={heroInsight}
          strengths={strengths}
          watchAreas={watchAreas}
          plusContent={plusContent}
          careerResult={careerResult}
          careerModuleHidden={Boolean(careerHiddenMembership)}
          bridgeNextStep={{
            stage: selfDashboardVm.journeyStage ?? journeySnapshot.state.currentStage,
            explanation: selfDashboardVm.recommendedAction.description,
            primary: {
              label: selfDashboardVm.recommendedAction.primary.label,
              href: selfDashboardVm.recommendedAction.primary.href,
            },
            secondary: selfDashboardVm.recommendedAction.secondary
              ? {
                  label: selfDashboardVm.recommendedAction.secondary.label,
                  href: selfDashboardVm.recommendedAction.secondary.href,
                }
              : null,
          }}
          teamRoleMeasuredScores={teamRoleMeasuredScores}
          teamRolePeer={teamRolePeer}
          initialViewMode={viewMode}
          simpleSummary={simpleSummary}
          experienceHints={journeySnapshot.resolution.experienceHints}
          experienceHintDestination={journeySnapshot.resolution.destination}
        />

        {/* Csapat-érdeklődés (meleg lead) — csak consulting-led módban,
            és csak ha a user még nem tagja csapatnak/szervezetnek. */}
        {isConsultingLed() &&
          !journeySnapshot.state.completionSummary.team.joined &&
          !journeySnapshot.state.completionSummary.org.joined && (
            <TeamInterestBanner
              alreadySent={Boolean(
                await prisma.feedback.findUnique({
                  where: {
                    userProfileId_kind_targetKey: {
                      userProfileId: profile.id,
                      kind: "feature_interest",
                      targetKey: "team",
                    },
                  },
                  select: { id: true },
                }),
              )}
            />
          )}

      </div>
    </PlatformPageShell>
  );
}
