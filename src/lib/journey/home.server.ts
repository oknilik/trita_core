import "server-only";

import type { ResolveJourneyOptions } from "@/lib/journey/engine";
import { resolveJourney } from "@/lib/journey/engine";
import type { JourneyHomeDecision } from "@/lib/journey/home";

export async function resolveHomeForProfileId(
  profileId: string,
  options: Omit<ResolveJourneyOptions, "locale"> = {},
): Promise<JourneyHomeDecision> {
  const resolution = await resolveJourney(profileId, options);
  return {
    activeSurface: resolution.activeSurface,
    home: resolution.home,
  };
}
