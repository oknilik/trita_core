import "server-only";

import { prisma } from "@/lib/prisma";
import type { JourneyEntryIntent } from "@/lib/journey/types";
export type { JourneyEntryIntent } from "@/lib/journey/types";

/**
 * FeatureInterest marker for explicit team-first journey intent.
 * Presence of this key means we should resolve `entryIntent` as `"team"`
 * unless the current request explicitly overrides it.
 */
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
    await prisma.feedback.upsert({
      where: {
        userProfileId_kind_targetKey: {
          userProfileId: profileId,
          kind: "feature_interest",
          targetKey: JOURNEY_TEAM_INTENT_FEATURE_KEY,
        },
      },
      update: {},
      create: {
        userProfileId: profileId,
        kind: "feature_interest",
        targetKey: JOURNEY_TEAM_INTENT_FEATURE_KEY,
      },
    });
    return;
  }

  await prisma.feedback.deleteMany({
    where: {
      userProfileId: profileId,
      kind: "feature_interest",
      targetKey: JOURNEY_TEAM_INTENT_FEATURE_KEY,
    },
  });
}
