import type {
  ActiveSurface,
  JourneyContextSnapshot,
  JourneyProgressScope,
  JourneyScopeProgress,
  JourneyStage,
} from "@/lib/journey/types";
import { MIN_MEMBERS_FOR_TEAM_INSIGHTS } from "@/lib/journey/constants";

// Személyes observer-cél — journey-progress súlyozáshoz, NEM anonimitás-
// vagy insight-küszöb; ezért marad külön, lokális konstansként.
const OBSERVER_TARGET = 3;

interface ComputeScopeProgressOptions {
  activeSurface?: ActiveSurface;
  stage?: JourneyStage;
}

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function resolveProgressScope(
  context: JourneyContextSnapshot,
  options: ComputeScopeProgressOptions,
): JourneyProgressScope {
  const surface = options.activeSurface ?? context.activeSurface;

  if (surface === "personal" || surface === "team" || surface === "org") {
    return surface;
  }

  if (context.pendingJoinInvite?.kind === "org") return "org";
  if (context.pendingJoinInvite?.kind === "team") return "team";
  if (options.stage === "SELF_IN_PROGRESS" || options.stage === "SELF_NOT_STARTED") {
    return "personal";
  }

  return "personal";
}

function computePersonalScopeProgress(context: JourneyContextSnapshot): JourneyScopeProgress {
  const { self } = context.completionSummary;

  // Consulting-led + org-tag: az observer csapat-folyamat (kampány-vezérelt),
  // nem személyes hiány — a személyes út a kitöltéssel 100%-ra zárul, és a
  // haladásjelző nem mutat olyan lépést, amire a tagnak nincs ráhatása.
  // (Self/csapat szétválasztás, 2026-07-22.)
  if (self.orgGoverned) {
    const selfOnlyScore = context.assessment.completed
      ? 100
      : context.assessment.started
        ? 50
        : 0;
    return {
      scope: "personal",
      label: {
        hu: "Személyes haladás",
        en: "Personal progress",
      },
      scopeProgress: clampProgress(selfOnlyScore),
      substeps: [
        {
          id: "self_assessment",
          label: {
            hu: "Self assessment kész",
            en: "Self assessment completed",
          },
          done: context.assessment.completed,
        },
      ],
    };
  }

  const selfScore = context.assessment.completed ? 70 : context.assessment.started ? 35 : 0;
  const observerTarget = Math.max(1, Math.min(OBSERVER_TARGET, Math.max(self.sentInvites, self.completedObservers)));
  const observerCoverage =
    self.sentInvites > 0 ? Math.min(1, self.completedObservers / observerTarget) : 0;
  const observerScore = observerCoverage * 30;

  return {
    scope: "personal",
    label: {
      hu: "Személyes haladás",
      en: "Personal progress",
    },
    scopeProgress: clampProgress(selfScore + observerScore),
    substeps: [
      {
        id: "self_assessment",
        label: {
          hu: "Self assessment kész",
          en: "Self assessment completed",
        },
        done: context.assessment.completed,
      },
      {
        id: "observer_feedback",
        label: {
          hu: "Observer visszajelzések beérkeztek",
          en: "Observer feedback collected",
        },
        done: self.sentInvites > 0 && self.pendingInvites === 0,
      },
    ],
  };
}

function computeTeamScopeProgress(context: JourneyContextSnapshot): JourneyScopeProgress {
  const { team } = context.completionSummary;
  const memberCoverage = team.memberCount > 0 ? team.completedMemberCount / team.memberCount : 0;
  const joinedScore = team.joined ? 20 : 0;
  const coverageScore = team.joined ? memberCoverage * 60 : 0;
  const readyScore = team.ready ? 20 : 0;

  return {
    scope: "team",
    label: {
      hu: "Csapat haladás",
      en: "Team progress",
    },
    scopeProgress: clampProgress(joinedScore + coverageScore + readyScore),
    substeps: [
      {
        id: "team_joined",
        label: {
          hu: "Csapathoz csatlakozva",
          en: "Joined a team",
        },
        done: team.joined,
      },
      {
        id: "team_member_completion",
        label: {
          hu: "Tagok kitöltése kész",
          en: "Member assessments completed",
        },
        done: team.memberCount > 0 && team.completedMemberCount >= team.memberCount,
      },
      {
        id: "team_insight_ready",
        label: {
          hu: "Csapat insight elérhető",
          en: "Team insight available",
        },
        done: team.ready,
      },
    ],
  };
}

function computeOrgScopeProgress(context: JourneyContextSnapshot): JourneyScopeProgress {
  const { org } = context.completionSummary;
  const estimatedReadyTeamCount =
    org.teamCount > 0 ? Math.min(org.teamCount, Math.floor(org.completedMemberCount / MIN_MEMBERS_FOR_TEAM_INSIGHTS)) : 0;
  const teamCoverage = org.teamCount > 0 ? estimatedReadyTeamCount / org.teamCount : 0;

  const joinedScore = org.joined ? 20 : 0;
  const teamCoverageScore = org.joined ? teamCoverage * 50 : 0;
  const campaignScore = org.activeCampaignCount > 0 ? 15 : 0;
  const readyScore = org.ready ? 15 : 0;

  return {
    scope: "org",
    label: {
      hu: "Szervezeti haladás",
      en: "Organization progress",
    },
    scopeProgress: clampProgress(joinedScore + teamCoverageScore + campaignScore + readyScore),
    substeps: [
      {
        id: "org_teams_active",
        label: {
          hu: "Aktív csapatstruktúra",
          en: "Active team structure",
        },
        done: org.teamCount > 0,
      },
      {
        id: "org_team_insight_coverage",
        label: {
          hu: "Csapat insight lefedettség",
          en: "Team insight coverage",
        },
        done: org.teamCount > 0 && estimatedReadyTeamCount >= org.teamCount,
      },
      {
        id: "org_campaign_active",
        label: {
          hu: "Aktív szervezeti kampány",
          en: "Active organization campaign",
        },
        done: org.activeCampaignCount > 0,
      },
      {
        id: "org_insight_ready",
        label: {
          hu: "Szervezeti insight kész",
          en: "Organization insight ready",
        },
        done: org.ready,
      },
    ],
  };
}

export function computeScopeProgress(
  context: JourneyContextSnapshot,
  options: ComputeScopeProgressOptions = {},
): JourneyScopeProgress {
  const scope = resolveProgressScope(context, options);

  switch (scope) {
    case "team":
      return computeTeamScopeProgress(context);
    case "org":
      return computeOrgScopeProgress(context);
    case "personal":
    default:
      return computePersonalScopeProgress(context);
  }
}
