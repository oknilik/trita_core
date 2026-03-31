import "server-only";

import { prisma } from "@/lib/prisma";
import type { JourneyEntryIntent } from "@/lib/journey/types";
export type { JourneyEntryIntent } from "@/lib/journey/types";

export const JOURNEY_TEAM_INTENT_FEATURE_KEY = "journey_intent_team";

export function normalizeJourneyIntent(raw: unknown): JourneyEntryIntent | null {
  if (typeof raw !== "string") return null;
  if (raw === "team") return "team";
  if (raw === "explore") return "explore";
  return null;
}

export async function setJourneyIntentForProfile(
  profileId: string,
  intent: JourneyEntryIntent,
): Promise<void> {
  if (intent === "team") {
    await prisma.featureInterest.upsert({
      where: {
        userProfileId_featureKey: {
          userProfileId: profileId,
          featureKey: JOURNEY_TEAM_INTENT_FEATURE_KEY,
        },
      },
      update: {},
      create: {
        userProfileId: profileId,
        featureKey: JOURNEY_TEAM_INTENT_FEATURE_KEY,
      },
    });
    return;
  }

  await prisma.featureInterest.deleteMany({
    where: {
      userProfileId: profileId,
      featureKey: JOURNEY_TEAM_INTENT_FEATURE_KEY,
    },
  });
}
