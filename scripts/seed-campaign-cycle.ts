/**
 * seed-campaign-cycle.ts — teljes, lezárt mérési ciklus a bemutató-szervezet
 * mindhárom csapatára, publikált csapat-riporttal.
 *
 * Előfeltétel: a `seed-showcase-org.ts` már lefutott (org, csapatok, tagok,
 * self-kitöltések és observer-válaszok megvannak).
 *
 * Mit hoz létre csapatonként (idempotens):
 *   · Campaign a hat kanonikus lépéssel (CAMPAIGN_STEP_ORDER), lezárva
 *   · CampaignParticipant minden tagnak, MINDEN lépés teljesítve
 *   · OBSERVER_360   — a meglévő observer-meghívók kampányhoz kötése
 *   · TEAM_ROLE      — TeamRoleScore (source: "questionnaire") tagonként
 *   · TEAM_ROLE_360  — TeamRoleObservation minden csapattárstól (4 értékelő)
 *   · TRUST_360      — TrustObservation minden csapattárstól (4 értékelő)
 *   · PSYCH_SAFETY   — anonim PsychSafetyResponse tagonként (5 > n>=3)
 *   · PEER_FEEDBACK  — feedforward + elismerés minden tagtól egy csapattársnak
 *   · TeamReport PUBLISHED státuszban, valódi aggregátumokkal
 *
 * A riport aggregátumait és a narratív előtöltést az APP saját függvényei
 * adják (buildTeamReportAggregates / buildDraftNarrativePrefill), nem kézzel
 * gyártott JSON — így a seedelt riport pontosan olyan, mintha a tanácsadó
 * generálta volna a felületen.
 *
 * Futtatás:
 *   npx vercel env pull .env.preview --environment=preview --yes
 *   npx tsx scripts/seed-campaign-cycle.ts --env-file .env.preview
 *   npx tsx scripts/seed-campaign-cycle.ts --env-file .env.preview --keep-active
 *   npx tsx scripts/seed-campaign-cycle.ts --env-file .env.preview --teardown
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";
import { CAMPAIGN_STEP_ORDER } from "../src/lib/campaign-steps-core";
import { TEAM_ROLE_ITEMS } from "../src/lib/team-role-questions";
import { calculateTeamRoleScores } from "../src/lib/team-role-scoring";
import { TRUST_QUESTIONS } from "../src/lib/trust-network";
import { PSYCH_SAFETY_ITEMS } from "../src/lib/psych-safety";
import type { TeamRoleSelections } from "../src/lib/team-role-questions";

// ─── Env / argumentumok ───────────────────────────────────────────────────────

function argValue(flag: string): string | null {
  const i = process.argv.indexOf(flag);
  return i === -1 ? null : (process.argv[i + 1] ?? null);
}

function loadEnvFile(path: string): void {
  const content = readFileSync(resolve(process.cwd(), path), "utf-8");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).replace(/^export\s+/, "").trim();
    process.env[key] = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
  }
  console.log(`📄 Env: ${path}`);
}

loadEnvFile(argValue("--env-file") ?? ".env");

const ORG_NAME = "Aurora Dinamika Kft.";
const CAMPAIGN_NAME = "2026 nyári mérési ciklus";

// ─── Determinisztikus véletlen ────────────────────────────────────────────────

/** FNV-1a hash → stabil 32 bites szám. Ugyanaz a kulcs mindig ugyanazt adja. */
function hash(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 0..1 közötti stabil érték. */
const rand = (key: string): number => hash(key) / 0xffffffff;

/** Stabil egész a [min, max] zárt intervallumból. */
const randInt = (key: string, min: number, max: number): number =>
  min + Math.floor(rand(key) * (max - min + 1));

/** Lista stabil sorrendbe keverése a kulcs alapján. */
function shuffle<T>(items: readonly T[], key: string): T[] {
  return items
    .map((item, i) => ({ item, sort: rand(`${key}:${i}`) }))
    .sort((a, b) => a.sort - b.sort)
    .map((entry) => entry.item);
}

/**
 * Érvényes csapatszerep-kiválasztás: 10 megjelölt item, ebből pontosan 3
 * kiemelt (súly 2) — az `isValidTeamRoleSelectionSet` szabályai szerint
 * (8–12 item, pontosan 3 kiemelt).
 */
function buildSelections(seed: string): TeamRoleSelections {
  const picked = shuffle(TEAM_ROLE_ITEMS, seed).slice(0, 10);
  const selections: TeamRoleSelections = {};
  picked.forEach((item, i) => {
    selections[item.id] = i < 3 ? 2 : 1;
  });
  return selections;
}

/** Bizalmi válaszkészlet: minden kérdésre 1..max, a felső sávba húzva. */
function buildTrustAnswers(seed: string): Record<string, number> {
  const answers: Record<string, number> = {};
  for (const q of TRUST_QUESTIONS) {
    const low = q.max === 5 ? 3 : 2; // többségében pozitív, de nem egyhangú
    answers[q.id] = randInt(`${seed}:${q.id}`, low, q.max);
  }
  return answers;
}

/** Pszichológiai biztonság: minden itemre 1..5. */
function buildPsychAnswers(seed: string): Record<string, number> {
  const answers: Record<string, number> = {};
  for (const item of PSYCH_SAFETY_ITEMS) {
    answers[item.id] = randInt(`${seed}:${item.id}`, 3, 5);
  }
  return answers;
}

const APPRECIATIONS = [
  "Köszönöm, hogy a legutóbbi határidős körben átvetted a koordinációt — nélküled csúsztunk volna.",
  "Sokat segít, hogy mindig végigkérdezed a részleteket, mielőtt belevágunk.",
  "Értékelem, hogy nyíltan jelezted a kockázatot, akkor is, amikor kényelmetlen volt.",
  "Nagyon jó volt együtt dolgozni veled az ügyfél-workshopon, sokat tanultam belőle.",
  "Hálás vagyok, hogy beugrottál, amikor beteg voltam — zökkenőmentes volt az átadás.",
];
const CONTINUES = [
  "Tartsd meg, hogy korán megosztod a félkész gondolatokat is — ettől gyorsabban haladunk.",
  "Folytasd a heti státusz-összefoglalókat, sokat segítenek a tervezésben.",
  "Maradjon meg, ahogy a nehéz beszélgetéseket is felvállalod.",
  "Csináld továbbra is, hogy becsatornázod az ügyfél-visszajelzéseket.",
  "Tartsd meg a részletes jegyzeteidet a megbeszélésekről.",
];
const TRIES = [
  "Próbáld meg korábban bevonni a többieket a döntés-előkészítésbe.",
  "Kísérletezz azzal, hogy néha átadod a bemutatót másnak is.",
  "Érdemes lenne kevesebb párhuzamos szálat vinni egyszerre.",
  "Próbálj több időt hagyni a visszakérdezésekre a megbeszélések végén.",
  "Jó lenne, ha a döntéseidet írásban is összefoglalnád a csapatnak.",
];

const pick = <T>(list: readonly T[], seed: string): T => list[hash(seed) % list.length];

// ─── Fő folyamat ──────────────────────────────────────────────────────────────

type MemberRow = { id: string; username: string | null };

async function teardown(prisma: PrismaClient): Promise<void> {
  const org = await prisma.organization.findFirst({
    where: { name: ORG_NAME },
    select: {
      id: true,
      teams: { select: { id: true, members: { select: { userId: true } } } },
    },
  });
  if (!org) {
    console.log("ℹ️  Nincs ilyen szervezet — nincs mit törölni.");
    return;
  }
  const teamIds = org.teams.map((t) => t.id);
  const memberIds = [...new Set(org.teams.flatMap((t) => t.members.map((m) => m.userId)))];

  await prisma.teamReport.deleteMany({ where: { teamId: { in: teamIds } } });

  // A TeamRoleScore.campaign kapcsolat onDelete: SetNull — a kampány törlése
  // után már nem lenne mivel beazonosítani őket, ezért ELŐBB szedjük össze
  // az ID-ket, és SZIGORÚAN csak e szervezet tagjaira szűkítve törlünk.
  const roleScoreIds = (
    await prisma.teamRoleScore.findMany({
      where: { userProfileId: { in: memberIds }, source: "questionnaire" },
      select: { id: true },
    })
  ).map((r) => r.id);

  // A kampány törlése kaszkádolja a résztvevőket, psych-safety válaszokat,
  // szerep- és bizalmi megfigyeléseket, valamint az elismerés-köri tételeket.
  const { count } = await prisma.campaign.deleteMany({
    where: { orgId: org.id, name: CAMPAIGN_NAME },
  });
  await prisma.teamRoleScore.deleteMany({ where: { id: { in: roleScoreIds } } });
  console.log(`🗑  ${count} kampány + ${roleScoreIds.length} szerep-kitöltés + riportok törölve.`);
}

async function main(): Promise<void> {
  const prisma = new PrismaClient({ log: ["error"] });
  // A riport-építő az app prisma-singletonját használja, ami import-időben
  // olvassa a DATABASE_URL-t — ezért CSAK az env betöltése után importálható.
  const { buildTeamReportAggregates, buildDraftNarrativePrefill } = await import(
    "../src/lib/team-report"
  );

  try {
    if (process.argv.includes("--teardown")) {
      await teardown(prisma);
      return;
    }

    const org = await prisma.organization.findFirst({
      where: { name: ORG_NAME },
      select: {
        id: true,
        teams: {
          select: {
            id: true,
            name: true,
            members: { select: { user: { select: { id: true, username: true } } } },
          },
        },
        members: { where: { role: "ORG_CONSULTANT" }, select: { userId: true } },
      },
    });
    if (!org) throw new Error(`Nincs "${ORG_NAME}" szervezet — előbb futtasd a seed-showcase-org.ts-t.`);

    const consultantId = org.members[0]?.userId;
    if (!consultantId) throw new Error("Nincs ORG_CONSULTANT a szervezetben — a riportot ő adja ki.");

    const steps = [...CAMPAIGN_STEP_ORDER];
    const closed = !process.argv.includes("--keep-active");
    const startedAt = new Date();
    startedAt.setDate(startedAt.getDate() - 21);

    for (const team of org.teams) {
      const members: MemberRow[] = team.members.map((m) => m.user);
      console.log(`\n▸ ${team.name} (${members.length} tag)`);

      // 1) Kampány
      let campaign = await prisma.campaign.findFirst({
        where: { orgId: org.id, name: CAMPAIGN_NAME, teamId: team.id },
        select: { id: true },
      });
      if (!campaign) {
        campaign = await prisma.campaign.create({
          data: {
            orgId: org.id,
            name: CAMPAIGN_NAME,
            description: "Teljes mérési kör: személyiség, csapatszerepek, bizalom, biztonság, elismerés.",
            type: steps[0],
            steps,
            teamId: team.id,
            teamIds: [team.id],
            stepIntervalHours: 24,
            status: closed ? "CLOSED" : "ACTIVE",
            activatedAt: startedAt,
            closedAt: closed ? new Date() : null,
            createdBy: consultantId,
            createdAt: startedAt,
          },
          select: { id: true },
        });
      } else {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { steps, status: closed ? "CLOSED" : "ACTIVE", closedAt: closed ? new Date() : null },
        });
      }

      // 2) Résztvevők — minden lépés teljesítve
      const stepCompletions: Record<string, string> = {};
      steps.forEach((stepType, i) => {
        const at = new Date(startedAt);
        at.setDate(at.getDate() + i * 3);
        stepCompletions[stepType] = at.toISOString();
      });
      for (const m of members) {
        await prisma.campaignParticipant.upsert({
          where: { campaignId_userId: { campaignId: campaign.id, userId: m.id } },
          create: {
            campaignId: campaign.id,
            userId: m.id,
            addedAt: startedAt,
            currentStep: steps.length,
            stepCompletions,
            completedAt: new Date(),
            nextStepOpensAt: null,
          },
          update: {
            currentStep: steps.length,
            stepCompletions,
            completedAt: new Date(),
            nextStepOpensAt: null,
          },
        });
      }

      // 3) OBSERVER_360 — meglévő meghívók kampányhoz kötése
      const memberIds = members.map((m) => m.id);
      const tagged = await prisma.observerInvitation.updateMany({
        where: { inviterId: { in: memberIds }, status: "COMPLETED", campaignId: null },
        data: { campaignId: campaign.id },
      });

      // 4) TEAM_ROLE — self csapatszerep-kérdőív
      let roleScores = 0;
      for (const m of members) {
        const existing = await prisma.teamRoleScore.findFirst({
          where: { userProfileId: m.id, source: "questionnaire" },
          select: { id: true },
        });
        if (existing) continue;
        const selections = buildSelections(`role:${m.id}`);
        await prisma.teamRoleScore.create({
          data: {
            userProfileId: m.id,
            campaignId: campaign.id,
            source: "questionnaire",
            scores: calculateTeamRoleScores(selections) as object,
          },
        });
        roleScores += 1;
      }

      // 5) TEAM_ROLE_360 + TRUST_360 — minden csapattárs értékel mindenkit
      let roleObs = 0;
      let trustObs = 0;
      for (const about of members) {
        for (const rater of members) {
          if (rater.id === about.id) continue;
          await prisma.teamRoleObservation.upsert({
            where: {
              campaignId_aboutUserId_raterUserId: {
                campaignId: campaign.id,
                aboutUserId: about.id,
                raterUserId: rater.id,
              },
            },
            create: {
              teamId: team.id,
              campaignId: campaign.id,
              aboutUserId: about.id,
              raterUserId: rater.id,
              selections: buildSelections(`peer:${about.id}:${rater.id}`) as object,
            },
            update: {},
          });
          roleObs += 1;
          await prisma.trustObservation.upsert({
            where: {
              campaignId_aboutUserId_raterUserId: {
                campaignId: campaign.id,
                aboutUserId: about.id,
                raterUserId: rater.id,
              },
            },
            create: {
              teamId: team.id,
              campaignId: campaign.id,
              aboutUserId: about.id,
              raterUserId: rater.id,
              answers: buildTrustAnswers(`trust:${about.id}:${rater.id}`) as object,
            },
            update: {},
          });
          trustObs += 1;
        }
      }

      // 6) PSYCH_SAFETY — anonim, tagonként egy válasz
      const psychExisting = await prisma.psychSafetyResponse.count({
        where: { campaignId: campaign.id },
      });
      if (psychExisting < members.length) {
        for (const m of members.slice(psychExisting)) {
          await prisma.psychSafetyResponse.create({
            data: {
              campaignId: campaign.id,
              answers: buildPsychAnswers(`psych:${m.id}`) as object,
              submittedOn: new Date(),
            },
          });
        }
      }

      // 7) PEER_FEEDBACK — mindenki a következő csapattársnak
      let peerItems = 0;
      for (let i = 0; i < members.length; i += 1) {
        const from = members[i];
        const to = members[(i + 1) % members.length];
        const already = await prisma.peerFeedbackItem.count({
          where: { campaignId: campaign.id, fromUserId: from.id, toUserId: to.id },
        });
        if (already > 0) continue;
        await prisma.peerFeedbackItem.create({
          data: {
            teamId: team.id,
            campaignId: campaign.id,
            fromUserId: from.id,
            toUserId: to.id,
            kind: "feedforward",
            visibility: "named",
            payload: {
              continueText: pick(CONTINUES, `cont:${from.id}:${to.id}`),
              tryText: pick(TRIES, `try:${from.id}:${to.id}`),
            },
          },
        });
        await prisma.peerFeedbackItem.create({
          data: {
            teamId: team.id,
            campaignId: campaign.id,
            fromUserId: from.id,
            toUserId: to.id,
            kind: "appreciation",
            visibility: "named",
            payload: { message: pick(APPRECIATIONS, `appr:${from.id}:${to.id}`) },
          },
        });
        peerItems += 2;
      }

      console.log(
        `  ✓ lépések: ${steps.length} · observer-kötés: ${tagged.count} · szerep-kitöltés: ${roleScores}` +
          ` · szerep-360: ${roleObs} · bizalom: ${trustObs} · pulse: ${members.length} · elismerés: ${peerItems}`,
      );

      // 8) Publikált csapat-riport az app saját aggregátoraival
      const aggregates = await buildTeamReportAggregates(team.id);
      if (!aggregates) {
        console.log("  ⚠️  Nem épült aggregátum (kevés kitöltés?) — riport kimarad.");
        continue;
      }
      const narrative = buildDraftNarrativePrefill(aggregates);
      const existingReport = await prisma.teamReport.findFirst({
        where: { teamId: team.id },
        select: { id: true },
      });
      const reportData = {
        teamId: team.id,
        orgId: org.id,
        status: "PUBLISHED",
        title: `${team.name} — ${CAMPAIGN_NAME}`,
        aggregates: aggregates as object,
        summary: narrative?.summary ?? null,
        strengths: narrative?.strengths ?? null,
        risks: narrative?.risks ?? null,
        recommendations: narrative?.recommendations ?? null,
        leadershipGuide: narrative?.leadershipGuide ?? null,
        actionItems: (narrative?.actionItems ?? []) as object,
        createdById: consultantId,
        publishedAt: new Date(),
        publishedById: consultantId,
      };
      if (existingReport) {
        await prisma.teamReport.update({ where: { id: existingReport.id }, data: reportData });
      } else {
        await prisma.teamReport.create({ data: reportData });
      }
      console.log(`  ✓ riport PUBLISHED${narrative ? " (narratívával)" : " (aggregátumokkal)"}`);
    }

    console.log(
      `\n✅  Kész — 3 csapat, ${closed ? "LEZÁRT" : "AKTÍV"} ciklus, mind a ${steps.length} lépéssel és publikált riporttal.\n`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
