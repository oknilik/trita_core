import assert from "node:assert/strict";
import test from "node:test";

import {
  buildJourneyObligationFlags,
  isJourneyDebugEnabled,
  traceJourneyDecision,
} from "@/lib/journey/observability";
import { buildJourneyContext } from "../../factories/journey-fixture-builder";

test("buildJourneyObligationFlags captures pending join and assessment obligations", () => {
  const flags = buildJourneyObligationFlags(
    buildJourneyContext({
      assessment: { started: true, completed: false },
      pendingJoinInvite: {
        kind: "team",
        inviteId: "inv1",
        email: "test@trita.app",
        teamId: "t1",
        orgId: "o1",
        role: "ORG_MEMBER",
        createdAt: new Date(),
      },
    }),
  );

  assert.deepEqual(flags, {
    pendingJoinPriority: true,
    assessmentContinuationPriority: true,
    selfAssessmentIncomplete: true,
  });
});

test("isJourneyDebugEnabled respects JOURNEY_DEBUG truthy values", () => {
  const original = process.env.JOURNEY_DEBUG;

  process.env.JOURNEY_DEBUG = "1";
  assert.equal(isJourneyDebugEnabled(), true);

  process.env.JOURNEY_DEBUG = "true";
  assert.equal(isJourneyDebugEnabled(), true);

  process.env.JOURNEY_DEBUG = "0";
  assert.equal(isJourneyDebugEnabled(), false);

  process.env.JOURNEY_DEBUG = "";
  assert.equal(isJourneyDebugEnabled(), false);

  if (typeof original === "undefined") {
    delete process.env.JOURNEY_DEBUG;
  } else {
    process.env.JOURNEY_DEBUG = original;
  }
});

test("traceJourneyDecision logs required fields in debug mode only", () => {
  const originalDebug = process.env.JOURNEY_DEBUG;
  const originalInfo = console.info;
  const messages: string[] = [];

  console.info = (message?: unknown) => {
    messages.push(String(message));
  };

  try {
    process.env.JOURNEY_DEBUG = "0";
    traceJourneyDecision({
      entryPoint: "dashboard_page",
      profileId: "p1",
      resolvedStage: "SELF_NOT_STARTED",
      resolvedSurface: "personal",
      destination: "/assessment",
      obligationFlags: {
        pendingJoinPriority: false,
        assessmentContinuationPriority: false,
        selfAssessmentIncomplete: true,
      },
      restrictionFlags: {
        subscriptionState: "none",
        missingOrgSubscription: false,
        readOnlyOrgViews: false,
        disableOrgWriteActions: false,
        hideDetailedOrgInsights: false,
        requiresSubscriptionAction: false,
      },
    });
    assert.equal(messages.length, 0);

    process.env.JOURNEY_DEBUG = "1";
    traceJourneyDecision({
      entryPoint: "dashboard_page",
      profileId: "p1",
      resolvedStage: "SELF_NOT_STARTED",
      resolvedSurface: "personal",
      destination: "/assessment",
      obligationFlags: {
        pendingJoinPriority: false,
        assessmentContinuationPriority: false,
        selfAssessmentIncomplete: true,
      },
      restrictionFlags: {
        subscriptionState: "none",
        missingOrgSubscription: false,
        readOnlyOrgViews: false,
        disableOrgWriteActions: false,
        hideDetailedOrgInsights: false,
        requiresSubscriptionAction: false,
      },
    });
    assert.equal(messages.length, 1);
    assert.match(messages[0], /\[JourneyTrace\]/);
    assert.match(messages[0], /"entryPoint":"dashboard_page"/);
    assert.match(messages[0], /"resolvedStage":"SELF_NOT_STARTED"/);
    assert.match(messages[0], /"resolvedSurface":"personal"/);
    assert.match(messages[0], /"destination":"\/assessment"/);
    assert.match(messages[0], /"obligationFlags":/);
    assert.match(messages[0], /"restrictionFlags":/);
  } finally {
    console.info = originalInfo;
    if (typeof originalDebug === "undefined") {
      delete process.env.JOURNEY_DEBUG;
    } else {
      process.env.JOURNEY_DEBUG = originalDebug;
    }
  }
});
