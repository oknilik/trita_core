/**
 * seed-org-team.ts
 *
 * Létrehoz egy szervezetet + csapatot, és feltölti fake userekkel (HEXACO eredménnyel).
 * Az admin user (--email) lesz az org és csapat tulajdonosa, ORG_ADMIN szerepkörrel.
 * A csapattagok fake UserProfile rekordokként jönnek létre (nincs Clerk fiók).
 *
 * Futtatás:
 *   pnpm seed:org-team --email admin@example.com
 *
 * Opciók:
 *   --email <email>    Az org/team admin emailje (kötelező, már léteznie kell a DB-ben)
 *   --org-name <name>  Szervezet neve (alapért.: "Trita Demo Kft.")
 *   --team-name <name> Csapat neve (alapért.: "Termékfejlesztés")
 *   --members <n>      Csapattagok száma, max 10 (alapért.: 6)
 *   --clean            Törli a meglévő org/team/tag adatokat az admin usertől
 *   --help             Súgó
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";

// ─── Load .env ─────────────────────────────────────────────────────────────────

function loadEnv() {
  const candidates = [".env.local", ".env"];
  for (const file of candidates) {
    try {
      const content = readFileSync(resolve(process.cwd(), file), "utf-8");
      for (const line of content.split("\n")) {
        const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
        if (!match) continue;
        const [, key, raw] = match;
        if (!process.env[key]) {
          process.env[key] = raw.replace(/^['"]|['"]$/g, "").trim();
        }
      }
      console.log(`📄 Env betöltve: ${file}`);
      return;
    } catch {
      // not found
    }
  }
}

loadEnv();

// ─── CLI args ──────────────────────────────────────────────────────────────────

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

// ─── Score generation ──────────────────────────────────────────────────────────

function rand(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}

function nearbyScore(base: number, variance = 18): number {
  return Math.max(5, Math.min(95, Math.round(base + (Math.random() - 0.5) * 2 * variance)));
}

const HEXACO_FACETS: Record<string, string[]> = {
  H: ["sincerity", "fairness", "greed_avoidance", "modesty"],
  E: ["fearfulness", "anxiety", "dependence", "sentimentality"],
  X: ["social_self_esteem", "social_boldness", "sociability", "liveliness"],
  A: ["forgiveness", "gentleness", "flexibility", "patience"],
  C: ["organization", "diligence", "prudence", "perfectionism"],
  O: ["aesthetic_appreciation", "inquisitiveness", "creativity", "unconventionality"],
};

function generateHexacoScores() {
  const dimensions: Record<string, number> = {};
  const facets: Record<string, Record<string, number>> = {};
  for (const [dim, facetList] of Object.entries(HEXACO_FACETS)) {
    const base = rand(22, 83);
    dimensions[dim] = base;
    facets[dim] = {};
    for (const facet of facetList) {
      facets[dim][facet] = nearbyScore(base);
    }
  }
  return { type: "likert", dimensions, facets, answers: [], questionCount: 60 };
}

// ─── Fake team members ─────────────────────────────────────────────────────────

const FAKE_MEMBERS = [
  { username: "Kovács Péter",    email: "kovacs.peter@seed.test",    occupation: "Frontend fejlesztő" },
  { username: "Nagy Eszter",     email: "nagy.eszter@seed.test",     occupation: "Termékmenedzser" },
  { username: "Szabó Dávid",     email: "szabo.david@seed.test",     occupation: "Backend fejlesztő" },
  { username: "Tóth Réka",       email: "toth.reka@seed.test",       occupation: "UX designer" },
  { username: "Horváth Balázs",  email: "horvath.balazs@seed.test",  occupation: "DevOps mérnök" },
  { username: "Varga Anna",      email: "varga.anna@seed.test",      occupation: "Értékesítési vezető" },
  { username: "Kiss Gábor",      email: "kiss.gabor@seed.test",      occupation: "Adatelemző" },
  { username: "Fekete Zsófia",   email: "fekete.zsofia@seed.test",   occupation: "Marketingmenedzser" },
  { username: "Balogh Tamás",    email: "balogh.tamas@seed.test",    occupation: "Ügyfélsikermenedzser" },
  { username: "Molnár Lilla",    email: "molnar.lilla@seed.test",    occupation: "HR specialista" },
];

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs();

  if ("help" in args) {
    console.log(`
Org + team seed script

Futtatás:
  pnpm seed:org-team --email admin@example.com [opciók]

Opciók:
  --email <email>      Admin user email (kötelező, már léteznie kell a DB-ben)
  --org-name <name>    Szervezet neve  (alapért.: "Trita Demo Kft.")
  --team-name <name>   Csapat neve     (alapért.: "Termékfejlesztés")
  --members <n>        Csapattagok száma, max 10  (alapért.: 6)
  --clean              Törli a meglévő org/team adatokat az admin usertől
  --help               Ez a súgó
`);
    return;
  }

  const email = args.email;
  if (!email) {
    console.error("❌  --email megadása kötelező");
    process.exit(1);
  }

  const orgName  = args["org-name"]  ?? "Trita Demo Kft.";
  const teamName = args["team-name"] ?? "Termékfejlesztés";
  const memberCount = Math.max(1, Math.min(10, parseInt(args.members ?? "6", 10) || 6));
  const clean = "clean" in args;

  const prisma = new PrismaClient();

  try {
    // ── Find admin user ────────────────────────────────────────────────────────
    console.log(`\n🔍  Admin user keresése: ${email}`);
    const admin = await prisma.userProfile.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true, email: true },
    });
    if (!admin) {
      console.error(`❌  Nem találom: ${email} — regisztrálj be először a weboldalon`);
      process.exit(1);
    }
    console.log(`✅  Admin megtalálva: ${admin.id}`);

    // ── Clean up ───────────────────────────────────────────────────────────────
    if (clean) {
      console.log("\n🧹  Meglévő adatok törlése...");

      // Delete org memberships → orgs owned by admin
      const ownedOrgs = await prisma.organization.findMany({
        where: { ownerId: admin.id },
        select: { id: true },
      });
      if (ownedOrgs.length > 0) {
        const orgIds = ownedOrgs.map((o) => o.id);
        await prisma.organizationPendingInvite.deleteMany({ where: { orgId: { in: orgIds } } });
        await prisma.organizationMember.deleteMany({ where: { orgId: { in: orgIds } } });
        await prisma.organization.deleteMany({ where: { id: { in: orgIds } } });
        console.log(`   🗑  ${ownedOrgs.length} szervezet törölve`);
      }

      // Delete teams owned by admin + their members
      const ownedTeams = await prisma.team.findMany({
        where: { ownerId: admin.id },
        select: { id: true },
      });
      if (ownedTeams.length > 0) {
        const teamIds = ownedTeams.map((t) => t.id);
        await prisma.teamPendingInvite.deleteMany({ where: { teamId: { in: teamIds } } });
        await prisma.teamMember.deleteMany({ where: { teamId: { in: teamIds } } });
        await prisma.team.deleteMany({ where: { id: { in: teamIds } } });
        console.log(`   🗑  ${ownedTeams.length} csapat törölve`);
      }

      // Delete seed fake user profiles (+ their FK dependencies first)
      const seedEmails = FAKE_MEMBERS.map((m) => m.email);
      const seedUsers = await prisma.userProfile.findMany({
        where: { email: { in: seedEmails } },
        select: { id: true },
      });
      if (seedUsers.length > 0) {
        const seedIds = seedUsers.map((u) => u.id);
        await prisma.teamMember.deleteMany({ where: { userId: { in: seedIds } } });
        await prisma.organizationMember.deleteMany({ where: { userId: { in: seedIds } } });
        await prisma.assessmentResult.deleteMany({ where: { userProfileId: { in: seedIds } } });
        const { count: seedUserCount } = await prisma.userProfile.deleteMany({
          where: { id: { in: seedIds } },
        });
        console.log(`   🗑  ${seedUserCount} seed user profil törölve`);
      }
    }

    // ── Create org ─────────────────────────────────────────────────────────────
    console.log(`\n🏢  Szervezet létrehozása: "${orgName}"`);
    const org = await prisma.organization.create({
      data: {
        name: orgName,
        ownerId: admin.id,
        status: "ACTIVE",
        members: {
          create: { userId: admin.id, role: "ORG_ADMIN" },
        },
      },
      select: { id: true, name: true },
    });
    console.log(`✅  Szervezet: ${org.name} (${org.id})`);

    // ── Create team ────────────────────────────────────────────────────────────
    console.log(`\n👥  Csapat létrehozása: "${teamName}"`);
    const team = await prisma.team.create({
      data: {
        name: teamName,
        ownerId: admin.id,
        orgId: org.id,
      },
      select: { id: true, name: true },
    });
    console.log(`✅  Csapat: ${team.name} (${team.id})`);

    // Add admin as team member
    await prisma.teamMember.create({
      data: { teamId: team.id, userId: admin.id, role: "admin" },
    });

    // Add admin's assessment result if not exists
    const adminHasResult = await prisma.assessmentResult.findFirst({
      where: { userProfileId: admin.id, isSelfAssessment: true },
      select: { id: true },
    });
    if (!adminHasResult) {
      const adminScores = generateHexacoScores();
      await prisma.assessmentResult.create({
        data: {
          userProfileId: admin.id,
          testType: "HEXACO",
          isSelfAssessment: true,
          scores: adminScores as object,
        },
      });
      await prisma.userProfile.update({
        where: { id: admin.id },
        data: { testType: "HEXACO" },
      });
      console.log(`   ✅  Admin assessment eredmény létrehozva`);
    } else {
      console.log(`   ℹ️   Admin már rendelkezik assessment eredménnyel`);
    }

    // ── Create fake team members ───────────────────────────────────────────────
    console.log(`\n👤  Csapattagok generálása: ${memberCount} fő`);

    for (let i = 0; i < memberCount; i++) {
      const fake = FAKE_MEMBERS[i];

      // Create or find the fake user profile
      let userProfile = await prisma.userProfile.findFirst({
        where: { email: fake.email },
        select: { id: true },
      });

      if (!userProfile) {
        userProfile = await prisma.userProfile.create({
          data: {
            email: fake.email,
            username: fake.username,
            occupation: fake.occupation,
            testType: "HEXACO",
            testTypeAssignedAt: new Date(),
            onboardedAt: new Date(),
          },
          select: { id: true },
        });
      }

      // Assessment result
      const hasResult = await prisma.assessmentResult.findFirst({
        where: { userProfileId: userProfile.id, isSelfAssessment: true },
        select: { id: true },
      });
      if (!hasResult) {
        const scores = generateHexacoScores();
        await prisma.assessmentResult.create({
          data: {
            userProfileId: userProfile.id,
            testType: "HEXACO",
            isSelfAssessment: true,
            scores: scores as object,
          },
        });
      }

      // Org membership
      const hasOrgMembership = await prisma.organizationMember.findUnique({
        where: { userId: userProfile.id },
      });
      if (!hasOrgMembership) {
        await prisma.organizationMember.create({
          data: { orgId: org.id, userId: userProfile.id, role: "ORG_MEMBER" },
        });
      }

      // Team membership
      const hasTeamMembership = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: team.id, userId: userProfile.id } },
      });
      if (!hasTeamMembership) {
        await prisma.teamMember.create({
          data: { teamId: team.id, userId: userProfile.id, role: "member" },
        });
      }

      console.log(`   ✅  ${fake.username} (${fake.occupation}) — ${userProfile.id}`);
    }

    // ── Done ───────────────────────────────────────────────────────────────────
    console.log(`
🎉  Kész!

   Szervezet:  http://localhost:3000/org/${org.id}
   Csapat:     http://localhost:3000/team/${team.id}
   Dashboard:  http://localhost:3000/dashboard
`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("❌  Hiba:", (e as Error).message);
  process.exit(1);
});
