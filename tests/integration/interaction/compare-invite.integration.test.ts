/**
 * B1 — Compare-invite (valódi páros összehasonlítás) életciklus
 *
 * A /api/interaction/invite route-hármas valós DB-vel:
 * létrehozás (limit, eredmény-feltétel), publikus token-feloldás,
 * elfogadás (consent, SELF_COMPARE, idempotencia, COMPARE_ACCEPTED
 * értesítés), lejárat (lusta EXPIRED), visszavonás mindkét oldalról,
 * és az elfogadott pár → buildPairSimulation input-oldala.
 *
 * A Clerk-feloldó a compare-invite-auth seamen keresztül cserélt
 * (a Clerk szerver-SDK react-server condition alatt nem tölthető be).
 */

import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ScoreResult } from "@/lib/scoring";
import {
  COMPARE_INVITE_MAX_ACTIVE,
  COMPARE_INVITE_TTL_DAYS,
  resolveCompareInviteState,
} from "@/lib/compare-invite";
import { __setCompareInviteViewerResolverForTests } from "@/lib/compare-invite-auth";
import { buildPairSimulation } from "@/lib/interaction-view";
import {
  POST as createInvitePOST,
  GET as listInvitesGET,
  DELETE as revokeInviteDELETE,
} from "@/app/api/interaction/invite/route";
import { GET as inviteTokenGET } from "@/app/api/interaction/invite/[token]/route";
import { POST as acceptInvitePOST } from "@/app/api/interaction/invite/[token]/accept/route";

// Az email-láb determinisztikusan a hiba-ágra megy (a küldés best-effort,
// a link él): a kulcs kiürítése CSAK ennek a tesztfolyamatnak az env-jét
// érinti, .env fájlhoz nem nyúlunk.
process.env.RESEND_API_KEY = "";

const DAY_MS = 24 * 60 * 60 * 1000;

function makeId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

// Erősen pólusos, egymással ellentétes profilpár — a páros szimuláció
// garantáltan nem sparse (minden dimenzió a HIGH 65 / LOW 35 küszöbön túl).
const POLAR_SELF = { H: 80, E: 25, X: 78, A: 30, C: 82, O: 74 };
const POLAR_OTHER = { H: 22, E: 76, X: 24, A: 72, C: 20, O: 28 };

async function createUser(
  prefix: string,
  overrides: {
    withResult?: boolean;
    dimensions?: Record<string, number>;
  } = {},
) {
  const id = makeId(prefix);
  const profile = await prisma.userProfile.create({
    data: {
      id,
      clerkId: makeId("clerk"),
      email: `${id}@test.trita.app`,
      username: `${prefix} ${id}`,
      testType: "TRITAN",
      onboardedAt: new Date(),
      consentedAt: new Date(),
    },
  });

  if (overrides.withResult !== false) {
    const scores: ScoreResult = {
      type: "likert",
      dimensions: overrides.dimensions ?? {
        H: 50,
        E: 50,
        X: 50,
        A: 50,
        C: 50,
        O: 50,
      },
    };
    await prisma.assessmentResult.create({
      data: {
        userProfileId: profile.id,
        testType: "TRITAN",
        isSelfAssessment: true,
        scores: scores as Prisma.InputJsonValue,
      },
    });
  }

  return profile;
}

async function asUser<T>(clerkId: string | null, fn: () => Promise<T>): Promise<T> {
  const restore = __setCompareInviteViewerResolverForTests(async () => clerkId);
  try {
    return await fn();
  } finally {
    restore();
  }
}

function callCreate(clerkId: string | null, body: Record<string, unknown> = {}) {
  return asUser(clerkId, () =>
    createInvitePOST(
      new Request("http://localhost/api/interaction/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    ),
  );
}

function callList(clerkId: string | null) {
  return asUser(clerkId, () => listInvitesGET());
}

function callRevoke(clerkId: string | null, id: string) {
  return asUser(clerkId, () =>
    revokeInviteDELETE(
      new Request("http://localhost/api/interaction/invite", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      }),
    ),
  );
}

function callTokenResolve(token: string) {
  return inviteTokenGET(
    new Request(`http://localhost/api/interaction/invite/${token}`),
    { params: Promise.resolve({ token }) },
  );
}

function callAccept(clerkId: string | null, token: string) {
  return asUser(clerkId, () =>
    acceptInvitePOST(
      new Request(`http://localhost/api/interaction/invite/${token}/accept`, {
        method: "POST",
      }),
      { params: Promise.resolve({ token }) },
    ),
  );
}

test("B1 Compare-invite lifecycle", async (t) => {
  await t.test("létrehozás: saját eredménnyel → PENDING invite ~30 nap lejárattal", async () => {
    const inviter = await createUser("inviter");
    const before = Date.now();

    const res = await callCreate(inviter.clerkId);
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.ok(body.id);
    assert.ok(body.token);
    assert.ok(String(body.url).includes(`/interaction/compare/${body.token}`));
    assert.equal(body.emailSent, false);
    assert.equal(body.emailError, null);

    const invite = await prisma.compareInvite.findUnique({ where: { id: body.id } });
    assert.ok(invite);
    assert.equal(invite?.status, "PENDING");
    assert.equal(invite?.inviterId, inviter.id);
    assert.equal(invite?.partnerId, null);

    // Lejárat: pontosan a TTL-nyi idő előre (perces tűréssel).
    const expectedExpiry = before + COMPARE_INVITE_TTL_DAYS * DAY_MS;
    const drift = Math.abs((invite?.expiresAt.getTime() ?? 0) - expectedExpiry);
    assert.ok(drift < 60 * 1000, `expiry drift too large: ${drift}ms`);
  });

  await t.test("létrehozás bejelentkezés nélkül → 401", async () => {
    const res = await callCreate(null);
    assert.equal(res.status, 401);
    assert.equal((await res.json()).error, "FORBIDDEN");
  });

  await t.test("létrehozás saját eredmény nélkül → 409 NO_RESULT", async () => {
    const noResult = await createUser("noresult", { withResult: false });
    const res = await callCreate(noResult.clerkId);
    assert.equal(res.status, 409);
    assert.equal((await res.json()).error, "NO_RESULT");

    // Profil nélküli (ismeretlen) clerkId → 403.
    const orphanRes = await callCreate(makeId("ghost_clerk"));
    assert.equal(orphanRes.status, 403);
  });

  await t.test("aktív-limit: a 4. meghívó 409, visszavonás/lejárat után újra mehet", async () => {
    const inviter = await createUser("limit");

    const created: string[] = [];
    for (let i = 0; i < COMPARE_INVITE_MAX_ACTIVE; i++) {
      const res = await callCreate(inviter.clerkId);
      assert.equal(res.status, 200, `invite #${i + 1} should succeed`);
      created.push((await res.json()).id);
    }

    const overflow = await callCreate(inviter.clerkId);
    assert.equal(overflow.status, 409);
    assert.equal((await overflow.json()).error, "COMPARE_LIMIT_REACHED");

    // REVOKED nem számít aktívnak → újra van hely.
    const revoke = await callRevoke(inviter.clerkId, created[0]);
    assert.equal(revoke.status, 200);
    const afterRevoke = await callCreate(inviter.clerkId);
    assert.equal(afterRevoke.status, 200);

    // Lustán lejárt PENDING sem számít aktívnak.
    await prisma.compareInvite.update({
      where: { id: created[1] },
      data: { expiresAt: new Date(Date.now() - DAY_MS) },
    });
    const afterExpiry = await callCreate(inviter.clerkId);
    assert.equal(afterExpiry.status, 200);
  });

  await t.test("token-feloldás GET: érvényes / ismeretlen / lejárt", async () => {
    const inviter = await createUser("resolver");
    const res = await callCreate(inviter.clerkId);
    const { token } = await res.json();

    const valid = await callTokenResolve(token);
    const validBody = await valid.json();
    assert.equal(valid.status, 200);
    assert.equal(validBody.state, "PENDING");
    assert.equal(validBody.inviterName, inviter.username);

    const unknown = await callTokenResolve("nonexistent_compare_token");
    assert.equal(unknown.status, 404);
    assert.equal((await unknown.json()).error, "INVALID_TOKEN");

    // Lusta lejárat: a DB-ben PENDING marad, az olvasat EXPIRED.
    await prisma.compareInvite.update({
      where: { token },
      data: { expiresAt: new Date(Date.now() - DAY_MS) },
    });
    const expired = await callTokenResolve(token);
    assert.equal((await expired.json()).state, "EXPIRED");
    const stored = await prisma.compareInvite.findUnique({ where: { token } });
    assert.equal(stored?.status, "PENDING");
    assert.equal(
      resolveCompareInviteState({ status: stored!.status, expiresAt: stored!.expiresAt }),
      "EXPIRED",
    );
  });

  await t.test("elfogadás: ACCEPTED + COMPARE_ACCEPTED értesítés a meghívónak", async () => {
    const inviter = await createUser("acc_inviter");
    const partner = await createUser("acc_partner");
    const createRes = await callCreate(inviter.clerkId);
    const { id, token } = await createRes.json();

    const accept = await callAccept(partner.clerkId, token);
    const acceptBody = await accept.json();
    assert.equal(accept.status, 200);
    assert.equal(acceptBody.ok, true);
    assert.equal(acceptBody.id, id);

    const invite = await prisma.compareInvite.findUnique({ where: { id } });
    assert.equal(invite?.status, "ACCEPTED");
    assert.equal(invite?.partnerId, partner.id);
    assert.ok(invite?.acceptedAt);

    const notification = await prisma.notification.findFirst({
      where: { userId: inviter.id, type: "COMPARE_ACCEPTED" },
    });
    assert.ok(notification, "inviter should get COMPARE_ACCEPTED notification");
    assert.equal(notification?.dedupeKey, `COMPARE_ACCEPTED:${id}`);
    assert.equal(notification?.link, `/interaction?pair=${id}`);
    assert.equal(notification?.sourceType, "compare_invite");
    assert.equal(notification?.sourceId, id);
    assert.equal(notification?.actorUserId, partner.id);
    assert.equal(
      (notification?.vars as { name?: string } | null)?.name,
      partner.username,
    );
  });

  await t.test("elfogadás idempotens; másik user már nem léphet be", async () => {
    const inviter = await createUser("idem_inviter");
    const partner = await createUser("idem_partner");
    const intruder = await createUser("idem_intruder");
    const { id, token } = await (await callCreate(inviter.clerkId)).json();

    const first = await callAccept(partner.clerkId, token);
    assert.equal(first.status, 200);

    // Ugyanaz a partner újra (dupla kattintás) → ok, és nem duplázódik
    // sem a pár, sem az értesítés.
    const again = await callAccept(partner.clerkId, token);
    assert.equal(again.status, 200);
    assert.equal((await again.json()).ok, true);

    const notifCount = await prisma.notification.count({
      where: { userId: inviter.id, type: "COMPARE_ACCEPTED", sourceId: id },
    });
    assert.equal(notifCount, 1);

    const stolen = await callAccept(intruder.clerkId, token);
    assert.equal(stolen.status, 409);
    assert.equal((await stolen.json()).error, "ALREADY_ACCEPTED");
  });

  await t.test("saját link elfogadása → 409 SELF_COMPARE", async () => {
    const inviter = await createUser("self_inviter");
    const { token } = await (await callCreate(inviter.clerkId)).json();

    const res = await callAccept(inviter.clerkId, token);
    assert.equal(res.status, 409);
    assert.equal((await res.json()).error, "SELF_COMPARE");

    const invite = await prisma.compareInvite.findUnique({ where: { token } });
    assert.equal(invite?.status, "PENDING");
  });

  await t.test("elfogadás eredmény nélkül → 409 NO_RESULT; auth nélkül → 401", async () => {
    const inviter = await createUser("guard_inviter");
    const noResult = await createUser("guard_noresult", { withResult: false });
    const { token } = await (await callCreate(inviter.clerkId)).json();

    const anon = await callAccept(null, token);
    assert.equal(anon.status, 401);

    const res = await callAccept(noResult.clerkId, token);
    assert.equal(res.status, 409);
    assert.equal((await res.json()).error, "NO_RESULT");

    // Ismeretlen token, eredménnyel rendelkező usernek → 404.
    const partner = await createUser("guard_partner");
    const missing = await callAccept(partner.clerkId, "nonexistent_compare_token");
    assert.equal(missing.status, 404);
    assert.equal((await missing.json()).error, "INVALID_TOKEN");
  });

  await t.test("lejárt → 410 COMPARE_EXPIRED; visszavont → 410 COMPARE_REVOKED", async () => {
    const inviter = await createUser("exp_inviter");
    const partner = await createUser("exp_partner");

    const { id: expiredId, token: expiredToken } = await (
      await callCreate(inviter.clerkId)
    ).json();
    await prisma.compareInvite.update({
      where: { id: expiredId },
      data: { expiresAt: new Date(Date.now() - DAY_MS) },
    });
    const expired = await callAccept(partner.clerkId, expiredToken);
    assert.equal(expired.status, 410);
    assert.equal((await expired.json()).error, "COMPARE_EXPIRED");

    const { id: revokedId, token: revokedToken } = await (
      await callCreate(inviter.clerkId)
    ).json();
    await callRevoke(inviter.clerkId, revokedId);
    const revoked = await callAccept(partner.clerkId, revokedToken);
    assert.equal(revoked.status, 410);
    assert.equal((await revoked.json()).error, "COMPARE_REVOKED");
  });

  await t.test("visszavonás: mindkét fél vonhat, kívülálló nem", async () => {
    const inviter = await createUser("rev_inviter");
    const partner = await createUser("rev_partner");
    const outsider = await createUser("rev_outsider");

    // Inviter vonja vissza a saját PENDING linkjét.
    const { id: ownId } = await (await callCreate(inviter.clerkId)).json();
    const ownRevoke = await callRevoke(inviter.clerkId, ownId);
    assert.equal(ownRevoke.status, 200);
    assert.equal(
      (await prisma.compareInvite.findUnique({ where: { id: ownId } }))?.status,
      "REVOKED",
    );

    // Elfogadott párt a PARTNER is visszavonhatja.
    const { id: pairId, token } = await (await callCreate(inviter.clerkId)).json();
    await callAccept(partner.clerkId, token);

    const outsiderRevoke = await callRevoke(outsider.clerkId, pairId);
    assert.equal(outsiderRevoke.status, 403);

    const partnerRevoke = await callRevoke(partner.clerkId, pairId);
    assert.equal(partnerRevoke.status, 200);
    assert.equal(
      (await prisma.compareInvite.findUnique({ where: { id: pairId } }))?.status,
      "REVOKED",
    );

    const missing = await callRevoke(inviter.clerkId, "cmp_nonexistent_id");
    assert.equal(missing.status, 404);
  });

  await t.test("lista GET: token csak az inviternek; state/role/otherName helyes", async () => {
    const inviter = await createUser("list_inviter");
    const partner = await createUser("list_partner");
    const { id, token } = await (await callCreate(inviter.clerkId)).json();
    await callAccept(partner.clerkId, token);

    const inviterList = await (await callList(inviter.clerkId)).json();
    const inviterRow = inviterList.invites.find(
      (row: { id: string }) => row.id === id,
    );
    assert.ok(inviterRow);
    assert.equal(inviterRow.role, "inviter");
    assert.equal(inviterRow.state, "ACCEPTED");
    assert.equal(inviterRow.token, token);
    assert.equal(inviterRow.otherName, partner.username);

    const partnerList = await (await callList(partner.clerkId)).json();
    const partnerRow = partnerList.invites.find(
      (row: { id: string }) => row.id === id,
    );
    assert.ok(partnerRow);
    assert.equal(partnerRow.role, "partner");
    assert.equal(partnerRow.state, "ACCEPTED");
    // A token a partnernek nem jár (link-birtoklás = meghívói jog).
    assert.equal(partnerRow.token, null);
    assert.equal(partnerRow.otherName, inviter.username);
  });

  await t.test("elfogadott pár → a páros nézet inputja elérhető (buildPairSimulation)", async () => {
    const inviter = await createUser("pair_inviter", { dimensions: POLAR_SELF });
    const partner = await createUser("pair_partner", { dimensions: POLAR_OTHER });
    const { id, token } = await (await callCreate(inviter.clerkId)).json();
    await callAccept(partner.clerkId, token);

    // Az interaction-oldal adat-útvonala: ACCEPTED pár → másik fél
    // feloldása → a másik fél legfrissebb self-eredménye → szimuláció.
    const invite = await prisma.compareInvite.findUnique({ where: { id } });
    assert.ok(invite);
    assert.equal(
      resolveCompareInviteState({ status: invite!.status, expiresAt: invite!.expiresAt }),
      "ACCEPTED",
    );

    const otherId =
      invite!.inviterId === inviter.id ? invite!.partnerId : invite!.inviterId;
    assert.equal(otherId, partner.id);

    const [selfResult, otherResult] = await Promise.all([
      prisma.assessmentResult.findFirst({
        where: { userProfileId: inviter.id, isSelfAssessment: true },
        orderBy: { createdAt: "desc" },
        select: { scores: true },
      }),
      prisma.assessmentResult.findFirst({
        where: { userProfileId: otherId!, isSelfAssessment: true },
        orderBy: { createdAt: "desc" },
        select: { scores: true },
      }),
    ]);

    const selfScores = selfResult?.scores as ScoreResult | undefined;
    const otherScores = otherResult?.scores as ScoreResult | undefined;
    assert.equal(selfScores?.type, "likert");
    assert.equal(otherScores?.type, "likert");

    const sim = buildPairSimulation(
      selfScores!.dimensions,
      otherScores!.dimensions,
      "hu",
    );
    // Erősen pólusos, ellentétes profilokon a szimuláció tartalmas.
    assert.equal(sim.sparse, false);
    assert.ok(sim.easy.length + sim.friction.length + sim.discuss.length > 0);
    assert.ok(Array.isArray(sim.leaderNotesSelf));
    assert.ok(Array.isArray(sim.leaderNotesOther));
    // A nézet-modell sima JSON (RSC-szerializálható) — nincs benne Date/fn.
    assert.deepEqual(JSON.parse(JSON.stringify(sim)), sim);
  });

  await t.test("email-cím megadásával: a link akkor is él, ha a küldés elhal", async () => {
    const inviter = await createUser("email_inviter");
    const res = await callCreate(inviter.clerkId, {
      email: "compare.partner@test.trita.app",
    });
    const body = await res.json();

    // Teszt-env: nincs RESEND_API_KEY → a küldés best-effort hibára fut,
    // de a meghívó létrejön és a link másolható marad.
    assert.equal(res.status, 200);
    assert.ok(body.token);
    assert.equal(body.emailSent, false);
    assert.equal(body.emailError, "EMAIL_SEND_FAILED");

    const invite = await prisma.compareInvite.findUnique({
      where: { id: body.id },
    });
    assert.equal(invite?.status, "PENDING");
  });

  await t.test("érvénytelen email a payloadban → 400 INVALID_PAYLOAD", async () => {
    const inviter = await createUser("badmail_inviter");
    const res = await callCreate(inviter.clerkId, { email: "not-an-email" });
    assert.equal(res.status, 400);
    assert.equal((await res.json()).error, "INVALID_PAYLOAD");
  });
});
