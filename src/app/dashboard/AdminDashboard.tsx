"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { t, tf } from "@/lib/i18n";
import {
  DashboardActionCard,
  DashboardPanel,
  DashboardSectionHeader,
  DashboardStatusChip,
} from "@/components/dashboard/DashboardPrimitives";
import { createOrgDashboardIA, type DashboardRiskAttentionItem } from "@/lib/dashboard/ia-contract";
import { JourneyNextStepCard } from "@/components/journey/JourneyNextStepCard";
import { getAvatarGradient } from "@/lib/ui/avatar";
import { resolveWorkspaceNavRole } from "@/lib/navigation/roles";
import { canViewDashboardBlock } from "@/lib/navigation/visibility";

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
  viewer?: {
    role: string;
    isOrgAdmin: boolean;
  };
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
  const viewerNavRole = resolveWorkspaceNavRole(data.viewer?.role ?? "SELF");
  const showOnboardingChecklist = canViewDashboardBlock(viewerNavRole, "onboarding_checklist");
  const showAnalyticsTeaser = canViewDashboardBlock(viewerNavRole, "analytics_teaser");

  // ── Derived ──────────────────────────────────────────────────────────────

  const missingMembers = teams.flatMap((t) => t.members.filter((m) => !m.assessmentDone));
  const missingCount = missingMembers.length;
  const teamsWithSnapshot = teams.filter((t) => t.members.filter((m) => m.assessmentDone).length >= 3).length;

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
  const heroChips = dashboardVm.heroSummary.chips;
  const secondaryHeroAction = dashboardVm.recommendedAction.secondary ?? {
    label: t("dashboard.openOrgCockpit", localeTag),
    href: `/org/${org.id}`,
  };

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
  const pendingOnboardingSteps = showOnboardingChecklist
    ? onboardingSteps.filter((step) => !step.done)
    : [];
  const attentionItems = [
    ...dashboardVm.riskAttentionPanel.items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      cta: item.cta ?? null,
      tone:
        item.severity === "high"
          ? "rose"
          : item.severity === "medium"
            ? "warm"
            : "sage",
    })),
    ...pendingOnboardingSteps.map((step, index) => ({
      id: `onboarding-${index}`,
      title: step.title,
      description: step.detail,
      cta: { label: step.cta, href: step.href },
      tone: "bronze" as const,
    })),
  ];
  const insightTeaserBody = isHu
    ? `A részletes szervezeti értelmezés külön analitikai nézetben érhető el. Jelenleg ${teamsWithSnapshot}/${teams.length} csapatnál áll rendelkezésre csapatkép, összesen ${stats.completedCount} kitöltött felméréssel.`
    : `Detailed organization interpretation is available in analytics. Right now ${teamsWithSnapshot}/${teams.length} teams have team insights, based on ${stats.completedCount} completed assessments.`;
  const analyticsTeaserLabel = isHu ? "Analitikai nézet" : "Analytics";
  const analyticsTeaserEyebrow = isHu ? "Rövid összkép" : "Quick insight";
  const analyticsTeaserTitle = isHu ? "Szervezeti összkép" : "Organization snapshot";
  const analyticsTeaserCta = isHu ? "Analitika megnyitása →" : "Open analytics →";
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
                      href={dashboardVm.recommendedAction.primary.href}
                      className="inline-flex min-h-[44px] items-center rounded-[10px] px-5 py-2 text-[12px] font-semibold text-white no-underline transition hover:brightness-110"
                      style={{ backgroundColor: ORG_HERO_PRIMARY }}
                    >
                      {dashboardVm.recommendedAction.primary.label}
                    </Link>
                    <Link
                      href={secondaryHeroAction.href}
                      className="inline-flex min-h-[44px] items-center rounded-[10px] bg-white/[0.08] px-5 py-2 text-[12px] font-medium text-white/[0.62] no-underline transition hover:bg-white/[0.12]"
                    >
                      {secondaryHeroAction.label}
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
                        <span className="font-semibold text-white/[0.7]">
                          {dashboardVm.completionStatusCards[0]?.progressPct ?? 0}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.12]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${dashboardVm.completionStatusCards[0]?.progressPct ?? 0}%`,
                            backgroundColor: "#8ad0b4",
                          }}
                        />
                      </div>
                      <p className="mt-1.5 text-[10px] text-white/[0.45]">
                        {dashboardVm.completionStatusCards[0]?.sub}
                      </p>
                    </div>

                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-[10px] text-white/[0.52]">
                        <span>{t("dashboard.teamPatternReadiness", localeTag)}</span>
                        <span className="font-semibold text-white/[0.7]">
                          {dashboardVm.completionStatusCards[1]?.progressPct ?? 0}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.12]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${dashboardVm.completionStatusCards[1]?.progressPct ?? 0}%`,
                            backgroundColor: ORG_HERO_PRIMARY,
                          }}
                        />
                      </div>
                      <p className="mt-1.5 text-[10px] text-white/[0.45]">
                        {dashboardVm.completionStatusCards[1]?.sub}
                      </p>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <DashboardSectionHeader label={t("dashboard.needsAttention", localeTag)} className="mb-4" />
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
            <JourneyNextStepCard
              eyebrow={t("dashboard.recommendedStep", localeTag)}
              title={dashboardVm.recommendedAction.title}
              description={dashboardVm.recommendedAction.description}
              primary={dashboardVm.recommendedAction.primary}
              secondary={dashboardVm.recommendedAction.secondary}
            />

            <DashboardPanel className="px-5 py-[18px]">
              <div className="mb-3.5 flex items-center justify-between">
                <span className="font-dm-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                  {t("dashboard.needsAttention", localeTag)}
                </span>
                {attentionItems.length > 0 && (
                  <DashboardStatusChip label={String(attentionItems.length)} tone="bronze" />
                )}
              </div>
              {attentionItems.length === 0 ? (
                <p className="text-[13px] text-muted">
                  {t("dashboard.noOpenActions", localeTag)}
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {attentionItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[18px] bg-cream py-3 pl-3.5 pr-3.5"
                      style={{
                        borderLeft: `2px solid ${
                          item.tone === "rose"
                            ? "var(--color-accent-primary)"
                            : item.tone === "warm" || item.tone === "bronze"
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
        </section>

        <section className="mb-8">
          <DashboardSectionHeader label={t("dashboard.teamMovement", localeTag)} className="mb-4" />
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
                const [from, to] = getAvatarGradient(team.name);

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
        </section>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section>
            <DashboardSectionHeader label={t("dashboard.recentActivity", localeTag)} className="mb-4" />
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
          </section>

          {showAnalyticsTeaser ? (
            <section>
              <DashboardSectionHeader label={analyticsTeaserLabel} className="mb-4" />
              <DashboardActionCard
                eyebrow={analyticsTeaserEyebrow}
                title={analyticsTeaserTitle}
                tone="warm"
                body={<p>{insightTeaserBody}</p>}
                cta={{
                  href: `/org/${org.id}`,
                  label: analyticsTeaserCta,
                  tone: "link",
                }}
              />
            </section>
          ) : null}
        </div>

      </main>
    </div>
  );
}
