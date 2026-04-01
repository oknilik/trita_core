import "server-only";

import { prisma } from "@/lib/prisma";
import { resolveJourney, type ResolveJourneyOptions } from "@/lib/journey/engine";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";

export async function resolveJourneyFallbackForProfileId(
  profileId: string,
  options: ResolveJourneyOptions = {},
): Promise<string> {
  const journey = await resolveJourney(profileId, {
    ...options,
    entryPoint: options.entryPoint ?? "guardrails_fallback_profile",
  });
  return journey.destination;
}

export async function resolveJourneyFallbackForClerkId(
  clerkId: string,
  options: ResolveJourneyOptions = {},
): Promise<string> {
  const profile = await prisma.userProfile.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!profile) return JOURNEY_HOME_HANDOFF_PATH;
  return resolveJourneyFallbackForProfileId(profile.id, {
    ...options,
    entryPoint: options.entryPoint ?? "guardrails_fallback_clerk",
  });
}
