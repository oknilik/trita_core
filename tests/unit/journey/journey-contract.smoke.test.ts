import assert from "node:assert/strict";
import test from "node:test";

import { resolveJourneyFromContext } from "@/lib/journey/engine-core";
import type { JourneyContextSnapshot } from "@/lib/journey/types";
import {
  buildJourneyContext,
  type JourneyContextOverrides,
} from "../../factories/journey-fixture-builder";

interface SmokeFixture {
  name: string;
  overrides?: JourneyContextOverrides;
  expected: {
    destination: string;
    activeSurface: JourneyContextSnapshot["activeSurface"];
    stage: string;
    nextBestActionId: string;
    progressScope: "personal" | "team" | "org";
    progressValue: number;
    restrictionState?: JourneyContextSnapshot["subscription"]["state"];
    obligationPrecedence?: "assessment_over_team";
  };
}

const FIXTURES: SmokeFixture[] = [
  {
    name: "self not started",
    expected: {
      destination: "/assessment",
      activeSurface: "personal",
      stage: "SELF_NOT_STARTED",
      nextBestActionId: "START_SELF_ASSESSMENT",
      progressScope: "personal",
      progressValue: 0,
    },
  },
  {
    name: "self in progress",
    overrides: {
      assessment: { started: true, completed: false, hasDraft: true },
      completionSummary: { self: { started: true } },
    },
    expected: {
      destination: "/assessment",
      activeSurface: "continuation",
      stage: "SELF_IN_PROGRESS",
      nextBestActionId: "CONTINUE_SELF_ASSESSMENT",
      progressScope: "personal",
      progressValue: 35,
    },
  },
  {
    name: "self completed",
    overrides: {
      assessment: { started: true, completed: true, hasResult: true },
      completionSummary: { self: { started: true, completed: true } },
    },
    expected: {
      destination: "/profile/results",
      activeSurface: "personal",
      stage: "SELF_COMPLETED",
      nextBestActionId: "INVITE_OBSERVERS",
      progressScope: "personal",
      progressValue: 70,
    },
  },
  {
    name: "self completed + observer pending",
    overrides: {
      assessment: { started: true, completed: true, hasResult: true },
      completionSummary: {
        self: {
          started: true,
          completed: true,
          sentInvites: 2,
          pendingInvites: 1,
          completedObservers: 1,
        },
      },
    },
    expected: {
      destination: "/profile/results",
      activeSurface: "personal",
      stage: "OBSERVER_PENDING",
      nextBestActionId: "MANAGE_OBSERVER_INVITES",
      progressScope: "personal",
      progressValue: 85,
    },
  },
  {
    name: "self completed + org member",
    overrides: {
      currentContext: "org-member",
      orgId: "org_1",
      teamId: "team_1",
      orgMembership: { orgId: "org_1", role: "ORG_MEMBER", joinedAt: new Date() },
      teamMembership: { teamId: "team_1", role: "member", joinedAt: new Date(), orgId: "org_1" },
      assessment: { started: true, completed: true, hasResult: true },
      completionSummary: {
        self: { started: true, completed: true },
        team: {
          joined: true,
          teamId: "team_1",
          memberCount: 3,
          completedMemberCount: 3,
          ready: true,
        },
      },
    },
    expected: {
      destination: "/team/team_1",
      activeSurface: "team",
      stage: "TEAM_READY",
      nextBestActionId: "VIEW_TEAM_INSIGHTS",
      progressScope: "team",
      progressValue: 100,
    },
  },
  {
    name: "org member + unfinished assessment",
    overrides: {
      currentContext: "org-member",
      orgId: "org_1",
      teamId: "team_1",
      orgMembership: { orgId: "org_1", role: "ORG_MEMBER", joinedAt: new Date() },
      teamMembership: { teamId: "team_1", role: "member", joinedAt: new Date(), orgId: "org_1" },
      assessment: { started: true, completed: false, hasDraft: true },
      completionSummary: {
        self: { started: true, completed: false },
        team: {
          joined: true,
          teamId: "team_1",
          memberCount: 5,
          completedMemberCount: 5,
          ready: true,
        },
      },
    },
    expected: {
      destination: "/assessment",
      activeSurface: "continuation",
      stage: "SELF_IN_PROGRESS",
      nextBestActionId: "CONTINUE_SELF_ASSESSMENT",
      progressScope: "personal",
      progressValue: 35,
      obligationPrecedence: "assessment_over_team",
    },
  },
  {
    name: "team pending join",
    overrides: {
      hasPendingJoinInvite: true,
      pendingJoinInvite: {
        kind: "team",
        inviteId: "join_team_1",
        email: "team@trita.app",
        teamId: "team_1",
        orgId: "org_1",
        role: "ORG_MEMBER",
        createdAt: new Date(),
      },
      pendingInviteCounts: { team: 1, org: 0 },
      assessment: { started: true, completed: true, hasResult: true },
      completionSummary: {
        self: { started: true, completed: true, pendingTeamInvites: 1 },
      },
    },
    expected: {
      destination: "/join/join_team_1",
      activeSurface: "continuation",
      stage: "TEAM_NOT_JOINED",
      nextBestActionId: "JOIN_TEAM",
      progressScope: "team",
      progressValue: 0,
    },
  },
  {
    name: "team partial",
    overrides: {
      currentContext: "org-member",
      orgId: "org_1",
      teamId: "team_1",
      orgMembership: { orgId: "org_1", role: "ORG_MEMBER", joinedAt: new Date() },
      teamMembership: { teamId: "team_1", role: "member", joinedAt: new Date(), orgId: "org_1" },
      assessment: { started: true, completed: true, hasResult: true },
      completionSummary: {
        self: { started: true, completed: true },
        team: {
          joined: true,
          teamId: "team_1",
          memberCount: 5,
          completedMemberCount: 2,
          pendingInviteCount: 0,
          ready: false,
        },
      },
    },
    expected: {
      destination: "/team/team_1",
      activeSurface: "team",
      stage: "TEAM_PARTIAL",
      nextBestActionId: "COMPLETE_TEAM_ASSESSMENTS",
      progressScope: "team",
      progressValue: 44,
    },
  },
  {
    name: "team ready",
    overrides: {
      currentContext: "org-member",
      orgId: "org_1",
      teamId: "team_1",
      orgMembership: { orgId: "org_1", role: "ORG_MEMBER", joinedAt: new Date() },
      teamMembership: { teamId: "team_1", role: "member", joinedAt: new Date(), orgId: "org_1" },
      assessment: { started: true, completed: true, hasResult: true },
      completionSummary: {
        self: { started: true, completed: true },
        team: {
          joined: true,
          teamId: "team_1",
          memberCount: 5,
          completedMemberCount: 5,
          ready: true,
        },
      },
    },
    expected: {
      destination: "/team/team_1",
      activeSurface: "team",
      stage: "TEAM_READY",
      nextBestActionId: "VIEW_TEAM_INSIGHTS",
      progressScope: "team",
      progressValue: 100,
    },
  },
  {
    name: "org partial",
    overrides: {
      currentContext: "org-manager",
      orgId: "org_1",
      orgMembership: { orgId: "org_1", role: "ORG_MANAGER", joinedAt: new Date() },
      assessment: { started: true, completed: true, hasResult: true },
      completionSummary: {
        self: { started: true, completed: true },
        org: {
          joined: true,
          orgId: "org_1",
          teamCount: 2,
          completedMemberCount: 4,
          activeCampaignCount: 1,
          ready: false,
        },
      },
    },
    expected: {
      destination: "/dashboard",
      activeSurface: "org",
      stage: "ORG_PARTIAL",
      nextBestActionId: "VIEW_ORG_INSIGHTS",
      progressScope: "org",
      progressValue: 60,
    },
  },
  {
    name: "active subscription",
    overrides: {
      currentContext: "org-admin",
      orgId: "org_1",
      orgMembership: { orgId: "org_1", role: "ORG_ADMIN", joinedAt: new Date() },
      assessment: { started: true, completed: true, hasResult: true },
      subscription: { state: "active", orgId: "org_1", status: "active", hasAccess: true },
      completionSummary: {
        self: { started: true, completed: true },
        org: {
          joined: true,
          orgId: "org_1",
          teamCount: 2,
          completedMemberCount: 6,
          activeCampaignCount: 1,
          ready: true,
        },
      },
    },
    expected: {
      destination: "/dashboard",
      activeSurface: "org",
      stage: "ORG_READY",
      nextBestActionId: "VIEW_ORG_INSIGHTS",
      progressScope: "org",
      progressValue: 100,
      restrictionState: "active",
    },
  },
  {
    name: "restricted subscription",
    overrides: {
      currentContext: "org-manager",
      orgId: "org_1",
      orgMembership: { orgId: "org_1", role: "ORG_MANAGER", joinedAt: new Date() },
      assessment: { started: true, completed: true, hasResult: true },
      subscription: { state: "restricted", orgId: "org_1", status: "past_due", hasAccess: false },
      completionSummary: {
        self: { started: true, completed: true },
        org: {
          joined: true,
          orgId: "org_1",
          teamCount: 2,
          completedMemberCount: 4,
          activeCampaignCount: 1,
          ready: false,
        },
      },
    },
    expected: {
      destination: "/dashboard",
      activeSurface: "org",
      stage: "ORG_PARTIAL",
      nextBestActionId: "VIEW_ORG_INSIGHTS",
      progressScope: "org",
      progressValue: 60,
      restrictionState: "restricted",
    },
  },
  {
    name: "frozen subscription",
    overrides: {
      currentContext: "org-admin",
      orgId: "org_1",
      orgMembership: { orgId: "org_1", role: "ORG_ADMIN", joinedAt: new Date() },
      assessment: { started: true, completed: true, hasResult: true },
      subscription: { state: "frozen", orgId: "org_1", status: "canceled", hasAccess: false },
      completionSummary: {
        self: { started: true, completed: true },
        org: {
          joined: true,
          orgId: "org_1",
          teamCount: 2,
          completedMemberCount: 6,
          activeCampaignCount: 1,
          ready: true,
        },
      },
    },
    expected: {
      destination: "/dashboard",
      activeSurface: "org",
      stage: "ORG_READY",
      nextBestActionId: "VIEW_ORG_INSIGHTS",
      progressScope: "org",
      progressValue: 100,
      restrictionState: "frozen",
    },
  },
];

for (const fixture of FIXTURES) {
  test(`journey contract smoke: ${fixture.name}`, () => {
    const resolution = resolveJourneyFromContext(buildJourneyContext(fixture.overrides));

    assert.equal(resolution.destination, fixture.expected.destination, "destination");
    assert.equal(resolution.activeSurface, fixture.expected.activeSurface, "activeSurface");
    assert.equal(resolution.stage, fixture.expected.stage, "stage");
    assert.equal(resolution.nextBestAction.primary.id, fixture.expected.nextBestActionId, "nextBestAction.primary.id");
    assert.equal(resolution.scopeProgress.scope, fixture.expected.progressScope, "scopeProgress.scope");
    assert.equal(resolution.scopeProgress.scopeProgress, fixture.expected.progressValue, "scopeProgress.scopeProgress");

    if (fixture.expected.restrictionState) {
      assert.equal(
        resolution.restrictionFlags.subscriptionState,
        fixture.expected.restrictionState,
        "restrictionFlags.subscriptionState",
      );
    }

    if (fixture.expected.obligationPrecedence === "assessment_over_team") {
      assert.equal(resolution.destination, "/assessment");
      assert.equal(resolution.activeSurface, "continuation");
      assert.notEqual(resolution.destination, "/team/team_1");
    }
  });
}
