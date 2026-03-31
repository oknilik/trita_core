import "server-only";

import type { JourneyNextBestAction, JourneyResolverLocale } from "./next-best-action";
import { resolveJourney, resolveJourneyForClerkId } from "./engine";
import type { JourneyResolution, JourneyScopeProgress, JourneyState } from "./types";

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
  resolution: JourneyResolution;
  state: JourneyState;
  scopeProgress: JourneyScopeProgress;
  nextBestAction: JourneyNextBestAction;
  generatedAt: string;
}

/**
 * Flat API response variant (easy to consume in UI clients).
 */
export type JourneyApiResponse = JourneyState & {
  resolution: JourneyResolution;
  scopeProgress: JourneyScopeProgress;
  nextBestAction: JourneyNextBestAction;
  generatedAt: string;
};

function toApiResponse(snapshot: JourneySnapshot): JourneyApiResponse {
  return {
    ...snapshot.state,
    resolution: snapshot.resolution,
    scopeProgress: snapshot.scopeProgress,
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
  const resolution = await resolveJourney(profileId, {
    teamId: options.teamId,
    orgId: options.orgId,
    locale: options.locale,
  });

  return {
    resolution,
    state: resolution.state,
    scopeProgress: resolution.scopeProgress,
    nextBestAction: resolution.nextBestAction,
    generatedAt: new Date().toISOString(),
  };
}

export async function getJourneySnapshotForClerkId(
  clerkId: string,
  options: JourneySnapshotOptions = {},
): Promise<JourneySnapshot | null> {
  const resolution = await resolveJourneyForClerkId(clerkId, {
    teamId: options.teamId,
    orgId: options.orgId,
    locale: options.locale,
  });
  if (!resolution) return null;

  return {
    resolution,
    state: resolution.state,
    scopeProgress: resolution.scopeProgress,
    nextBestAction: resolution.nextBestAction,
    generatedAt: new Date().toISOString(),
  };
}
