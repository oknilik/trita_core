/**
 * Account-scrub (GDPR fiók-törlés) integration tesztek — valós DB rekordokkal.
 *
 * A `scrubProfileData` a KANONIKUS törlési scrub, amit MINDKÉT út hív (in-app
 * /api/profile/delete ÉS a Clerk user.deleted webhook). Motor-audit v6 (F18)
 * jelezte, hogy nulla tesztje volt — pedig ez a hatókör legérzékenyebb
 * privacy-függvénye. Lefedi: inviter- és rater-oldali observer-scrub minden
 * státuszra, case-insensitive email-illesztés, árva draft, compare-invite,
 * analitika-elvágás, profil-tombstone.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { scrubProfileData } from "@/lib/account-scrub";

const NOW = new Date("2026-04-01T10:00:00.000Z");
const FUTURE = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

function makeId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

async function createProfile(overrides: { email?: string } = {}) {
  const id = makeId("scrub");
  return prisma.userProfile.create({
    data: {
      id,
      clerkId: makeId("clerk"),
      email: overrides.email ?? `${id}@test.trita.app`,
      username: `User ${id}`,
      testType: "TRITAN",
      testTypeAssignedAt: NOW,
      onboardedAt: NOW,
      consentedAt: NOW,
    },
  });
}

async function createInvitation(data: {
  inviterId: string;
  status?: Prisma.ObserverInvitationCreateInput["status"];
  observerProfileId?: string | null;
  observerEmail?: string | null;
  observerName?: string | null;
}) {
  return prisma.observerInvitation.create({
    data: {
      inviterId: data.inviterId,
      testType: "TRITAN",
      status: data.status ?? "PENDING",
      expiresAt: FUTURE,
      observerType: "EXTERNAL",
      observerProfileId: data.observerProfileId ?? null,
      observerEmail: data.observerEmail ?? null,
      observerName: data.observerName ?? null,
    },
  });
}

test("account-scrub — GDPR fiók-törlés (scrubProfileData)", async (t) => {
  await t.test("inviter-oldal: PENDING lezárva + PII nullázva, COMPLETED PII nullázva (score marad)", async () => {
    const target = await createProfile();

    const pending = await createInvitation({
      inviterId: target.id,
      status: "PENDING",
      observerEmail: "rater.pending@example.com",
      observerName: "Pending Rater",
    });
    const completed = await createInvitation({
      inviterId: target.id,
      status: "COMPLETED",
      observerEmail: "rater.done@example.com",
      observerName: "Done Rater",
    });

    await scrubProfileData(target.id, target.email);

    const p = await prisma.observerInvitation.findUnique({ where: { id: pending.id } });
    assert.equal(p?.status, "CANCELED");
    assert.equal(p?.observerEmail, null);
    assert.equal(p?.observerName, null);

    // A COMPLETED inviter-sor a harmadik fél (rater) PII-ját is elveszti
    // (motor-audit F4 — a v5 csak a PENDING-et nullázta), de a státusza marad.
    const c = await prisma.observerInvitation.findUnique({ where: { id: completed.id } });
    assert.equal(c?.status, "COMPLETED");
    assert.equal(c?.observerEmail, null);
    assert.equal(c?.observerName, null);
  });

  await t.test("rater-oldal: minden státuszon személyazonosító elvágva, PENDING lezárva", async () => {
    const other = await createProfile();
    const target = await createProfile();

    // A target mint ÉRTÉKELŐ egy MÁSIK user meghívóin — profil-kapcsolat alapján.
    const raterCompleted = await createInvitation({
      inviterId: other.id,
      status: "COMPLETED",
      observerProfileId: target.id,
      observerEmail: "linked@example.com",
      observerName: "Linked",
    });
    const raterCanceled = await createInvitation({
      inviterId: other.id,
      status: "CANCELED",
      observerProfileId: target.id,
    });

    await scrubProfileData(target.id, target.email);

    // COMPLETED: score marad (státusz), de az identitás elvágva.
    const rc = await prisma.observerInvitation.findUnique({ where: { id: raterCompleted.id } });
    assert.equal(rc?.status, "COMPLETED");
    assert.equal(rc?.observerProfileId, null);
    assert.equal(rc?.observerEmail, null);
    assert.equal(rc?.observerName, null);

    // CANCELED (nem PENDING) sor is nullázódik — minden státuszra.
    const rx = await prisma.observerInvitation.findUnique({ where: { id: raterCanceled.id } });
    assert.equal(rx?.observerProfileId, null);
  });

  await t.test("rater-oldali email-illesztés CASE-INSENSITIVE", async () => {
    const other = await createProfile();
    const target = await createProfile({ email: `mixed_${randomUUID().slice(0, 8)}@Test.Trita.App` });

    // A meghívó a target emailjét MÁS betűzéssel tárolta (nincs profil-kapcsolat).
    const byEmail = await createInvitation({
      inviterId: other.id,
      status: "PENDING",
      observerProfileId: null,
      observerEmail: target.email!.toUpperCase(),
      observerName: "By Email",
    });

    await scrubProfileData(target.id, target.email);

    const be = await prisma.observerInvitation.findUnique({ where: { id: byEmail.id } });
    assert.equal(be?.status, "CANCELED");
    assert.equal(be?.observerEmail, null, "case-variant emailt is meg kell találnia");
    assert.equal(be?.observerName, null);
  });

  await t.test("árva draft, compare-invite, analitika, self-eredmény, tombstone", async () => {
    const target = await createProfile();

    const inv = await createInvitation({ inviterId: target.id, status: "PENDING" });
    await prisma.observerDraft.create({
      data: {
        invitationId: inv.id,
        phase: "assessment",
        relationshipType: "COLLEAGUE",
        knownDuration: "1_3",
        answers: { "1": 3, "2": 4 },
      },
    });
    const cmp = await prisma.compareInvite.create({
      data: { inviterId: target.id, status: "PENDING", expiresAt: FUTURE },
    });
    const ev = await prisma.analyticsEvent.create({
      data: {
        name: "test_event",
        visitorRef: makeId("vref"),
        userProfileId: target.id,
        isAuthed: true,
      },
    });
    const ar = await prisma.assessmentResult.create({
      data: {
        userProfileId: target.id,
        testType: "TRITAN",
        isSelfAssessment: true,
        scores: { INTE: 55, RESO: 50, TEMP: 60, ADAP: 45, THOR: 52, OPEN: 58 } as Prisma.InputJsonValue,
      },
    });

    await scrubProfileData(target.id, target.email);

    assert.equal(await prisma.observerDraft.findUnique({ where: { invitationId: inv.id } }), null);
    assert.equal((await prisma.compareInvite.findUnique({ where: { id: cmp.id } }))?.status, "REVOKED");
    const evAfter = await prisma.analyticsEvent.findUnique({ where: { id: ev.id } });
    assert.equal(evAfter?.userProfileId, null);
    assert.equal(evAfter?.isAuthed, false);
    assert.equal((await prisma.assessmentResult.findUnique({ where: { id: ar.id } }))?.userProfileId, null);

    const tomb = await prisma.userProfile.findUnique({ where: { id: target.id } });
    assert.equal(tomb?.deleted, true);
    assert.equal(tomb?.clerkId, null);
    assert.equal(tomb?.email, null);
  });
});
