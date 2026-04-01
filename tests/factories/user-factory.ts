import type { AcceptanceAuthState } from "@/lib/acceptance/service";

export interface TestUserIdentity {
  clerkId: string;
  profileId: string;
  email: string;
  username: string | null;
}

export interface TestUserProfileRecord {
  id: string;
  username: string | null;
  birthYear: number | null;
  gender: string | null;
  consentedAt: Date | null;
  onboardedAt: Date | null;
}

export function createTestUserIdentity(
  overrides: Partial<TestUserIdentity> = {},
): TestUserIdentity {
  return {
    clerkId: "clerk_test_user",
    profileId: "profile_test_user",
    email: "test.user@trita.app",
    username: "Test User",
    ...overrides,
  };
}

export function createTestUserProfileRecord(
  overrides: Partial<TestUserProfileRecord> = {},
): TestUserProfileRecord {
  return {
    id: "profile_test_user",
    username: "Test User",
    birthYear: 1992,
    gender: "female",
    consentedAt: new Date("2026-04-01T10:00:00.000Z"),
    onboardedAt: new Date("2026-04-01T10:00:00.000Z"),
    ...overrides,
  };
}

export function createAcceptanceAuthState(
  overrides: Partial<AcceptanceAuthState> = {},
): AcceptanceAuthState {
  return {
    clerkId: "clerk_test_user",
    authenticated: true,
    ...overrides,
  };
}
