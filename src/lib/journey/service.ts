import "server-only";

import type { JourneyNextBestAction, JourneyResolverLocale } from "./next-best-action";
import { resolveNextBestAction } from "./next-best-action";
import type { JourneyState } from "./state";
import { getJourneyStateForClerkId, getJourneyStateForProfileId } from "./state";

export interface JourneySnapshotOptions {
  teamId?: string | null;
  orgId?: string | null;
  locale?: JourneyResolverLocale;
}

/**
 * Single typed contract for frontend/API consumers.
 * `state` is the full journey truth, `nextBestAction` is the CTA decision output.
 */
export interface JourneySnapshot {
  state: JourneyState;
  nextBestAction: JourneyNextBestAction;
  generatedAt: string;
}

/**
 * Flat API response variant (easy to consume in UI clients).
 */
export type JourneyApiResponse = JourneyState & {
  nextBestAction: JourneyNextBestAction;
  generatedAt: string;
};

function toApiResponse(snapshot: JourneySnapshot): JourneyApiResponse {
  return {
    ...snapshot.state,
    nextBestAction: snapshot.nextBestAction,
    generatedAt: snapshot.generatedAt,
  };
}

export function serializeJourneySnapshot(snapshot: JourneySnapshot): JourneyApiResponse {
  return toApiResponse(snapshot);
}

export async function getJourneySnapshotForProfileId(
  profileId: string,
  options: JourneySnapshotOptions = {},
): Promise<JourneySnapshot> {
  const locale = options.locale === "hu" ? "hu" : "en";
  const state = await getJourneyStateForProfileId(profileId, {
    teamId: options.teamId,
    orgId: options.orgId,
  });
  return {
    state,
    nextBestAction: resolveNextBestAction(state, locale),
    generatedAt: new Date().toISOString(),
  };
}

export async function getJourneySnapshotForClerkId(
  clerkId: string,
  options: JourneySnapshotOptions = {},
): Promise<JourneySnapshot | null> {
  const locale = options.locale === "hu" ? "hu" : "en";
  const state = await getJourneyStateForClerkId(clerkId, {
    teamId: options.teamId,
    orgId: options.orgId,
  });
  if (!state) return null;

  return {
    state,
    nextBestAction: resolveNextBestAction(state, locale),
    generatedAt: new Date().toISOString(),
  };
}

