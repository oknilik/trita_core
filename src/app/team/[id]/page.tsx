import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { canAccessTeam, canManageTeam } from "@/lib/team-auth";
import { requireActiveSubscription } from "@/lib/require-active-subscription";
import { getTeamPageData } from "@/lib/team-stats";
import { createTeamDashboardIA } from "@/lib/dashboard/ia-contract";
import { evaluateProductLayersForScope } from "@/lib/domain/layers-4plus2";
import {
  DashboardMetricCard,
  DashboardPanel,
  DashboardSectionHeader,
  DashboardStatusChip,
} from "@/components/dashboard/DashboardPrimitives";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";
import { JourneyNextStepCard } from "@/components/journey/JourneyNextStepCard";
import { ProgressChecklist } from "@/components/journey/ProgressChecklist";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: locale === "hu" ? "Csapat | trita" : "Team | trita",
    robots: { index: false },
  };
}

const AVATAR_COLORS = [
  ["#2a5244", "#1e3d34"],
  ["#8a5530", "#6b3f22"],
  ["#4a4a5e", "#33334a"],
  ["#6366F1", "#4F46E5"],
  ["#0E7490", "#0C5E75"],
  ["#9333EA", "#7C22CB"],
] as const;

const TEAM_HERO_GRADIENT =
  "linear-gradient(135deg, #66455d 0%, #4a314a 60%, #2f2035 100%)";
const TEAM_HERO_PRIMARY = "#d48e62";
const TEAM_HERO_BADGE_BG = "rgba(212,142,98,0.22)";
const TEAM_HERO_BADGE_TEXT = "#f3c39d";

function getAvatarColor(name: string): readonly [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [locale, { userId }, { id: teamId }] = await Promise.all([
    getServerLocale(), auth(), params,
  ]);
  if (!userId) redirect("/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId }, select: { id: true },
  });
  if (!profile) redirect("/dashboard");

  const team = await prisma.team.findUnique({
    where: { id: teamId }, select: { id: true, name: true, orgId: true },
  });
  if (!team) notFound();

  const orgMembership = team.orgId
    ? await prisma.organizationMember.findUnique({
        where: { orgId_userId: { orgId: team.orgId, userId: profile.id } },
        select: { role: true },
      })
    : null;
  const orgMemberRole = orgMembership?.role ?? null;
  if (!orgMemberRole) redirect("/dashboard");

  const hasTeamAccess = await canAccessTeam(profile.id, teamId, orgMemberRole);
  if (!hasTeamAccess) redirect("/dashboard");
  const isOrgManager = await canManageTeam(profile.id, teamId, orgMemberRole);
  await requireActiveSubscription();

  const isHu = locale !== "en";
  const teamData = await getTeamPageData(teamId, locale as "hu" | "en");
  if (!teamData) notFound();

  const completedCount = teamData.completedCount;
  const inProgressCount = teamData.members.filter((m) => m.scores === null && m.joinedAt).length;
  const waitingCount = teamData.memberCount - completedCount - inProgressCount;
  const completionPct = teamData.memberCount > 0 ? Math.round((completedCount / teamData.memberCount) * 100) : 0;
  const hasPattern = completedCount >= 3;
  const hasObserver = !!teamData.activeCampaign;
  const patternTarget = 3;
  const patternProgressPct = Math.min(
    Math.round((completedCount / patternTarget) * 100),
    100,
  );
  const observerCoveragePct =
    hasObserver && teamData.activeCampaign!.teamParticipantCount > 0
      ? Math.round(
          (teamData.activeCampaign!.teamObserverDoneCount /
            teamData.activeCampaign!.teamParticipantCount) *
            100,
        )
      : 0;
  const secondaryLabel = hasObserver
    ? (isHu ? "Visszajelzési kör" : "Feedback round")
    : (isHu ? "Csapatkép készültség" : "Pattern readiness");
  const secondaryPct = hasObserver ? observerCoveragePct : patternProgressPct;
  const secondaryText = hasObserver
    ? isHu
      ? `${teamData.activeCampaign!.teamObserverDoneCount} kész · ${Math.max(teamData.activeCampaign!.teamParticipantCount - teamData.activeCampaign!.teamObserverDoneCount, 0)} hátra`
      : `${teamData.activeCampaign!.teamObserverDoneCount} done · ${Math.max(teamData.activeCampaign!.teamParticipantCount - teamData.activeCampaign!.teamObserverDoneCount, 0)} remaining`
    : hasPattern
      ? (isHu ? "A csapatkép elérhető" : "Team pattern is available")
      : isHu
        ? `${Math.min(completedCount, patternTarget)}/${patternTarget} kész`
        : `${Math.min(completedCount, patternTarget)}/${patternTarget} done`;
  const recommendedAction = (() => {
    if (isOrgManager && teamData.orgId) {
      return {
        title: isHu ? "Következő lépés" : "Next step",
        description: hasObserver
          ? (isHu ? "A visszajelzési kör fut, kövesd és zárd le a hiányzó visszajelzéseket." : "The feedback round is active. Track and close remaining feedback.")
          : hasPattern
            ? (isHu ? "A csapatkép kész, most érdemes elindítani a visszajelzési kört." : "Team pattern is ready. Launch the feedback round now.")
            : (isHu ? "Előbb zárjátok le a hiányzó kitöltéseket, utána indítsatok kört." : "Close missing assessments first, then launch the round."),
        primary: {
          label: hasObserver
            ? (isHu ? "Kör kezelése" : "Manage round")
            : (isHu ? "Kör indítása" : "Start round"),
          href: `/org/${teamData.orgId}?tab=campaigns`,
        },
        secondary: hasPattern
          ? {
              label: isHu ? "Csapatkép megnyitása" : "View team pattern",
              href: `/team/${teamId}?tab=profile`,
            }
          : null,
      };
    }

    return {
      title: isHu ? "Következő lépés" : "Next step",
      description: hasPattern
        ? (isHu ? "A csapatkép már elérhető, nézd át a mintázatokat a következő döntés előtt." : "Team pattern is available. Review it before your next decision.")
        : (isHu ? "A csapatkép feloldásához még kitöltések szükségesek." : "More completed assessments are needed to unlock team pattern."),
      primary: {
        label: hasPattern
          ? (isHu ? "Csapatkép megtekintése" : "View team pattern")
          : (isHu ? "Tagok megnyitása" : "Open members"),
        href: hasPattern ? `/team/${teamId}?tab=profile` : `/team/${teamId}?tab=members`,
      },
      secondary: null,
    };
  })();
  const teamDashboardVm = createTeamDashboardIA({
    locale: isHu ? "hu" : "en",
    teamName: teamData.teamName,
    memberCount: teamData.memberCount,
    completedCount,
    inProgressCount,
    waitingCount,
    hasPattern,
    hasActiveObserverRound: hasObserver,
    observerDoneCount: teamData.activeCampaign?.teamObserverDoneCount,
    observerParticipantCount: teamData.activeCampaign?.teamParticipantCount,
    pendingInviteCount: teamData.pendingInvites.length,
    recommendedAction,
  });
  const teamLayerStatuses = evaluateProductLayersForScope(isHu ? "hu" : "en", {
    hasSelfAssessmentStarted: teamData.memberCount > 0,
    hasSelfAssessment: completedCount > 0,
    hasBelbinStarted: completedCount > 0,
    hasBelbin: hasPattern,
    hasStrengthProfile: completedCount > 0,
    hasObserverFeedback:
      hasObserver && teamData.activeCampaign!.teamObserverDoneCount > 0,
    hasTeamInsights: hasPattern,
    hasOrgCampaign: hasObserver,
    hasValuesLayerStarted: false,
    hasValuesLayer: false,
    hasConflictLayerStarted: false,
    hasConflictLayer: false,
    hasPlusAccess: true,
  }, "dashboard", "team");
  const teamLayerCompletedCount = teamLayerStatuses.filter(
    (layer) => layer.status === "COMPLETED",
  ).length;
  const statusLine = teamDashboardVm.heroSummary.summary;
  const heroChips = teamDashboardVm.heroSummary.chips;
  const teamChecklistItems = [
    {
      id: "team-membership",
      title: isHu ? "Magcsapat kialakítása" : "Core team in place",
      detail: isHu
        ? `${teamData.memberCount} tag aktív a csapatban`
        : `${teamData.memberCount} active members in the team`,
      done: teamData.memberCount >= 3,
      cta: teamData.memberCount >= 3
        ? undefined
        : {
            label: isHu ? "Tagok kezelése" : "Manage members",
            href: `/team/${teamId}?tab=members`,
          },
    },
    {
      id: "team-assessment",
      title: isHu ? "Kitöltések lezárása" : "Assessments completed",
      detail: isHu
        ? `${completedCount}/3 szükséges az első csapatképhez`
        : `${completedCount}/3 needed for first team pattern`,
      done: completedCount >= 3,
      cta: completedCount >= 3
        ? undefined
        : {
            label: isHu ? "Hiányzók követése" : "Track missing members",
            href: `/team/${teamId}?tab=members`,
          },
    },
    {
      id: "team-feedback-round",
      title: isHu ? "Visszajelzési kör" : "Feedback round",
      detail: hasObserver
        ? (isHu ? "Aktív kör fut a csapaton." : "An active round is running.")
        : (isHu ? "Még nincs aktív observer kör." : "No active observer round yet."),
      done: hasObserver,
      cta: hasObserver || !teamData.orgId
        ? undefined
        : {
            label: isHu ? "Kör indítása" : "Start round",
            href: `/org/${teamData.orgId}?tab=campaigns`,
          },
    },
  ];

  return (
    <PlatformPageShell
      surface="team"
      contentClassName="max-w-5xl gap-8 px-4 py-8 md:gap-10 md:px-6"
    >
        {/* ═══ HERO ═══ */}
        <section
          className="relative overflow-hidden rounded-[28px]"
          style={{
            background: TEAM_HERO_GRADIENT,
          }}
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-[240px] w-[240px] rounded-full bg-white/[0.03]" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-24 rounded-tr-full bg-[#d48e62]/12" />

          <div className="relative px-6 pb-7 pt-7 md:px-8 md:pb-8 md:pt-9">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <p className="text-[9px] uppercase tracking-[2px] text-white/[0.28]">
                    {isHu ? "Csapatnézet" : "Team view"}
                  </p>
                  {hasPattern && (
                    <span
                      className="rounded-md px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
                      style={{ backgroundColor: TEAM_HERO_BADGE_BG, color: TEAM_HERO_BADGE_TEXT }}
                    >
                      {isHu ? "Csapatkép elérhető" : "Pattern ready"}
                    </span>
                  )}
                </div>

                <h1 className="mt-3 font-fraunces text-[34px] tracking-tight text-white md:text-[40px]">
                  {teamData.teamName}
                </h1>

                <p className="mt-3 max-w-[620px] text-[14px] leading-relaxed text-white/[0.42]">
                  {statusLine}
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
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {hasPattern && (
                    <Link
                      href={`/team/${teamId}?tab=profile`}
                      className="inline-flex min-h-[44px] items-center rounded-[10px] px-5 py-2 text-[12px] font-semibold text-white transition hover:brightness-110"
                      style={{ backgroundColor: TEAM_HERO_PRIMARY }}
                    >
                      {isHu ? "Csapatkép megtekintése" : "View team pattern"}
                    </Link>
                  )}
                  {isOrgManager && teamData.orgId && (
                    <Link
                      href={`/org/${teamData.orgId}?tab=campaigns`}
                      className="inline-flex min-h-[44px] items-center rounded-[10px] bg-white/[0.08] px-5 py-2 text-[12px] font-medium text-white/[0.62] transition hover:bg-white/[0.12]"
                    >
                      {hasObserver
                        ? (isHu ? "Visszajelzési kör kezelése" : "Manage feedback round")
                        : (isHu ? "Kör indítása" : "Start round")}
                    </Link>
                  )}
                </div>
              </div>

              <aside className="hidden rounded-2xl border border-white/15 bg-white/[0.06] p-4 backdrop-blur-[2px] lg:block">
                <p className="text-[9px] uppercase tracking-[2px] text-white/[0.34]">
                  {isHu ? "Élő pillanatkép" : "Live snapshot"}
                </p>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-white/[0.08] px-3 py-2">
                    <p className="text-[9px] uppercase tracking-[0.18em] text-white/[0.35]">{isHu ? "Tag" : "Members"}</p>
                    <p className="mt-1 font-fraunces text-[22px] leading-none text-white">{teamData.memberCount}</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.08] px-3 py-2">
                    <p className="text-[9px] uppercase tracking-[0.18em] text-white/[0.35]">{isHu ? "Kész" : "Done"}</p>
                    <p className="mt-1 font-fraunces text-[22px] leading-none text-white">{completedCount}</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.08] px-3 py-2">
                    <p className="text-[9px] uppercase tracking-[0.18em] text-white/[0.35]">{isHu ? "Vár" : "Wait"}</p>
                    <p className="mt-1 font-fraunces text-[22px] leading-none text-white">{waitingCount}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-[10px] text-white/[0.52]">
                      <span>{isHu ? "Kitöltési arány" : "Completion rate"}</span>
                      <span className="font-semibold text-white/[0.7]">{completionPct}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.12]">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${completionPct}%`, backgroundColor: "#8ad0b4" }}
                      />
                    </div>
                    <p className="mt-1.5 text-[10px] text-white/[0.45]">
                      {completedCount} {isHu ? "kész" : "done"} · {inProgressCount} {isHu ? "folyamatban" : "in progress"}
                    </p>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-[10px] text-white/[0.52]">
                      <span>{secondaryLabel}</span>
                      <span className="font-semibold text-white/[0.7]">{secondaryPct}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.12]">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${secondaryPct}%`, backgroundColor: TEAM_HERO_PRIMARY }}
                      />
                    </div>
                    <p className="mt-1.5 text-[10px] text-white/[0.45]">
                      {secondaryText}
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* ═══ ÖSSZEFOGLALÓ ═══ */}
        <section>
          <DashboardSectionHeader label={isHu ? "Állapotkép" : "Snapshot"} className="mb-4" />
          <p className="mb-3 text-[10px] font-medium uppercase tracking-[1px] text-ink-body">
            {isHu ? "ÖSSZEFOGLALÓ" : "SUMMARY"}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Kitöltési arány */}
            <DashboardMetricCard
              accent="#3d6b5e"
              title={isHu ? "KITÖLTÉSI ARÁNY" : "COMPLETION RATE"}
              value={`${completionPct}%`}
              sub={`${completedCount} ${isHu ? "kész" : "done"} · ${inProgressCount} ${isHu ? "folyamatban" : "in progress"} · ${waitingCount} ${isHu ? "várakozik" : "waiting"}`}
            >
              <div className="flex gap-1.5">
                {completedCount > 0 && <div className="h-1.5 rounded-full bg-sage" style={{ flex: completedCount }} />}
                {inProgressCount > 0 && <div className="h-1.5 rounded-full bg-[#d8a253]" style={{ flex: inProgressCount }} />}
                {waitingCount > 0 && <div className="h-1.5 rounded-full bg-bronze/65" style={{ flex: waitingCount }} />}
              </div>
            </DashboardMetricCard>

            {/* Csapatmintázat */}
            <DashboardMetricCard
              accent="#c17f4a"
              title={isHu ? "CSAPATMINTÁZAT" : "TEAM PATTERN"}
              value={hasPattern ? (isHu ? "Elérhető" : "Available") : (isHu ? "Még nem" : "Not yet")}
              sub={hasPattern
                ? teamData.patternResult?.fullLabel
                : isHu
                ? `A kitöltések ${completionPct}%-ánál tart. Minimum 3 kitöltés szükséges.`
                : `${completionPct}% complete. Minimum 3 assessments required.`}
            >
              {hasPattern ? (
                <Link
                  href={`/team/${teamId}?tab=profile`}
                  className="inline-flex text-[11px] font-semibold text-sage transition-colors hover:text-sage-dark"
                >
                  {isHu ? "Csapatkép megtekintése →" : "View team pattern →"}
                </Link>
              ) : null}
            </DashboardMetricCard>
          </div>
        </section>

        <section>
          <DashboardSectionHeader label={isHu ? "Journey checklist" : "Journey checklist"} className="mb-4" />
          <ProgressChecklist
            eyebrow={isHu ? "haladás" : "progress"}
            title={isHu ? "Csapatút követése" : "Track team journey"}
            description={isHu
              ? "Ugyanarra a journey logikára építve látod, hol tart a csapat és mi hiányzik a következő szinthez."
              : "Built on the same journey logic, this shows where the team stands and what is missing for the next level."}
            items={teamChecklistItems}
            nextStepLabel={isHu ? "Következő lépés" : "Next step"}
          />
        </section>

        <section>
          <DashboardSectionHeader label={isHu ? "4+2 rétegkészültség" : "4+2 layer readiness"} className="mb-4" />
          <DashboardPanel className="p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="font-dm-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                {isHu ? "Csapatszintű rétegek" : "Team-level layers"}
              </p>
              <DashboardStatusChip
                label={`${teamLayerCompletedCount}/${teamLayerStatuses.length} ${isHu ? "kész" : "done"}`}
                tone="sage"
              />
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {teamLayerStatuses.map((layer) => {
                const tone =
                  layer.status === "COMPLETED"
                    ? "sage"
                    : layer.status === "IN_PROGRESS"
                      ? "bronze"
                      : layer.status === "AVAILABLE"
                        ? "warm"
                        : "muted";
                const statusLabel = layer.status === "COMPLETED"
                  ? (isHu ? "Kész" : "Completed")
                  : layer.status === "IN_PROGRESS"
                    ? (isHu ? "Folyamatban" : "In progress")
                    : layer.status === "AVAILABLE"
                      ? (isHu ? "Elérhető" : "Available")
                      : (isHu ? "Zárolt" : "Locked");

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

        {/* ═══ TAGOK ═══ */}
        <section>
          <DashboardSectionHeader label={isHu ? "Emberek" : "People"} className="mb-4" />
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[1px] text-ink-body">
            {isHu ? "TAGOK" : "MEMBERS"}
          </p>
          <div className="divide-y divide-[#e8e0d3] rounded-[24px] border border-sand bg-white shadow-[0_16px_40px_rgba(26,26,46,0.04)]">
            {teamData.members.map((member) => {
              const isDone = member.scores !== null;
              const avgScore = isDone && member.scores
                ? Math.round(Object.values(member.scores).reduce((s, v) => s + v, 0) / Object.values(member.scores).length)
                : null;
              const [from, to] = getAvatarColor(member.displayName);
              const initial = member.displayName[0]?.toUpperCase() ?? "?";

              return (
                <div key={member.id} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-cream/65">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                    style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                  >
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-ink">{member.displayName}</p>
                    <p className="text-[10px] text-ink-body">{member.role}</p>
                  </div>
                  {/* Status badge */}
                  {isDone ? (
                    <DashboardStatusChip label={isHu ? "Kész" : "Done"} tone="sage" />
                  ) : member.joinedAt ? (
                    <DashboardStatusChip label={isHu ? "Folyamatban" : "In progress"} tone="warm" />
                  ) : (
                    <DashboardStatusChip label={isHu ? "Várakozik" : "Waiting"} tone="bronze" />
                  )}
                  {/* Score */}
                  <span className="w-8 text-right text-[11px] font-medium text-ink">
                    {avgScore ?? "—"}
                  </span>
                  {/* CTA */}
                  {isDone ? (
                    <span className="text-[11px] font-semibold text-sage">
                      {isHu ? "Profil →" : "Profile →"}
                    </span>
                  ) : (
                    <span className="cursor-pointer text-[11px] font-semibold text-bronze">
                      {isHu ? "Eml. →" : "Remind →"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ═══ VISSZAJELZÉSI KÖR ═══ */}
        <section>
          <DashboardSectionHeader label={isHu ? "Következő lépés" : "Next step"} className="mb-4" />
          <JourneyNextStepCard
            eyebrow={teamDashboardVm.recommendedAction.title}
            title={hasObserver
              ? (isHu ? `${teamData.activeCampaign!.teamObserverDoneCount} aktív visszajelzés` : `${teamData.activeCampaign!.teamObserverDoneCount} active feedback`)
              : (isHu ? "Fókuszban a csapatkép" : "Focus on team insight")}
            description={teamDashboardVm.recommendedAction.description}
            primary={teamDashboardVm.recommendedAction.primary}
            secondary={teamDashboardVm.recommendedAction.secondary}
          />
        </section>

    </PlatformPageShell>
  );
}
