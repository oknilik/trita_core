/**
 * A1 — Vendég-kitöltés fiókhoz kapcsolása (try/claim szerver-oldala)
 *
 * A vendég válaszai a claim ELŐTT csak localStorage-ban élnek; a
 * /api/assessment/claim-guest a bejelentkezés utáni átvitel: profil
 * upsert (TRITAN hozzárendeléssel), pontozás, eredmény-írás. Lefedve:
 * eredmény-átvitel, duplikált claim-védelem (idempotencia), újrakitöltés,
 * válasz-validáció és a stale (nem TSFI) itemek kiszűrése.
 *
 * A Clerk-feloldó a guest-claim-auth seamen keresztül cserélt
 * (a Clerk szerver-SDK react-server condition alatt nem tölthető be).
 */

import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getTestConfig } from "@/lib/questions";
import type { ScoreResult } from "@/lib/scoring";
import { __setGuestClaimViewerResolverForTests } from "@/lib/guest-claim-auth";
import { POST as claimGuestPOST } from "@/app/api/assessment/claim-guest/route";

function makeId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

// A vendég-flow a TSFI-S (rövid) formát tölti ki — a claimnek ez a
// hiánytalan készlet érvényes (a teljes forma szintén az lenne).
const SHORT_FORM_QUESTIONS = getTestConfig("TRITAN", "hu", "short").questions;

function buildShortAnswers(
  value: number | ((questionId: number, index: number) => number) = 3,
): Array<{ questionId: number; value: number }> {
  return SHORT_FORM_QUESTIONS.map((q, index) => ({
    questionId: q.id,
    value: typeof value === "function" ? value(q.id, index) : value,
  }));
}

async function callClaim(
  clerkId: string | null,
  payload: Record<string, unknown>,
) {
  const restore = __setGuestClaimViewerResolverForTests(async () => clerkId);
  try {
    return await claimGuestPOST(
      new Request("http://localhost/api/assessment/claim-guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
  } finally {
    restore();
  }
}

test("A1 Guest claim (vendég-eredmény fiókhoz kapcsolása)", async (t) => {
  await t.test("bejelentkezés nélkül → 401", async () => {
    const res = await callClaim(null, { answers: buildShortAnswers() });
    assert.equal(res.status, 401);
  });

  await t.test("első claim: profil létrejön TRITAN-nal, az eredmény átkerül", async () => {
    const clerkId = makeId("clerk_new");
    assert.equal(
      await prisma.userProfile.findUnique({ where: { clerkId } }),
      null,
    );

    const res = await callClaim(clerkId, { answers: buildShortAnswers(3) });
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.ok(body.id);

    const profile = await prisma.userProfile.findUnique({ where: { clerkId } });
    assert.ok(profile, "profile should be created by claim");
    assert.equal(profile?.testType, "TRITAN");
    assert.ok(profile?.testTypeAssignedAt);

    const result = await prisma.assessmentResult.findUnique({
      where: { id: body.id },
    });
    assert.equal(result?.userProfileId, profile?.id);
    assert.equal(result?.isSelfAssessment, true);
    assert.equal(result?.testType, "TRITAN");

    const scores = result?.scores as
      | (ScoreResult & { answers?: unknown[]; questionCount?: number })
      | undefined;
    assert.equal(scores?.type, "likert");
    // Csupa-semleges (3) válasz → minden dimenzió 50 (a fordítottság
    // ellenére), tehát a pontozás tényleg lefutott az átvitt válaszokon.
    for (const [code, score] of Object.entries(scores?.dimensions ?? {})) {
      assert.equal(score, 50, `dimension ${code} should be 50`);
    }
    assert.equal(scores?.answers?.length, SHORT_FORM_QUESTIONS.length);
    assert.equal(scores?.questionCount, SHORT_FORM_QUESTIONS.length);
  });

  await t.test("meglévő, testType nélküli profil → claim rendeli hozzá a TRITAN-t", async () => {
    const clerkId = makeId("clerk_existing");
    const existing = await prisma.userProfile.create({
      data: {
        id: makeId("claimer"),
        clerkId,
        email: `${clerkId}@test.trita.app`,
        username: "Guest Claimer",
      },
    });
    assert.equal(existing.testType, null);

    const res = await callClaim(clerkId, { answers: buildShortAnswers(4) });
    assert.equal(res.status, 200);

    const updated = await prisma.userProfile.findUnique({
      where: { id: existing.id },
    });
    assert.equal(updated?.testType, "TRITAN");
    assert.ok(updated?.testTypeAssignedAt);

    const count = await prisma.assessmentResult.count({
      where: { userProfileId: existing.id, isSelfAssessment: true },
    });
    assert.equal(count, 1);
  });

  await t.test("duplikált claim (ugyanaz a válaszkészlet) → nem duplikálódik", async () => {
    const clerkId = makeId("clerk_dupe");
    // Vegyes értékek — a kanonikalizálás (sorrendfüggetlenség) is tesztelt.
    const answers = buildShortAnswers((_, index) => (index % 5) + 1);

    const first = await callClaim(clerkId, { answers });
    const firstBody = await first.json();
    assert.equal(first.status, 200);

    // Ugyanaz a készlet megkevert sorrendben (retry / dupla submit).
    const shuffled = [...answers].reverse();
    const second = await callClaim(clerkId, { answers: shuffled });
    const secondBody = await second.json();
    assert.equal(second.status, 200);
    assert.equal(secondBody.id, firstBody.id);
    assert.equal(secondBody.alreadyClaimed, true);

    const profile = await prisma.userProfile.findUnique({ where: { clerkId } });
    const count = await prisma.assessmentResult.count({
      where: { userProfileId: profile?.id, isSelfAssessment: true },
    });
    assert.equal(count, 1, "duplicate claim must not create a second result");
  });

  await t.test("eltérő válaszkészlet (újrakitöltés) → új eredmény jön létre", async () => {
    const clerkId = makeId("clerk_retake");

    const first = await callClaim(clerkId, { answers: buildShortAnswers(2) });
    const firstBody = await first.json();
    assert.equal(first.status, 200);

    const second = await callClaim(clerkId, { answers: buildShortAnswers(5) });
    const secondBody = await second.json();
    assert.equal(second.status, 200);
    assert.notEqual(secondBody.id, firstBody.id);
    assert.equal(secondBody.alreadyClaimed, undefined);

    const profile = await prisma.userProfile.findUnique({ where: { clerkId } });
    const count = await prisma.assessmentResult.count({
      where: { userProfileId: profile?.id, isSelfAssessment: true },
    });
    assert.equal(count, 2);
  });

  await t.test("hiányos válaszkészlet → 400 ANSWER_COUNT_MISMATCH", async () => {
    const clerkId = makeId("clerk_partial");
    const res = await callClaim(clerkId, {
      answers: buildShortAnswers().slice(0, 10),
    });
    assert.equal(res.status, 400);
    assert.equal((await res.json()).error, "ANSWER_COUNT_MISMATCH");

    // A validációs hiba nem hagyhat hátra eredményt.
    const profile = await prisma.userProfile.findUnique({ where: { clerkId } });
    if (profile) {
      const count = await prisma.assessmentResult.count({
        where: { userProfileId: profile.id },
      });
      assert.equal(count, 0);
    }
  });

  await t.test("duplikált questionId a payloadban → 400 DUPLICATE_ANSWER", async () => {
    const clerkId = makeId("clerk_dupq");
    const answers = buildShortAnswers();
    answers.push({ questionId: answers[0].questionId, value: 5 });

    const res = await callClaim(clerkId, { answers });
    assert.equal(res.status, 400);
    assert.equal((await res.json()).error, "DUPLICATE_ANSWER");
  });

  await t.test("ismeretlen (stale) questionId-k kiszűrődnek, a claim sikerül", async () => {
    const clerkId = makeId("clerk_stale");
    const answers = [
      ...buildShortAnswers(3),
      // Régi kérdésbank-verzióból ottmaradt (nem TSFI) item — a szerver dobja.
      { questionId: 99999, value: 4 },
    ];

    const res = await callClaim(clerkId, { answers });
    const body = await res.json();
    assert.equal(res.status, 200);

    const result = await prisma.assessmentResult.findUnique({
      where: { id: body.id },
    });
    const scores = result?.scores as { questionCount?: number } | undefined;
    assert.equal(scores?.questionCount, SHORT_FORM_QUESTIONS.length);
  });

  await t.test("érvénytelen érték (Likert-en kívül) → 400", async () => {
    const clerkId = makeId("clerk_badval");
    const answers = buildShortAnswers();
    answers[0] = { questionId: answers[0].questionId, value: 9 };

    const res = await callClaim(clerkId, { answers });
    assert.equal(res.status, 400);
  });
});
