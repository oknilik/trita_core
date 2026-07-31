import type { JourneySubscriptionSnapshot } from "@/lib/journey/types";
import type { SubscriptionStatus } from "@/lib/subscription";

export interface TestSubscriptionRecord {
  status: SubscriptionStatus;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  candidateCredits: number;
}

export function createSubscriptionRecord(
  overrides: Partial<TestSubscriptionRecord> = {},
): TestSubscriptionRecord {
  return {
    status: "none",
    trialEndsAt: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    candidateCredits: 0,
    ...overrides,
  };
}

export function createJourneySubscriptionSnapshot(
  overrides: Partial<JourneySubscriptionSnapshot> = {},
): JourneySubscriptionSnapshot {
  return {
    state: "none",
    orgId: null,
    status: "none",
    hasAccess: false,
    trialEndsAt: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    ...overrides,
  };
}
