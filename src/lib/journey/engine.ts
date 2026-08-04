import "server-only";

import { prisma } from "@/lib/prisma";
import { resolveJourneyContext, type ResolveJourneyContextOptions } from "@/lib/journey/context";
import { resolveJourneyFromContext as resolveJourneyFromContextCore } from "@/lib/journey/engine-core";
import type { JourneyDecisionEntryPoint } from "@/lib/journey/observability";
import type { JourneyResolution } from "@/lib/journey/types";

export interface ResolveJourneyOptions extends ResolveJourneyContextOptions {
  locale?: "hu" | "en";
  entryPoint?: JourneyDecisionEntryPoint;
}

export const resolveJourneyFromContext = resolveJourneyFromContextCore;

export async function resolveJourney(
  profileId: string,
  options: ResolveJourneyOptions = {},
): Promise<JourneyResolution> {
  const context = await resolveJourneyContext(profileId, options);
  return resolveJourneyFromContext(context, {
    locale: options.locale,
    entryPoint: options.entryPoint,
  });
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
