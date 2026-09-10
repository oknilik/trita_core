import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveTeamReadiness, type TeamReadinessInput } from "@/lib/team-readiness";

const complete: TeamReadinessInput = {
  completedCount: 5,
  memberCount: 5,
  stepProgress: [],
  hasPublishedReport: false,
};

describe("team report readiness", () => {
  it("does not treat the minimum analysis sample as a published or completed team", () => {
    assert.equal(resolveTeamReadiness({ ...complete, completedCount: 3 }).stage, "profiles");
    assert.equal(resolveTeamReadiness({ ...complete, completedCount: 0, memberCount: 0 }).stage, "profiles");
  });

  it("distinguishes completed profiles from a still-running collection", () => {
    const state = resolveTeamReadiness({
      ...complete,
      stepProgress: [{ type: "SELF", done: 5, total: 5 }, { type: "TRUST_360", done: 3, total: 5 }],
    });
    assert.equal(state.profilesComplete, true);
    assert.equal(state.collectionComplete, false);
    assert.equal(state.stage, "collection");
  });

  it("requires consultant interpretation even at 100% completion", () => {
    assert.equal(resolveTeamReadiness(complete).stage, "interpretation");
    assert.equal(resolveTeamReadiness({
      ...complete,
      stepProgress: [{ type: "TRUST_360", done: 5, total: 5 }],
    }).stage, "interpretation");
  });

  it("keeps an explicitly published report available during a newer collection", () => {
    assert.equal(resolveTeamReadiness({
      ...complete,
      hasPublishedReport: true,
      completedCount: 4,
      stepProgress: [{ type: "TRUST_360", done: 2, total: 5 }],
    }).stage, "published");
  });
});
