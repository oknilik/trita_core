import test from "node:test";
import assert from "node:assert/strict";
import {
  deriveJourneyActiveSurface,
  deriveJourneyCurrentContext,
  deriveJourneyEntryIntent,
} from "@/lib/journey/context";

test("deriveJourneyCurrentContext maps org roles", () => {
  assert.equal(deriveJourneyCurrentContext("ORG_ADMIN"), "org-admin");
  assert.equal(deriveJourneyCurrentContext("ORG_MANAGER"), "org-manager");
  assert.equal(deriveJourneyCurrentContext("ORG_MEMBER"), "org-member");
  assert.equal(deriveJourneyCurrentContext(null), "self-only");
});

test("deriveJourneyEntryIntent honors explicit override", () => {
  assert.equal(deriveJourneyEntryIntent("explore", true), "explore");
  assert.equal(deriveJourneyEntryIntent("team", false), "team");
});

test("deriveJourneyEntryIntent falls back to team flag", () => {
  assert.equal(deriveJourneyEntryIntent(null, true), "team");
  assert.equal(deriveJourneyEntryIntent(undefined, false), "explore");
});

test("deriveJourneyActiveSurface follows priority order", () => {
  assert.equal(
    deriveJourneyActiveSurface({
      hasPendingJoinInvite: true,
      currentContext: "org-admin",
      teamMembership: { teamId: "t1", role: "member", joinedAt: new Date(), orgId: "o1" },
      assessmentStarted: true,
      assessmentCompleted: true,
    }),
    "continuation",
  );

  assert.equal(
    deriveJourneyActiveSurface({
      hasPendingJoinInvite: false,
      currentContext: "self-only",
      teamMembership: null,
      assessmentStarted: true,
      assessmentCompleted: false,
    }),
    "continuation",
  );

  assert.equal(
    deriveJourneyActiveSurface({
      hasPendingJoinInvite: false,
      currentContext: "org-manager",
      teamMembership: null,
      assessmentStarted: true,
      assessmentCompleted: true,
    }),
    "org",
  );

  assert.equal(
    deriveJourneyActiveSurface({
      hasPendingJoinInvite: false,
      currentContext: "org-member",
      teamMembership: { teamId: "t1", role: "member", joinedAt: new Date(), orgId: "o1" },
      assessmentStarted: true,
      assessmentCompleted: true,
    }),
    "team",
  );

  assert.equal(
    deriveJourneyActiveSurface({
      hasPendingJoinInvite: false,
      currentContext: "self-only",
      teamMembership: null,
      assessmentStarted: false,
      assessmentCompleted: false,
    }),
    "personal",
  );
});
