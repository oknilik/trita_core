import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  OBSERVER_TYPE_BADGES,
  observerInviteRequiresApproval,
  resolveColleagueObserverType,
} from "@/lib/observer/invite-policy";

describe("resolveColleagueObserverType", () => {
  it("marks shared-team colleagues as TEAM", () => {
    assert.equal(
      resolveColleagueObserverType({
        inviterTeamIds: ["t1", "t2"],
        colleagueTeamIds: ["t2", "t3"],
      }),
      "TEAM",
    );
  });

  it("marks org-only colleagues as ORG", () => {
    assert.equal(
      resolveColleagueObserverType({
        inviterTeamIds: ["t1"],
        colleagueTeamIds: ["t9"],
      }),
      "ORG",
    );
    assert.equal(
      resolveColleagueObserverType({ inviterTeamIds: [], colleagueTeamIds: [] }),
      "ORG",
    );
  });
});

describe("observerInviteRequiresApproval", () => {
  it("requires approval only for EXTERNAL in a restricting campaign", () => {
    assert.equal(
      observerInviteRequiresApproval({
        observerType: "EXTERNAL",
        campaign: { allowExternalObservers: false },
      }),
      true,
    );
  });

  it("does not gate when the campaign allows externals", () => {
    assert.equal(
      observerInviteRequiresApproval({
        observerType: "EXTERNAL",
        campaign: { allowExternalObservers: true },
      }),
      false,
    );
  });

  it("never gates colleague or personal invites", () => {
    for (const observerType of ["TEAM", "ORG", "INTERNAL", "ANONYMOUS"]) {
      assert.equal(
        observerInviteRequiresApproval({
          observerType,
          campaign: { allowExternalObservers: false },
        }),
        false,
      );
    }
  });

  it("never gates outside campaign context", () => {
    assert.equal(
      observerInviteRequiresApproval({ observerType: "EXTERNAL", campaign: null }),
      false,
    );
  });
});

describe("observer type badges", () => {
  it("labels every type in both locales", () => {
    for (const type of ["TEAM", "ORG", "EXTERNAL", "INTERNAL", "ANONYMOUS"]) {
      assert.ok((OBSERVER_TYPE_BADGES[type]?.hu.length ?? 0) > 2);
      assert.ok((OBSERVER_TYPE_BADGES[type]?.en.length ?? 0) > 2);
    }
  });
});
