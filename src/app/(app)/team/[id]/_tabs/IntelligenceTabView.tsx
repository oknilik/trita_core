import Link from "next/link";
import { t } from "@/lib/i18n";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";
import { TeamIntelligence } from "@/components/team/TeamIntelligence";
import { TeamPatternCard } from "@/components/team/TeamPatternCard";
import { TeamHeroBlock } from "./TeamHeroBlock";
import { buildIntelligenceViewData } from "./intelligence-data";
import type { TeamTabContext } from "./types";

// ── Intelligence tab: potential/types and map ───────────────────────────
export function IntelligenceTabView({ ctx }: { ctx: TeamTabContext }) {
  const { teamId, teamData, locale, isHu, canReachOrgCampaigns } = ctx;
  const intel = buildIntelligenceViewData({
    teamData, teamId, locale, isHu, canReachOrgCampaigns,
  });
  const {
    intelligenceMembers,
    assessedCount,
    totalCount,
    teamDynamicsEdges,
    hasDynamicsData,
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

        <section className="rounded-[24px] border border-sand bg-[linear-gradient(140deg,#fffdf7_0%,#f6f1e8_100%)] p-5 shadow-[0_14px_32px_rgba(26,26,46,0.06)] md:p-6">
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
            <span className="rounded-full border border-sand bg-white px-2.5 py-1 text-[11px] font-medium text-ink-body">
              {isHu ? "Kitöltött assessmentek" : "Completed assessments"}:{" "}
              <span className="font-semibold text-ink">{assessedCount}/{totalCount}</span>
            </span>
            <span className="rounded-full border border-sand bg-white px-2.5 py-1 text-[11px] font-medium text-ink-body">
              {isHu ? "Hiányzik a stabil nézethez" : "Still needed for stable view"}:{" "}
              <span className="font-semibold text-ink">{missingForStableIntelligence}</span>
            </span>
            <span className="rounded-full border border-sand bg-white px-2.5 py-1 text-[11px] font-medium text-ink-body">
              {isHu ? "Observer kör" : "Observer round"}:{" "}
              <span className="font-semibold text-ink">
                {teamData.activeCampaign ? (isHu ? "aktív" : "active") : (isHu ? "nincs" : "none")}
              </span>
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/team/${teamId}?tab=members`}
              className="inline-flex min-h-[38px] items-center rounded-[10px] bg-white px-3 text-[12px] font-semibold text-ink transition-colors hover:bg-cream"
            >
              {isHu ? "Tagok és kitöltések kezelése" : "Manage members and completions"}
            </Link>
            {canReachOrgCampaigns && teamData.orgId ? (
              <Link
                href={`/org/${teamData.orgId}?tab=campaigns`}
                className="inline-flex min-h-[38px] items-center rounded-[10px] bg-white px-3 text-[12px] font-semibold text-ink transition-colors hover:bg-cream"
              >
                {isHu ? "Observer kör indítása" : "Start observer round"}
              </Link>
            ) : null}
          </div>
        </section>

        <section className="rounded-[22px] border border-sand bg-white p-4 shadow-[0_12px_28px_rgba(26,26,46,0.05)] md:p-5">
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

  return (
    <PlatformPageShell
      surface="team"
      contentClassName="max-w-5xl gap-8 px-4 py-8 md:gap-10 md:px-6"
    >
      <TeamHeroBlock ctx={ctx} active="intelligence" />
      <section className="rounded-[24px] border border-sand bg-[linear-gradient(140deg,#fffdf7_0%,#f6f1e8_100%)] p-5 shadow-[0_14px_32px_rgba(26,26,46,0.06)] md:p-6">
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
          <span className="rounded-full border border-sand bg-white px-2.5 py-1 text-[11px] font-medium text-ink-body">
            {isHu ? "Kitöltött assessmentek" : "Completed assessments"}:{" "}
            <span className="font-semibold text-ink">{assessedCount}/{totalCount}</span>
          </span>
          <span className="rounded-full border border-sand bg-white px-2.5 py-1 text-[11px] font-medium text-ink-body">
            {isHu ? "Adatállapot" : "Data status"}:{" "}
            <span className="font-semibold text-ink">{intelligenceQualityLabel}</span>
          </span>
          <span className="rounded-full border border-sand bg-white px-2.5 py-1 text-[11px] font-medium text-ink-body">
            {isHu ? "Dinamika nézet" : "Dynamics view"}:{" "}
            <span className="font-semibold text-ink">{dynamicsStateLabel}</span>
          </span>
        </div>
      </section>

      <section className="rounded-[22px] border border-sand bg-white p-4 shadow-[0_12px_28px_rgba(26,26,46,0.05)] md:p-5">
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
                  teamData.patternResult ? "bg-sage/15 text-sage-dark" : "bg-amber-50 text-amber-700"
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

      <TeamIntelligence
        members={intelligenceMembers}
        edges={teamDynamicsEdges}
        evidenceBySub={intelligenceEvidenceBySub}
        presentation="blocks"
        isHu={isHu}
        hasDynamicsData={hasDynamicsData}
        dynamicsSummary={
          teamData.activeCampaign
            ? {
                participantCount: teamData.activeCampaign.teamParticipantCount,
                observerDoneCount: teamData.activeCampaign.teamObserverDoneCount,
              }
            : undefined
        }
        noDataCtaHref={`/team/${teamId}?tab=members`}
        noDataCtaLabel={isHu ? "Tagok és kitöltések megnyitása" : "Open members and completions"}
        deepDiveHref={`/team/${teamId}?tab=teamRole`}
        deepDiveLabel={isHu ? "Részletes csapatszerep elemzés" : "Detailed team-role analysis"}
      />

      <section className="rounded-[22px] border border-sand bg-white p-4 shadow-[0_12px_28px_rgba(26,26,46,0.05)] md:p-5">
        <p className="font-mono text-micro uppercase tracking-widest text-muted">
          {isHu ? "Fejlesztési prioritások" : "Development priorities"}
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          {intelligencePriorities.map((priority) => {
            const toneClass =
              priority.tone === "rose"
                ? "border-rose-200 bg-rose-50"
                : priority.tone === "amber"
                  ? "border-amber-200 bg-amber-50"
                  : priority.tone === "violet"
                    ? "border-violet-200 bg-violet-50"
                    : "border-emerald-200 bg-emerald-50";
            return (
              <div key={priority.id} className={`rounded-xl border p-3 ${toneClass}`}>
                <p className="text-caption font-semibold text-ink">{priority.title}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-ink-body">{priority.reason}</p>
                <Link
                  href={priority.ctaHref}
                  className="mt-3 inline-flex min-h-[38px] items-center rounded-[10px] bg-white px-3 text-[12px] font-semibold text-ink transition-colors hover:bg-cream"
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
