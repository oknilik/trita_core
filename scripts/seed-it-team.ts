/**
 * seed-it-team.ts
 * Az "IT csapat" nevű csapatot feltölti 8 fake taggal,
 * mindegyiknek HEXACO self-assessment + 2 observer eredménnyel.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";

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
      return;
    } catch { /* not found */ }
  }
}

loadEnv();

function rand(min: number, max: number) {
  return Math.round(min + Math.random() * (max - min));
}

function nearbyScore(base: number, variance = 18) {
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
    for (const facet of facetList) facets[dim][facet] = nearbyScore(base);
  }
  return { type: "likert", dimensions, facets };
}

const IT_MEMBERS = [
  { username: "Németh Ádám",     email: "nemeth.adam@seed.test" },
  { username: "Farkas Krisztina", email: "farkas.krisztina@seed.test" },
  { username: "Papp Bence",       email: "papp.bence@seed.test" },
  { username: "Simon Nóra",       email: "simon.nora@seed.test" },
  { username: "Takács Márton",    email: "takacs.marton@seed.test" },
  { username: "Lukács Vivien",    email: "lukacs.vivien@seed.test" },
  { username: "Gönczi Richárd",   email: "gonczi.richard@seed.test" },
  { username: "Hegedűs Boglárka", email: "hegedus.boglarkaA@seed.test" },
];

const RELATIONSHIPS = ["COLLEAGUE", "FRIEND", "FAMILY"] as const;
const DURATIONS = ["LT_1", "1_3", "3_5", "5P"] as const;

async function main() {
  const prisma = new PrismaClient();

  try {
    // Find "IT csapat"
    const team = await prisma.team.findFirst({
      where: { name: { contains: "IT", mode: "insensitive" } },
      select: { id: true, name: true, orgId: true },
    });

    if (!team) {
      console.error('❌  Nem találom az "IT csapat" nevű csapatot a DB-ben');
      process.exit(1);
    }

    console.log(`✅  Csapat megtalálva: ${team.name} (${team.id}), org: ${team.orgId}`);

    const createdProfiles: { id: string; email: string }[] = [];

    for (const fake of IT_MEMBERS) {
      // Upsert user profile
      let profile = await prisma.userProfile.findFirst({
        where: { email: fake.email },
        select: { id: true, email: true },
      });

      if (!profile) {
        profile = await prisma.userProfile.create({
          data: {
            email: fake.email,
            username: fake.username,
            testType: "HEXACO",
            testTypeAssignedAt: new Date(),
            onboardedAt: new Date(),
          },
          select: { id: true, email: true },
        });
        console.log(`   ➕  Létrehozva: ${fake.username}`);
      } else {
        console.log(`   ℹ️   Már létezik: ${fake.username}`);
      }

      // Org membership (only if not already in an org)
      const hasOrg = await prisma.organizationMember.findUnique({
        where: { userId: profile.id },
      });
      if (!hasOrg) {
        await prisma.organizationMember.create({
          data: { orgId: team.orgId, userId: profile.id, role: "ORG_MEMBER" },
        });
      }

      // Team membership
      const hasTeam = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: team.id, userId: profile.id } },
      });
      if (!hasTeam) {
        await prisma.teamMember.create({
          data: { teamId: team.id, userId: profile.id },
        });
      }

      // Self-assessment
      const hasResult = await prisma.assessmentResult.findFirst({
        where: { userProfileId: profile.id, isSelfAssessment: true },
        select: { id: true },
      });
      if (!hasResult) {
        const scores = generateHexacoScores();
        await prisma.assessmentResult.create({
          data: {
            userProfileId: profile.id,
            testType: "HEXACO",
            isSelfAssessment: true,
            scores: scores as object,
          },
        });
      }

      createdProfiles.push(profile);
    }

    console.log(`\n👁️   Observer adatok generálása...`);

    for (const profile of createdProfiles) {
      // 2 observer from other members
      const observers = createdProfiles.filter((p) => p.id !== profile.id).slice(0, 2);
      for (const observer of observers) {
        const existing = await prisma.observerInvitation.findFirst({
          where: { inviterId: profile.id, observerProfileId: observer.id },
          select: { id: true },
        });
        if (existing) continue;

        const invitation = await prisma.observerInvitation.create({
          data: {
            inviterId: profile.id,
            observerProfileId: observer.id,
            observerEmail: observer.email,
            testType: "HEXACO",
            status: "COMPLETED",
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            completedAt: new Date(),
          },
          select: { id: true },
        });

        await prisma.observerAssessment.create({
          data: {
            invitationId: invitation.id,
            relationshipType: RELATIONSHIPS[rand(0, 2)],
            knownDuration: DURATIONS[rand(0, 3)],
            scores: generateHexacoScores() as object,
            confidence: rand(3, 5),
          },
        });
      }
    }

    console.log(`\n🎉  Kész! ${createdProfiles.length} tag hozzáadva az IT csapathoz.`);
    console.log(`   Csapat: http://localhost:3000/team/${team.id}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("❌  Hiba:", (e as Error).message);
  process.exit(1);
});
