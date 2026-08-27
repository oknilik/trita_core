/**
 * Csapat-szintű visszajelzési kultúra — a BETÖLTŐ integrációs fedése.
 *
 * A tiszta számítást (computeTeamFeedbackCulture) unit-teszt fedi. Ami ott
 * NEM ellenőrizhető, és itt dől el:
 *   · a kampány-hatókör vörösvonala — a privát (kampányhoz nem kötött) és a
 *     MÁS szervezet kampányából jövő visszajelzés nem szivároghat be;
 *   · csak COMPLETED meghívó számít;
 *   · az örökség-kulcsos (INTE/RESO/…) tárolt score-sorok is beszámítanak;
 *   · a per-fős rater-padló a valódi lekérdezésen keresztül is áll.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { loadTeamFeedbackCulture } from "@/lib/team-observer.server";
import { TEAM_OBSERVER_MIN_COVERED } from "@/lib/team-observer";
import { DOSSIER_OBSERVER_MIN, DOSSIER_GAP_MIN_DELTA } from "@/lib/member-dossier";
import { HEXACO_ORDER } from "@/lib/hexaco";

const FUTURE = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

function makeId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

const flatDims = (value: number): Record<string, number> =>
  Object.fromEntries(HEXACO_ORDER.map((code) => [code, value]));

/** Örökség-kulcsú (2026-08-11 előtti) alak – a normalizálást hivatott bizonyítani. */
const legacyDims = (value: number): Record<string, number> => ({
  INTE: value, RESO: value, TEMP: value, ADAP: value, THOR: value, OPEN: value,
});

const scoresJson = (dimensions: Record<string, number>) => ({
  type: "likert",
  dimensions,
});

async function createProfile() {
  const id = makeId("u");
  return prisma.userProfile.create({
    data: {
      id,
      clerkId: makeId("clerk"),
      email: `${id}@test.trita.app`,
      username: `Member ${id}`,
      locale: "hu",
    },
    select: { id: true },
  });
}

async function createOrgWithTeam() {
  const owner = await createProfile();
  const org = await prisma.organization.create({
    data: { name: `Org ${makeId("o")}`, ownerId: owner.id },
    select: { id: true },
  });
  const team = await prisma.team.create({
    data: { name: `Team ${makeId("t")}`, orgId: org.id, ownerId: owner.id },
    select: { id: true },
  });
  const campaign = await prisma.campaign.create({
    data: {
      orgId: org.id,
      name: `Campaign ${makeId("c")}`,
      type: "OBSERVER_360",
      steps: ["OBSERVER_360"],
      teamId: team.id,
      teamIds: [team.id],
      status: "ACTIVE",
      createdBy: owner.id,
    },
    select: { id: true },
  });
  return { orgId: org.id, teamId: team.id, campaignId: campaign.id };
}

/** Értékelések egy tagnak. `campaignId: null` → privát (hatókörön kívüli). */
async function addObservers(params: {
  subjectId: string;
  count: number;
  dims: Record<string, number>;
  campaignId: string | null;
  status?: "COMPLETED" | "PENDING";
}) {
  const { subjectId, count, dims, campaignId, status = "COMPLETED" } = params;
  for (let i = 0; i < count; i += 1) {
    const invitation = await prisma.observerInvitation.create({
      data: {
        inviterId: subjectId,
        observerName: `Rater ${i}`,
        testType: "TRITAN",
        status,
        observerType: "TEAM",
        expiresAt: FUTURE,
        completedAt: status === "COMPLETED" ? new Date() : null,
        campaignId,
      },
      select: { id: true },
    });
    await prisma.observerAssessment.create({
      data: {
        invitationId: invitation.id,
        relationshipType: "COLLEAGUE",
        knownDuration: "1_3",
        confidence: 4,
        scores: scoresJson(dims) as object,
      },
    });
  }
}

/** Csapat felépítése: n tag, mindegyik self=50, és a megadott observer-kép. */
async function buildTeam(specs: Array<{
  observerValue: number | null;
  raters?: number;
  campaignScoped?: boolean;
  legacy?: boolean;
}>) {
  const { orgId, teamId, campaignId } = await createOrgWithTeam();
  const members: Array<{ userId: string; scores: Record<string, number> | null }> = [];

  for (const spec of specs) {
    const profile = await createProfile();
    await prisma.teamMember.create({
      data: { teamId, userId: profile.id, role: "member" },
    });
    if (spec.observerValue !== null) {
      await addObservers({
        subjectId: profile.id,
        count: spec.raters ?? DOSSIER_OBSERVER_MIN,
        dims: spec.legacy ? legacyDims(spec.observerValue) : flatDims(spec.observerValue),
        campaignId: spec.campaignScoped === false ? null : campaignId,
      });
    }
    members.push({ userId: profile.id, scores: flatDims(50) });
  }
  return { orgId, teamId, members };
}

const alignedSpec = { observerValue: 50 };
const gapSpec = { observerValue: 50 + DOSSIER_GAP_MIN_DELTA + 5 };

test("kampány-hatókörű körökből valódi képet ad", async () => {
  const { orgId, members } = await buildTeam([
    alignedSpec,
    alignedSpec,
    alignedSpec,
    gapSpec,
  ]);
  const result = await loadTeamFeedbackCulture({ orgId, members });
  assert.ok(result, "a kampány-hatókörű adat nem jutott át a betöltőn");
  assert.equal(result.coveredCount, 4);
  assert.equal(result.alignedCount, 3);
  assert.equal(result.gapCount, 1);
});

test("PRIVÁT (kampányhoz nem kötött) visszajelzés NEM szivárog be", async () => {
  // Ugyanaz a négy tag, de minden köre privát → nincs mit mutatni.
  const { orgId, members } = await buildTeam([
    { ...alignedSpec, campaignScoped: false },
    { ...alignedSpec, campaignScoped: false },
    { ...alignedSpec, campaignScoped: false },
    { ...gapSpec, campaignScoped: false },
  ]);
  const result = await loadTeamFeedbackCulture({ orgId, members });
  assert.equal(result, null, "privát observer-adat bekerült a csapatnézetbe");
});

test("MÁS szervezet kampányának adata nem számít bele", async () => {
  const { members } = await buildTeam([alignedSpec, alignedSpec, alignedSpec, gapSpec]);
  // A tagok adata a SAJÁT orgjukban él; egy idegen org azonosítójával nézve
  // a hatókör-szűrő nem találhat semmit.
  const other = await createOrgWithTeam();
  const result = await loadTeamFeedbackCulture({ orgId: other.orgId, members });
  assert.equal(result, null, "idegen szervezet kampány-adata átszivárgott");
});

test("PENDING meghívó nem számít lefedettségnek", async () => {
  const { orgId, teamId } = await createOrgWithTeam();
  const members: Array<{ userId: string; scores: Record<string, number> | null }> = [];
  const campaign = await prisma.campaign.findFirst({
    where: { teamId }, select: { id: true },
  });
  for (let i = 0; i < TEAM_OBSERVER_MIN_COVERED; i += 1) {
    const profile = await createProfile();
    await prisma.teamMember.create({ data: { teamId, userId: profile.id, role: "member" } });
    await addObservers({
      subjectId: profile.id,
      count: DOSSIER_OBSERVER_MIN,
      dims: flatDims(50),
      campaignId: campaign!.id,
      status: "PENDING",
    });
    members.push({ userId: profile.id, scores: flatDims(50) });
  }
  const result = await loadTeamFeedbackCulture({ orgId, members });
  assert.equal(result, null, "befejezetlen kör lefedettségnek számított");
});

test("örökség-kulcsos tárolt értékelés is beszámít", async () => {
  const { orgId, members } = await buildTeam([
    { observerValue: 50, legacy: true },
    { observerValue: 50, legacy: true },
    { observerValue: 50, legacy: true },
    { observerValue: 50, legacy: true },
  ]);
  const result = await loadTeamFeedbackCulture({ orgId, members });
  assert.ok(result, "az örökség-kulcsos értékelések némán kimaradtak");
  assert.equal(result.coveredCount, TEAM_OBSERVER_MIN_COVERED);
  assert.equal(result.alignedCount, TEAM_OBSERVER_MIN_COVERED);
});

test("a per-fős rater-padló a valódi lekérdezésen is áll", async () => {
  const { orgId, members } = await buildTeam([
    alignedSpec,
    alignedSpec,
    alignedSpec,
    // Eggyel kevesebb értékelő, mint az anonimitás-padló → nem lefedett,
    // így a csapat a TEAM_OBSERVER_MIN_COVERED padló alá esik.
    { observerValue: 50, raters: DOSSIER_OBSERVER_MIN - 1 },
  ]);
  const result = await loadTeamFeedbackCulture({ orgId, members });
  assert.equal(result, null, "küszöb alatti értékelői kör lefedettségnek számított");
});

test("org nélküli csapatra nincs kimenet", async () => {
  const { members } = await buildTeam([alignedSpec, alignedSpec, alignedSpec, alignedSpec]);
  const result = await loadTeamFeedbackCulture({ orgId: null, members });
  assert.equal(result, null);
});
