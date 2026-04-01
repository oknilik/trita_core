import "server-only";

import { prisma } from "@/lib/prisma";
import { resolveJourneyContext, type ResolveJourneyContextOptions } from "@/lib/journey/context";
import { resolveHome } from "@/lib/journey/home";
import type { JourneyResolverLocale } from "@/lib/journey/next-best-action";
import { resolveNextBestAction } from "@/lib/journey/next-best-action";
import { computeScopeProgress } from "@/lib/journey/progress";
import { computeJourneyState } from "@/lib/journey/state";
import type {
  JourneyContextSnapshot,
  JourneyExperienceHints,
  JourneyProgressLabel,
  JourneyRestrictionFlags,
  JourneyResolution,
  JourneyStage,
} from "@/lib/journey/types";

export interface ResolveJourneyOptions extends ResolveJourneyContextOptions {
  locale?: JourneyResolverLocale;
}

const STAGE_LABELS: Record<JourneyStage, JourneyProgressLabel> = {
  SELF_NOT_STARTED: {
    hu: "Self journey még nem indult",
    en: "Self journey not started",
  },
  SELF_IN_PROGRESS: {
    hu: "Self journey folyamatban",
    en: "Self journey in progress",
  },
  SELF_COMPLETED: {
    hu: "Self journey kész",
    en: "Self journey completed",
  },
  OBSERVER_PENDING: {
    hu: "Observer kör folyamatban",
    en: "Observer cycle in progress",
  },
  TEAM_NOT_JOINED: {
    hu: "Csapat kontextus még nincs lezárva",
    en: "Team context not joined yet",
  },
  TEAM_PENDING_MEMBERS: {
    hu: "Csapat tagok aktiválása folyamatban",
    en: "Team member activation in progress",
  },
  TEAM_PARTIAL: {
    hu: "Csapat insight részben kész",
    en: "Team insight partially ready",
  },
  TEAM_READY: {
    hu: "Csapat insight kész",
    en: "Team insight ready",
  },
  ORG_PARTIAL: {
    hu: "Szervezeti insight részben kész",
    en: "Organization insight partially ready",
  },
  ORG_READY: {
    hu: "Szervezeti insight kész",
    en: "Organization insight ready",
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

function computeRestrictionFlags(context: JourneyContextSnapshot): JourneyRestrictionFlags {
  const subscriptionState = context.subscription.state;
  const hasOrgScope =
    context.currentContext !== "self-only" ||
    Boolean(context.orgMembership) ||
    Boolean(context.orgId);
  const readOnlyOrgViews =
    hasOrgScope &&
    (subscriptionState === "restricted" || subscriptionState === "frozen");

  return {
    subscriptionState,
    missingOrgSubscription: hasOrgScope && subscriptionState === "none",
    readOnlyOrgViews,
    disableOrgWriteActions: readOnlyOrgViews,
    hideDetailedOrgInsights: hasOrgScope && subscriptionState === "frozen",
    requiresSubscriptionAction:
      hasOrgScope &&
      (subscriptionState === "none" ||
        subscriptionState === "restricted" ||
        subscriptionState === "frozen"),
  };
}

export function resolveJourneyFromContext(
  context: JourneyContextSnapshot,
  options: Pick<ResolveJourneyOptions, "locale"> = {},
): JourneyResolution {
  const locale: JourneyResolverLocale = options.locale === "hu" ? "hu" : "en";
  const state = computeJourneyState(context);
  const homeDecision = resolveHome({ context, state });
  const scopeProgress = computeScopeProgress(context, {
    activeSurface: homeDecision.activeSurface,
    stage: state.currentStage,
  });
  const restrictionFlags = computeRestrictionFlags(context);

  return {
    activeSurface: homeDecision.activeSurface,
    entryIntent: context.entryIntent,
    currentContext: context.currentContext,
    stage: state.currentStage,
    destination: homeDecision.home.destination,
    reason: homeDecision.home.reason,
    stageDisplay: {
      label: STAGE_LABELS[state.currentStage],
      scopeProgress: scopeProgress.scopeProgress,
      substeps: scopeProgress.substeps,
    },
    home: homeDecision.home,
    experienceHints: computeExperienceHints(context, state.currentStage),
    restrictionFlags,
    scopeProgress,
    nextBestAction: resolveNextBestAction(state, locale),
    state,
  };
}

export async function resolveJourney(
  profileId: string,
  options: ResolveJourneyOptions = {},
): Promise<JourneyResolution> {
  const context = await resolveJourneyContext(profileId, options);
  return resolveJourneyFromContext(context, { locale: options.locale });
}

export async function resolveJourneyForClerkId(
  clerkId: string,
  options: ResolveJourneyOptions = {},
): Promise<JourneyResolution | null> {
  const profile = await prisma.userProfile.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!profile) return null;
  return resolveJourney(profile.id, options);
}
