import type {
  AcceptanceAuthState,
  AcceptanceCurrentUserContext,
} from "@/lib/acceptance/service";

export function createAuthenticatedAuthMock(
  overrides: Partial<AcceptanceAuthState> = {},
): AcceptanceAuthState {
  return {
    clerkId: "clerk_test_user",
    authenticated: true,
    ...overrides,
  };
}

export function createUnauthenticatedAuthMock(
  overrides: Partial<AcceptanceAuthState> = {},
): AcceptanceAuthState {
  return {
    clerkId: null,
    authenticated: false,
    ...overrides,
  };
}

export function createCurrentUserContextMock(
  overrides: Partial<AcceptanceCurrentUserContext> = {},
): AcceptanceCurrentUserContext {
  return {
    profileId: "profile_test_user",
    activeOrgId: null,
    ...overrides,
  };
}
