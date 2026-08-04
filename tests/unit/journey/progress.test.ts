import test from "node:test";
import assert from "node:assert/strict";
import { computeScopeProgress } from "@/lib/journey/progress";
import { buildJourneyContext } from "../../factories/journey-fixture-builder";

test("computes personal scope for personal surface", () => {
  const progress = computeScopeProgress(
    buildJourneyContext({
      activeSurface: "personal",
      assessment: { started: true, completed: true, hasResult: true },
      completionSummary: {
        self: { sentInvites: 3, completedObservers: 2, pendingInvites: 1 },
      },
    }),
  );

  assert.equal(progress.scope, "personal");
  assert.equal(progress.scopeProgress, 90);
  assert.equal(progress.substeps?.[0]?.done, true);
});

test("computes team scope for team surface", () => {
  const progress = computeScopeProgress(
    buildJourneyContext({
      activeSurface: "team",
      completionSummary: {
        team: {
          joined: true,
          teamId: "t1",
          memberCount: 5,
          completedMemberCount: 3,
          ready: true,
        },
      },
    }),
  );

  assert.equal(progress.scope, "team");
  assert.equal(progress.scopeProgress, 76);
  assert.equal(progress.substeps?.find((step) => step.id === "team_insight_ready")?.done, true);
});

test("continuation scope resolves to org when pending org invite exists", () => {
  const progress = computeScopeProgress(
    buildJourneyContext({
      activeSurface: "continuation",
      pendingJoinInvite: {
        kind: "org",
        inviteId: "inv1",
        token: "tok_inv1",
        email: "a@b.com",
        teamId: null,
        orgId: "o1",
        role: "ORG_MEMBER",
        createdAt: new Date(),
      },
      completionSummary: {
        org: {
          joined: true,
          orgId: "o1",
          teamCount: 2,
          completedMemberCount: 3,
          activeCampaignCount: 1,
          ready: false,
        },
      },
    }),
  );

  assert.equal(progress.scope, "org");
  assert.equal(progress.scopeProgress, 60);
});
