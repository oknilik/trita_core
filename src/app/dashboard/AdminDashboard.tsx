"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { t, tf } from "@/lib/i18n";
import {
  DashboardActionCard,
  DashboardMetricCard,
  DashboardPanel,
  DashboardSectionHeader,
  DashboardStatusChip,
} from "@/components/dashboard/DashboardPrimitives";
import { createOrgDashboardIA, type DashboardRiskAttentionItem } from "@/lib/dashboard/ia-contract";
import { evaluateProductLayersForScope } from "@/lib/domain/layers-4plus2";
import { JourneyNextStepCard } from "@/components/journey/JourneyNextStepCard";
import { ProgressChecklist } from "@/components/journey/ProgressChecklist";

// ── Types ──────────────────────────────────────────────────────────────────────

interface TeamMember {
  userId: string;
  username: string;
  role: string;
  joinedAt: string | null;
  assessmentDone: boolean;
  assessmentScore: number | null;
  assessmentAt: string | null;
}

interface OrgStatusResponse {
  org: { id: string; name: string; status: string; createdAt: string };
  teams: Array<{
    id: string;
    name: string;
    inviteUrl: string | null;
    members: TeamMember[];
  }>;
  stats: {
    totalMembers: number;
    completedCount: number;
    pendingCount: number;
    teamMapUnlocked: boolean;
    adminHasAssessment: boolean;
    firstTeamInviteUrl: string | null;
  };
  journey?: {
    currentStage: string;
    completionSummary?: {
      self?: {
        completedObservers?: number;
      };
      org?: {
        activeCampaignCount?: number;
      };
    };
    nextBestAction?: {
      explanation: string;
      primary: {
        label: string;
        href: string;
      };
      secondary?: {
        label: string;
        href: string;
      } | null;
    };
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  ["var(--color-accent-self-strong)", "var(--color-accent-self-deep)"], ["var(--color-accent-primary-strong)", "var(--color-accent-earth-strong)"], ["var(--color-text-secondary)", "var(--color-text-strong-alt)"],
  ["var(--color-visual-gradient-indigo)", "var(--color-visual-gradient-indigo-deep)"], ["var(--color-visual-cyan)", "var(--color-visual-cyan-deep)"], ["var(--color-visual-gradient-purple)", "var(--color-visual-gradient-purple-deep)"],
] as const;

function getAvatarColor(name: string): readonly [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function relativeTime(iso: string | null, locale: "hu" | "en"): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return locale === "hu" ? "most" : "just now";
  if (mins < 60) return locale === "hu" ? `${mins} perce` : `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return locale === "hu" ? `${hrs} órája` : `${hrs}h ago`;
  return locale === "hu" ? `${Math.floor(hrs / 24)} napja` : `${Math.floor(hrs / 24)}d ago`;
}

function progressColor(pct: number): string {
  if (pct >= 80) return "#1D9E75";
  if (pct >= 50) return "#EF9F27";
  return "#c8410a";
}

// ── Dummy data (until real API) ────────────────────────────────────────────────

const DUMMY_HEXACO: Record<string, number> = { H: 62, E: 48, X: 71, A: 55, C: 68, O: 74 };

const HEXACO_DIMS = [
  { key: "H", name: { hu: "Őszinteség", en: "Honesty-Humility" }, color: "#c8410a" },
  { key: "E", name: { hu: "Emocionalitás", en: "Emotionality" }, color: "#1D9E75" },
  { key: "X", name: { hu: "Extraverzió", en: "Extraversion" }, color: "#378ADD" },
  { key: "A", name: { hu: "Barátságosság", en: "Agreeableness" }, color: "#EF9F27" },
  { key: "C", name: { hu: "Lelkiismeretesség", en: "Conscientiousness" }, color: "#7F77DD" },
  { key: "O", name: { hu: "Nyitottság", en: "Openness" }, color: "#D4537E" },
];

const ORG_HERO_GRADIENT =
  "linear-gradient(135deg, #2f4863 0%, #22374d 60%, #172737 100%)";
const ORG_HERO_PRIMARY = "#d2a36a";
const ORG_HERO_BADGE_BG = "rgba(210,163,106,0.22)";
const ORG_HERO_BADGE_TEXT = "#f4c792";

// ── Component ──────────────────────────────────────────────────────────────────

export function AdminDashboard() {
  const { locale } = useLocale();
  const isHu = locale !== "en";
  const localeTag: "hu" | "en" = isHu ? "hu" : "en";
  const [data, setData] = useState<OrgStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/org-status");
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  if (loading) return (
    <div className="flex min-h-dvh items-center justify-center bg-cream">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sand border-t-sage" />
        <p className="font-dm-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
          {t("dashboard.loading", localeTag)}
        </p>
      </div>
    </div>
  );

  if (!data) return (
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col items-center justify-center gap-4 bg-cream px-4">
      <p className="text-[13px] text-ink-body">
        {t("dashboard.loadError", localeTag)}
      </p>
      <button onClick={fetchStatus} className="rounded-[10px] bg-ink px-4 py-2 text-[13px] font-semibold text-cream">
        {t("dashboard.retry", localeTag)}
      </button>
    </main>
  );

  const { org, teams, stats } = data;

  // ── Derived ──────────────────────────────────────────────────────────────

  const missingMembers = teams.flatMap((t) => t.members.filter((m) => !m.assessmentDone));
  const missingCount = missingMembers.length;
  const teamsWithSnapshot = teams.filter((t) => t.members.filter((m) => m.assessmentDone).length >= 3).length;
  const notStarted = teams.flatMap((t) => t.members.filter((m) => !m.assessmentDone && !m.joinedAt)).length;

  // Todos
  type Todo = { severity: "red" | "amber" | "green"; title: string; desc: string; cta?: { label: string; href: string } };
  const todos: Todo[] = [];
  if (missingCount > 0) {
    todos.push({
      severity: "red",
      title: t("dashboard.missingAssessments", localeTag),
      desc: missingMembers.slice(0, 3).map((m) => m.username).join(" · "),
      cta: {
        label: t("dashboard.sendReminder", localeTag),
        href: `/org/${org.id}?tab=members`,
      },
    });
  }
  if (!stats.teamMapUnlocked) {
    todos.push({
      severity: "amber",
      title: t("dashboard.feedbackNotStarted", localeTag),
      desc: t("dashboard.feedbackNotStartedDesc", localeTag),
    });
  }
  if (teamsWithSnapshot > 0) {
    todos.push({
      severity: "green",
      title: t("dashboard.teamPatternAvailable", localeTag),
      desc: tf("dashboard.teamPatternAvailableCount", localeTag, { count: String(teamsWithSnapshot) }),
      cta: {
        label: t("dashboard.teamPatternView", localeTag),
        href: `/team/${teams[0]?.id ?? ""}`,
      },
    });
  }

  // Activity
  const activities = teams.flatMap((tm) => tm.members.filter((m) => m.assessmentAt || m.joinedAt).map((m) => ({
    name: m.username, teamName: tm.name, date: m.assessmentAt ?? m.joinedAt ?? "",
    type: m.assessmentDone ? "completed" as const : "joined" as const,
    desc: m.assessmentDone
      ? t("dashboard.activityCompleted", localeTag)
      : t("dashboard.activityJoined", localeTag),
  }))).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  // Insight
  const localizedHexacoDims = HEXACO_DIMS.map((dim) => ({
    ...dim,
    name: dim.name[localeTag],
  }));
  const topDim = localizedHexacoDims.reduce((a, b) =>
    DUMMY_HEXACO[a.key] > DUMMY_HEXACO[b.key] ? a : b,
  );
  const lowDim = localizedHexacoDims.reduce((a, b) =>
    DUMMY_HEXACO[a.key] < DUMMY_HEXACO[b.key] ? a : b,
  );
  const conscientiousnessDim =
    localizedHexacoDims.find((dim) => dim.key === "C") ?? localizedHexacoDims[4];

  // TODO(journey-guardrail): remove this fallback once `/api/admin/org-status`
  // always guarantees `journey.nextBestAction`.
  // Reason: we keep a resilient UI-only fallback temporarily for partial API states.
  const fallbackRecommendedAction = (() => {
    const teamWithReminder = teams.find((t) => t.members.some((m) => !m.assessmentDone));
    if (teamWithReminder) {
      return {
        title: t("dashboard.bestNextStep", localeTag),
        description: tf("dashboard.reminderFallbackDesc", localeTag, { teamName: teamWithReminder.name }),
        primary: {
          label: t("dashboard.reminderFallbackPrimary", localeTag),
          href: `/org/${org.id}?tab=members`,
        },
        secondary: null,
      };
    }
    if (teamsWithSnapshot > 0) {
      return {
        title: t("dashboard.bestNextStep", localeTag),
        description: t("dashboard.snapshotFallbackDesc", localeTag),
        primary: {
          label: t("dashboard.snapshotFallbackPrimary", localeTag),
          href: `/team/${teams[0]?.id ?? ""}`,
        },
        secondary: null,
      };
    }
    return {
      title: t("dashboard.bestNextStep", localeTag),
      description: t("dashboard.campaignFallbackDesc", localeTag),
      primary: {
        label: t("dashboard.campaignFallbackPrimary", localeTag),
        href: `/org/${org.id}?tab=campaigns`,
      },
      secondary: null,
    };
  })();

  const now = new Date();
  const lastUpdated = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const riskItems: DashboardRiskAttentionItem[] = todos.map((todo, index) => ({
    id: `org-risk-${index}`,
    severity: todo.severity === "red" ? "high" : todo.severity === "amber" ? "medium" : "low",
    title: todo.title,
    description: todo.desc,
    cta: todo.cta ? { label: todo.cta.label, href: todo.cta.href } : undefined,
  }));
  const recommendedAction = data.journey?.nextBestAction
    ? {
        title: t("dashboard.recommendedNextStep", localeTag),
        description: data.journey.nextBestAction.explanation,
        primary: data.journey.nextBestAction.primary,
        secondary: data.journey.nextBestAction.secondary ?? null,
      }
    : fallbackRecommendedAction;
  const dashboardVm = createOrgDashboardIA({
    locale: localeTag,
    orgName: org.name,
    totalMembers: stats.totalMembers,
    completedMembers: stats.completedCount,
    teamCount: teams.length,
    teamsReadyCount: teamsWithSnapshot,
    pendingAttentionCount: todos.length,
    activeCampaignCount: data.journey?.completionSummary?.org?.activeCampaignCount ?? 0,
    recommendedAction,
    riskItems,
    recentActivity: activities.map((activity, index) => ({
      id: `activity-${index}`,
      kind: activity.type,
      title: `${activity.name} ${activity.desc}`,
      meta: `${activity.teamName} · ${relativeTime(activity.date, localeTag)}`,
      timestampLabel: activity.date,
    })),
    updatedAtLabel: lastUpdated,
  });
  const [orgCompletionCard, teamReadinessCard, attentionCard] =
    dashboardVm.completionStatusCards;
  const layerStatuses = evaluateProductLayersForScope(localeTag, {
    hasSelfAssessmentStarted: stats.totalMembers > 0,
    hasSelfAssessment: stats.adminHasAssessment,
    hasBelbinStarted: teamsWithSnapshot > 0,
    hasBelbin: teamsWithSnapshot > 0,
    hasStrengthProfile: stats.completedCount > 0,
    hasObserverFeedback: (data.journey?.completionSummary?.self?.completedObservers ?? 0) > 0,
    hasTeamInsights: teamsWithSnapshot > 0,
    hasOrgCampaign: (data.journey?.completionSummary?.org?.activeCampaignCount ?? 0) > 0,
    hasValuesLayerStarted: false,
    hasValuesLayer: false,
    hasConflictLayerStarted: false,
    hasConflictLayer: false,
    hasPlusAccess: true,
  }, "dashboard", "org");
  const heroChips = dashboardVm.heroSummary.chips;
  const secondaryFocusAction = dashboardVm.recommendedAction.secondary ?? {
    label: t("dashboard.openOrgCockpit", localeTag),
    href: `/org/${org.id}`,
  };

  const showOnboarding = teams.length === 1 && !stats.teamMapUnlocked;
  const onboardingSteps = [
    {
      title: t("dashboard.firstTeamCreated", localeTag),
      done: teams.length > 0,
      detail: teams[0]
        ? tf("dashboard.teamCreatedDetail", localeTag, { name: teams[0].name })
        : t("dashboard.teamCreateNeeded", localeTag),
      href: teams[0] ? `/team/${teams[0].id}` : `/org/${org.id}?tab=teams`,
      cta: teams[0]
        ? t("dashboard.openTeam", localeTag)
        : t("dashboard.createTeam", localeTag),
    },
    {
      title: t("dashboard.completeProfile", localeTag),
      done: stats.adminHasAssessment,
      detail: stats.adminHasAssessment
        ? t("dashboard.profileDone", localeTag)
        : t("dashboard.profileMissing", localeTag),
      href: "/assessment",
      cta: stats.adminHasAssessment
        ? t("dashboard.viewProfile", localeTag)
        : t("dashboard.startAssessment", localeTag),
    },
    {
      title: t("dashboard.inviteMembers", localeTag),
      done: stats.totalMembers >= 3,
      detail: tf("dashboard.activeMembersCount", localeTag, { count: String(stats.totalMembers) }),
      href: `/org/${org.id}?tab=members`,
      cta: t("dashboard.manageMembers", localeTag),
    },
    {
      title: t("dashboard.unlockTeamPattern", localeTag),
      done: stats.completedCount >= 3,
      detail: tf("dashboard.completionCount", localeTag, { count: String(stats.completedCount) }),
      href: `/org/${org.id}?tab=members`,
      cta: t("dashboard.trackProgress", localeTag),
    },
  ];
  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-dvh bg-cream">
      <main className="mx-auto max-w-[1180px] px-4 pb-16 pt-8 sm:px-8">

        {/* ═══ HERO BANNER ═══ */}
        <section className="mb-6">
          <div
            className="relative overflow-hidden rounded-[30px]"
            style={{ background: ORG_HERO_GRADIENT }}
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-[260px] w-[260px] rounded-full bg-white/[0.03]" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-24 rounded-tr-full bg-[var(--color-accent-primary)]/10" />

            <div className="relative px-6 py-7 md:px-8 md:py-8">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <p className="text-[9px] uppercase tracking-[2px] text-white/[0.28]">
                      {dashboardVm.heroSummary.eyebrow}
                    </p>
                    <span className="rounded-md bg-white/[0.08] px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/[0.55]">
                      {t("dashboard.updated", localeTag)} {dashboardVm.heroSummary.updatedAtLabel ?? lastUpdated}
                    </span>
                  </div>

                  <h1 className="mt-3 font-fraunces text-[34px] tracking-tight text-white md:text-[40px]">
                    {dashboardVm.heroSummary.title}
                  </h1>

                  <p className="mt-3 max-w-[620px] text-[14px] leading-relaxed text-white/[0.42]">
                    {dashboardVm.heroSummary.summary}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {heroChips.map((chip) => (
                      <span
                        key={chip}
                        className="rounded-full bg-white/[0.08] px-3 py-1.5 text-[11px] font-medium text-white/[0.62]"
                      >
                        {chip}
                      </span>
                    ))}
                    {dashboardVm.riskAttentionPanel.items.length > 0 && (
                      <span
                        className="rounded-full px-3 py-1.5 text-[11px] font-semibold"
                        style={{ backgroundColor: ORG_HERO_BADGE_BG, color: ORG_HERO_BADGE_TEXT }}
                      >
                        {tf("dashboard.openAttentionPoints", localeTag, { count: String(dashboardVm.riskAttentionPanel.items.length) })}
                      </span>
                    )}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <Link
                      href={`/org/${org.id}?tab=members`}
                      className="inline-flex min-h-[44px] items-center rounded-[10px] px-5 py-2 text-[12px] font-semibold text-white no-underline transition hover:brightness-110"
                      style={{ backgroundColor: ORG_HERO_PRIMARY }}
                    >
                      {t("dashboard.inviteMembersForPattern", localeTag)}
                    </Link>
                    <Link
                      href={`/org/${org.id}`}
                      className="inline-flex min-h-[44px] items-center rounded-[10px] bg-white/[0.08] px-5 py-2 text-[12px] font-medium text-white/[0.62] no-underline transition hover:bg-white/[0.12]"
                    >
                      {t("dashboard.openOrgReport", localeTag)}
                    </Link>
                  </div>
                </div>

                <aside className="hidden rounded-2xl border border-white/15 bg-white/[0.06] p-4 backdrop-blur-[2px] lg:block">
                  <p className="text-[9px] uppercase tracking-[2px] text-white/[0.34]">
                    {t("dashboard.liveSnapshot", localeTag)}
                  </p>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-white/[0.08] px-3 py-2">
                      <p className="text-[9px] uppercase tracking-[0.18em] text-white/[0.35]">
                        {t("dashboard.membersLabel", localeTag)}
                      </p>
                      <p className="mt-1 font-fraunces text-[22px] leading-none text-white">{stats.totalMembers}</p>
                    </div>
                    <div className="rounded-xl bg-white/[0.08] px-3 py-2">
                      <p className="text-[9px] uppercase tracking-[0.18em] text-white/[0.35]">
                        {t("dashboard.teamsLabel", localeTag)}
                      </p>
                      <p className="mt-1 font-fraunces text-[22px] leading-none text-white">{teams.length}</p>
                    </div>
                    <div className="rounded-xl bg-white/[0.08] px-3 py-2">
                      <p className="text-[9px] uppercase tracking-[0.18em] text-white/[0.35]">
                        {t("dashboard.doneLabel", localeTag)}
                      </p>
                      <p className="mt-1 font-fraunces text-[22px] leading-none text-white">{stats.completedCount}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-[10px] text-white/[0.52]">
                        <span>{t("dashboard.orgCompletion", localeTag)}</span>
                        <span className="font-semibold text-white/[0.7]">{orgCompletionCard.progressPct ?? 0}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.12]">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${orgCompletionCard.progressPct ?? 0}%`, backgroundColor: "#8ad0b4" }}
                        />
                      </div>
                      <p className="mt-1.5 text-[10px] text-white/[0.45]">
                        {orgCompletionCard.sub}
                      </p>
                    </div>

                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-[10px] text-white/[0.52]">
                        <span>{t("dashboard.teamPatternReadiness", localeTag)}</span>
                        <span className="font-semibold text-white/[0.7]">{teamReadinessCard.progressPct ?? 0}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.12]">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${teamReadinessCard.progressPct ?? 0}%`, backgroundColor: ORG_HERO_PRIMARY }}
                        />
                      </div>
                      <p className="mt-1.5 text-[10px] text-white/[0.45]">
                        {teamReadinessCard.sub}
                      </p>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </section>

        {showOnboarding && (
          <section className="mb-8">
            <ProgressChecklist
              eyebrow={t("dashboard.onboardingEyebrow", localeTag)}
              title={t("dashboard.firstTeamKickoff", localeTag)}
              description={t("dashboard.onboardingDesc", localeTag)}
              items={onboardingSteps.map((step, index) => ({
                id: `onboarding-step-${index}`,
                title: step.title,
                detail: step.detail,
                done: step.done,
                cta: step.done
                  ? undefined
                  : {
                      label: step.cta,
                      href: step.href,
                    },
              }))}
              nextStepLabel={t("dashboard.nextStep", localeTag)}
            />
          </section>
        )}

        {showOnboarding ? (
          <section className="mb-8">
            <DashboardSectionHeader
              label={t("dashboard.upcomingModules", localeTag)}
              className="mb-4"
            />
            <div className="relative overflow-hidden rounded-[24px] border border-sand bg-white">
              <div className="space-y-5 p-5 blur-[2.5px]">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-sand bg-cream p-4">
                    <div className="h-3.5 w-40 rounded bg-sand" />
                    <div className="mt-3 h-3 w-full rounded bg-sand/90" />
                    <div className="mt-2 h-3 w-3/4 rounded bg-sand/90" />
                    <div className="mt-4 h-9 w-32 rounded bg-sand" />
                  </div>
                  <div className="rounded-2xl border border-sand bg-cream p-4">
                    <div className="h-3.5 w-32 rounded bg-sand" />
                    <div className="mt-3 space-y-2">
                      <div className="h-10 w-full rounded bg-sand/90" />
                      <div className="h-10 w-full rounded bg-sand/90" />
                      <div className="h-10 w-full rounded bg-sand/90" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="h-28 rounded-2xl border border-sand bg-cream" />
                  ))}
                </div>
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="h-44 rounded-2xl border border-sand bg-cream" />
                  <div className="h-44 rounded-2xl border border-sand bg-cream" />
                </div>
              </div>

              <div className="absolute inset-0 flex items-center justify-center bg-white/35 px-4">
                <div className="max-w-md rounded-2xl border border-sand bg-white px-5 py-4 text-center shadow-[0_12px_32px_rgba(26,26,46,0.08)]">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-bronze/80">
                    {t("dashboard.onboardingFocus", localeTag)}
                  </p>
                  <p className="mt-2 text-[13px] leading-[1.65] text-ink-body">
                    {t("dashboard.onboardingFocusDesc", localeTag)}
                  </p>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <>
            <section className="mb-8 grid gap-4 lg:grid-cols-2">
              <JourneyNextStepCard
                eyebrow={t("dashboard.recommendedStep", localeTag)}
                title={dashboardVm.recommendedAction.title}
                description={dashboardVm.recommendedAction.description}
                primary={dashboardVm.recommendedAction.primary}
                secondary={dashboardVm.recommendedAction.secondary}
              />

              <DashboardPanel tone="warm" className="p-5">
                <p className="font-dm-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-sage-dark/70">
                  {t("dashboard.secondaryStep", localeTag)}
                </p>
                <div className="mt-4 space-y-3">
                  <Link
                    href={secondaryFocusAction.href}
                    className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[12px] border border-sand bg-white px-4 py-3 text-[13px] font-semibold text-ink no-underline transition-colors hover:border-sage/25 hover:bg-cream"
                  >
                    {secondaryFocusAction.label}
                  </Link>
                  <Link
                    href={`/org/${org.id}`}
                    className="inline-flex text-[12px] font-semibold text-bronze no-underline transition-colors hover:text-bronze-dark"
                  >
                    {t("dashboard.moreActionsOrg", localeTag)}
                  </Link>
                </div>
              </DashboardPanel>
            </section>

            {/* ═══ KPI ROW ═══ */}
            <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <DashboardMetricCard
                accent="var(--color-accent-primary)"
                title={orgCompletionCard.label}
                value={orgCompletionCard.value.replace("%", "")}
                suffix="%"
                sub={orgCompletionCard.sub}
                progressPct={orgCompletionCard.progressPct}
                progressColor="var(--color-accent-primary)"
              />
              <DashboardMetricCard
                accent="#1D9E75"
                title={t("dashboard.activeMembersTitle", localeTag)}
                value={`${stats.completedCount}`}
                suffix={`/${stats.totalMembers}`}
                sub={notStarted > 0
                  ? tf("dashboard.notStartedCount", localeTag, { count: String(notStarted) })
                  : t("dashboard.everyoneStarted", localeTag)}
                progressPct={stats.totalMembers > 0 ? (stats.completedCount / stats.totalMembers) * 100 : 0}
                progressColor="#1D9E75"
              />
              <DashboardMetricCard
                accent="var(--color-accent-primary)"
                title={attentionCard.label}
                value={attentionCard.value}
                sub={attentionCard.sub}
                valueColor={Number(attentionCard.value) > 0 ? "var(--color-accent-primary)" : undefined}
                progressPct={attentionCard.progressPct}
                progressColor="var(--color-accent-primary)"
              />
              <DashboardMetricCard
                accent="#0F6E56"
                title={teamReadinessCard.label}
                value={`${teamsWithSnapshot}`}
                suffix={`/${teams.length}`}
                sub={teamReadinessCard.sub}
                progressPct={teamReadinessCard.progressPct}
                progressColor="#0F6E56"
              />
            </div>

            <section className="mb-8">
              <DashboardPanel className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-dm-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                    {t("dashboard.layerReadiness", localeTag)}
                  </p>
                  <DashboardStatusChip
                    label={`${layerStatuses.filter((layer) => layer.status === "COMPLETED").length}/6 ${t("orgHero.done", localeTag)}`}
                    tone="sage"
                  />
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {layerStatuses.map((layer) => {
                    const tone =
                      layer.status === "COMPLETED"
                        ? "sage"
                        : layer.status === "IN_PROGRESS"
                          ? "bronze"
                        : layer.status === "AVAILABLE"
                          ? "warm"
                          : "muted";
                    const statusLabel =
                      layer.status === "COMPLETED"
                        ? t("dashboard.layerStatusCompleted", localeTag)
                        : layer.status === "IN_PROGRESS"
                          ? t("dashboard.layerStatusInProgress", localeTag)
                          : layer.status === "AVAILABLE"
                          ? t("dashboard.layerStatusAvailable", localeTag)
                          : t("dashboard.layerStatusLocked", localeTag);

                    return (
                      <div key={layer.id} className="rounded-[14px] border border-sand bg-cream px-3 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[12px] font-semibold text-ink">{layer.label}</p>
                          <DashboardStatusChip label={statusLabel} tone={tone} />
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-ink-body">
                          {layer.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </DashboardPanel>
            </section>

            <DashboardSectionHeader label={t("dashboard.leadershipFocus", localeTag)} className="mb-4" />
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">

              <div className="flex flex-col gap-5">
                <DashboardPanel className="px-5 py-5 sm:px-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-fraunces text-[24px] leading-none tracking-tight text-ink">
                        {t("dashboard.orgPersonalityProfile", localeTag)}
                      </p>
                      <p className="mt-2 text-[11px] leading-[1.5] text-ink-body">
                        {tf("dashboard.assessedMembersAvg", localeTag, { count: String(stats.completedCount) })}
                      </p>
                    </div>
                    <Link href={`/org/${org.id}`} className="text-[12px] font-semibold text-bronze no-underline">
                      {t("dashboard.detailedView", localeTag)}
                    </Link>
                  </div>
                  <div className="my-4 border-t border-sand" />
                  <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
                    {localizedHexacoDims.map((d) => (
                      <DimRing key={d.key} name={d.name} value={DUMMY_HEXACO[d.key]} color={d.color} />
                    ))}
                  </div>
                  <DashboardActionCard
                    eyebrow={t("dashboard.dominantPattern", localeTag)}
                    title={t("dashboard.structuredInnovator", localeTag)}
                    tone="warm"
                    body={
                      <>
                        {tf("dashboard.patternDesc", localeTag, { top: topDim.name.toLowerCase(), conscientiousness: conscientiousnessDim.name.toLowerCase(), low: lowDim.name.toLowerCase() })}
                      </>
                    }
                    cta={{
                      href: `/org/${org.id}`,
                      label: t("dashboard.openTeamPattern", localeTag),
                      tone: "link",
                    }}
                  />
                </DashboardPanel>
              </div>

              <div className="flex flex-col gap-5">
                <div
                  className="rounded-[28px] px-5 py-5"
                  style={{
                    background: ORG_HERO_GRADIENT,
                  }}
                >
                  <p className="mb-2 text-[10px] uppercase tracking-[0.9px] text-white/[0.32]">
                    {t("dashboard.watchNow", localeTag)}
                  </p>
                  <h3 className="mb-2 font-fraunces text-[24px] leading-[1.05] tracking-tight text-white">
                    {tf("dashboard.highLow", localeTag, { top: topDim.name.toLowerCase(), low: lowDim.name.toLowerCase() })}
                  </h3>
                  <p className="text-[12.5px] leading-[1.7] text-white/[0.68]">
                    {tf("dashboard.frictionDesc", localeTag, { low: lowDim.name.toLowerCase(), pct: String(DUMMY_HEXACO[lowDim.key]) })}
                  </p>
                  <Link href={`/org/${org.id}`} className="mt-4 inline-flex text-[12px] font-semibold text-[var(--color-accent-primary-soft)] no-underline">
                    {t("dashboard.detailedAnalysis", localeTag)}
                  </Link>
                </div>

                <DashboardPanel className="px-5 py-[18px]">
                  <div className="mb-3.5 flex items-center justify-between">
                    <span className="font-dm-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                      {t("dashboard.needsAttention", localeTag)}
                    </span>
                    {dashboardVm.riskAttentionPanel.items.length > 0 && (
                      <DashboardStatusChip label={String(dashboardVm.riskAttentionPanel.items.length)} tone="bronze" />
                    )}
                  </div>
                  {dashboardVm.riskAttentionPanel.items.length === 0 ? (
                    <p className="text-[13px] text-muted">
                      {t("dashboard.noOpenActions", localeTag)}
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {dashboardVm.riskAttentionPanel.items.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-[18px] bg-cream py-3 pl-3.5 pr-3.5"
                          style={{
                            borderLeft: `2px solid ${
                              item.severity === "high"
                                ? "var(--color-accent-primary)"
                                : item.severity === "medium"
                                  ? "#d4a15a"
                                  : "var(--color-action-primary-bg)"
                            }`,
                          }}
                        >
                          <p className="mb-0.5 text-[13px] font-semibold text-ink">{item.title}</p>
                          <p className="text-[12px] leading-[1.5] text-ink-body">{item.description}</p>
                          {item.cta && (
                            <Link href={item.cta.href} className="mt-1 inline-block text-[11px] font-semibold text-bronze no-underline">
                              {item.cta.label} →
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </DashboardPanel>
              </div>
            </div>

            <DashboardSectionHeader label={t("dashboard.teamMovement", localeTag)} className="mb-4 mt-8" />
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <DashboardPanel className="px-5 py-5 sm:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-fraunces text-[24px] leading-none tracking-tight text-ink">
                      {t("dashboard.teamStatus", localeTag)}
                    </p>
                    <p className="mt-2 text-[11px] leading-[1.5] text-ink-body">
                      {t("dashboard.teamStatusDesc", localeTag)}
                    </p>
                  </div>
                  <Link href="/team" className="text-[12px] font-semibold text-bronze no-underline">
                    {t("dashboard.allTeams", localeTag)}
                  </Link>
                </div>
                <div className="mt-4 flex flex-col gap-3">
                  {teams.map((team) => {
                    const done = team.members.filter((m) => m.assessmentDone).length;
                    const total = team.members.length;
                    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                    const rem = total - done;
                    const snap = done >= 3;
                    const [from, to] = getAvatarColor(team.name);

                    const insight = rem > 0 && snap
                      ? tf("dashboard.insightAlmostReady", localeTag, { count: String(rem) })
                      : snap
                      ? t("dashboard.insightReady", localeTag)
                      : tf("dashboard.insightNeeded", localeTag, { count: String(rem) });

                    const statusLabel = snap
                      ? t("dashboard.patternReady", localeTag)
                      : pct >= 50
                        ? t("dashboard.patternBuilding", localeTag)
                        : t("dashboard.pending", localeTag);
                    const statusTone = snap ? "sage" : pct >= 50 ? "warm" : "rose";

                    return (
                      <Link key={team.id} href={`/team/${team.id}`} className="block rounded-[20px] border border-sand bg-cream p-4 no-underline transition-colors hover:bg-warm">
                        <div className="mb-2.5 flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-white" style={{ background: `linear-gradient(135deg,${from},${to})` }}>
                              {team.name[0]?.toUpperCase() ?? "?"}
                            </div>
                            <div>
                              <p className="text-[13px] font-semibold text-ink">{team.name}</p>
                              <p className="mt-0.5 text-[11px] text-muted">
                                {tf("dashboard.teamMemberCount", localeTag, { count: String(total) })}
                              </p>
                            </div>
                          </div>
                          <DashboardStatusChip label={statusLabel} tone={statusTone} />
                        </div>
                        <div className="mb-2 h-1 overflow-hidden rounded-[3px] bg-sand">
                          <div className="h-full rounded-[3px]" style={{ width: `${pct}%`, background: progressColor(pct) }} />
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="flex-1 pr-3 text-[12px] leading-[1.55] text-ink-body">{insight}</p>
                          <span className="shrink-0 text-[12px] font-semibold text-bronze">
                            {t("dashboard.open", localeTag)}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </DashboardPanel>

              <DashboardPanel className="px-5 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-fraunces text-[24px] leading-none tracking-tight text-ink">
                      {t("dashboard.recentActivity", localeTag)}
                    </p>
                    <p className="mt-2 text-[11px] leading-[1.5] text-ink-body">
                      {t("dashboard.last2Weeks", localeTag)}
                    </p>
                  </div>
                </div>
                {dashboardVm.recentActivity.length === 0 ? (
                  <p className="mt-4 text-[13px] text-muted">
                    {t("dashboard.noActivity", localeTag)}
                  </p>
                ) : (
                  <div className="mt-4 flex flex-col gap-2.5">
                    {dashboardVm.recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-2.5">
                        <div className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: activity.kind === "completed" ? "#1D9E75" : "#EF9F27" }} />
                        <div className="min-w-0">
                          <p className="text-[13px] leading-[1.55] text-ink">{activity.title}</p>
                          <p className="mt-0.5 text-[11px] text-muted">{activity.meta}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </DashboardPanel>
            </div>
          </>
        )}

      </main>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function DimRing({ name, value, color }: { name: string; value: number; color: string }) {
  const c = 125.66;
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 52 52" width="52" height="52" className="mx-auto">
        <circle cx="26" cy="26" r="20" fill="none" stroke="rgba(26,46,34,0.08)" strokeWidth="5" />
        <circle cx="26" cy="26" r="20" fill="none" stroke={color} strokeWidth="5" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} strokeLinecap="round" transform="rotate(-90 26 26)" style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)" }} />
        <text x="26" y="30" textAnchor="middle" fontSize="12" fontWeight="500" fill="#1a2e22">{value}</text>
      </svg>
      <p className="mt-1 text-center text-[10px] leading-tight text-muted">{name}</p>
    </div>
  );
}
