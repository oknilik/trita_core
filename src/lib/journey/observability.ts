import "server-only";

import { createLogger } from "@/lib/logger";

import type {
  ActiveSurface,
  JourneyContextSnapshot,
  JourneyRestrictionFlags,
  JourneyStage,
} from "@/lib/journey/types";

const TRUTHY_ENV_VALUES = new Set(["1", "true", "yes", "on"]);

type StringLiteralUnion<LiteralType extends string> =
  | LiteralType
  | (string & Record<never, never>);

export type KnownJourneyEntryPoint =
  | "dashboard_page"
  | "platform_home_page"
  | "root_layout_nav"
  | "onboarding_page"
  | "membership_join_handoff"
  | "journey_state_api"
  | "journey_state_alias"
  | "guardrails_fallback_profile"
  | "guardrails_fallback_clerk"
  | "profile_results_page"
  | "api_admin_org_status"
  | "resolve_journey";

export type JourneyDecisionEntryPoint = StringLiteralUnion<KnownJourneyEntryPoint>;

export interface JourneyObligationFlags {
  pendingJoinPriority: boolean;
  assessmentContinuationPriority: boolean;
  selfAssessmentIncomplete: boolean;
}

export interface JourneyTraceDecision {
  entryPoint: JourneyDecisionEntryPoint;
  profileId: string;
  resolvedStage: JourneyStage;
  resolvedSurface: ActiveSurface;
  destination: string;
  obligationFlags: JourneyObligationFlags;
  restrictionFlags: JourneyRestrictionFlags;
}

export function isJourneyDebugEnabled(): boolean {
  const flag = process.env.JOURNEY_DEBUG?.trim().toLowerCase();
  if (!flag) return false;
  return TRUTHY_ENV_VALUES.has(flag);
}

export function buildJourneyObligationFlags(
  context: JourneyContextSnapshot,
): JourneyObligationFlags {
  const hasUnfinishedAssessment =
    context.assessment.started && !context.assessment.completed;
  return {
    pendingJoinPriority: Boolean(context.pendingJoinInvite),
    assessmentContinuationPriority: hasUnfinishedAssessment,
    selfAssessmentIncomplete: !context.assessment.completed,
  };
}

export function traceJourneyDecision(input: JourneyTraceDecision): void {
  if (!isJourneyDebugEnabled()) return;

  createLogger("journey").info(
    { event: "journey.decision", ...input },
    "Journey decision",
  );
}
