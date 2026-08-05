/**
 * D1 — Reflexiós utókövetés (napi sweep) integration tests
 *
 * A runNotificationSweep reflexiós ága valós DB-vel: a ~1 hete (7–10 nap)
 * kitöltött legfrissebb self-eredmény kiválasztódik, EGYETLEN
 * REFLECTION_PROMPT értesítést kap (user-szintű dedupe, sosem ismétlődik),
 * az email-láb pedig kizárólag lifecycleEmailsOptOut=false mellett indul.
 * A pure kiválasztó (selectReflectionCandidates) ablak-szélei fix "now"-val
 * fedettek; a DB-esetek dátumait a teszt relatívan (valós now-hoz képest)
 * állítja be — determinisztikus, nem rothad.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  REFLECTION_WINDOW_END_DAYS,
  REFLECTION_WINDOW_START_DAYS,
  runNotificationSweep,
  selectReflectionCandidates,
} from "@/lib/notifications/sweep";
import { TRITAN_DIMENSIONS } from "@/lib/tritan";

// Az email-láb determinisztikusan a hiba-ágra megy (a kísérlet ténye a
// SweepResult.errors-ból olvasható): a kulcs kiürítése CSAK ennek a
// tesztfolyamatnak az env-jét érinti, .env fájlhoz nem nyúlunk.
process.env.RESEND_API_KEY = "";

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

function makeId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * DAY_MS);
}

// OPEN a legerősebb — a személyre szabott szöveg dimenziója egyértelmű.
const OPEN_TOP_DIMS = {
  INTE: 40,
  RESO: 45,
  TEMP: 50,
  ADAP: 55,
  THOR: 60,
  OPEN: 82,
};

async function createUserWithSelfResult(
  prefix: string,
  overrides: {
    resultCreatedAt?: Date;
    dimensions?: Record<string, number>;
    lifecycleEmailsOptOut?: boolean;
    clerkId?: string | null;
    locale?: string;
    scores?: unknown;
  } = {},
) {
  const id = makeId(prefix);
  const profile = await prisma.userProfile.create({
    data: {
      id,
      clerkId:
        overrides.clerkId === undefined ? makeId("clerk") : overrides.clerkId,
      email: `${id}@test.trita.app`,
      username: `${prefix} ${id}`,
      locale: overrides.locale ?? "hu",
      testType: "TRITAN",
      onboardedAt: new Date(),
      lifecycleEmailsOptOut: overrides.lifecycleEmailsOptOut ?? false,
    },
  });

  await prisma.assessmentResult.create({
    data: {
      userProfileId: profile.id,
      testType: "TRITAN",
      isSelfAssessment: true,
      createdAt: overrides.resultCreatedAt ?? daysAgo(8),
      scores: (overrides.scores ?? {
        type: "likert",
        dimensions: overrides.dimensions ?? OPEN_TOP_DIMS,
      }) as Prisma.InputJsonValue,
    },
  });

  return profile;
}

function reflectionNotificationsFor(userId: string) {
  return prisma.notification.findMany({
    where: { userId, type: "REFLECTION_PROMPT" },
  });
}

test("D1 Reflection sweep", async (t) => {
  await t.test("pure kiválasztó: ablak-szélek, hiányos inputok, holtverseny", () => {
    const now = new Date("2026-08-04T12:00:00.000Z");
    const at = (msBack: number) => new Date(now.getTime() - msBack);
    const likert = (dims: Record<string, number>) => ({
      type: "likert",
      dimensions: dims,
    });

    const rows = [
      // Pontosan 7 nap → az ablak eleje, jelölt.
      {
        userProfileId: "u_edge_start",
        createdAt: at(REFLECTION_WINDOW_START_DAYS * DAY_MS),
        scores: likert(OPEN_TOP_DIMS),
      },
      // Pontosan 10 nap → az ablak vége, még jelölt.
      {
        userProfileId: "u_edge_end",
        createdAt: at(REFLECTION_WINDOW_END_DAYS * DAY_MS),
        scores: likert(OPEN_TOP_DIMS),
      },
      // Egy perccel fiatalabb a 7 napnál → még nem jelölt.
      {
        userProfileId: "u_too_fresh",
        createdAt: at(REFLECTION_WINDOW_START_DAYS * DAY_MS - MINUTE_MS),
        scores: likert(OPEN_TOP_DIMS),
      },
      // Egy perccel idősebb a 10 napnál → már kicsúszott.
      {
        userProfileId: "u_too_old",
        createdAt: at(REFLECTION_WINDOW_END_DAYS * DAY_MS + MINUTE_MS),
        scores: likert(OPEN_TOP_DIMS),
      },
      // Profil nélküli (vendég) eredmény sosem jelölt.
      {
        userProfileId: null,
        createdAt: at(8 * DAY_MS),
        scores: likert(OPEN_TOP_DIMS),
      },
      // Nem-likert score-JSON kimarad.
      {
        userProfileId: "u_not_likert",
        createdAt: at(8 * DAY_MS),
        scores: { type: "other" },
      },
      // Holtverseny: pontszám-egyezésnél a kód szerinti (ABC) sorrend nyer.
      {
        userProfileId: "u_tie",
        createdAt: at(8 * DAY_MS),
        scores: likert({ OPEN: 70, ADAP: 70, INTE: 10 }),
      },
    ];

    const candidates = selectReflectionCandidates(rows, now);
    const byUser = new Map(candidates.map((c) => [c.userId, c.topDim]));

    assert.deepEqual(
      [...byUser.keys()].sort(),
      ["u_edge_end", "u_edge_start", "u_tie"],
    );
    assert.equal(byUser.get("u_edge_start"), "OPEN");
    assert.equal(byUser.get("u_tie"), "ADAP");
  });

  await t.test("~8 napja kitöltött self-eredmény → REFLECTION_PROMPT keletkezik", async () => {
    const user = await createUserWithSelfResult("refl_hit", {
      resultCreatedAt: daysAgo(8),
    });

    const result = await runNotificationSweep();
    assert.ok(result.notificationsCreated >= 1);

    const notifications = await reflectionNotificationsFor(user.id);
    assert.equal(notifications.length, 1);

    const notif = notifications[0];
    assert.equal(notif.category, "assessment");
    assert.equal(notif.priority, "low");
    assert.equal(notif.link, "/interaction");
    assert.equal(notif.dedupeKey, `REFLECTION_PROMPT:${user.id}`);

    // Per-locale megszemélyesítés: mindkét nyelvű címke vars-ként utazik.
    const vars = notif.vars as { dimLabelHu?: string; dimLabelEn?: string };
    assert.equal(vars.dimLabelHu, TRITAN_DIMENSIONS.OPEN.hu);
    assert.equal(vars.dimLabelEn, TRITAN_DIMENSIONS.OPEN.en);
  });

  await t.test("dedupe: a második sweep nem hoz létre újat", async () => {
    const user = await createUserWithSelfResult("refl_dedupe", {
      resultCreatedAt: daysAgo(8),
    });

    await runNotificationSweep();
    assert.equal((await reflectionNotificationsFor(user.id)).length, 1);

    const second = await runNotificationSweep();
    assert.equal((await reflectionNotificationsFor(user.id)).length, 1);

    // A második körben már email-kísérlet sincs erre a userre (a skip a
    // persist ELŐTT történik) — a hibalista sem említheti.
    assert.ok(
      !second.errors.some((e) => e.includes(user.id)),
      `second sweep must skip already-notified user, errors: ${second.errors.join(" | ")}`,
    );
  });

  await t.test("friss (3 napos) és régi (12 napos) eredmény nem jelölt", async () => {
    const fresh = await createUserWithSelfResult("refl_fresh", {
      resultCreatedAt: daysAgo(3),
    });
    const old = await createUserWithSelfResult("refl_old", {
      resultCreatedAt: daysAgo(12),
    });

    await runNotificationSweep();

    assert.equal((await reflectionNotificationsFor(fresh.id)).length, 0);
    assert.equal((await reflectionNotificationsFor(old.id)).length, 0);
  });

  await t.test("aki azóta újat töltött ki, kicsúszik (a legfrissebb számít)", async () => {
    const user = await createUserWithSelfResult("refl_retake", {
      resultCreatedAt: daysAgo(8),
    });
    // Frissebb self-eredmény — a distinct a legfrissebbet nézi, az pedig
    // az ablakon kívül (túl friss) van.
    await prisma.assessmentResult.create({
      data: {
        userProfileId: user.id,
        testType: "TRITAN",
        isSelfAssessment: true,
        createdAt: daysAgo(1),
        scores: { type: "likert", dimensions: OPEN_TOP_DIMS } as Prisma.InputJsonValue,
      },
    });

    await runNotificationSweep();
    assert.equal((await reflectionNotificationsFor(user.id)).length, 0);
  });

  await t.test("lifecycleEmailsOptOut: in-app értesítés jön, email-kísérlet nincs", async () => {
    const mailed = await createUserWithSelfResult("refl_mailed", {
      resultCreatedAt: daysAgo(8),
      lifecycleEmailsOptOut: false,
    });
    const optedOut = await createUserWithSelfResult("refl_optout", {
      resultCreatedAt: daysAgo(8),
      lifecycleEmailsOptOut: true,
    });

    const result = await runNotificationSweep();

    // Az in-app érintést az opt-out NEM érinti — mindkét user megkapja.
    assert.equal((await reflectionNotificationsFor(mailed.id)).length, 1);
    assert.equal((await reflectionNotificationsFor(optedOut.id)).length, 1);

    // Teszt-env: nincs RESEND_API_KEY → az email-kísérlet hibára fut, a
    // kísérlet TÉNYE a hibalistából olvasható. Opt-out mellett kísérlet
    // sincs, így hiba-sor sem.
    assert.ok(
      result.errors.some((e) => e.startsWith(`reflection email ${mailed.id}`)),
      `expected email attempt for opted-in user, errors: ${result.errors.join(" | ")}`,
    );
    assert.ok(
      !result.errors.some((e) => e.includes(optedOut.id)),
      "opted-out user must not get an email attempt",
    );
    assert.equal(result.emailsSent, 0);

    // Az email-hiba nem dönti be az in-app értesítést, és a dedupe miatt
    // következő körben sem ismétlődik (in-app rekordon ül).
    const again = await runNotificationSweep();
    assert.equal((await reflectionNotificationsFor(mailed.id)).length, 1);
    assert.ok(!again.errors.some((e) => e.includes(mailed.id)));
  });

  await t.test("clerkId nélküli (nem claimelt) profil nem jelölt", async () => {
    const ghost = await createUserWithSelfResult("refl_ghost", {
      resultCreatedAt: daysAgo(8),
      clerkId: null,
    });

    await runNotificationSweep();
    assert.equal((await reflectionNotificationsFor(ghost.id)).length, 0);
  });
});
