import "server-only";

import { cache } from "react";
import { getProfileCoreByClerkId, getProfileCoreById } from "@/lib/profile.server";
import { resolveJourney, type ResolveJourneyOptions } from "@/lib/journey/engine";
import { isPlatformAdminEmail } from "@/lib/measurement-auth";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";

/**
 * Platform-stáb (admin / tanácsadó) célfelülete — ők NEM kényszerülnek a
 * teszt-útvonalra: az admin az /admin vezérlőre, a tanácsadó a szervezetei
 * listájára érkezik. A saját teszt számukra opció, nem kapu.
 */
export const resolveStaffDestination = cache(async function resolveStaffDestination(
  profileId: string,
): Promise<string | null> {
  const profile = await getProfileCoreById(profileId);
  if (!profile) return null;
  if (isPlatformAdminEmail(profile.email)) return "/admin";
  if (profile.isConsultant) return "/org";
  return null;
});

export async function resolveJourneyFallbackForProfileId(
  profileId: string,
  options: ResolveJourneyOptions = {},
): Promise<string> {
  const staffDestination = await resolveStaffDestination(profileId);
  if (staffDestination) return staffDestination;
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
  const profile = await getProfileCoreByClerkId(clerkId);
  if (!profile) return JOURNEY_HOME_HANDOFF_PATH;
  return resolveJourneyFallbackForProfileId(profile.id, {
    ...options,
    entryPoint: options.entryPoint ?? "guardrails_fallback_clerk",
  });
}
