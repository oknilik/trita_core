import Link from "next/link";
import { t } from "@/lib/i18n";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";
import { TeamIntelligence } from "@/components/team/TeamIntelligence";
import { TeamPatternCard } from "@/components/team/TeamPatternCard";
import { TeamFeedbackCultureCard } from "@/components/team/TeamFeedbackCultureCard";
import { TeamProfileTab } from "@/components/team/TeamProfileTab";
import { TeamRoleSection } from "@/components/team/TeamRoleSection";
import { TeamRoleRoundCard } from "@/components/team/TeamRoleRoundCard";
import { loadTeamFeedbackCulture } from "@/lib/team-observer.server";
import { prisma } from "@/lib/prisma";
import { hasCompleteTritanDims } from "@/lib/team-role-estimate";
import { buildTeamPeerRoleProfiles } from "@/lib/team-role-peer.server";
import { TeamHeroBlock } from "./TeamHeroBlock";
import { buildIntelligenceViewData } from "./intelligence-data";
import type { TeamTabContext } from "./types";

// ── Intelligence tab: potential/types and map ───────────────────────────
export async function IntelligenceTabView({ ctx }: { ctx: TeamTabContext }) {
  const { teamId, teamData, locale, isHu, canReachOrgCampaigns, isOrgManager } = ctx;
  // Visszajelzési kultúra: az EGYETLEN observer-forrású csapat-blokk.
  // `null`, ha a lefedettség a TEAM_OBSERVER_MIN_COVERED padló alatt van —
  // ilyenkor a kártya nem renderel (nem „0"-t mutat, hanem semmit).
  const feedbackCulture = await loadTeamFeedbackCulture({
    orgId: teamData.orgId,
    members: teamData.members.map((m) => ({ userId: m.userId, scores: m.scores })),
  });
  const intel = buildIntelligenceViewData({
    teamData, teamId, locale, canReachOrgCampaigns,
  });
  const {
    intelligenceMembers,
    assessedCount,
    totalCount,
    teamDynamicsEdges,
    intelligenceEvidenceBySub,
    intelligencePriorities,
    missingForStableIntelligence,
    hasSufficientIntelligenceData,
    membersWithoutAssessment,
    intelligenceQualityLabel,
    dynamicsStateLabel,
  } = intel;

  if (!hasSufficientIntelligenceData) {
    return (
      <PlatformPageShell
        surface="team"
        contentClassName="max-w-5xl gap-8 px-4 py-8 md:gap-10 md:px-6"
      >
        <TeamHeroBlock ctx={ctx} active="intelligence" />

        <section className="rounded-[24px] border border-sand bg-[linear-gradient(140deg,var(--color-surface-card)_0%,var(--color-surface-muted)_100%)] p-5 shadow-[0_14px_32px_rgba(26,26,46,0.06)] md:p-6">
          <p className="font-mono text-micro uppercase tracking-widest text-muted">
            {t("teamComp.tabIntelligence", locale)}
          </p>
          <h1 className="mt-1 font-fraunces text-[28px] leading-tight text-ink md:text-[34px]">
            {isHu ? "Még nincs elég adat a csapatintelligenciához" : "Not enough data yet for team intelligence"}
          </h1>
          <p className="mt-2 max-w-3xl text-caption leading-relaxed text-ink-body">
            {isHu
              ? "A stabil értelmezéshez legalább 3 kitöltött önértékelés szükséges. Addig a nézet inkább adatgyűjtési fókuszban marad."
              : "At least 3 completed self-assessments are required for stable interpretation. Until then, this view stays in data-collection mode."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-sand bg-surface-card px-2.5 py-1 text-[11px] font-medium text-ink-body">
              {isHu ? "Kitöltött assessmentek" : "Completed assessments"}:{" "}
              <span className="font-semibold text-ink">{assessedCount}/{totalCount}</span>
            </span>
            <span className="rounded-full border border-sand bg-surface-card px-2.5 py-1 text-[11px] font-medium text-ink-body">
              {isHu ? "Hiányzik a stabil nézethez" : "Still needed for stable view"}:{" "}
              <span className="font-semibold text-ink">{missingForStableIntelligence}</span>
            </span>
            <span className="rounded-full border border-sand bg-surface-card px-2.5 py-1 text-[11px] font-medium text-ink-body">
              {isHu ? "Observer kör" : "Observer round"}:{" "}
              <span className="font-semibold text-ink">
                {teamData.activeCampaign ? (isHu ? "aktív" : "active") : (isHu ? "nincs" : "none")}
              </span>
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/team/${teamId}?tab=members`}
              className="inline-flex min-h-[38px] items-center rounded-[10px] bg-surface-card px-3 text-[12px] font-semibold text-ink transition-colors hover:bg-cream"
            >
              {isHu ? "Tagok és kitöltések kezelése" : "Manage members and completions"}
            </Link>
            {canReachOrgCampaigns && teamData.orgId ? (
              <Link
                href={`/org/${teamData.orgId}?tab=campaigns`}
                className="inline-flex min-h-[38px] items-center rounded-[10px] bg-surface-card px-3 text-[12px] font-semibold text-ink transition-colors hover:bg-cream"
              >
                {isHu ? "Observer kör indítása" : "Start observer round"}
              </Link>
            ) : null}
          </div>
        </section>

        <section className="rounded-[22px] border border-sand bg-surface-card p-4 shadow-[0_12px_28px_rgba(26,26,46,0.05)] md:p-5">
          <p className="font-mono text-micro uppercase tracking-widest text-muted">
            {isHu ? "Kiknél hiányzik még adat" : "Members still missing data"}
          </p>
          {membersWithoutAssessment.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {membersWithoutAssessment.map((member) => (
                <span
                  key={`${member.userId}-missing-intel`}
                  className="rounded-full border border-sand bg-cream px-2.5 py-1 text-[12px] text-ink-body"
                >
                  {member.displayName}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-[12px] text-ink-body">
              {isHu
                ? "Minden tagnak van legalább részleges adatpontja, de még nincs elég kitöltés a stabil csapatképre."
                : "All members have partial data points, but there are still not enough completions for stable team intelligence."}
            </p>
          )}
        </section>
      </PlatformPageShell>
    );
  }

  const [teamRoleTeam, peerProfileEntries] = await Promise.all([
    prisma.team.findUnique({
      where: { id: teamId },
      select: { teamRoleRoundActive: true, teamRoleRoundStartedAt: true },
    }),
    buildTeamPeerRoleProfiles(teamId),
  ]);
  const teamRoleMemberStatus = teamData.members.map((member) => {
    const hasQuestionnaire = member.teamRoleSource === "questionnaire";
    return {
      userId: member.userId,
      name: member.displayName,
      hasQuestionnaire,
      hasEstimate:
        !hasQuestionnaire && hasCompleteTritanDims(member.scores),
    };
  });
  const teamRoleCompletedCount = teamRoleMemberStatus.filter(
    (member) => member.hasQuestionnaire,
  ).length;
  const teamRoleEstimateCount = teamRoleMemberStatus.filter(
    (member) => member.hasEstimate,
  ).length;

  return (
    <PlatformPageShell
      surface="team"
      contentClassName="max-w-5xl gap-8 px-4 py-8 md:gap-10 md:px-6"
    >
      <TeamHeroBlock ctx={ctx} active="intelligence" />
      <section className="rounded-[24px] border border-sand bg-[linear-gradient(140deg,var(--color-surface-card)_0%,var(--color-surface-muted)_100%)] p-5 shadow-[0_14px_32px_rgba(26,26,46,0.06)] md:p-6">
        <p className="font-mono text-micro uppercase tracking-widest text-muted">
          {t("teamComp.tabIntelligence", locale)}
        </p>
        <h1 className="mt-1 font-fraunces text-[28px] leading-tight text-ink md:text-[34px]">
          {isHu ? "Csapatintelligencia nézet" : "Team intelligence view"}
        </h1>
        <p className="mt-2 max-w-3xl text-caption leading-relaxed text-ink-body">
          {isHu
            ? "Összefoglaló nézet arról, ki mit hoz a csapatba, hol vannak hiányok, és mi a következő legjobb lépés."
            : "Executive summary of who brings what to the team, where the gaps are, and what the next best action is."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-sand bg-surface-card px-2.5 py-1 text-[11px] font-medium text-ink-body">
            {isHu ? "Kitöltött assessmentek" : "Completed assessments"}:{" "}
            <span className="font-semibold text-ink">{assessedCount}/{totalCount}</span>
          </span>
          <span className="rounded-full border border-sand bg-surface-card px-2.5 py-1 text-[11px] font-medium text-ink-body">
            {isHu ? "Adatállapot" : "Data status"}:{" "}
            <span className="font-semibold text-ink">{intelligenceQualityLabel}</span>
          </span>
          <span className="rounded-full border border-sand bg-surface-card px-2.5 py-1 text-[11px] font-medium text-ink-body">
            {isHu ? "Dinamika nézet" : "Dynamics view"}:{" "}
            <span className="font-semibold text-ink">{dynamicsStateLabel}</span>
          </span>
        </div>
      </section>

      <nav
        aria-label={isHu ? "Elemzési fejezetek" : "Analysis sections"}
        className="flex flex-wrap gap-2 rounded-2xl border border-sand bg-surface-card p-2 shadow-[0_8px_22px_rgba(26,26,46,0.04)]"
      >
        {[
          { href: "#team-summary", hu: "Összkép", en: "Overview" },
          { href: "#team-profile", hu: "Csapatprofil", en: "Team profile" },
          { href: "#team-roles", hu: "Csapatszerepek", en: "Team roles" },
          { href: "#development-priorities", hu: "Prioritások", en: "Priorities" },
        ].map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="inline-flex min-h-[38px] items-center rounded-xl px-3 text-xs font-semibold text-ink-body transition-colors hover:bg-cream hover:text-ink"
          >
            {isHu ? item.hu : item.en}
          </a>
        ))}
      </nav>

      {feedbackCulture ? (
        <TeamFeedbackCultureCard culture={feedbackCulture} locale={locale} />
      ) : null}

      <section id="team-summary" className="scroll-mt-6 rounded-[22px] border border-sand bg-surface-card p-4 shadow-[0_12px_28px_rgba(26,26,46,0.05)] md:p-5">
        <p className="font-mono text-micro uppercase tracking-widest text-muted">
          {isHu ? "Csapat-összefoglaló" : "Team summary"}
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-sand bg-cream/60 p-3">
            <p className="text-[11px] text-ink-body">{isHu ? "Assessment készültség" : "Assessment readiness"}</p>
            <p className="mt-1 font-fraunces text-[26px] text-ink">{Math.round((assessedCount / Math.max(totalCount, 1)) * 100)}%</p>
            <p className="text-[11px] text-muted">{assessedCount}/{totalCount}</p>
          </div>
          {/* Státusz-csempék chipekkel, nem nagy-szám tipográfiával
              (UX-audit #28): az „Aktív"/„Elérhető" állapot, nem mennyiség. */}
          <div className="rounded-xl border border-sand bg-cream/60 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] text-ink-body">{isHu ? "Observer kör státusz" : "Observer round status"}</p>
              <span
                className={`rounded-full px-2 py-0.5 text-micro font-semibold ${
                  teamData.activeCampaign ? "bg-sage/15 text-sage-dark" : "bg-sand text-ink-body"
                }`}
              >
                {teamData.activeCampaign ? (isHu ? "Aktív" : "Active") : (isHu ? "Nincs" : "None")}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-muted">
              {teamData.activeCampaign
                ? (isHu ? "Visszajelzések gyűjtése folyamatban" : "Feedback collection in progress")
                : (isHu ? "A dinamika adatokhoz szükséges" : "Required for dynamics data")}
            </p>
          </div>
          <div className="rounded-xl border border-sand bg-cream/60 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] text-ink-body">{isHu ? "Csapatminta státusz" : "Pattern status"}</p>
              <span
                className={`rounded-full px-2 py-0.5 text-micro font-semibold ${
                  teamData.patternResult ? "bg-sage/15 text-sage-dark" : "bg-state-warning-bg text-state-warning-fg"
                }`}
              >
                {teamData.patternResult ? (isHu ? "Elérhető" : "Ready") : (isHu ? "Folyamatban" : "In progress")}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-muted">
              {teamData.patternResult
                ? teamData.patternResult.fullLabel
                : isHu
                  ? "Legalább 3 kitöltés szükséges"
                  : "At least 3 completions required"}
            </p>
          </div>
        </div>
      </section>

      {/* A számított 16-os csapatminta teljes nézete: tengelysávok, stabilitás-
          jegyzet, confidence-badge. A fenti státusz-csempe csak a címkét adja —
          a részletes kártya eddig árva komponens volt (nem volt importálója). */}
      <TeamPatternCard
        patternResult={teamData.patternResult}
        totalMembers={totalCount}
        isHu={isHu}
      />

      <section id="team-profile" className="scroll-mt-6">
        <TeamProfileTab
          heatmapRows={teamData.heatmapRows}
          dimConfigs={teamData.dimConfigs}
          isHu={isHu}
        />
      </section>

      <TeamIntelligence
        members={intelligenceMembers}
        edges={teamDynamicsEdges}
        evidenceBySub={intelligenceEvidenceBySub}
        presentation="blocks"
        isHu={isHu}
        noDataCtaHref={`/team/${teamId}?tab=members`}
        noDataCtaLabel={isHu ? "Tagok és kitöltések megnyitása" : "Open members and completions"}
        deepDiveHref="#team-roles"
        deepDiveLabel={isHu ? "Részletes csapatszerep elemzés" : "Detailed team-role analysis"}
      />

      <section id="team-roles" className="scroll-mt-6 space-y-8">
        <TeamRoleRoundCard
          teamId={teamId}
          isRoundActive={teamRoleTeam?.teamRoleRoundActive ?? false}
          totalMembers={teamData.members.length}
          completedCount={teamRoleCompletedCount}
          estimateCount={teamRoleEstimateCount}
          members={teamRoleMemberStatus}
          canManage={isOrgManager}
          isHu={isHu}
        />
        <TeamRoleSection
          members={teamData.members}
          isHu={isHu}
          peerProfiles={Object.fromEntries(peerProfileEntries)}
        />
      </section>

      <section id="development-priorities" className="scroll-mt-6 rounded-[22px] border border-sand bg-surface-card p-4 shadow-[0_12px_28px_rgba(26,26,46,0.05)] md:p-5">
        <p className="font-mono text-micro uppercase tracking-widest text-muted">
          {isHu ? "Fejlesztési prioritások" : "Development priorities"}
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          {intelligencePriorities.map((priority) => {
            const toneClass =
              priority.tone === "rose"
                ? "border-state-error-border bg-state-error-bg"
                : priority.tone === "amber"
                  ? "border-state-warning-border bg-state-warning-bg"
                  : priority.tone === "violet"
                    ? "border-sage-soft bg-sage-ghost"
                    : "border-state-success-border bg-state-success-bg";
            return (
              <div key={priority.id} className={`rounded-xl border p-3 ${toneClass}`}>
                <p className="text-caption font-semibold text-ink">{priority.title}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-ink-body">{priority.reason}</p>
                <Link
                  href={priority.ctaHref}
                  className="mt-3 inline-flex min-h-[38px] items-center rounded-[10px] bg-surface-card px-3 text-[12px] font-semibold text-ink transition-colors hover:bg-cream"
                >
                  {priority.ctaLabel}
                </Link>
              </div>
            );
          })}
        </div>
      </section>
    </PlatformPageShell>
  );
}
