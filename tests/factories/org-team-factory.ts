import type {
  JourneyOrgMembershipSnapshot,
  JourneyPendingJoinInviteSnapshot,
  JourneyTeamMembershipSnapshot,
} from "@/lib/journey/types";

export interface TestOrg {
  id: string;
  name: string;
}

export interface TestTeam {
  id: string;
  name: string;
  orgId: string | null;
}

export interface TestTeamInviteRecord {
  id: string;
  email: string;
  teamId: string;
  team: {
    name: string;
    orgId: string;
    org: { name: string };
  };
}

export interface TestOrgInviteRecord {
  id: string;
  orgId: string;
  role: string;
  org: { name: string };
}

export function createTestOrg(overrides: Partial<TestOrg> = {}): TestOrg {
  return {
    id: "org_test_1",
    name: "Test Org",
    ...overrides,
  };
}

export function createTestTeam(overrides: Partial<TestTeam> = {}): TestTeam {
  return {
    id: "team_test_1",
    name: "Test Team",
    orgId: "org_test_1",
    ...overrides,
  };
}

export function createJourneyOrgMembership(
  overrides: Partial<JourneyOrgMembershipSnapshot> = {},
): JourneyOrgMembershipSnapshot {
  return {
    orgId: "org_test_1",
    role: "ORG_MEMBER",
    joinedAt: new Date("2026-04-01T10:00:00.000Z"),
    ...overrides,
  };
}

export function createJourneyTeamMembership(
  overrides: Partial<JourneyTeamMembershipSnapshot> = {},
): JourneyTeamMembershipSnapshot {
  return {
    teamId: "team_test_1",
    role: "member",
    joinedAt: new Date("2026-04-01T10:00:00.000Z"),
    orgId: "org_test_1",
    ...overrides,
  };
}

export function createJourneyPendingJoinInvite(
  overrides: Partial<JourneyPendingJoinInviteSnapshot> = {},
): JourneyPendingJoinInviteSnapshot {
  return {
    kind: "team",
    inviteId: "invite_test_1",
    token: "invite_token_test_1",
    email: "invitee@trita.app",
    teamId: "team_test_1",
    orgId: "org_test_1",
    role: "ORG_MEMBER",
    createdAt: new Date("2026-04-01T10:00:00.000Z"),
    ...overrides,
  };
}

export function createTeamInviteRecord(
  overrides: Partial<TestTeamInviteRecord> = {},
): TestTeamInviteRecord {
  return {
    id: "team_invite_test_1",
    email: "__open__",
    teamId: "team_test_1",
    team: {
      name: "Test Team",
      orgId: "org_test_1",
      org: { name: "Test Org" },
    },
    ...overrides,
  };
}

export function createOrgInviteRecord(
  overrides: Partial<TestOrgInviteRecord> = {},
): TestOrgInviteRecord {
  return {
    id: "org_invite_test_1",
    orgId: "org_test_1",
    role: "ORG_MEMBER",
    org: { name: "Test Org" },
    ...overrides,
  };
}
