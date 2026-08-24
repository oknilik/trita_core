import assert from "node:assert/strict";
import test from "node:test";
import { resolveTeamOverviewFocus } from "@/lib/team-overview-focus";

test("open measurement wins over feedback and observer tasks", () => {
  const focus = resolveTeamOverviewFocus({
    locale: "hu",
    pendingMeasurement: {
      campaignId: "autumn-round",
      campaignName: "Őszi kör",
      stepType: "PSYCH_SAFETY",
      opensAt: null,
      started: false,
    },
    observerGathering: { campaignName: "Külső kör", sent: 1, received: 0, min: 3 },
    receivedFeedbackRequests: [
      { token: "feedback-token", inviterName: "Anna", answered: 2, total: 5 },
    ],
  });

  assert.equal(focus?.kind, "measurement");
  assert.equal(focus?.primary.href, "/assessment/psych-safety?campaignId=autumn-round");
  assert.equal(focus?.secondary?.href, "/tasks");
  assert.match(focus?.secondary?.label ?? "", /További 2/);
});

test("in-progress requested feedback wins over a scheduled measurement", () => {
  const focus = resolveTeamOverviewFocus({
    locale: "en",
    pendingMeasurement: {
      campaignId: "autumn-round",
      campaignName: "Autumn round",
      stepType: "TRUST_360",
      opensAt: new Date("2026-09-01T08:00:00.000Z"),
      started: false,
    },
    observerGathering: null,
    receivedFeedbackRequests: [
      { token: "fresh", inviterName: "Sam", answered: 0, total: 5 },
      { token: "started", inviterName: "Alex", answered: 3, total: 5 },
    ],
  });

  assert.equal(focus?.kind, "feedback");
  assert.equal(focus?.primary.href, "/observe/started");
  assert.match(focus?.description ?? "", /3\/5/);
});

test("standalone self measurement carries the exact campaign round in its link", () => {
  const focus = resolveTeamOverviewFocus({
    locale: "hu",
    pendingMeasurement: {
      campaignId: "round / 2",
      campaignName: "Második kör",
      stepType: "SELF_ASSESSMENT",
      opensAt: null,
      started: false,
    },
    observerGathering: null,
    receivedFeedbackRequests: [],
  });

  assert.equal(focus?.primary.href, "/assessment?campaignId=round%20%2F%202");
});

test("observer collection is the focus when it is the only actionable item", () => {
  const focus = resolveTeamOverviewFocus({
    locale: "hu",
    pendingMeasurement: null,
    observerGathering: { campaignName: "Külső kör", sent: 2, received: 1, min: 3 },
    receivedFeedbackRequests: [],
  });

  assert.equal(focus?.kind, "observer");
  assert.equal(focus?.primary.href, "/profile/results?tab=comparison#observer-flow");
  assert.equal(focus?.secondary, null);
});

test("no local obligations produce no focus card", () => {
  assert.equal(
    resolveTeamOverviewFocus({
      locale: "hu",
      pendingMeasurement: null,
      observerGathering: null,
      receivedFeedbackRequests: [],
    }),
    null,
  );
});
