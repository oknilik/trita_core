import Link from "next/link";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { getButtonClassName } from "@/components/ui/primitives/Button";
import { t, tf } from "@/lib/i18n";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";
import { TeamIntelligence } from "@/components/team/TeamIntelligence";
import { TeamPatternCard } from "@/components/team/TeamPatternCard";
import { TeamFeedbackCultureCard } from "@/components/team/TeamFeedbackCultureCard";
import { TeamProfileTab } from "@/components/team/TeamProfileTab";
import { TeamRoleSection } from "@/components/team/TeamRoleSection";
import { TeamRoleRoundCard } from "@/components/team/TeamRoleRoundCard";
import { loadTeamFeedbackCulture } from "@/lib/team-observer.server";
import { prisma } from "@/lib/prisma";
import { resolveDisplayRoleScores, hasCompleteTritanDims } from "@/lib/team-role-estimate";
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
          <SectionEyebrow>
            {t("teamComp.tabIntelligence", locale)}
          </SectionEyebrow>
          <h1 className="mt-1 font-fraunces text-title leading-tight text-ink md:text-display">
            {isHu ? "Még nincs elég adat a csapatintelligenciához" : "Not enough data yet for team intelligence"}
          </h1>
          <p className="mt-2 max-w-3xl text-caption leading-relaxed text-ink-body">
            {isHu
              ? "A stabil értelmezéshez legalább 3 kitöltött önértékelés szükséges. Addig a nézet inkább adatgyűjtési fókuszban marad."
              : "At least 3 completed self-assessments are required for stable interpretation. Until then, this view stays in data-collection mode."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-sand bg-surface-card px-2.5 py-1 text-note font-medium text-ink-body">
              {t("teamUi.completedProfiles", locale)}:{" "}
              <span className="font-semibold text-ink">{assessedCount}/{totalCount}</span>
            </span>
            <span className="rounded-full border border-sand bg-surface-card px-2.5 py-1 text-note font-medium text-ink-body">
              {isHu ? "Hiányzik a stabil nézethez" : "Still needed for stable view"}:{" "}
              <span className="font-semibold text-ink">{missingForStableIntelligence}</span>
            </span>
            <span className="rounded-full border border-sand bg-surface-card px-2.5 py-1 text-note font-medium text-ink-body">
              {t("teamUi.feedbackRound", locale)}:{" "}
              <span className="font-semibold text-ink">
                {teamData.activeCampaign ? (isHu ? "aktív" : "active") : (isHu ? "nincs" : "none")}
              </span>
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/team/${teamId}?tab=members`}
              className={getButtonClassName({ variant: "secondary", size: "sm" })}
            >
              {isHu ? "Tagok és kitöltések kezelése" : "Manage members and completions"}
            </Link>
            {canReachOrgCampaigns && teamData.orgId ? (
              <Link
                href={`/org/${teamData.orgId}?tab=campaigns`}
                className={getButtonClassName({ variant: "secondary", size: "sm" })}
              >
                {t("teamUi.startFeedbackRound", locale)}
              </Link>
            ) : null}
          </div>
        </section>

        <section className="rounded-[22px] border border-sand bg-surface-card p-4 shadow-[0_12px_28px_rgba(26,26,46,0.05)] md:p-5">
          <SectionEyebrow>
            {isHu ? "Kiknél hiányzik még adat" : "Members still missing data"}
          </SectionEyebrow>
          {membersWithoutAssessment.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {membersWithoutAssessment.map((member) => (
                <span
                  key={`${member.userId}-missing-intel`}
                  className="rounded-full border border-sand bg-cream px-2.5 py-1 text-xs text-ink-body"
                >
                  {member.displayName}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-ink-body">
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
  const roleSources = teamData.members.map((member) => resolveDisplayRoleScores(
    member.teamRoleSource === "questionnaire" ? member.teamRoleScores : null,
    member.scores,
  )?.source);
  const priorityRoleCounts = {
    measured: roleSources.filter((source) => source === "questionnaire").length,
    estimated: roleSources.filter((source) => source === "estimate").length,
  };

  return (
    <PlatformPageShell
      surface="team"
      contentClassName="max-w-5xl gap-8 px-4 py-8 md:gap-10 md:px-6"
    >
      <TeamHeroBlock ctx={ctx} active="intelligence" />
      <section id="development-priorities" className="scroll-mt-24 rounded-[22px] border border-sand bg-surface-card p-4 shadow-[0_12px_28px_rgba(26,26,46,0.05)] md:p-5">
        <SectionEyebrow>{t("teamHierarchy.chapterPriorities", locale)}</SectionEyebrow>
        <h2 className="mt-2 font-fraunces text-title text-ink">{t("teamHierarchy.priorities", locale)}</h2>
        <p className="mt-2 text-caption text-ink-body">{t("teamHierarchy.prioritiesIntro", locale)}</p>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          {intelligencePriorities.map((priority) => {
            const toneClass =
              priority.tone === "rose"
                ? "border-surface-team-border bg-surface-team-accent-soft"
                : priority.tone === "amber"
                  ? "border-state-warning-border bg-state-warning-bg"
                  : priority.tone === "violet"
                    ? "border-sage-soft bg-sage-ghost"
                    : "border-state-success-border bg-state-success-bg";
            return (
              <div key={priority.id} className={`rounded-xl border p-3 ${toneClass}`}>
                <p className="text-caption font-semibold text-ink">{priority.title}</p>
                <p className="mt-1 text-caption leading-relaxed text-ink-body">{priority.reason}</p>
                <p className="mt-3 border-t border-sand pt-3 text-caption text-ink-body">
                  {priority.id === "role_coverage_gap"
                    ? `${tf("teamEvidence.roleCounts", locale, priorityRoleCounts)} ${t("teamEvidence.roleInterpretation", locale)}`
                    : priority.id === "missing_assessments" || priority.id === "missing_observer_round"
                      ? t("teamEvidence.collectionState", locale)
                      : tf("teamEvidence.profileHypothesis", locale, { done: assessedCount, total: totalCount })}
                </p>
                <Link
                  href={priority.ctaHref}
                  className={getButtonClassName({ variant: "secondary", size: "sm", className: "mt-3" })}
                >
                  {priority.ctaLabel}
                </Link>
              </div>
            );
          })}
        </div>
      </section>
      <p className="text-caption text-ink-body">
        {t("teamHierarchy.reportMetadata", locale)} · {assessedCount}/{totalCount} · {intelligenceQualityLabel} · {dynamicsStateLabel}
      </p>

      <nav
        aria-label={isHu ? "Elemzési fejezetek" : "Analysis sections"}
        className="flex flex-wrap gap-2 rounded-2xl border border-sand bg-surface-card p-2 shadow-[0_8px_22px_rgba(26,26,46,0.04)]"
      >
        {[
          { href: "#development-priorities", label: t("teamHierarchy.chapterPriorities", locale) },
          { href: "#team-profile", label: t("teamHierarchy.chapterProfile", locale) },
          { href: "#team-resources", label: t("teamHierarchy.chapterResources", locale) },
          { href: "#team-roles", label: t("teamHierarchy.chapterRoles", locale) },
          { href: "#team-summary", label: t("teamHierarchy.chapterReadiness", locale) },
        ].map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={getButtonClassName({ variant: "ghost", size: "sm" })}
          >
            {item.label}
          </a>
        ))}
      </nav>

      {feedbackCulture ? (
        <TeamFeedbackCultureCard culture={feedbackCulture} locale={locale} />
      ) : null}

      <details id="team-summary" className="scroll-mt-24 rounded-[22px] border border-sand bg-surface-card p-4 shadow-[0_12px_28px_rgba(26,26,46,0.05)] md:p-5">
        <summary className="min-h-11 cursor-pointer py-3 text-caption font-semibold text-ink">{t("teamHierarchy.readinessDetails", locale)}</summary>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-sand bg-cream/60 p-3">
            <p className="text-caption text-ink-body">{t("teamUi.profileReadiness", locale)}</p>
            <p className="mt-1 font-fraunces text-title text-ink">{Math.round((assessedCount / Math.max(totalCount, 1)) * 100)}%</p>
            <p className="text-note text-muted">{assessedCount}/{totalCount}</p>
          </div>
          {/* Státusz-csempék chipekkel, nem nagy-szám tipográfiával
              (UX-audit #28): az „Aktív"/„Elérhető" állapot, nem mennyiség. */}
          <div className="rounded-xl border border-sand bg-cream/60 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-caption text-ink-body">{t("teamUi.feedbackRoundStatus", locale)}</p>
              <span
                className={`rounded-full px-2 py-0.5 text-micro font-semibold ${
                  teamData.activeCampaign ? "bg-sage/15 text-sage-dark" : "bg-sand text-ink-body"
                }`}
              >
                {teamData.activeCampaign ? (isHu ? "Aktív" : "Active") : (isHu ? "Nincs" : "None")}
              </span>
            </div>
            <p className="mt-2 text-note text-muted">
              {teamData.activeCampaign
                ? (isHu ? "Visszajelzések gyűjtése folyamatban" : "Feedback collection in progress")
                : (isHu ? "A dinamika adatokhoz szükséges" : "Required for dynamics data")}
            </p>
          </div>
          <div className="rounded-xl border border-sand bg-cream/60 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-note text-ink-body">{isHu ? "Csapatminta státusz" : "Pattern status"}</p>
              <span
                className={`rounded-full px-2 py-0.5 text-micro font-semibold ${
                  teamData.patternResult ? "bg-sage/15 text-sage-dark" : "bg-state-warning-bg text-state-warning-fg"
                }`}
              >
                {teamData.patternResult ? (isHu ? "Elérhető" : "Ready") : (isHu ? "Folyamatban" : "In progress")}
              </span>
            </div>
            <p className="mt-2 text-note text-muted">
              {teamData.patternResult
                ? teamData.patternResult.fullLabel
                : isHu
                  ? "Legalább 3 kitöltés szükséges"
                  : "At least 3 completions required"}
            </p>
          </div>
        </div>
      </details>

      {/* A számított 16-os csapatminta teljes nézete: tengelysávok, stabilitás-
          jegyzet, confidence-badge. A fenti státusz-csempe csak a címkét adja –
          a részletes kártya eddig árva komponens volt (nem volt importálója). */}
      <TeamPatternCard
        patternResult={teamData.patternResult}
        totalMembers={totalCount}
        isHu={isHu}
      />

      <section id="team-profile" className="scroll-mt-24">
        <TeamProfileTab
          heatmapRows={teamData.heatmapRows}
          dimConfigs={teamData.dimConfigs}
          isHu={isHu}
        />
      </section>

      <section id="team-resources" className="scroll-mt-24">
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

      </section>

      <section id="team-roles" className="scroll-mt-24 space-y-8">
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


    </PlatformPageShell>
  );
}
