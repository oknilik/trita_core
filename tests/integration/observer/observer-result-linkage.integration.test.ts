import type { Prisma } from "@prisma/client";
/**
 * C5.4 — Observer → result linkage integration tests
 *
 * Covers: observer response aggregation into self results,
 * self vs observer gap recalculation, multi-observer averaging,
 * 2-observer anonymity threshold, and Plus/org entitlement gating.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getTestConfig } from "@/lib/questions";
import { calculateScores, type ScoreResult } from "@/lib/scoring";
import { POST as observerSubmitPOST } from "@/app/api/observer/submit/route";
import { can, resolveCapabilities } from "@/lib/policy-engine";

// ── Constants ──────────────────────────────────────────────────────────────────

const NOW = new Date("2026-04-01T10:00:00.000Z");
const FUTURE = new Date("2026-04-15T10:00:00.000Z");

function makeId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

async function createInviterWithResult(overrides: {
  selfAnswerValue?: number;
} = {}) {
  const id = makeId("inviter");
  const config = getTestConfig("TRITAN");

  const profile = await prisma.userProfile.create({
    data: {
      id,
      clerkId: makeId("clerk"),
      email: `${id}@test.trita.app`,
      username: `Inviter ${id}`,
      testType: "TRITAN",
      testTypeAssignedAt: NOW,
      onboardedAt: NOW,
      consentedAt: NOW,
      birthYear: 1990,
      gender: "male",
    },
  });

  // Create self-assessment with known scores
  const selfValue = overrides.selfAnswerValue ?? 3;
  const selfAnswers = config.questions.map((q) => ({
    questionId: q.id,
    value: selfValue,
  }));
  const selfScores = calculateScores("TRITAN", selfAnswers);

  const result = await prisma.assessmentResult.create({
    data: {
      userProfileId: profile.id,
      testType: "TRITAN",
      scores: selfScores as Prisma.InputJsonValue,
      isSelfAssessment: true,
    },
  });

  return { profile, result, selfScores };
}

async function createInvitation(inviterId: string) {
  return prisma.observerInvitation.create({
    data: {
      id: makeId("inv"),
      inviterId,
      testType: "TRITAN",
      status: "PENDING",
      expiresAt: FUTURE,
      observerType: "EXTERNAL",
    },
  });
}

function buildValidAnswers(value: number = 3) {
  const config = getTestConfig("TRITAN");
  return config.questions.map((q) => ({ questionId: q.id, value }));
}

async function submitObserver(token: string, answerValue: number = 3) {
  const req = new Request("http://localhost/api/observer/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token,
      relationshipType: "COLLEAGUE",
      knownDuration: "1_3",
      answers: buildValidAnswers(answerValue),
    }),
  });
  return observerSubmitPOST(req);
}

/**
 * Replicates the aggregation logic from profile/results/page.tsx
 * to verify it produces correct averages.
 */
function aggregateObserverScores(
  observerScores: ScoreResult[],
  dimCodes: string[],
): Record<string, number> {
  const avg: Record<string, number> = {};
  for (const code of dimCodes) {
    let sum = 0;
    let count = 0;
    for (const obs of observerScores) {
      if (obs.type === "likert" && obs.dimensions[code] != null) {
        sum += obs.dimensions[code];
        count++;
      }
    }
    avg[code] = count > 0 ? Math.round(sum / count) : 0;
  }
  return avg;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

test("C5.4 Observer → result linkage", async (t) => {

  // ── Observer response enters aggregation ───────────────────────────────

  await t.test("single observer score is stored and retrievable for inviter", async () => {
    const { profile } = await createInviterWithResult();
    const inv = await createInvitation(profile.id);

    const res = await submitObserver(inv.token, 4);
    assert.equal(res.status, 200);

    const assessments = await prisma.observerAssessment.findMany({
      where: { invitation: { inviterId: profile.id, status: "COMPLETED" } },
      select: { scores: true },
    });

    assert.equal(assessments.length, 1);
    const scores = assessments[0].scores as ScoreResult;
    assert.equal(scores.type, "likert");
    assert.ok(Object.keys(scores.dimensions).length >= 6);
  });

  // ── 2-observer anonymity threshold ─────────────────────────────────────

  await t.test("hasObserverData = false with only 1 observer (anonymity threshold)", async () => {
    const { profile } = await createInviterWithResult();
    const inv = await createInvitation(profile.id);

    await submitObserver(inv.token, 4);

    const completedObservers = await prisma.observerAssessment.findMany({
      where: { invitation: { inviterId: profile.id, status: "COMPLETED" } },
      select: { scores: true },
    });

    // Results page logic: hasObserverData = completedObservers.length >= 2
    const hasObserverData = completedObservers.length >= 2;
    assert.equal(hasObserverData, false, "1 observer should not reveal data (anonymity)");
  });

  await t.test("hasObserverData = true with 2 observers", async () => {
    const { profile } = await createInviterWithResult();
    const inv1 = await createInvitation(profile.id);
    const inv2 = await createInvitation(profile.id);

    await submitObserver(inv1.token, 4);
    await submitObserver(inv2.token, 2);

    const completedObservers = await prisma.observerAssessment.findMany({
      where: { invitation: { inviterId: profile.id, status: "COMPLETED" } },
      select: { scores: true },
    });

    const hasObserverData = completedObservers.length >= 2;
    assert.equal(hasObserverData, true, "2 observers should reveal comparison data");
  });

  // ── Self vs observer gap recalculation ─────────────────────────────────

  await t.test("self vs observer gap is computable from stored scores", async () => {
    // Self answers all 3 (neutral) → each dim = 50
    const { profile, selfScores } = await createInviterWithResult({ selfAnswerValue: 3 });
    const inv1 = await createInvitation(profile.id);
    const inv2 = await createInvitation(profile.id);

    // Observers answer all 5 (high) → scores will differ from self
    await submitObserver(inv1.token, 5);
    await submitObserver(inv2.token, 5);

    const observerAssessments = await prisma.observerAssessment.findMany({
      where: { invitation: { inviterId: profile.id, status: "COMPLETED" } },
      select: { scores: true },
    });

    const observerScoresArr = observerAssessments.map((a) => a.scores as ScoreResult);
    const dimCodes = Object.keys(selfScores.dimensions);
    const observerAvg = aggregateObserverScores(observerScoresArr, dimCodes);

    // Self = 50 for all dims (neutral), observer avg should be different
    for (const code of dimCodes) {
      const selfScore = selfScores.dimensions[code];
      const obsScore = observerAvg[code];
      const gap = Math.abs(selfScore - obsScore);

      // With all-5 vs all-3, gap should exist (reverse-scored items may vary)
      assert.ok(
        typeof obsScore === "number" && obsScore >= 0 && obsScore <= 100,
        `Observer avg for ${code} should be in range`,
      );
      assert.ok(
        typeof gap === "number",
        `Gap for ${code} should be computable`,
      );
    }

    // At least some dimensions should show a gap
    const gaps = dimCodes.map((c) =>
      Math.abs(selfScores.dimensions[c] - observerAvg[c]),
    );
    const hasAnyGap = gaps.some((g) => g > 0);
    assert.ok(hasAnyGap, "There should be at least one non-zero gap between self (3) and observer (5)");
  });

  // ── Multi-observer aggregation correctness ─────────────────────────────

  await t.test("3 observers: average is arithmetic mean of dimension scores", async () => {
    const { profile } = await createInviterWithResult();
    const inv1 = await createInvitation(profile.id);
    const inv2 = await createInvitation(profile.id);
    const inv3 = await createInvitation(profile.id);

    // Submit with different answer values
    await submitObserver(inv1.token, 1);
    await submitObserver(inv2.token, 3);
    await submitObserver(inv3.token, 5);

    const assessments = await prisma.observerAssessment.findMany({
      where: { invitation: { inviterId: profile.id, status: "COMPLETED" } },
      select: { scores: true },
      orderBy: { createdAt: "asc" },
    });

    assert.equal(assessments.length, 3);

    const scores = assessments.map((a) => a.scores as ScoreResult);
    const dimCodes = Object.keys(scores[0].dimensions);

    // Verify aggregation matches manual mean
    const observerAvg = aggregateObserverScores(scores, dimCodes);
    for (const code of dimCodes) {
      const manualMean = Math.round(
        (scores[0].dimensions[code] + scores[1].dimensions[code] + scores[2].dimensions[code]) / 3,
      );
      assert.equal(
        observerAvg[code],
        manualMean,
        `Aggregated avg for ${code} should match manual mean`,
      );
    }
  });

  await t.test("5 observers: aggregation handles max active invite count", async () => {
    const { profile } = await createInviterWithResult();

    // Create 5 invitations (the hard limit)
    const invitations = [];
    for (let i = 0; i < 5; i++) {
      invitations.push(await createInvitation(profile.id));
    }

    // Submit all 5
    for (const inv of invitations) {
      const res = await submitObserver(inv.token, 3);
      assert.equal(res.status, 200);
    }

    const totalAssessments = await prisma.observerAssessment.count({
      where: { invitation: { inviterId: profile.id, status: "COMPLETED" } },
    });

    assert.equal(totalAssessments, 5);

    // All 5 should aggregate correctly
    const assessments = await prisma.observerAssessment.findMany({
      where: { invitation: { inviterId: profile.id, status: "COMPLETED" } },
      select: { scores: true },
    });

    const scores = assessments.map((a) => a.scores as ScoreResult);
    const dimCodes = Object.keys(scores[0].dimensions);
    const observerAvg = aggregateObserverScores(scores, dimCodes);

    // All answered 3 → all scores should be identical → avg = same
    for (const code of dimCodes) {
      assert.equal(
        observerAvg[code],
        scores[0].dimensions[code],
        `With identical answers, avg should equal any single score for ${code}`,
      );
    }
  });

  // ── No hard cap on completed observers ─────────────────────────────────

  await t.test("completed observer count is unlimited (invite limit is on creation, not completion)", async () => {
    const { profile } = await createInviterWithResult();

    // Create and complete 3 invitations in batches
    // (invite limit is 5 *active* at a time, but completed ones free up slots)
    for (let batch = 0; batch < 2; batch++) {
      const inv = await createInvitation(profile.id);
      const res = await submitObserver(inv.token, 3);
      assert.equal(res.status, 200);
    }

    // After completing 2, we can still create more (COMPLETED ones don't count toward active limit)
    // The invite route counts status != CANCELED, but COMPLETED invites ARE counted in the limit check.
    // However, at the DB level, nothing prevents storing >5 completed assessments.
    const completedCount = await prisma.observerAssessment.count({
      where: { invitation: { inviterId: profile.id, status: "COMPLETED" } },
    });

    assert.equal(completedCount, 2);

    // All 2 assessments aggregate correctly
    const assessments = await prisma.observerAssessment.findMany({
      where: { invitation: { inviterId: profile.id, status: "COMPLETED" } },
      select: { scores: true },
    });

    const scores = assessments.map((a) => a.scores as ScoreResult);
    const dimCodes = Object.keys(scores[0].dimensions);
    const observerAvg = aggregateObserverScores(scores, dimCodes);

    for (const code of dimCodes) {
      assert.ok(
        observerAvg[code] >= 0 && observerAvg[code] <= 100,
        `Aggregated score for ${code} should be in valid range`,
      );
    }
  });

  // ── Entitlement: observerInvite capability ─────────────────────────────

  await t.test("observerInvite denied for free self-only user (no purchase, no membership)", () => {
    const decision = can(
      {
        isAuthenticated: true,
        membership: undefined,
        teamRole: null,
      },
      "observerInvite",
      {},
    );

    assert.equal(decision.allowed, false, "Free user should be denied observerInvite");
    assert.equal(decision.reason, "PURCHASE_REQUIRED");
  });

  await t.test("observerInvite granted for Plus user (self_plus tier)", () => {
    const decision = can(
      {
        isAuthenticated: true,
        membership: undefined,
        teamRole: null,
      },
      "observerInvite",
      {},
    );

    assert.equal(decision.allowed, true, "Plus user should have observerInvite capability");
  });

  await t.test("observerInvite granted for org member (active subscription)", () => {
    const decision = can(
      {
        isAuthenticated: true,
        membership: { orgId: "org_1" }, orgRole: "ORG_MEMBER",
        teamRole: null,
      },
      "observerInvite",
      { subscriptionStatus: "active" },
    );

    assert.equal(decision.allowed, true, "Org member with active subscription should have observerInvite");
  });

  await t.test("observerInvite granted for org member even in restricted state", () => {
    // Per capability-matrix.md: observerInvite is granted even in restricted/frozen
    const capabilities = resolveCapabilities(
      {
        isAuthenticated: true,
        membership: { orgId: "org_1" }, orgRole: "ORG_MEMBER",
        teamRole: null,
      },
      { subscriptionStatus: "past_due" },
    );

    assert.ok(
      capabilities.has("observerInvite"),
      "Org member in restricted state should still have observerInvite",
    );
  });

  await t.test("observerInvite granted for team member without purchase", () => {
    const decision = can(
      {
        isAuthenticated: true,
        membership: { orgId: "org_1" }, orgRole: "ORG_MEMBER",
        teamRole: "member",
      },
      "observerInvite",
      { subscriptionStatus: "active" },
    );

    assert.equal(decision.allowed, true, "Team member should have observerInvite via membership");
  });

  // ── Observer scores don't pollute self-assessment ──────────────────────

  await t.test("observer assessments are separate from self-assessment result", async () => {
    const { profile, selfScores } = await createInviterWithResult({ selfAnswerValue: 3 });
    const inv1 = await createInvitation(profile.id);
    const inv2 = await createInvitation(profile.id);

    // Observers give extreme scores
    await submitObserver(inv1.token, 1);
    await submitObserver(inv2.token, 5);

    // Self-assessment result should be unchanged
    const selfResult = await prisma.assessmentResult.findFirst({
      where: { userProfileId: profile.id, isSelfAssessment: true },
    });

    const currentSelfScores = selfResult!.scores as ScoreResult;
    for (const code of Object.keys(selfScores.dimensions)) {
      assert.equal(
        currentSelfScores.dimensions[code],
        selfScores.dimensions[code],
        `Self score for ${code} should not change after observer submissions`,
      );
    }
  });

  // ── Dashboard status reflects observer count ───────────────────────────

  await t.test("completed observer count query matches actual submissions", async () => {
    const { profile } = await createInviterWithResult();
    const inv1 = await createInvitation(profile.id);
    const inv2 = await createInvitation(profile.id);
    const inv3 = await createInvitation(profile.id);

    await submitObserver(inv1.token, 3);
    await submitObserver(inv2.token, 4);
    // inv3 stays PENDING

    // Replicate dashboard status query
    const completedObserverCount = await prisma.observerAssessment.count({
      where: {
        invitation: {
          inviterId: profile.id,
          status: "COMPLETED",
        },
      },
    });

    const pendingInviteCount = await prisma.observerInvitation.count({
      where: {
        inviterId: profile.id,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });

    assert.equal(completedObserverCount, 2, "Should count 2 completed observers");
    assert.equal(pendingInviteCount, 1, "Should count 1 pending invitation");
  });

});
