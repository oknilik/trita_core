import { resolveHome } from "@/lib/journey/home";
import { assertJourneyInvariants, enforceJourneyGuardrails } from "@/lib/journey/guardrails";
import type { JourneyResolverLocale } from "@/lib/journey/next-best-action";
import { resolveNextBestAction } from "@/lib/journey/next-best-action";
import {
  buildJourneyObligationFlags,
  traceJourneyDecision,
  type JourneyDecisionEntryPoint,
} from "@/lib/journey/observability";
import { computeScopeProgress } from "@/lib/journey/progress";
import { computeJourneyState } from "@/lib/journey/state";
import type {
  JourneyContextSnapshot,
  JourneyExperienceHints,
  JourneyProgressLabel,
  JourneyResolution,
  JourneyStage,
} from "@/lib/journey/types";

const STAGE_LABELS: Record<JourneyStage, JourneyProgressLabel> = {
  SELF_NOT_STARTED: {
    hu: "Az önértékelés még nem indult",
    en: "Self-assessment not started",
  },
  SELF_IN_PROGRESS: {
    hu: "Önértékelés folyamatban",
    en: "Self-assessment in progress",
  },
  SELF_COMPLETED: {
    hu: "Az önértékelés kész",
    en: "Self-assessment completed",
  },
  OBSERVER_PENDING: {
    hu: "Visszajelzési kör folyamatban",
    en: "Feedback round in progress",
  },
  TEAM_NOT_JOINED: {
    hu: "Csapathoz még nem csatlakoztál",
    en: "Not part of a team yet",
  },
  TEAM_PENDING_MEMBERS: {
    hu: "Csapattagok aktiválása folyamatban",
    en: "Team member activation in progress",
  },
  TEAM_PARTIAL: {
    hu: "A csapat eredménye részben kész",
    en: "Team results partially ready",
  },
  TEAM_READY: {
    hu: "A csapat eredménye kész",
    en: "Team results ready",
  },
  ORG_PARTIAL: {
    hu: "A szervezeti eredmény részben kész",
    en: "Organization results partially ready",
  },
  ORG_READY: {
    hu: "A szervezeti eredmény kész",
    en: "Organization results ready",
  },
};

function computeExperienceHints(context: JourneyContextSnapshot, stage: JourneyStage): JourneyExperienceHints {
  return {
    showOrgExpansionPrompt:
      context.entryIntent === "explore" &&
      context.pendingInviteCounts.org > 0 &&
      !context.orgMembership,
    showTeamCreationBanner:
      context.entryIntent === "team" &&
      !context.orgMembership &&
      !context.teamMembership,
    showAssessmentContinuation: stage === "SELF_IN_PROGRESS",
  };
}

export interface ResolveJourneyFromContextOptions {
  locale?: JourneyResolverLocale;
  entryPoint?: JourneyDecisionEntryPoint;
}

export function resolveJourneyFromContext(
  context: JourneyContextSnapshot,
  options: ResolveJourneyFromContextOptions = {},
): JourneyResolution {
  const locale: JourneyResolverLocale = options.locale === "hu" ? "hu" : "en";
  const rawState = computeJourneyState(context);
  const rawHomeDecision = resolveHome({ context, state: rawState });
  const guardrailed = enforceJourneyGuardrails({
    context,
    state: rawState,
    home: {
      activeSurface: rawHomeDecision.activeSurface,
      destination: rawHomeDecision.home.destination,
      reason: rawHomeDecision.home.reason,
    },
  });
  void assertJourneyInvariants({
    context,
    state: guardrailed.state,
    home: guardrailed.home,
    restrictionFlags: guardrailed.restrictionFlags,
  });

  const scopeProgress = computeScopeProgress(context, {
    activeSurface: guardrailed.home.activeSurface,
    stage: guardrailed.state.currentStage,
  });
  const nextBestAction = resolveNextBestAction(guardrailed.state, locale);

  const resolution: JourneyResolution = {
    activeSurface: guardrailed.home.activeSurface,
    entryIntent: context.entryIntent,
    currentContext: context.currentContext,
    stage: guardrailed.state.currentStage,
    destination: guardrailed.home.destination,
    reason: guardrailed.home.reason,
    stageDisplay: {
      label: STAGE_LABELS[guardrailed.state.currentStage],
      scopeProgress: scopeProgress.scopeProgress,
      substeps: scopeProgress.substeps,
    },
    home: {
      destination: guardrailed.home.destination,
      reason: guardrailed.home.reason,
      primaryAction: guardrailed.state.recommendedNextAction ?? undefined,
    },
    experienceHints: computeExperienceHints(context, guardrailed.state.currentStage),
    restrictionFlags: guardrailed.restrictionFlags,
    scopeProgress,
    nextBestAction,
    state: guardrailed.state,
  };

  traceJourneyDecision({
    entryPoint: options.entryPoint ?? "resolve_journey",
    profileId: context.profileId,
    resolvedStage: resolution.stage,
    resolvedSurface: resolution.activeSurface,
    destination: resolution.destination,
    obligationFlags: buildJourneyObligationFlags(context),
    restrictionFlags: resolution.restrictionFlags,
  });

  return resolution;
}
