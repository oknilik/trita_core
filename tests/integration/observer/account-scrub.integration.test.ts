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
import { getTeamCommitmentsWorkspace, mutateTeamCommitments } from "@/lib/team-commitments.server";

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

test("account-scrub – GDPR fiók-törlés (scrubProfileData)", async (t) => {
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
    // (motor-audit F4 – a v5 csak a PENDING-et nullázta), de a státusza marad.
    const c = await prisma.observerInvitation.findUnique({ where: { id: completed.id } });
    assert.equal(c?.status, "COMPLETED");
    assert.equal(c?.observerEmail, null);
    assert.equal(c?.observerName, null);
  });

  await t.test("rater-oldal: minden státuszon személyazonosító elvágva, PENDING lezárva", async () => {
    const other = await createProfile();
    const target = await createProfile();

    // A target mint ÉRTÉKELŐ egy MÁSIK user meghívóin – profil-kapcsolat alapján.
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

    // CANCELED (nem PENDING) sor is nullázódik – minden státuszra.
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
        scores: { H: 55, E: 50, X: 60, A: 45, C: 52, O: 58 } as Prisma.InputJsonValue,
      },
    });

    await scrubProfileData(target.id, target.email);

    assert.equal(await prisma.observerDraft.findUnique({ where: { invitationId: inv.id } }), null);
    assert.equal((await prisma.compareInvite.findUnique({ where: { id: cmp.id } }))?.status, "REVOKED");
    const evAfter = await prisma.analyticsEvent.findUnique({ where: { id: ev.id } });
    assert.equal(evAfter?.userProfileId, null);
    assert.equal(evAfter?.isAuthed, false);
    // Self-eredmény elárvul ÉS a publikus megosztó-link visszavonódik
    // (motor-audit A1 HIGH – a /share/[token] különben a törölt user
    // eredményét publikusan szolgálná ki).
    const arAfter = await prisma.assessmentResult.findUnique({ where: { id: ar.id } });
    assert.equal(arAfter?.userProfileId, null);
    assert.equal(arAfter?.shareToken, null, "a törölt user megosztó-tokenje nullázódik");

    // Tombstone: MINDEN közvetlen PII elvágva (motor-audit A2 – a korábbi scrub
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
    assert.equal(il?.name, "–");
    assert.equal(il?.message, "");

    const ie = await prisma.inquiry.findUnique({ where: { id: inqByEmail.id } });
    assert.equal(ie?.email, "", "case-variant email szerint is redaktál");
    assert.equal(ie?.name, "–");

    const c = await prisma.candidateInvite.findUnique({ where: { id: cand.id } });
    assert.equal(c?.email, null, "a jelölt közvetlen emailje elvágva");
    assert.equal(c?.name, null);
    // A manager-kötés marad (a folyamat az org rekordja) – csak az identitás megy.
    assert.equal(c?.managerId, manager.id);
  });

  await t.test("függő team-/org-/consultant-meghívók törlődnek (case-insensitive email)", async () => {
    const target = await createProfile();
    const owner = await createProfile();
    const org = await prisma.organization.create({
      data: { name: "Scrub Org", ownerId: owner.id },
    });
    const team = await prisma.team.create({
      data: { name: "Scrub Team", ownerId: owner.id, orgId: org.id },
    });

    // A törölt user emailjére szóló függő meghívók – MÁS betűzéssel tárolva.
    const teamInvite = await prisma.teamPendingInvite.create({
      data: { teamId: team.id, email: target.email!.toUpperCase() },
    });
    const orgInvite = await prisma.organizationPendingInvite.create({
      data: { orgId: org.id, email: target.email!.toUpperCase() },
    });
    const consultantInvite = await prisma.consultantInvite.create({
      data: { email: target.email!.toUpperCase(), invitedById: owner.id },
    });
    // Kontroll: MÁS emailre szóló meghívót a scrub nem érinthet.
    const otherInvite = await prisma.teamPendingInvite.create({
      data: { teamId: team.id, email: `keep_${randomUUID().slice(0, 8)}@example.com` },
    });

    await scrubProfileData(target.id, target.email);

    assert.equal(
      await prisma.teamPendingInvite.findUnique({ where: { id: teamInvite.id } }),
      null,
      "a csapat-meghívó sor maga a PII – törlődik",
    );
    assert.equal(
      await prisma.organizationPendingInvite.findUnique({ where: { id: orgInvite.id } }),
      null,
    );
    assert.equal(
      await prisma.consultantInvite.findUnique({ where: { id: consultantInvite.id } }),
      null,
    );
    assert.ok(
      await prisma.teamPendingInvite.findUnique({ where: { id: otherInvite.id } }),
      "másik user meghívója marad",
    );
  });

  await t.test("FakeDoorResponse: email + otherText + profil-link redaktálva, a sor marad", async () => {
    const target = await createProfile();

    // Profil-link szerint illeszkedő sor, szabad-szöveges „egyéb" mezővel.
    const byProfile = await prisma.fakeDoorResponse.create({
      data: {
        module: "career",
        sessionId: makeId("sess"),
        profileId: target.id,
        audience: "member",
        priceVariant: 1,
        interest: "no",
        reasonNo: "other",
        otherText: "Szabad szöveg, benne PII",
        emailOptIn: true,
        email: "optin.cim@example.com",
        viewedAt: NOW,
      },
    });
    // Csak (case-variant) email szerint illeszkedő sor, profil-link nélkül.
    const byEmail = await prisma.fakeDoorResponse.create({
      data: {
        module: "career",
        sessionId: makeId("sess"),
        audience: "guest",
        priceVariant: 2,
        interest: "yes",
        email: target.email!.toUpperCase(),
        viewedAt: NOW,
      },
    });

    await scrubProfileData(target.id, target.email);

    const p = await prisma.fakeDoorResponse.findUnique({ where: { id: byProfile.id } });
    assert.ok(p, "a sor megmarad az aggregált számokhoz");
    assert.equal(p?.email, null);
    assert.equal(p?.otherText, null, "a szabad szöveg is redaktálva");
    assert.equal(p?.profileId, null);
    assert.equal(p?.interest, "no", "az aggregátum-mezők változatlanok");
    assert.equal(p?.reasonNo, "other");

    const e = await prisma.fakeDoorResponse.findUnique({ where: { id: byEmail.id } });
    assert.equal(e?.email, null, "case-variant email szerint is redaktál");
  });

  await t.test("notification-vars: a törölt user neve/emailje redaktálva más usereknél", async () => {
    const target = await createProfile();
    const recipient = await createProfile();

    // A törölt user NEVÉT hordozó értesítés egy MÁSIK user listájában.
    const byName = await prisma.notification.create({
      data: {
        userId: recipient.id,
        type: "OBSERVER_SUBMITTED",
        titleKey: "notif.observerSubmittedTitle",
        bodyKey: "notif.observerSubmittedBody",
        vars: { inviterName: target.username! },
      },
    });
    // A törölt user EMAILJÉT (case-variant, „Név (email)" formában) hordozó
    // targetLabel – az inviterName itt egy másik (élő) user, az marad.
    const byLabel = await prisma.notification.create({
      data: {
        userId: recipient.id,
        type: "OBSERVER_APPROVAL_REQUESTED",
        titleKey: "notif.observerApprovalTitle",
        bodyKey: "notif.observerApprovalBody",
        vars: {
          inviterName: "Élő Kolléga",
          targetLabel: `Külső Értékelő (${target.email!.toUpperCase()})`,
        },
      },
    });
    // Kontroll: nem a törölt userre mutató vars érintetlen marad.
    const untouched = await prisma.notification.create({
      data: {
        userId: recipient.id,
        type: "OBSERVER_COLLEAGUE_INVITED",
        titleKey: "notif.observerColleagueTitle",
        bodyKey: "notif.observerColleagueBody",
        vars: { inviterName: "Élő Kolléga" },
      },
    });

    await scrubProfileData(target.id, target.email);

    const n1 = await prisma.notification.findUnique({ where: { id: byName.id } });
    assert.deepEqual(n1?.vars, { inviterName: "–" });

    const n2 = await prisma.notification.findUnique({ where: { id: byLabel.id } });
    assert.deepEqual(n2?.vars, { inviterName: "Élő Kolléga", targetLabel: "–" });

    const n3 = await prisma.notification.findUnique({ where: { id: untouched.id } });
    assert.deepEqual(n3?.vars, { inviterName: "Élő Kolléga" });
  });

  await t.test("vállalások: a jelenlegi és történeti profilhivatkozások eltűnnek, a csapat munkája megmarad", async () => {
    const target = await createProfile();
    const keeper = await createProfile();
    const org = await prisma.organization.create({ data: { name: makeId("scrub_org"), ownerId: keeper.id } });
    const team = await prisma.team.create({ data: { name: "Scrub commitments", ownerId: keeper.id, orgId: org.id } });
    const otherTeam = await prisma.team.create({ data: { name: "Unchanged plan", ownerId: keeper.id, orgId: org.id } });
    try {
      await prisma.organizationMember.createMany({ data: [keeper, target].map((person) => ({ orgId: org.id, userId: person.id, role: "ORG_MEMBER" })) });
      await prisma.teamMember.createMany({ data: [keeper, target].map((person) => ({ teamId: team.id, userId: person.id, role: person.id === keeper.id ? "manager" : "member" })) });
      await prisma.subscription.create({ data: { orgId: org.id, status: "active", planType: "team" } });
      const sourceSnapshot = { reportId: "historical-report", action: { title: "Original proposal", owner: target.username, note: "Shared source note" } };
      const owned = await prisma.teamCommitment.create({ data: {
        teamId: team.id, title: "Keep the delivered work", ownerUserId: target.id, ownerLabel: target.username,
        createdById: target.id, version: 3, status: "done", dueDate: "2026-10-01",
        latestNote: "The team agreed this is complete.", sourceSnapshot,
      } });
      const reassigned = await prisma.teamCommitment.create({ data: {
        teamId: team.id, title: "Now owned by someone else", ownerUserId: keeper.id, ownerLabel: keeper.username,
        createdById: keeper.id, version: 2, status: "in_progress",
      } });
      const legacy = await prisma.teamCommitment.create({ data: {
        teamId: team.id, title: "Legacy text is not a profile link", ownerLabel: target.username,
        createdById: keeper.id, sourceSnapshot,
      } });
      const payload = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
      await prisma.teamCommitmentEvent.createMany({ data: [
        { commitmentId: owned.id, actorUserId: target.id, version: 3, eventType: "UPDATED", note: owned.latestNote, payload: payload(owned), createdAt: NOW },
        // A different actor's old snapshot still contains the deleted owner and creator.
        { commitmentId: reassigned.id, actorUserId: keeper.id, version: 1, eventType: "CREATED", note: "Earlier team note", payload: payload({ ...reassigned, version: 1, ownerUserId: target.id, ownerLabel: target.username, createdById: target.id, status: "not_started" }), createdAt: NOW },
        // Removing this actor must not remove somebody else's owner/creator references.
        { commitmentId: reassigned.id, actorUserId: target.id, version: 2, eventType: "EDITED", payload: payload(reassigned), createdAt: NOW },
        { commitmentId: legacy.id, actorUserId: keeper.id, version: 1, eventType: "IMPORTED", payload: payload(legacy), createdAt: NOW },
      ] });
      await prisma.teamCommitmentPlan.create({ data: {
        teamId: team.id, focus: "Keep the shared team focus", nextCheckInDate: "2026-10-15", version: 2, updatedById: target.id,
        events: { create: [
          { actorUserId: keeper.id, focus: "Initial team focus", nextCheckInDate: null, version: 1, createdAt: NOW },
          { actorUserId: target.id, focus: "Keep the shared team focus", nextCheckInDate: "2026-10-15", version: 2, createdAt: NOW },
        ] },
      } });
      const untouchedPlan = await prisma.teamCommitmentPlan.create({ data: {
        teamId: otherTeam.id, focus: "Unchanged", updatedById: keeper.id,
        events: { create: { actorUserId: keeper.id, focus: "Unchanged", version: 1, createdAt: NOW } },
      }, include: { events: true } });
      const historyBefore = await prisma.teamCommitmentEvent.findMany({ where: { commitment: { teamId: team.id } }, orderBy: { id: "asc" } });
      const planBefore = await prisma.teamCommitmentPlan.findUniqueOrThrow({ where: { teamId: team.id }, include: { events: { orderBy: { version: "asc" } } } });

      await scrubProfileData(target.id, target.email);

      const ownedAfter = await prisma.teamCommitment.findUniqueOrThrow({ where: { id: owned.id } });
      assert.equal(ownedAfter.ownerUserId, null);
      assert.equal(ownedAfter.ownerLabel, null);
      assert.equal(ownedAfter.createdById, null);
      assert.equal(ownedAfter.version, owned.version + 1, "privacy unassignment invalidates a previously opened editor");
      assert.equal(ownedAfter.status, owned.status);
      assert.equal(ownedAfter.latestNote, owned.latestNote);
      assert.equal(ownedAfter.dueDate, owned.dueDate);
      assert.deepEqual(ownedAfter.sourceSnapshot, sourceSnapshot, "free text is not redacted by a guessed name match");
      assert.deepEqual(await prisma.teamCommitment.findUniqueOrThrow({ where: { id: reassigned.id } }), reassigned);
      assert.deepEqual(await prisma.teamCommitment.findUniqueOrThrow({ where: { id: legacy.id } }), legacy);
      assert.deepEqual(await prisma.userProfile.findUniqueOrThrow({ where: { id: keeper.id } }), keeper);

      const historyAfter = await prisma.teamCommitmentEvent.findMany({ where: { commitment: { teamId: team.id } }, orderBy: { id: "asc" } });
      assert.equal(historyAfter.length, historyBefore.length, "redaction neither deletes history nor invents a user event");
      for (let i = 0; i < historyBefore.length; i++) {
        const before = historyBefore[i];
        const nextPayload = { ...(before.payload as Record<string, Prisma.JsonValue>) };
        if (nextPayload.ownerUserId === target.id) { nextPayload.ownerUserId = null; nextPayload.ownerLabel = null; }
        if (nextPayload.createdById === target.id) nextPayload.createdById = null;
        assert.deepEqual(historyAfter[i], {
          ...before, actorUserId: before.actorUserId === target.id ? null : before.actorUserId, payload: nextPayload,
        }, "only known identity fields change; status, version, note, timestamp and source stay intact");
      }
      const planAfter = await prisma.teamCommitmentPlan.findUniqueOrThrow({ where: { teamId: team.id }, include: { events: { orderBy: { version: "asc" } } } });
      assert.equal(planAfter.updatedById, null);
      assert.equal(planAfter.focus, planBefore.focus);
      assert.equal(planAfter.nextCheckInDate, planBefore.nextCheckInDate);
      assert.equal(planAfter.version, planBefore.version);
      assert.deepEqual(planAfter.events, planBefore.events.map((event) => ({ ...event, actorUserId: event.actorUserId === target.id ? null : event.actorUserId })));
      assert.deepEqual(await prisma.teamCommitmentPlan.findUniqueOrThrow({ where: { teamId: otherTeam.id }, include: { events: true } }), untouchedPlan);

      const result = await getTeamCommitmentsWorkspace(team.id, keeper.id);
      assert.ok("workspace" in result);
      const publicItem = result.workspace.items.find((item) => item.id === owned.id)!;
      assert.equal(publicItem.ownerUserId, null);
      assert.equal(publicItem.ownerName, null);
      assert.equal(publicItem.events[0].actorName, "–", "nullable actors are safe to serialize without querying a null profile ID");
      assert.deepEqual(await mutateTeamCommitments(team.id, keeper.id, {
        action: "edit", id: owned.id, expectedVersion: owned.version,
        fields: { title: "Stale edit", description: "", nextStep: "", successCriteria: "", ownerUserId: null, dueDate: null },
      }), { error: "VERSION_CONFLICT", status: 409 });
      assert.deepEqual(await mutateTeamCommitments(team.id, keeper.id, {
        action: "edit", id: owned.id, expectedVersion: owned.version,
        fields: { title: "Stale assignment", description: "", nextStep: "", successCriteria: "", ownerUserId: target.id, dueDate: null },
      }), { error: "OWNER_NOT_TEAM_MEMBER", status: 400 });

      // Both deletion paths share this helper; a repeated call with the now-null
      // email must not increment versions or alter already scrubbed history.
      await scrubProfileData(target.id, null);
      assert.deepEqual(await prisma.teamCommitment.findUniqueOrThrow({ where: { id: owned.id } }), ownedAfter);
      assert.deepEqual(await prisma.teamCommitmentEvent.findMany({ where: { commitment: { teamId: team.id } }, orderBy: { id: "asc" } }), historyAfter);
      assert.deepEqual(await prisma.teamCommitmentPlan.findUniqueOrThrow({ where: { teamId: team.id }, include: { events: { orderBy: { version: "asc" } } } }), planAfter);
    } finally {
      await prisma.team.deleteMany({ where: { id: { in: [team.id, otherTeam.id] } } });
      await prisma.organization.delete({ where: { id: org.id } });
      await prisma.userProfile.deleteMany({ where: { id: { in: [target.id, keeper.id] } } });
    }
  });
});
