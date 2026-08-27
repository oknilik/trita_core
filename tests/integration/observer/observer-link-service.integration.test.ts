/**
 * C5.2 — Observer token + acceptance integration coverage
 *
 * Focus:
 * - auth-oriented token acceptance (linking token to profile)
 * - wrong target / association mismatch protection
 * - token lifecycle validation parity
 * - anonymous and linked observer submit paths
 */

import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getTestConfig } from "@/lib/questions";
import { POST as observerSubmitPOST } from "@/app/api/observer/submit/route";
import { linkObserverTokenToProfile } from "@/lib/observer/link-service";
import { __setObserverSubmitViewerResolverForTests } from "@/lib/observer/submit-auth";

const NOW = new Date("2026-04-01T10:00:00.000Z");
// Lejárathoz a VALÓS órához képesti jövő kell: a submit API a szerver-oldali
// Date.now()-val ellenőriz, fix dátum idővel a múltba csúszna (teszt-rothadás).
const FUTURE = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
const PAST = new Date("2026-03-01T10:00:00.000Z");

function makeId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

async function createProfile(prefix: string) {
  const id = makeId(prefix);
  return prisma.userProfile.create({
    data: {
      id,
      clerkId: makeId("clerk"),
      email: `${id}@test.trita.app`,
      username: `${prefix} ${id}`,
      locale: "en",
    },
  });
}

async function createInvitation(
  inviterId: string,
  overrides: {
    status?: "PENDING" | "COMPLETED" | "EXPIRED" | "CANCELED";
    expiresAt?: Date;
    observerProfileId?: string | null;
    observerType?: "INTERNAL" | "EXTERNAL" | "ANONYMOUS";
    completedAt?: Date | null;
  } = {},
) {
  return prisma.observerInvitation.create({
    data: {
      id: makeId("inv"),
      inviterId,
      testType: "TRITAN",
      status: overrides.status ?? "PENDING",
      expiresAt: overrides.expiresAt ?? FUTURE,
      observerProfileId: overrides.observerProfileId ?? null,
      observerType: overrides.observerType ?? "EXTERNAL",
      completedAt: overrides.completedAt ?? null,
    },
  });
}

function buildValidAnswers() {
  const config = getTestConfig("TRITAN" as const);
  return config.questions.map((q) => ({
    questionId: q.id,
    value: 3,
  }));
}

async function submitObserverToken(token: string) {
  const req = new Request("http://localhost/api/observer/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token,
      relationshipType: "COLLEAGUE",
      knownDuration: "1_3",
      answers: buildValidAnswers(),
      confidence: 4,
    }),
  });
  return observerSubmitPOST(req);
}

test("C5.2 Observer token link + acceptance", async (t) => {
  await t.test("valid token links to observer profile (authenticated flow service)", async () => {
    const inviter = await createProfile("inviter");
    const observer = await createProfile("observer");
    const invitation = await createInvitation(inviter.id);

    const result = await linkObserverTokenToProfile({
      token: invitation.token,
      profileId: observer.id,
      now: NOW,
    });

    assert.equal(result.ok, true);
    const linked = await prisma.observerInvitation.findUnique({
      where: { id: invitation.id },
      select: { observerProfileId: true },
    });
    assert.equal(linked?.observerProfileId, observer.id);
  });

  await t.test("invalid token is rejected", async () => {
    const observer = await createProfile("observer");
    const result = await linkObserverTokenToProfile({
      token: "missing_token",
      profileId: observer.id,
      now: NOW,
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "INVALID_TOKEN");
  });

  await t.test("expired token is rejected", async () => {
    const inviter = await createProfile("inviter");
    const observer = await createProfile("observer");
    const invitation = await createInvitation(inviter.id, { expiresAt: PAST });

    const result = await linkObserverTokenToProfile({
      token: invitation.token,
      profileId: observer.id,
      now: NOW,
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "INVITE_EXPIRED");
  });

  await t.test("already completed token is rejected", async () => {
    const inviter = await createProfile("inviter");
    const observer = await createProfile("observer");
    const invitation = await createInvitation(inviter.id, {
      status: "COMPLETED",
      completedAt: NOW,
    });

    const result = await linkObserverTokenToProfile({
      token: invitation.token,
      profileId: observer.id,
      now: NOW,
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "ALREADY_USED");
  });

  await t.test("revoked/canceled token is rejected", async () => {
    const inviter = await createProfile("inviter");
    const observer = await createProfile("observer");
    const invitation = await createInvitation(inviter.id, { status: "CANCELED" });

    const result = await linkObserverTokenToProfile({
      token: invitation.token,
      profileId: observer.id,
      now: NOW,
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "INVITE_CANCELED");
  });

  await t.test("self-guard: az értékelt nem claim-elheti a SAJÁT tokenjét", async () => {
    const inviter = await createProfile("inviter");
    const invitation = await createInvitation(inviter.id);

    const result = await linkObserverTokenToProfile({
      token: invitation.token,
      profileId: inviter.id,
      now: NOW,
    });

    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "SELF_LINK_FORBIDDEN");

    // A token NEM kötődött a meghívóhoz.
    const after = await prisma.observerInvitation.findUnique({
      where: { id: invitation.id },
      select: { observerProfileId: true },
    });
    assert.equal(after?.observerProfileId, null);
  });

  await t.test("wrong target / wrong entity association is rejected", async () => {
    const inviter = await createProfile("inviter");
    const linkedObserver = await createProfile("linked_observer");
    const differentObserver = await createProfile("different_observer");
    const invitation = await createInvitation(inviter.id, {
      observerProfileId: linkedObserver.id,
      observerType: "INTERNAL",
    });

    const result = await linkObserverTokenToProfile({
      token: invitation.token,
      profileId: differentObserver.id,
      now: NOW,
    });

    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "OBSERVER_MISMATCH");
  });

  await t.test("anonymous observer flow: submit succeeds with valid anonymous token", async () => {
    const inviter = await createProfile("inviter");
    const invitation = await createInvitation(inviter.id, {
      observerType: "ANONYMOUS",
      observerProfileId: null,
    });

    const res = await submitObserverToken(invitation.token);
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.success, true);
  });

  await t.test("linked observer flow: token linked first, then addressee submit succeeds", async () => {
    const inviter = await createProfile("inviter");
    const observer = await createProfile("observer");
    const invitation = await createInvitation(inviter.id, {
      observerType: "INTERNAL",
    });

    const linked = await linkObserverTokenToProfile({
      token: invitation.token,
      profileId: observer.id,
      now: NOW,
    });
    assert.equal(linked.ok, true);

    // Mai viselkedés: a nevesített (linkelt) meghívót csak a bejelentkezett
    // címzett adhatja be – bejelentkezés nélkül NOT_ADDRESSEE.
    const restoreAnon = __setObserverSubmitViewerResolverForTests(async () => null);
    try {
      const anonRes = await submitObserverToken(invitation.token);
      assert.equal(anonRes.status, 403);
      assert.equal((await anonRes.json()).error, "NOT_ADDRESSEE");
    } finally {
      restoreAnon();
    }

    // A címzettként bejelentkezett néző submitja sikeres.
    const restore = __setObserverSubmitViewerResolverForTests(
      async () => observer.clerkId,
    );
    try {
      const res = await submitObserverToken(invitation.token);
      const body = await res.json();

      assert.equal(res.status, 200);
      assert.equal(body.success, true);
    } finally {
      restore();
    }
  });
});

