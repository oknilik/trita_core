/**
 * C5.2 — Observer token and acceptance integration tests
 *
 * Tests the observer submit API with real DB records.
 * Covers: valid token, invalid token, expired token, already completed,
 * canceled token, duplicate answers, missing answers, confidence rating.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { InvitationStatus } from "@prisma/client";
import { getTestConfig } from "@/lib/questions";
import { POST as observerSubmitPOST } from "@/app/api/observer/submit/route";
import {
  POST as observerDraftPOST,
  DELETE as observerDraftDELETE,
} from "@/app/api/observer/draft/route";
import {
  observerDraftCookieName,
  observerDraftCookieValue,
} from "@/lib/observer/draft-cookie";

// ── Constants ──────────────────────────────────────────────────────────────────

const NOW = new Date("2026-04-01T10:00:00.000Z");
// Lejárathoz a VALÓS órához képesti jövő kell: a submit API a szerver-oldali
// Date.now()-val ellenőriz, fix dátum idővel a múltba csúszna (teszt-rothadás).
const FUTURE = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
const PAST = new Date("2026-03-01T10:00:00.000Z");

function makeId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

async function createInviterProfile() {
  const id = makeId("inviter");
  return prisma.userProfile.create({
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
}

async function createInvitation(
  inviterId: string,
  overrides: {
    status?: InvitationStatus;
    expiresAt?: Date;
    completedAt?: Date | null;
  } = {},
) {
  const id = makeId("inv");
  return prisma.observerInvitation.create({
    data: {
      id,
      inviterId,
      testType: "TRITAN",
      status: overrides.status ?? "PENDING",
      expiresAt: overrides.expiresAt ?? FUTURE,
      completedAt: overrides.completedAt ?? null,
      observerType: "EXTERNAL",
    },
  });
}

function buildValidAnswers(): Array<{ questionId: number; value: number }> {
  const config = getTestConfig("TRITAN");
  return config.questions.map((q) => ({
    questionId: q.id,
    value: 3, // neutral Likert value
  }));
}

function buildSubmitPayload(
  token: string,
  overrides: {
    answers?: Array<{ questionId: number; value: number }>;
    relationshipType?: string;
    knownDuration?: string;
    confidence?: number;
  } = {},
) {
  return {
    token,
    relationshipType: overrides.relationshipType ?? "COLLEAGUE",
    knownDuration: overrides.knownDuration ?? "1_3",
    answers: overrides.answers ?? buildValidAnswers(),
    confidence: overrides.confidence,
  };
}

async function callSubmit(payload: Record<string, unknown>) {
  const req = new Request("http://localhost/api/observer/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return observerSubmitPOST(req);
}

// ── Tests ──────────────────────────────────────────────────────────────────────

test("C5.2 Observer token acceptance", async (t) => {

  await t.test("valid PENDING token → 200 success + COMPLETED status", async () => {
    const inviter = await createInviterProfile();
    const invitation = await createInvitation(inviter.id);

    const payload = buildSubmitPayload(invitation.token);
    const res = await callSubmit(payload);
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.success, true);

    // Verify DB state
    const updated = await prisma.observerInvitation.findUnique({
      where: { id: invitation.id },
    });
    assert.equal(updated?.status, "COMPLETED");
    assert.ok(updated?.completedAt);

    // Verify ObserverAssessment created
    const assessment = await prisma.observerAssessment.findUnique({
      where: { invitationId: invitation.id },
    });
    assert.ok(assessment);
    assert.equal(assessment?.relationshipType, "COLLEAGUE");
    assert.equal(assessment?.knownDuration, "1_3");
    assert.ok(assessment?.scores);
  });

  await t.test("invalid token → 404 INVALID_TOKEN", async () => {
    const payload = buildSubmitPayload("nonexistent_token_12345");
    const res = await callSubmit(payload);
    const body = await res.json();

    assert.equal(res.status, 404);
    assert.equal(body.error, "INVALID_TOKEN");
  });

  await t.test("expired token → 400 INVITE_EXPIRED", async () => {
    const inviter = await createInviterProfile();
    const invitation = await createInvitation(inviter.id, { expiresAt: PAST });

    const payload = buildSubmitPayload(invitation.token);
    const res = await callSubmit(payload);
    const body = await res.json();

    assert.equal(res.status, 400);
    assert.equal(body.error, "INVITE_EXPIRED");

    // Verify invitation status unchanged
    const unchanged = await prisma.observerInvitation.findUnique({
      where: { id: invitation.id },
    });
    assert.equal(unchanged?.status, "PENDING");
  });

  await t.test("already completed token → 400 ALREADY_USED", async () => {
    const inviter = await createInviterProfile();
    const invitation = await createInvitation(inviter.id, {
      status: "COMPLETED",
      completedAt: NOW,
    });

    const payload = buildSubmitPayload(invitation.token);
    const res = await callSubmit(payload);
    const body = await res.json();

    assert.equal(res.status, 400);
    assert.equal(body.error, "ALREADY_USED");
  });

  await t.test("canceled token → 400 INVITE_CANCELED", async () => {
    const inviter = await createInviterProfile();
    const invitation = await createInvitation(inviter.id, { status: "CANCELED" });

    const payload = buildSubmitPayload(invitation.token);
    const res = await callSubmit(payload);
    const body = await res.json();

    assert.equal(res.status, 400);
    assert.equal(body.error, "INVITE_CANCELED");
  });

  await t.test("duplicate answers → 400 DUPLICATE_ANSWER", async () => {
    const inviter = await createInviterProfile();
    const invitation = await createInvitation(inviter.id);

    const answers = buildValidAnswers();
    // Add a duplicate of the first answer
    answers.push({ questionId: answers[0].questionId, value: 4 });

    const payload = buildSubmitPayload(invitation.token, { answers });
    const res = await callSubmit(payload);
    const body = await res.json();

    assert.equal(res.status, 400);
    assert.equal(body.error, "DUPLICATE_ANSWER");

    // Verify invitation NOT completed
    const unchanged = await prisma.observerInvitation.findUnique({
      where: { id: invitation.id },
    });
    assert.equal(unchanged?.status, "PENDING");
  });

  await t.test("missing answers → 400 MISSING_ANSWER", async () => {
    const inviter = await createInviterProfile();
    const invitation = await createInvitation(inviter.id);

    // Only send first 5 answers (should be 60 for TRITAN)
    const answers = buildValidAnswers().slice(0, 5);

    const payload = buildSubmitPayload(invitation.token, { answers });
    const res = await callSubmit(payload);
    const body = await res.json();

    assert.equal(res.status, 400);
    assert.equal(body.error, "MISSING_ANSWER");
  });

  await t.test("valid submit with confidence rating → stored correctly", async () => {
    const inviter = await createInviterProfile();
    const invitation = await createInvitation(inviter.id);

    const payload = buildSubmitPayload(invitation.token, { confidence: 4 });
    const res = await callSubmit(payload);

    assert.equal(res.status, 200);

    const assessment = await prisma.observerAssessment.findUnique({
      where: { invitationId: invitation.id },
    });
    assert.equal(assessment?.confidence, 4);
  });

  await t.test("valid submit without confidence → null stored", async () => {
    const inviter = await createInviterProfile();
    const invitation = await createInvitation(inviter.id);

    const payload = buildSubmitPayload(invitation.token);
    const res = await callSubmit(payload);

    assert.equal(res.status, 200);

    const assessment = await prisma.observerAssessment.findUnique({
      where: { invitationId: invitation.id },
    });
    assert.equal(assessment?.confidence, null);
  });

  await t.test("submit with all relationship types → accepted", async () => {
    const types = ["FRIEND", "COLLEAGUE", "FAMILY", "PARTNER", "OTHER"] as const;

    for (const relType of types) {
      const inviter = await createInviterProfile();
      const invitation = await createInvitation(inviter.id);

      const payload = buildSubmitPayload(invitation.token, {
        relationshipType: relType,
      });
      const res = await callSubmit(payload);

      assert.equal(res.status, 200, `Failed for relationship type: ${relType}`);

      const assessment = await prisma.observerAssessment.findUnique({
        where: { invitationId: invitation.id },
      });
      assert.equal(assessment?.relationshipType, relType);
    }
  });

  await t.test("submit creates scored dimensions in assessment", async () => {
    const inviter = await createInviterProfile();
    const invitation = await createInvitation(inviter.id);

    const payload = buildSubmitPayload(invitation.token);
    const res = await callSubmit(payload);

    assert.equal(res.status, 200);

    const assessment = await prisma.observerAssessment.findUnique({
      where: { invitationId: invitation.id },
    });
    assert.ok(assessment?.scores);

    const scores = assessment!.scores as Record<string, unknown>;
    assert.equal(scores.type, "likert");

    const dims = scores.dimensions as Record<string, number>;
    // TRITAN has 6 dimensions: H, E, X, A, C, O
    assert.ok("H" in dims);
    assert.ok("E" in dims);
    assert.ok("X" in dims);
    assert.ok("A" in dims);
    assert.ok("C" in dims);
    assert.ok("O" in dims);

    // All neutral (value=3) → score should be 50 ((3-1)/4*100 = 50)
    for (const [code, score] of Object.entries(dims)) {
      assert.equal(score, 50, `Dimension ${code} should be 50 for all-neutral answers`);
    }
  });

  await t.test("draft is deleted after successful submit", async () => {
    const inviter = await createInviterProfile();
    const invitation = await createInvitation(inviter.id);

    // Create a draft first
    await prisma.observerDraft.create({
      data: {
        invitationId: invitation.id,
        phase: "assessment",
        relationshipType: "COLLEAGUE",
        knownDuration: "1_3",
        answers: { "1": 3, "2": 4 },
        currentPage: 2,
      },
    });

    const payload = buildSubmitPayload(invitation.token);
    const res = await callSubmit(payload);

    assert.equal(res.status, 200);

    // A draft a submit-tranzakcióban törlődik — nem maradhat árva sor.
    const draft = await prisma.observerDraft.findUnique({
      where: { invitationId: invitation.id },
    });
    assert.equal(draft, null);
  });

  await t.test("second submit to same token → 400 ALREADY_USED", async () => {
    const inviter = await createInviterProfile();
    const invitation = await createInvitation(inviter.id);

    // First submit
    const payload = buildSubmitPayload(invitation.token);
    const res1 = await callSubmit(payload);
    assert.equal(res1.status, 200);

    // Second submit — should fail
    const res2 = await callSubmit(payload);
    const body2 = await res2.json();

    assert.equal(res2.status, 400);
    assert.equal(body2.error, "ALREADY_USED");
  });

});

// ── Draft route lifecycle + birtoklás-cookie ───────────────────────────────────

function buildDraftPayload(token: string) {
  return {
    token,
    phase: "assessment" as const,
    relationshipType: "COLLEAGUE",
    knownDuration: "1_3",
    answers: { "1": 3, "2": 4 },
    currentPage: 0,
  };
}

async function callDraftPost(token: string) {
  const req = new Request("http://localhost/api/observer/draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildDraftPayload(token)),
  });
  return observerDraftPOST(req);
}

async function callDraftDelete(token: string) {
  const req = new Request("http://localhost/api/observer/draft", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  return observerDraftDELETE(req);
}

test("Observer draft route — lifecycle + cookie", async (t) => {
  await t.test("aktív külső tokenre a draft-írás megy, és HMAC-cookie-t kap", async () => {
    const inviter = await createInviterProfile();
    const invitation = await createInvitation(inviter.id);

    const res = await callDraftPost(invitation.token);
    assert.equal(res.status, 200);

    const draft = await prisma.observerDraft.findUnique({
      where: { invitationId: invitation.id },
    });
    assert.ok(draft, "a draft mentődik");

    // A válasz beállítja a birtoklás-bizonyíték cookie-t (fix: logged-out
    // draft-szivárgás — a draftot csak az író böngésző olvashatja vissza).
    const setCookie = res.headers.get("set-cookie") ?? "";
    assert.ok(
      setCookie.includes(
        `${observerDraftCookieName(invitation.id)}=${observerDraftCookieValue(invitation.id)}`,
      ),
      "a külső meghívó draft-POST-ja HMAC-cookie-t állít",
    );
    assert.match(setCookie, /httponly/i, "httpOnly — JS-ből nem olvasható");
  });

  await t.test("LEJÁRT (de PENDING) tokenre a draft-írás 400 INVITE_EXPIRED", async () => {
    const inviter = await createInviterProfile();
    const invitation = await createInvitation(inviter.id, { expiresAt: PAST });

    const res = await callDraftPost(invitation.token);
    const body = await res.json();

    assert.equal(res.status, 400);
    assert.equal(body.error, "INVITE_EXPIRED");
    assert.equal(
      await prisma.observerDraft.findUnique({ where: { invitationId: invitation.id } }),
      null,
      "lejárt tokennel draft nem jöhet létre",
    );
  });

  await t.test("LEJÁRT tokenre a draft-törlés is elutasítva", async () => {
    const inviter = await createInviterProfile();
    const invitation = await createInvitation(inviter.id, { expiresAt: PAST });
    await prisma.observerDraft.create({
      data: {
        invitationId: invitation.id,
        phase: "assessment",
        relationshipType: "COLLEAGUE",
        knownDuration: "1_3",
        answers: { "1": 3 },
      },
    });

    const res = await callDraftDelete(invitation.token);
    const body = await res.json();

    assert.equal(res.status, 400);
    assert.equal(body.error, "INVITE_EXPIRED");
    assert.ok(
      await prisma.observerDraft.findUnique({ where: { invitationId: invitation.id } }),
      "a lejárt token nem nyúlhat a drafthoz",
    );
  });

  await t.test("CANCELED tokenre a draft-írás 400 INVITE_CANCELED", async () => {
    const inviter = await createInviterProfile();
    const invitation = await createInvitation(inviter.id, { status: "CANCELED" });

    const res = await callDraftPost(invitation.token);
    const body = await res.json();

    assert.equal(res.status, 400);
    assert.equal(body.error, "INVITE_CANCELED");
  });

  await t.test("COMPLETED tokenre a törlés megengedett marad (beadás utáni takarítás)", async () => {
    const inviter = await createInviterProfile();
    const invitation = await createInvitation(inviter.id, {
      status: "COMPLETED",
      completedAt: NOW,
    });

    const res = await callDraftDelete(invitation.token);
    assert.equal(res.status, 200);
    assert.equal((await res.json()).ok, true);
  });
});
