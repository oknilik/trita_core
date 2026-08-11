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
        shareToken: makeId("share"),
        scores: { INTE: 55, RESO: 50, TEMP: 60, ADAP: 45, THOR: 52, OPEN: 58 } as Prisma.InputJsonValue,
      },
    });

    await scrubProfileData(target.id, target.email);

    assert.equal(await prisma.observerDraft.findUnique({ where: { invitationId: inv.id } }), null);
    assert.equal((await prisma.compareInvite.findUnique({ where: { id: cmp.id } }))?.status, "REVOKED");
    const evAfter = await prisma.analyticsEvent.findUnique({ where: { id: ev.id } });
    assert.equal(evAfter?.userProfileId, null);
    assert.equal(evAfter?.isAuthed, false);
    // Self-eredmény elárvul ÉS a publikus megosztó-link visszavonódik
    // (motor-audit A1 HIGH — a /share/[token] különben a törölt user
    // eredményét publikusan szolgálná ki).
    const arAfter = await prisma.assessmentResult.findUnique({ where: { id: ar.id } });
    assert.equal(arAfter?.userProfileId, null);
    assert.equal(arAfter?.shareToken, null, "a törölt user megosztó-tokenje nullázódik");

    // Tombstone: MINDEN közvetlen PII elvágva (motor-audit A2 — a korábbi scrub
    // a username-t és a demográfiát bent hagyta).
    const tomb = await prisma.userProfile.findUnique({ where: { id: target.id } });
    assert.equal(tomb?.deleted, true);
    assert.equal(tomb?.clerkId, null);
    assert.equal(tomb?.email, null);
    assert.equal(tomb?.username, null, "a nevet is nullázni kell");
    assert.equal(tomb?.birthYear, null);
    assert.equal(tomb?.gender, null);
    assert.equal(tomb?.country, null);
  });

  await t.test("A1: demográfiával/karrier-háttérrel feltöltött profil is teljesen tombstone-ol", async () => {
    const target = await prisma.userProfile.create({
      data: {
        id: makeId("scrub"),
        clerkId: makeId("clerk"),
        email: `demo_${randomUUID().slice(0, 8)}@test.trita.app`,
        username: "Demografia Teszt",
        birthYear: 1990,
        gender: "female",
        country: "HU",
        careerBackground: { status: "employed", eduLevel: "msc", interests: ["a", "b"] } as Prisma.InputJsonValue,
        testType: "TRITAN",
        testTypeAssignedAt: NOW,
        onboardedAt: NOW,
        consentedAt: NOW,
      },
    });

    await scrubProfileData(target.id, target.email);

    const tomb = await prisma.userProfile.findUnique({ where: { id: target.id } });
    assert.equal(tomb?.deleted, true);
    assert.equal(tomb?.username, null);
    assert.equal(tomb?.birthYear, null);
    assert.equal(tomb?.gender, null);
    assert.equal(tomb?.country, null);
    assert.equal(tomb?.careerBackground, null, "a karrier-háttér Json is DB-NULL");
  });

  await t.test("Inquiry + CandidateInvite PII redaktálva a törléskor (v8 P1)", async () => {
    const target = await createProfile({ email: `p1_${randomUUID().slice(0, 8)}@test.trita.app` });
    const manager = await createProfile();

    // A törölt fél kapcsolat-űrlapja profil-linkkel …
    const inqLinked = await prisma.inquiry.create({
      data: {
        name: "Teszt Elek",
        email: target.email!,
        topic: "general",
        message: "Titkos üzenet a kapcsolat-űrlapról",
        userProfileId: target.id,
      },
    });
    // … és egy MÁSIK, csak (case-variant) email szerint illeszkedő, profil-link nélkül.
    const inqByEmail = await prisma.inquiry.create({
      data: {
        name: "Teszt Elek",
        email: target.email!.toUpperCase(),
        topic: "general",
        message: "Másik üzenet",
        userProfileId: null,
      },
    });
    // A törölt fél JELÖLTKÉNT egy MÁSIK user (manager) hiring-folyamatában.
    const cand = await prisma.candidateInvite.create({
      data: {
        managerId: manager.id,
        email: target.email!,
        name: "Jelölt Név",
        expiresAt: FUTURE,
      },
    });

    await scrubProfileData(target.id, target.email);

    const il = await prisma.inquiry.findUnique({ where: { id: inqLinked.id } });
    assert.equal(il?.userProfileId, null);
    assert.equal(il?.email, "");
    assert.equal(il?.name, "—");
    assert.equal(il?.message, "");

    const ie = await prisma.inquiry.findUnique({ where: { id: inqByEmail.id } });
    assert.equal(ie?.email, "", "case-variant email szerint is redaktál");
    assert.equal(ie?.name, "—");

    const c = await prisma.candidateInvite.findUnique({ where: { id: cand.id } });
    assert.equal(c?.email, null, "a jelölt közvetlen emailje elvágva");
    assert.equal(c?.name, null);
    // A manager-kötés marad (a folyamat az org rekordja) — csak az identitás megy.
    assert.equal(c?.managerId, manager.id);
  });
});
