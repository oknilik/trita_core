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
        token: "tok_inv1",
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
  const originalJson = process.env.LOG_JSON;
  // A journey-trace az egységes loggerre ír (info szint → console.log sink),
  // JSON-módban ellenőrizzük a strukturált mezőket.
  const originalLog = console.log;
  const messages: string[] = [];

  console.log = (message?: unknown) => {
    messages.push(String(message));
  };

  try {
    process.env.LOG_JSON = "1";
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
    const record = JSON.parse(messages[0]);
    assert.equal(record.event, "journey.decision");
    assert.equal(record.module, "journey");
    assert.equal(record.entryPoint, "dashboard_page");
    assert.equal(record.resolvedStage, "SELF_NOT_STARTED");
    assert.equal(record.resolvedSurface, "personal");
    assert.equal(record.destination, "/assessment");
    assert.ok(record.obligationFlags);
    assert.ok(record.restrictionFlags);
  } finally {
    console.log = originalLog;
    if (typeof originalJson === "undefined") delete process.env.LOG_JSON;
    else process.env.LOG_JSON = originalJson;
    if (typeof originalDebug === "undefined") {
      delete process.env.JOURNEY_DEBUG;
    } else {
      process.env.JOURNEY_DEBUG = originalDebug;
    }
  }
});
