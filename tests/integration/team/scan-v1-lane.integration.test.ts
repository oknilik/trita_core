/**
 * Scan v1 mérési lánc — a PILOT-KRITIKUS útvonal integrációs fedése.
 *
 * MIÉRT EZ A FÁJL: a 2026-08-23-i teljes audit leletje az volt, hogy a
 * playbook három rétegének (self → bizalmi háló → pulse) és a rá épülő
 * riport-lépéseknek a TISZTA logikája jól fedett unit-szinten, de sem
 * integrációs, sem e2e teszt nem érintette a valós adatbázis-műveleteket.
 * Az üzleti értéket adó lánc tehát a perzisztencia szintjén teszteletlen volt.
 *
 * Amit ITT dől el (és unit-szinten NEM ellenőrizhető):
 *   · a pulse-válasz VALÓBAN user-referencia nélkül és nap pontosságúra
 *     csonkolt dátummal kerül a táblába (az anonimitás ígérete),
 *   · az anonimitás-padló a valódi lekérdezésen keresztül is áll,
 *   · a trust-kör (kampány, értékelt, értékelő) egyediségi kulcsa
 *     felülírásként viselkedik, nem duplázásként,
 *   · a lépés-léptetés a valódi résztvevő-rekordon halad SELF → TRUST → PULSE,
 *   · a riport-aggregátum publikáláskor BEFAGY (az utólagos adatváltozás nem
 *     csúsztathatja el a validált képet),
 *   · a kampány-hatókör vörösvonala: másik kör adata nem szivárog be.
 *
 * AMI NEM ITT VAN: a route-ok Clerk-alapú authorizációja. Az integrációs
 * réteg ma csak publikus/tokenes route-handlereket hív közvetlenül; a
 * belépéshez kötött route-okhoz külön harness-döntés kell (Clerk-mock vagy
 * `getServerAuth` seam), és a CI Node 20-on fut, ahol a `mock.module` még
 * nem elérhető. Ld. docs/audits/teljes-audit-2026-08-23.md, P1-11.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import {
  PSYCH_SAFETY_ITEMS,
  PSYCH_SAFETY_MIN_RESPONSES,
  aggregatePsychSafety,
  type PsychSafetyAnswers,
} from "@/lib/psych-safety";
import { buildTeamTrustNetwork, hasRaterCoveredTeamTrust } from "@/lib/trust-network.server";
import { hasRaterCoveredTeam } from "@/lib/team-role-peer.server";
import { TRUST_MIN_RATERS, type TrustAnswerSet } from "@/lib/trust-network";
import {
  advanceCampaignStepForUser,
  getStepPartialProgress,
} from "@/lib/campaign-steps";
import { CAMPAIGN_PRESETS } from "@/lib/campaign-steps-core";
import { recordAnonymousPsychSafetyResponse } from "@/lib/psych-safety-submit.server";

function makeId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

/** Teljes, érvényes pulse-válaszkészlet — minden itemre ugyanaz az érték. */
function pulseAnswers(value: number): PsychSafetyAnswers {
  return Object.fromEntries(PSYCH_SAFETY_ITEMS.map((item) => [item.id, value]));
}

/**
 * Nap pontosságúra csonkolt beküldési dátum — a route is így ír.
 * Ez az anonimitás második rétege: pontos időbélyeggel a pulse-válasz
 * párosítható volna a `CampaignParticipant.completedAt` értékkel.
 */
function dayTruncated(): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

/** Teljes trust-válasz. A skálák maximuma kérdésenként eltér (3 vagy 5). */
const TRUST_ANSWERS: TrustAnswerSet = {
  trust: 5,
  help: 3,
  openness: 5,
  inclusion: 3,
  collaboration: 3,
};

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

/**
 * Egy szervezet + csapat + AKTÍV Scan v1 kampány, `memberCount` taggal.
 * A lépéssor SZÁNDÉKOSAN a presetből jön, nem kézzel írva: ha a preset
 * változik, ez a teszt is azt a láncot méri, amit a termék futtat.
 */
async function createScanV1Fixture(memberCount: number) {
  const owner = await createProfile();
  const org = await prisma.organization.create({
    data: { name: `Org ${makeId("o")}`, ownerId: owner.id },
    select: { id: true },
  });
  const team = await prisma.team.create({
    data: { name: `Team ${makeId("t")}`, orgId: org.id, ownerId: owner.id },
    select: { id: true },
  });

  const members = [];
  for (let index = 0; index < memberCount; index += 1) {
    const profile = await createProfile();
    await prisma.teamMember.create({ data: { teamId: team.id, userId: profile.id } });
    members.push(profile);
  }

  const campaign = await prisma.campaign.create({
    data: {
      orgId: org.id,
      name: `Scan ${makeId("c")}`,
      presetId: "SCAN_V1",
      type: CAMPAIGN_PRESETS.SCAN_V1.steps[0],
      steps: [...CAMPAIGN_PRESETS.SCAN_V1.steps],
      teamId: team.id,
      teamIds: [team.id],
      status: "ACTIVE",
      activatedAt: new Date(),
      stepIntervalHours: 0,
      requireFreshResults: CAMPAIGN_PRESETS.SCAN_V1.requireFreshResults,
      createdBy: owner.id,
    },
    select: { id: true, steps: true, teamId: true },
  });

  for (const member of members) {
    await prisma.campaignParticipant.create({
      data: { campaignId: campaign.id, userId: member.id },
    });
  }

  return { orgId: org.id, teamId: team.id, campaign, members, ownerId: owner.id };
}

// ─────────────────────────────────────────────────────────────────────
// 1. Pulse — anonimitás a perzisztencia szintjén
// ─────────────────────────────────────────────────────────────────────

test("a pulse-válasz user-referencia NÉLKÜL kerül a táblába", async () => {
  const { campaign, teamId, members } = await createScanV1Fixture(3);

  await prisma.psychSafetyResponse.create({
    data: { campaignId: campaign.id, teamId, submittedOn: dayTruncated(), answers: pulseAnswers(4) },
  });

  const stored = await prisma.psychSafetyResponse.findFirst({
    where: { campaignId: campaign.id },
  });
  assert.ok(stored, "a pulse-válasz nem jött létre");

  // A kitöltő azonosítója SEMMILYEN néven nem szerepelhet a rekordon: ez a
  // névtelenség egyetlen strukturális garanciája. A séma ma a `teamId`-t sem
  // tartalmazza. A teamId az aggregációs határ, nem személyazonosító adat.
  const serialized = JSON.stringify(stored);
  for (const member of members) {
    assert.ok(
      !serialized.includes(member.id),
      "a pulse-rekord tartalmazza a kitöltő azonosítóját",
    );
  }
  assert.deepEqual(
    Object.keys(stored).sort(),
    ["answers", "campaignId", "id", "submittedOn", "teamId"],
    "a pulse-rekord mezőkészlete bővült — minden új mező azonosíthatóságot vihet be",
  );
  assert.equal(stored.teamId, teamId, "a pulse-rekord csapat-határa hiányzik");

  // Az anonimitás MÁSODIK rétege: nap pontosságúra csonkolt dátum. Pontos
  // időbélyeggel a válasz párosítható volna a résztvevő `completedAt`
  // értékével, és a névtelenség gyakorlatilag megszűnne.
  assert.equal(stored.submittedOn.getUTCHours(), 0);
  assert.equal(stored.submittedOn.getUTCMinutes(), 0);
  assert.equal(stored.submittedOn.getUTCSeconds(), 0);
  assert.equal(stored.submittedOn.getUTCMilliseconds(), 0);
});

test("a kitöltöttség a résztvevő-rekordon jelenik meg, ÉRTÉK nélkül", async () => {
  const { campaign, members } = await createScanV1Fixture(3);
  const filler = members[0];

  await prisma.psychSafetyResponse.create({
    data: { campaignId: campaign.id, submittedOn: dayTruncated(), answers: pulseAnswers(5) },
  });
  await prisma.campaignParticipant.update({
    where: { campaignId_userId: { campaignId: campaign.id, userId: filler.id } },
    data: { completedAt: new Date() },
  });

  const participant = await prisma.campaignParticipant.findUnique({
    where: { campaignId_userId: { campaignId: campaign.id, userId: filler.id } },
    select: { completedAt: true },
  });

  // A tény igen, a válasz nem: a két adat együtt visszafejthetővé tenné a
  // kitöltőt, ezért a résztvevő-rekord CSAK a tényt hordozza.
  assert.ok(participant?.completedAt, "a kitöltöttség ténye nem került rá a résztvevőre");
  const participantColumns = await prisma.campaignParticipant.findFirst({
    where: { campaignId: campaign.id },
  });
  assert.ok(!JSON.stringify(participantColumns).includes("PS1"), "válaszérték szivárgott a résztvevőre");
});

test("két párhuzamos pulse-beküldésből pontosan egy anonim válasz jön létre", async () => {
  const { campaign, members } = await createScanV1Fixture(3);
  const participant = await prisma.campaignParticipant.update({
    where: { campaignId_userId: { campaignId: campaign.id, userId: members[0].id } },
    data: { currentStep: 2 },
    select: { id: true, userId: true },
  });

  const submit = () =>
    recordAnonymousPsychSafetyResponse({
      participantId: participant.id,
      profileId: participant.userId,
      campaignId: campaign.id,
      teamId: campaign.teamId!,
      answers: pulseAnswers(4),
      submittedOn: dayTruncated(),
    });
  const outcomes = await Promise.all([submit(), submit()]);

  assert.deepEqual(outcomes.map((outcome) => outcome.created).sort(), [false, true]);
  assert.equal(
    await prisma.psychSafetyResponse.count({ where: { campaignId: campaign.id } }),
    1,
  );
});

test("az anonimitás-padló a valódi adatbázis-adatból is áll", async () => {
  const { campaign } = await createScanV1Fixture(5);

  // Padló ALATT: PSYCH_SAFETY_MIN_RESPONSES − 1 válasz.
  for (let index = 0; index < PSYCH_SAFETY_MIN_RESPONSES - 1; index += 1) {
    await prisma.psychSafetyResponse.create({
      data: { campaignId: campaign.id, submittedOn: dayTruncated(), answers: pulseAnswers(4) },
    });
  }

  const below = await prisma.psychSafetyResponse.findMany({
    where: { campaignId: campaign.id },
    select: { answers: true },
  });
  assert.equal(
    aggregatePsychSafety(below.map((r) => r.answers as PsychSafetyAnswers)),
    null,
    "a küszöb alatt is keletkezett aggregátum",
  );

  // A padlót elérve MEGJELENIK az aggregátum.
  await prisma.psychSafetyResponse.create({
    data: { campaignId: campaign.id, submittedOn: dayTruncated(), answers: pulseAnswers(4) },
  });
  const atFloor = await prisma.psychSafetyResponse.findMany({
    where: { campaignId: campaign.id },
    select: { answers: true },
  });
  const aggregate = aggregatePsychSafety(atFloor.map((r) => r.answers as PsychSafetyAnswers));
  assert.ok(aggregate, "a padló elérésekor sem lett aggregátum");
  assert.equal(aggregate.count, PSYCH_SAFETY_MIN_RESPONSES);
});

test("a pulse-aggregátum kampányonként külön áll — másik kör adata nem szivárog be", async () => {
  const first = await createScanV1Fixture(4);

  const second = await prisma.campaign.create({
    data: {
      orgId: first.orgId,
      name: `Scan2 ${makeId("c")}`,
      presetId: "SCAN_V1",
      type: "SELF_ASSESSMENT",
      steps: [...CAMPAIGN_PRESETS.SCAN_V1.steps],
      teamId: first.teamId,
      teamIds: [first.teamId],
      status: "ACTIVE",
      activatedAt: new Date(),
      createdBy: first.ownerId,
    },
    select: { id: true },
  });

  // Az első körben 3 válasz (padló elérve), a másodikban 1.
  for (let index = 0; index < 3; index += 1) {
    await prisma.psychSafetyResponse.create({
      data: { campaignId: first.campaign.id, submittedOn: dayTruncated(), answers: pulseAnswers(5) },
    });
  }
  await prisma.psychSafetyResponse.create({
    data: { campaignId: second.id, submittedOn: dayTruncated(), answers: pulseAnswers(2) },
  });

  const secondRound = await prisma.psychSafetyResponse.findMany({
    where: { campaignId: second.id },
    select: { answers: true },
  });

  // Ha a hatókör szivárogna, a második kör 4 válasszal aggregátumot adna —
  // és a visszamérés „előtte–utána" állítása hamis alapra épülne.
  assert.equal(secondRound.length, 1);
  assert.equal(
    aggregatePsychSafety(secondRound.map((r) => r.answers as PsychSafetyAnswers)),
    null,
  );
});

// ─────────────────────────────────────────────────────────────────────
// 2. Bizalmi háló — egyediség, padló, lefedettség
// ─────────────────────────────────────────────────────────────────────

test("ugyanaz az értékelő ugyanarról a tagról FELÜLÍR, nem duplázik", async () => {
  const { campaign, teamId, members } = await createScanV1Fixture(3);
  const [rater, about] = members;

  const key = { campaignId: campaign.id, aboutUserId: about.id, raterUserId: rater.id };

  await prisma.trustObservation.create({
    data: { ...key, teamId, answers: { ...TRUST_ANSWERS, trust: 2 } },
  });
  await prisma.trustObservation.upsert({
    where: { campaignId_aboutUserId_raterUserId: key },
    create: { ...key, teamId, answers: TRUST_ANSWERS },
    update: { answers: TRUST_ANSWERS },
  });

  const rows = await prisma.trustObservation.findMany({ where: { campaignId: campaign.id } });
  assert.equal(rows.length, 1, "a második beküldés új sort hozott létre");
  assert.equal((rows[0].answers as TrustAnswerSet).trust, 5, "a felülírás nem érvényesült");
});

test("a csomópont-szintű bizalmi érték a rater-padló alatt nem jelenik meg", async () => {
  // 5 tag: egy célszemély + négy lehetséges értékelő.
  const { campaign, teamId, members } = await createScanV1Fixture(5);
  const [about, ...raters] = members;

  // A padló ALATT: TRUST_MIN_RATERS − 1 értékelő.
  for (let index = 0; index < TRUST_MIN_RATERS - 1; index += 1) {
    await prisma.trustObservation.create({
      data: {
        campaignId: campaign.id,
        teamId,
        aboutUserId: about.id,
        raterUserId: raters[index].id,
        answers: TRUST_ANSWERS,
      },
    });
  }

  const below = await buildTeamTrustNetwork(teamId, { campaignId: campaign.id });
  const nodeBelow = below.nodes.find((node) => node.userId === about.id);
  assert.ok(nodeBelow, "a célszemély csomópontja hiányzik a hálóból");
  assert.equal(
    nodeBelow.inboundMean,
    null,
    "a padló alatt is keletkezett csomópont-szintű bizalmi átlag",
  );

  // A padlót elérve MEGJELENIK.
  await prisma.trustObservation.create({
    data: {
      campaignId: campaign.id,
      teamId,
      aboutUserId: about.id,
      raterUserId: raters[TRUST_MIN_RATERS - 1].id,
      answers: TRUST_ANSWERS,
    },
  });

  const atFloor = await buildTeamTrustNetwork(teamId, { campaignId: campaign.id });
  const nodeAtFloor = atFloor.nodes.find((node) => node.userId === about.id);
  assert.ok(
    nodeAtFloor?.inboundMean !== null && nodeAtFloor?.inboundMean !== undefined,
    "a padló elérésekor sem lett csomópont-érték",
  );
});

test("a TRUST_360 lépés csak a TELJES csapat-lefedettségtől számít teljesítettnek", async () => {
  const { campaign, teamId, members } = await createScanV1Fixture(4);
  const [rater, ...others] = members;

  // Egy hiányzó társ — a lépés még nem teljesült.
  for (const other of others.slice(0, others.length - 1)) {
    await prisma.trustObservation.create({
      data: {
        campaignId: campaign.id,
        teamId,
        aboutUserId: other.id,
        raterUserId: rater.id,
        answers: TRUST_ANSWERS,
      },
    });
  }
  assert.equal(
    await hasRaterCoveredTeamTrust(campaign.id, teamId, rater.id),
    false,
    "hiányos lefedettség mellett is teljesítettnek számított a lépés",
  );

  // Az utolsó társ is megvan.
  await prisma.trustObservation.create({
    data: {
      campaignId: campaign.id,
      teamId,
      aboutUserId: others[others.length - 1].id,
      raterUserId: rater.id,
      answers: TRUST_ANSWERS,
    },
  });
  assert.equal(await hasRaterCoveredTeamTrust(campaign.id, teamId, rater.id), true);
});

test("kilépett tag stale sora nem pótolhat hiányzó aktuális célt egyik peer körben sem", async () => {
  const { campaign, teamId, members } = await createScanV1Fixture(4);
  const [rater, currentA, currentB, missingCurrent] = members;
  const formerMember = await createProfile();

  // A sorok létrejöttekor még valódi csapattag volt, majd kilépett. A három
  // observation darabszáma így eléri az aktuális három cél számát, de az
  // egyik célpont stale, a valódi aktuális tag pedig hiányzik.
  const formerMembership = await prisma.teamMember.create({
    data: { teamId, userId: formerMember.id },
    select: { id: true },
  });
  for (const about of [currentA, currentB, formerMember]) {
    await prisma.trustObservation.create({
      data: {
        campaignId: campaign.id,
        teamId,
        aboutUserId: about.id,
        raterUserId: rater.id,
        answers: TRUST_ANSWERS,
      },
    });
    await prisma.teamRoleObservation.create({
      data: {
        campaignId: campaign.id,
        teamId,
        aboutUserId: about.id,
        raterUserId: rater.id,
        selections: { OG1: 2 },
      },
    });
  }
  await prisma.teamMember.delete({ where: { id: formerMembership.id } });

  assert.equal(await hasRaterCoveredTeamTrust(campaign.id, teamId, rater.id), false);
  assert.equal(await hasRaterCoveredTeam(campaign.id, teamId, rater.id), false);
  assert.deepEqual(
    await getStepPartialProgress(campaign, "TRUST_360", rater.id),
    { done: 2, total: 3 },
  );
  assert.deepEqual(
    await getStepPartialProgress(campaign, "TEAM_ROLE_360", rater.id),
    { done: 2, total: 3 },
  );

  await prisma.trustObservation.create({
    data: {
      campaignId: campaign.id,
      teamId,
      aboutUserId: missingCurrent.id,
      raterUserId: rater.id,
      answers: TRUST_ANSWERS,
    },
  });
  await prisma.teamRoleObservation.create({
    data: {
      campaignId: campaign.id,
      teamId,
      aboutUserId: missingCurrent.id,
      raterUserId: rater.id,
      selections: { OG1: 2 },
    },
  });

  assert.equal(await hasRaterCoveredTeamTrust(campaign.id, teamId, rater.id), true);
  assert.equal(await hasRaterCoveredTeam(campaign.id, teamId, rater.id), true);
  assert.deepEqual(
    await getStepPartialProgress(campaign, "TRUST_360", rater.id),
    { done: 3, total: 3 },
  );
  assert.deepEqual(
    await getStepPartialProgress(campaign, "TEAM_ROLE_360", rater.id),
    { done: 3, total: 3 },
  );
});

// ─────────────────────────────────────────────────────────────────────
// 3. Lépés-léptetés — a playbook sorrendje a valós rekordon
// ─────────────────────────────────────────────────────────────────────

test("a résztvevő SELF → TRUST → PULSE sorrendben halad a Scan v1-en", async () => {
  const { campaign, members } = await createScanV1Fixture(3);
  const participant = members[0];

  const stepAt = async () =>
    (
      await prisma.campaignParticipant.findUniqueOrThrow({
        where: { campaignId_userId: { campaignId: campaign.id, userId: participant.id } },
        select: { currentStep: true },
      })
    ).currentStep;

  assert.equal(await stepAt(), 0, "nem a self lépésen indul");
  assert.equal(campaign.steps[0], "SELF_ASSESSMENT");

  await advanceCampaignStepForUser(participant.id, "SELF_ASSESSMENT", {
    campaignId: campaign.id,
  });
  assert.equal(await stepAt(), 1);
  assert.equal(campaign.steps[1], "TRUST_360");

  await advanceCampaignStepForUser(participant.id, "TRUST_360", { campaignId: campaign.id });
  assert.equal(await stepAt(), 2);
  assert.equal(campaign.steps[2], "PSYCH_SAFETY");
});

test("egy nem soron lévő lépés teljesítése nem lépteti előre a résztvevőt", async () => {
  const { campaign, members } = await createScanV1Fixture(3);
  const participant = members[0];

  // A pulse a HARMADIK lépés; a résztvevő még a selfen áll.
  await advanceCampaignStepForUser(participant.id, "PSYCH_SAFETY", {
    campaignId: campaign.id,
  });

  const { currentStep } = await prisma.campaignParticipant.findUniqueOrThrow({
    where: { campaignId_userId: { campaignId: campaign.id, userId: participant.id } },
    select: { currentStep: true },
  });
  assert.equal(currentStep, 0, "sorrenden kívüli teljesítés léptette a résztvevőt");
});

test("egy lépésteljesítés nem léptet másik aktív kampányt", async () => {
  const { orgId, teamId, campaign, members, ownerId } = await createScanV1Fixture(3);
  const participant = members[0];
  await prisma.campaignParticipant.update({
    where: { campaignId_userId: { campaignId: campaign.id, userId: participant.id } },
    data: { currentStep: 1 },
  });
  const other = await prisma.campaign.create({
    data: {
      orgId,
      name: `Parallel ${makeId("c")}`,
      presetId: "SCAN_V1",
      type: CAMPAIGN_PRESETS.SCAN_V1.steps[0],
      steps: [...CAMPAIGN_PRESETS.SCAN_V1.steps],
      teamId,
      teamIds: [teamId],
      status: "ACTIVE",
      activatedAt: new Date(),
      stepIntervalHours: 0,
      createdBy: ownerId,
      participants: { create: { userId: participant.id, currentStep: 1 } },
    },
    select: { id: true },
  });

  await advanceCampaignStepForUser(participant.id, "TRUST_360", {
    campaignId: campaign.id,
  });

  const states = await prisma.campaignParticipant.findMany({
    where: { userId: participant.id, campaignId: { in: [campaign.id, other.id] } },
    select: { campaignId: true, currentStep: true },
  });
  assert.equal(states.find((row) => row.campaignId === campaign.id)?.currentStep, 2);
  assert.equal(states.find((row) => row.campaignId === other.id)?.currentStep, 1);
});

// ─────────────────────────────────────────────────────────────────────
// 4. Riport — a publikált pillanatkép befagy
// ─────────────────────────────────────────────────────────────────────

test("a publikált riport aggregátuma nem mozdul az utólagos adatváltozástól", async () => {
  const { campaign, teamId, ownerId } = await createScanV1Fixture(4);
  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { status: "CLOSED", closedAt: new Date() },
  });

  for (let index = 0; index < 3; index += 1) {
    await prisma.psychSafetyResponse.create({
      data: { campaignId: campaign.id, submittedOn: dayTruncated(), answers: pulseAnswers(5) },
    });
  }

  const responses = await prisma.psychSafetyResponse.findMany({
    where: { campaignId: campaign.id },
    select: { answers: true },
  });
  const snapshot = aggregatePsychSafety(responses.map((r) => r.answers as PsychSafetyAnswers));
  assert.ok(snapshot);

  const report = await prisma.teamReport.create({
    data: {
      teamId,
      campaignId: campaign.id,
      status: "PUBLISHED",
      title: "Baseline",
      aggregates: { psychSafety: { index: snapshot.index, count: snapshot.count } },
      createdById: ownerId,
      publishedAt: new Date(),
      publishedById: ownerId,
    },
    select: { id: true, aggregates: true },
  });

  // A publikálás UTÁN érkező (rosszabb) válaszok nem írhatják át a validált
  // képet — a debrief és a visszamérés erre a pillanatképre hivatkozik.
  for (let index = 0; index < 3; index += 1) {
    await prisma.psychSafetyResponse.create({
      data: { campaignId: campaign.id, submittedOn: dayTruncated(), answers: pulseAnswers(1) },
    });
  }

  const stored = await prisma.teamReport.findUniqueOrThrow({
    where: { id: report.id },
    select: { aggregates: true },
  });
  assert.deepEqual(
    stored.aggregates,
    report.aggregates,
    "a publikált aggregátum elmozdult az utólagos adatváltozástól",
  );

  const live = await prisma.psychSafetyResponse.findMany({
    where: { campaignId: campaign.id },
    select: { answers: true },
  });
  const liveAggregate = aggregatePsychSafety(live.map((r) => r.answers as PsychSafetyAnswers));
  assert.ok(liveAggregate);
  assert.notEqual(
    liveAggregate.index,
    snapshot.index,
    "a fixture nem is változtatta meg az élő képet — a teszt nem bizonyít semmit",
  );
});

test("a Scan v1 riport-lánc: DRAFT → PUBLISHED, akcióelem célmutatóval", async () => {
  const { campaign, teamId, ownerId } = await createScanV1Fixture(3);
  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { status: "CLOSED", closedAt: new Date() },
  });

  const draft = await prisma.teamReport.create({
    data: {
      teamId,
      campaignId: campaign.id,
      status: "DRAFT",
      title: "Vázlat",
      createdById: ownerId,
    },
    select: { id: true, status: true, publishedAt: true },
  });
  assert.equal(draft.status, "DRAFT");
  assert.equal(draft.publishedAt, null);

  // A playbook S5 kritériuma: legalább egy akció STRUKTURÁLT célmutatóval.
  const published = await prisma.teamReport.update({
    where: { id: draft.id },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
      publishedById: ownerId,
      actionItems: [
        {
          title: "Heti retró bevezetése",
          description: "Minden pénteken 30 perc.",
          timeframe: "30",
          targetMetric: { kind: "psych_safety_index" },
        },
      ],
    },
    select: { status: true, publishedAt: true, actionItems: true },
  });

  assert.equal(published.status, "PUBLISHED");
  assert.ok(published.publishedAt, "publikáláskor nem került rá időbélyeg");

  const actions = published.actionItems as Array<{ targetMetric?: { kind?: string } }>;
  assert.equal(actions.length, 1);
  assert.equal(actions[0].targetMetric?.kind, "psych_safety_index");
});
