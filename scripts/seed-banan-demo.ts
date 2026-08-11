/**
 * seed-banan-demo.ts
 *
 * Egy MEGLÉVŐ szervezetbe seedel egy demó-csapatot teljes mérés-sorozattal:
 *   - "Banán" csapat N fake taggal (TRITAN self + 2-2 observer eredmény)
 *   - ACTIVE kampány MIND az 5 mérés-lépéssel (OBSERVER_360 → TEAM_ROLE →
 *     TEAM_ROLE_360 → TRUST_360 → PSYCH_SAFETY), minden résztvevő minden
 *     lépést teljesített
 *   - random (de érvényes) eredmények mindenhez: csapatszerep self + peer
 *     observationök, bizalmi kör observationök, névtelen pulse-válaszok
 *   - opcionálisan meghív egy admint (org-szinten ORG_ADMIN + csapattag) —
 *     ha a profil még nem létezik, pending invite-ként
 *
 * Futtatás:
 *   pnpm seed:banan
 *   npx tsx scripts/seed-banan-demo.ts --org <orgId> [opciók]
 *
 * Opciók:
 *   --org <id>           Cél-szervezet id (alapért.: cmroykgno0003itqbc8xxwk54)
 *   --team-name <name>   Csapat neve (alapért.: "Banán")
 *   --members <n>        Tagok száma, max 8 (alapért.: 6)
 *   --admin-email <e>    Meghívandó org admin (alapért.: kilinko@me.com)
 *   --clean              A korábbi banán-seed adatok törlése előbb
 *   --help               Súgó
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";
import { PSYCH_SAFETY_ITEMS } from "../src/lib/psych-safety";
import {
  TEAM_ROLE_ITEMS,
  TEAM_ROLE_MIN_SELECT,
  TEAM_ROLE_MAX_SELECT,
  TEAM_ROLE_TOP_SELECT,
  type TeamRoleSelections,
} from "../src/lib/team-role-questions";
import { calculateTeamRoleScores } from "../src/lib/team-role-scoring";
import { TRUST_QUESTIONS, type TrustAnswerSet } from "../src/lib/trust-network";

// ─── Load .env ────────────────────────────────────────────────────────────────

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      const content = readFileSync(resolve(process.cwd(), file), "utf-8");
      for (const line of content.split("\n")) {
        const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
        if (!match) continue;
        const [, key, raw] = match;
        if (!process.env[key]) process.env[key] = raw.replace(/^['"]|['"]$/g, "").trim();
      }
      console.log(`📄 Env betöltve: ${file}`);
      return;
    } catch {
      /* not found */
    }
  }
}

loadEnv();

// ─── CLI args ─────────────────────────────────────────────────────────────────

function parseArgs(): Record<string, string> {
  const args = process.argv.slice(2);
  const result: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith("--")) {
        result[key] = next;
        i++;
      } else {
        result[key] = "true";
      }
    }
  }
  return result;
}

// ─── Random helpers ───────────────────────────────────────────────────────────

function rand(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}

function nearbyScore(base: number, variance = 18): number {
  return Math.max(5, Math.min(95, Math.round(base + (Math.random() - 0.5) * 2 * variance)));
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// A facet-sorrend a kanonikus térképet (tritan.ts TRITAN_DIMENSION_FACETS)
// követi — a THOR korábban felcserélt sorrendben (prudence↔perfectionism)
// állt itt, eltérve az éles felület és a personas.shared.ts sorrendjétől.
// A kiegészítő altruizmus-skála (`I`) 2026-08-11 óta nincs a rövid (TSFI-S,
// 60 itemes) formában, amit ez a seed emulál — nem generálunk rá pontszámot.
const TRITAN_FACETS: Record<string, string[]> = {
  INTE: ["sincerity", "fairness", "greed_avoidance", "modesty"],
  RESO: ["fearfulness", "anxiety", "dependence", "sentimentality"],
  TEMP: ["social_self_esteem", "social_boldness", "sociability", "liveliness"],
  ADAP: ["forgiveness", "gentleness", "flexibility", "patience"],
  THOR: ["organization", "diligence", "perfectionism", "prudence"],
  OPEN: ["aesthetic_appreciation", "inquisitiveness", "creativity", "unconventionality"],
};

function generateTritanScores() {
  const dimensions: Record<string, number> = {};
  const facets: Record<string, Record<string, number>> = {};
  for (const [dim, facetList] of Object.entries(TRITAN_FACETS)) {
    const base = rand(22, 83);
    dimensions[dim] = base;
    facets[dim] = {};
    for (const facet of facetList) {
      facets[dim][facet] = nearbyScore(base);
    }
  }
  return { type: "likert", dimensions, facets, answers: [], questionCount: 60 };
}

/** Érvényes csapatszerep-kijelölés: 8–12 item, pontosan 3 kiemelt. */
function generateTeamRoleSelections(): TeamRoleSelections {
  const count = rand(TEAM_ROLE_MIN_SELECT, TEAM_ROLE_MAX_SELECT);
  const picked = shuffle(TEAM_ROLE_ITEMS.map((i) => i.id)).slice(0, count);
  const selections: TeamRoleSelections = {};
  picked.forEach((id, idx) => {
    selections[id] = idx < TEAM_ROLE_TOP_SELECT ? 2 : 1;
  });
  return selections;
}

/**
 * Bizalmi válaszkészlet egy cél-szint (0..1) körül — így a hálónak
 * struktúrája lesz (erős mag, gyengébb szélek), nem fehér zaj.
 */
function generateTrustAnswers(level: number): TrustAnswerSet {
  const answers: TrustAnswerSet = {};
  for (const q of TRUST_QUESTIONS) {
    const target = 1 + level * (q.max - 1);
    const noisy = Math.round(target + (Math.random() - 0.5) * 1.4);
    answers[q.id] = Math.max(1, Math.min(q.max, noisy));
  }
  return answers;
}

/** Pulse-válaszok: közepes-jó biztonság, 1-2 gyengébb területtel. */
function generatePsychSafetyAnswers(weakIds: Set<string>): Record<string, number> {
  const answers: Record<string, number> = {};
  for (const item of PSYCH_SAFETY_ITEMS) {
    const base = weakIds.has(item.id) ? 2.6 : 4.1;
    const noisy = Math.max(1, Math.min(5, Math.round(base + (Math.random() - 0.5) * 1.6)));
    // A tárolt válasz NYERS: fordított itemnél a "biztonságos" válasz alacsony.
    answers[item.id] = item.reversed ? 6 - noisy : noisy;
  }
  return answers;
}

// ─── Fake tagok ───────────────────────────────────────────────────────────────

const BANAN_MEMBERS = [
  { username: "Sárga Bence",     email: "sarga.bence@banan.seed.test" },
  { username: "Érett Emma",      email: "erett.emma@banan.seed.test" },
  { username: "Fürtös Ferenc",   email: "furtos.ferenc@banan.seed.test" },
  { username: "Héjas Hanna",     email: "hejas.hanna@banan.seed.test" },
  { username: "Görbe Gergő",     email: "gorbe.gergo@banan.seed.test" },
  { username: "Trópusi Tímea",   email: "tropusi.timea@banan.seed.test" },
  { username: "Zöldell Zoltán",  email: "zoldell.zoltan@banan.seed.test" },
  { username: "Barnuló Boglárka", email: "barnulo.boglarka@banan.seed.test" },
];

const CAMPAIGN_STEPS = [
  "OBSERVER_360",
  "TEAM_ROLE",
  "TEAM_ROLE_360",
  "TRUST_360",
  "PSYCH_SAFETY",
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs();

  if ("help" in args) {
    console.log(`
Banán demó-seed — meglévő org-ba teljes mérés-sorozattal

  npx tsx scripts/seed-banan-demo.ts --org <orgId> [--team-name Banán]
    [--members 6] [--admin-email kilinko@me.com] [--clean]
`);
    return;
  }

  const orgId = args.org ?? "cmroykgno0003itqbc8xxwk54";
  const teamName = args["team-name"] ?? "Banán";
  const memberCount = Math.max(3, Math.min(BANAN_MEMBERS.length, parseInt(args.members ?? "6", 10) || 6));
  const adminEmail = (args["admin-email"] ?? "kilinko@me.com").toLowerCase();
  const clean = "clean" in args;

  const prisma = new PrismaClient();

  try {
    // ── Org ellenőrzés ────────────────────────────────────────────────────────
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, name: true, ownerId: true },
    });
    if (!org) {
      console.error(`❌  Nincs ilyen szervezet: ${orgId}`);
      process.exit(1);
    }
    console.log(`🏢  Szervezet: ${org.name} (${org.id})`);

    // A kampány létrehozója: a szervezet tanácsadója, ennek híján a tulajdonos.
    const consultant = await prisma.organizationMember.findFirst({
      where: { orgId, role: "ORG_CONSULTANT", leftAt: null },
      select: { userId: true },
    });
    const creatorId = consultant?.userId ?? org.ownerId;
    console.log(`👤  Kampány-gazda: ${consultant ? "tanácsadó" : "org tulajdonos"} (${creatorId})`);

    // ── Clean ─────────────────────────────────────────────────────────────────
    if (clean) {
      console.log("\n🧹  Korábbi banán-seed törlése…");
      const seedUsers = await prisma.userProfile.findMany({
        where: { email: { in: BANAN_MEMBERS.map((m) => m.email) } },
        select: { id: true },
      });
      const ids = seedUsers.map((u) => u.id);
      if (ids.length > 0) {
        await prisma.trustObservation.deleteMany({
          where: { OR: [{ aboutUserId: { in: ids } }, { raterUserId: { in: ids } }] },
        });
        await prisma.teamRoleObservation.deleteMany({
          where: { OR: [{ aboutUserId: { in: ids } }, { raterUserId: { in: ids } }] },
        });
        await prisma.teamRoleScore.deleteMany({ where: { userProfileId: { in: ids } } });
        await prisma.teamRoleAnswer.deleteMany({ where: { userProfileId: { in: ids } } });
        await prisma.campaignParticipant.deleteMany({ where: { userId: { in: ids } } });
        await prisma.observerAssessment.deleteMany({
          where: { invitation: { inviterId: { in: ids } } },
        });
        await prisma.observerInvitation.deleteMany({
          where: { OR: [{ inviterId: { in: ids } }, { observerProfileId: { in: ids } }] },
        });
        await prisma.assessmentResult.deleteMany({ where: { userProfileId: { in: ids } } });
        await prisma.teamMember.deleteMany({ where: { userId: { in: ids } } });
        await prisma.organizationMember.deleteMany({ where: { userId: { in: ids } } });
      }
      const teams = await prisma.team.findMany({
        where: { orgId, name: teamName },
        select: { id: true },
      });
      for (const t of teams) {
        await prisma.campaign.deleteMany({ where: { teamId: t.id } });
        await prisma.teamPendingInvite.deleteMany({ where: { teamId: t.id } });
        await prisma.teamMember.deleteMany({ where: { teamId: t.id } });
        await prisma.team.delete({ where: { id: t.id } });
      }
      if (ids.length > 0) {
        await prisma.userProfile.deleteMany({ where: { id: { in: ids } } });
      }
      console.log(`   🗑  ${ids.length} seed-user + ${teams.length} csapat törölve`);
    }

    // ── Csapat ────────────────────────────────────────────────────────────────
    let team = await prisma.team.findFirst({
      where: { orgId, name: teamName },
      select: { id: true, name: true },
    });
    if (!team) {
      team = await prisma.team.create({
        data: { name: teamName, ownerId: creatorId, orgId },
        select: { id: true, name: true },
      });
      console.log(`\n🍌  Csapat létrehozva: ${team.name} (${team.id})`);
    } else {
      console.log(`\n🍌  Csapat már létezik: ${team.name} (${team.id})`);
    }

    // ── Tagok: profil + org-tagság + csapat-tagság + TRITAN self ─────────────
    console.log(`\n👥  ${memberCount} tag seedelése…`);
    const memberIds: string[] = [];
    for (const fake of BANAN_MEMBERS.slice(0, memberCount)) {
      let profile = await prisma.userProfile.findFirst({
        where: { email: fake.email },
        select: { id: true },
      });
      if (!profile) {
        profile = await prisma.userProfile.create({
          data: {
            email: fake.email,
            username: fake.username,
            testType: "TRITAN",
            testTypeAssignedAt: new Date(),
            onboardedAt: new Date(),
          },
          select: { id: true },
        });
      }
      memberIds.push(profile.id);

      const hasResult = await prisma.assessmentResult.findFirst({
        where: { userProfileId: profile.id, isSelfAssessment: true },
        select: { id: true },
      });
      if (!hasResult) {
        await prisma.assessmentResult.create({
          data: {
            userProfileId: profile.id,
            testType: "TRITAN",
            isSelfAssessment: true,
            scores: generateTritanScores() as object,
          },
        });
      }

      await prisma.organizationMember.upsert({
        where: { orgId_userId: { orgId, userId: profile.id } },
        create: { orgId, userId: profile.id, role: "ORG_MEMBER" },
        update: { leftAt: null },
      });
      await prisma.teamMember.upsert({
        where: { teamId_userId: { teamId: team.id, userId: profile.id } },
        create: { teamId: team.id, userId: profile.id, role: "member" },
        update: {},
      });
      console.log(`   ✅  ${fake.username}`);
    }

    // ── Observer eredmények (2/fő, egymást értékelik) ─────────────────────────
    console.log("\n👁️   Observer-eredmények…");
    const RELATIONSHIPS = ["COLLEAGUE", "FRIEND", "OTHER"] as const;
    const DURATIONS = ["LT_1", "1_3", "3_5", "5P"] as const;
    const profiles = await prisma.userProfile.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, email: true },
    });
    for (const p of profiles) {
      const observers = profiles.filter((o) => o.id !== p.id).slice(0, 2);
      for (const obs of observers) {
        const existing = await prisma.observerInvitation.findFirst({
          where: { inviterId: p.id, observerProfileId: obs.id },
          select: { id: true },
        });
        if (existing) continue;
        const invitation = await prisma.observerInvitation.create({
          data: {
            inviterId: p.id,
            observerProfileId: obs.id,
            observerEmail: obs.email,
            testType: "TRITAN",
            status: "COMPLETED",
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            completedAt: new Date(),
          },
          select: { id: true },
        });
        await prisma.observerAssessment.create({
          data: {
            invitationId: invitation.id,
            relationshipType: RELATIONSHIPS[rand(0, RELATIONSHIPS.length - 1)],
            knownDuration: DURATIONS[rand(0, DURATIONS.length - 1)],
            scores: generateTritanScores() as object,
            confidence: rand(3, 5),
          },
        });
      }
    }

    // ── Csapatszerep self (answer + score, source: questionnaire) ─────────────
    console.log("🎭  Csapatszerep self-eredmények…");
    // Append-only modell: ha már van kitöltés, nem duplikálunk (idempotens seed)
    for (const userId of memberIds) {
      const existing = await prisma.teamRoleAnswer.findFirst({
        where: { userProfileId: userId },
        select: { id: true },
      });
      if (existing) continue;
      const selections = generateTeamRoleSelections();
      const answer = await prisma.teamRoleAnswer.create({
        data: { userProfileId: userId, answers: selections as object },
        select: { id: true },
      });
      await prisma.teamRoleScore.create({
        data: {
          userProfileId: userId,
          scores: calculateTeamRoleScores(selections) as object,
          source: "questionnaire",
          teamRoleAnswerId: answer.id,
        },
      });
    }

    // ── Kampány: mind az 5 lépés, minden tag végzett ──────────────────────────
    console.log("\n🎯  Kampány (mind az 5 méréssel)…");
    let campaign = await prisma.campaign.findFirst({
      where: { orgId, teamId: team.id, status: "ACTIVE" },
      select: { id: true, name: true },
    });
    if (!campaign) {
      campaign = await prisma.campaign.create({
        data: {
          orgId,
          teamId: team.id,
          name: `${teamName} — teljes mérés-sorozat · 2026. július`,
          description: "Demó: mind az öt mérés-lépés, seedelt eredményekkel.",
          type: CAMPAIGN_STEPS[0],
          steps: CAMPAIGN_STEPS,
          status: "ACTIVE",
          createdBy: creatorId,
        },
        select: { id: true, name: true },
      });
    }
    console.log(`   ✅  ${campaign.name} (${campaign.id})`);

    const now = new Date();
    const stepCompletions = Object.fromEntries(
      CAMPAIGN_STEPS.map((s, i) => [
        s,
        new Date(now.getTime() - (CAMPAIGN_STEPS.length - i) * 24 * 60 * 60 * 1000).toISOString(),
      ]),
    );
    for (const userId of memberIds) {
      await prisma.campaignParticipant.upsert({
        where: { campaignId_userId: { campaignId: campaign.id, userId } },
        create: {
          campaignId: campaign.id,
          userId,
          currentStep: CAMPAIGN_STEPS.length,
          stepCompletions: stepCompletions as object,
          completedAt: now,
        },
        update: {
          currentStep: CAMPAIGN_STEPS.length,
          stepCompletions: stepCompletions as object,
          completedAt: now,
        },
      });
    }

    // ── TEAM_ROLE_360: minden rater × minden társ ─────────────────────────────
    console.log("🔁  Csapattársi szerep-visszajelzések…");
    for (const rater of memberIds) {
      for (const about of memberIds) {
        if (rater === about) continue;
        await prisma.teamRoleObservation.upsert({
          where: {
            campaignId_aboutUserId_raterUserId: {
              campaignId: campaign.id,
              aboutUserId: about,
              raterUserId: rater,
            },
          },
          create: {
            teamId: team.id,
            campaignId: campaign.id,
            aboutUserId: about,
            raterUserId: rater,
            selections: generateTeamRoleSelections() as object,
          },
          update: {},
        });
      }
    }

    // ── TRUST_360: strukturált háló (hub + gyengén beágyazott tag) ────────────
    console.log("🤝  Bizalmi kör observationök…");
    // Az első tag a hub (mindenkivel erős), az utolsó gyengén beágyazott.
    const hubId = memberIds[0];
    const looseId = memberIds[memberIds.length - 1];
    for (const rater of memberIds) {
      for (const about of memberIds) {
        if (rater === about) continue;
        let level = 0.55 + Math.random() * 0.25; // alap: közepes-jó
        if (rater === hubId || about === hubId) level = 0.8 + Math.random() * 0.2;
        if (rater === looseId || about === looseId) level = 0.15 + Math.random() * 0.25;
        await prisma.trustObservation.upsert({
          where: {
            campaignId_aboutUserId_raterUserId: {
              campaignId: campaign.id,
              aboutUserId: about,
              raterUserId: rater,
            },
          },
          create: {
            teamId: team.id,
            campaignId: campaign.id,
            aboutUserId: about,
            raterUserId: rater,
            answers: generateTrustAnswers(level) as object,
          },
          update: {},
        });
      }
    }

    // ── PSYCH_SAFETY: névtelen válaszok (1-2 gyenge területtel) ───────────────
    console.log("🛡️   Pulse-válaszok…");
    const existingPulse = await prisma.psychSafetyResponse.count({
      where: { campaignId: campaign.id },
    });
    if (existingPulse === 0) {
      const weakIds = new Set<string>(["PS2", "PS8"]); // hibázás + egyet-nem-értés gyengébb
      const submittedOn = new Date();
      submittedOn.setUTCHours(0, 0, 0, 0);
      for (let i = 0; i < memberCount; i++) {
        await prisma.psychSafetyResponse.create({
          data: {
            campaignId: campaign.id,
            answers: generatePsychSafetyAnswers(weakIds) as object,
            submittedOn,
          },
        });
      }
    } else {
      console.log(`   ℹ️   Már van ${existingPulse} pulse-válasz — kihagyva`);
    }

    // ── Admin meghívása (org admin + csapattag) ───────────────────────────────
    console.log(`\n✉️   Admin meghívása: ${adminEmail}`);
    const adminProfile = await prisma.userProfile.findFirst({
      where: { email: { equals: adminEmail, mode: "insensitive" } },
      select: { id: true, username: true },
    });
    if (adminProfile) {
      await prisma.organizationMember.upsert({
        where: { orgId_userId: { orgId, userId: adminProfile.id } },
        create: { orgId, userId: adminProfile.id, role: "ORG_ADMIN" },
        update: { role: "ORG_ADMIN", leftAt: null },
      });
      await prisma.teamMember.upsert({
        where: { teamId_userId: { teamId: team.id, userId: adminProfile.id } },
        create: { teamId: team.id, userId: adminProfile.id, role: "member" },
        update: {},
      });
      console.log(`   ✅  Meglévő profil (${adminProfile.username ?? adminProfile.id}) → ORG_ADMIN + csapattag`);
    } else {
      await prisma.organizationPendingInvite.upsert({
        where: { orgId_email: { orgId, email: adminEmail } },
        create: { orgId, email: adminEmail, role: "ORG_ADMIN" },
        update: { role: "ORG_ADMIN" },
      });
      await prisma.teamPendingInvite.upsert({
        where: { teamId_email: { teamId: team.id, email: adminEmail } },
        create: { teamId: team.id, email: adminEmail },
        update: {},
      });
      console.log(`   ✅  Pending invite: ORG_ADMIN (org) + csapat-meghívó — regisztrációkor aktiválódik`);
    }

    console.log(`
🎉  Kész!

   Csapat:   /team/${team.id}
   Kampány:  /org/${orgId}/campaigns/${campaign.id}
   Riport:   a tanácsadói nézetben szerkeszthető → publikálás után látja az admin/manager
`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("❌  Hiba:", (e as Error).message);
  process.exit(1);
});
