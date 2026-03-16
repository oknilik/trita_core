/**
 * seed-marketing-team.ts
 *
 * Feltölti a meglévő "Marketing" csapatot dummy adatokkal a "Trita Demo Kft." orgban.
 * - 5 marketing tag: 3 teljes profil + HEXACO eredmény, 2 félig kitöltött (nincs teszt)
 * - 1 ACTIVE Q2 2026 kampány, csak a tagok felével mint résztvevő
 *
 * Futtatás:
 *   pnpm tsx scripts/seed-marketing-team.ts
 *   pnpm tsx scripts/seed-marketing-team.ts --clean
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
        if (match && !process.env[match[1]]) {
          process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "").trim();
        }
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
    for (const facet of facetList) {
      facets[dim][facet] = nearbyScore(base);
    }
  }
  return { type: "likert", dimensions, facets, answers: [], questionCount: 60 };
}

// Marketing csapat fake tagjai (különálló email domain)
const MARKETING_MEMBERS = [
  // Teljes profil + HEXACO eredmény
  { username: "Farkas Nóra",     email: "farkas.nora@mktg.seed.test",     full: true  },
  { username: "Simon Ádám",      email: "simon.adam@mktg.seed.test",      full: true  },
  { username: "Papp Judit",      email: "papp.judit@mktg.seed.test",      full: true  },
  // Félig kitöltött: regisztrált, onboarding kész, de még nem töltötte ki a tesztet
  { username: "Lőrincz Bence",   email: "lorincz.bence@mktg.seed.test",   full: false },
  // Félig kitöltött: regisztrált, de még onboarding sem kész
  { username: "Hegedűs Petra",   email: "hegedus.petra@mktg.seed.test",   full: false, noOnboarding: true },
];

const RELATIONSHIPS = ["COLLEAGUE", "FRIEND"] as const;
const DURATIONS     = ["1_3", "3_5", "5P"] as const;

async function main() {
  const clean = process.argv.includes("--clean");
  const prisma = new PrismaClient();

  try {
    // ── Find org ────────────────────────────────────────────────────────────────
    const org = await prisma.organization.findFirst({
      where: { name: { contains: "Trita", mode: "insensitive" } },
      select: { id: true, name: true, members: { select: { userId: true } } },
    });
    if (!org) {
      console.error("❌  Nem találom a Trita Demo Kft. szervezetet. Futtasd előbb: pnpm seed:org-team");
      process.exit(1);
    }
    console.log(`✅  Org: ${org.name} (${org.id})`);

    // ── Find marketing team ─────────────────────────────────────────────────────
    const team = await prisma.team.findFirst({
      where: { orgId: org.id, name: { contains: "arketing", mode: "insensitive" } },
      select: { id: true, name: true },
    });
    if (!team) {
      console.error("❌  Nem találom a Marketing csapatot. Hozd létre manuálisan az org oldalon.");
      process.exit(1);
    }
    console.log(`✅  Csapat: ${team.name} (${team.id})`);

    // ── Clean up existing marketing seed data ───────────────────────────────────
    if (clean) {
      console.log("\n🧹  Meglévő marketing seed adatok törlése...");
      const mktgEmails = MARKETING_MEMBERS.map((m) => m.email);
      const existing = await prisma.userProfile.findMany({
        where: { email: { in: mktgEmails } },
        select: { id: true },
      });
      if (existing.length > 0) {
        const ids = existing.map((u) => u.id);
        await prisma.teamMember.deleteMany({ where: { userId: { in: ids } } });
        await prisma.organizationMember.deleteMany({ where: { userId: { in: ids } } });
        await prisma.assessmentResult.deleteMany({ where: { userProfileId: { in: ids } } });
        await prisma.userProfile.deleteMany({ where: { id: { in: ids } } });
        console.log(`   🗑  ${ids.length} marketing seed user törölve`);
      }
      // Delete Q2 campaigns in this org
      const q2campaigns = await prisma.campaign.findMany({
        where: { orgId: org.id, name: { contains: "Q2", mode: "insensitive" } },
        select: { id: true },
      });
      if (q2campaigns.length > 0) {
        await prisma.campaignParticipant.deleteMany({
          where: { campaignId: { in: q2campaigns.map((c) => c.id) } },
        });
        await prisma.campaign.deleteMany({
          where: { id: { in: q2campaigns.map((c) => c.id) } },
        });
        console.log(`   🗑  ${q2campaigns.length} Q2 kampány törölve`);
      }
    }

    // ── Create marketing team members ───────────────────────────────────────────
    console.log(`\n👤  Marketing csapattagok létrehozása...`);

    const createdProfiles: { id: string; email: string; full: boolean }[] = [];

    for (const m of MARKETING_MEMBERS) {
      let profile = await prisma.userProfile.findFirst({
        where: { email: m.email },
        select: { id: true },
      });

      if (!profile) {
        const profileData: Parameters<typeof prisma.userProfile.create>[0]["data"] = {
          email: m.email,
          username: m.username,
          testType: "HEXACO",
          testTypeAssignedAt: new Date(),
        };
        // noOnboarding: nincs onboardedAt → még nem töltötte ki a demógrafikát
        if (!m.noOnboarding) {
          profileData.onboardedAt = new Date();
        }
        profile = await prisma.userProfile.create({ data: profileData, select: { id: true } });
      }

      // Org membership (@@unique[userId] — csak ha még nincs)
      const hasMembership = await prisma.organizationMember.findUnique({
        where: { userId: profile.id },
      });
      if (!hasMembership) {
        await prisma.organizationMember.create({
          data: { orgId: org.id, userId: profile.id, role: "ORG_MEMBER" },
        });
      }

      // Team membership
      const hasTeam = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: team.id, userId: profile.id } },
      });
      if (!hasTeam) {
        await prisma.teamMember.create({
          data: { teamId: team.id, userId: profile.id, role: "member" },
        });
      }

      // Assessment result — csak a "full" tagoknál
      if (m.full) {
        const hasResult = await prisma.assessmentResult.findFirst({
          where: { userProfileId: profile.id, isSelfAssessment: true },
          select: { id: true },
        });
        if (!hasResult) {
          await prisma.assessmentResult.create({
            data: {
              userProfileId: profile.id,
              testType: "HEXACO",
              isSelfAssessment: true,
              scores: generateHexacoScores() as object,
            },
          });
        }
      }

      createdProfiles.push({ id: profile.id, email: m.email, full: m.full });
      const tag = m.full ? "✅ teljes" : "⚠️  félig";
      console.log(`   ${tag}  ${m.username}`);
    }

    // ── Observer data — csak a full profilok között ─────────────────────────────
    console.log("\n👁️   Observer adatok (full tagok között)...");
    const fullProfiles = createdProfiles.filter((p) => p.full);
    for (const profile of fullProfiles) {
      const others = fullProfiles.filter((p) => p.id !== profile.id).slice(0, 1);
      for (const observer of others) {
        const exists = await prisma.observerInvitation.findFirst({
          where: { inviterId: profile.id, observerProfileId: observer.id },
          select: { id: true },
        });
        if (exists) continue;
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
            relationshipType: RELATIONSHIPS[rand(0, 1)],
            knownDuration: DURATIONS[rand(0, 2)],
            scores: generateHexacoScores() as object,
            confidence: rand(3, 5),
          },
        });
      }
    }
    console.log(`   ✅  Observer assessmentek létrehozva`);

    // ── Q2 2026 kampány — félig befejezett ─────────────────────────────────────
    console.log("\n🎯  Q2 2026 kampány létrehozása...");

    // Az org admin megkeresése (ORG_ADMIN role)
    const adminMembership = await prisma.organizationMember.findFirst({
      where: { orgId: org.id, role: "ORG_ADMIN" },
      select: { userId: true },
    });
    if (!adminMembership) {
      console.error("❌  Nem találom az org admint");
      process.exit(1);
    }

    const campaign = await prisma.campaign.create({
      data: {
        orgId: org.id,
        name: "Q2 2026 — Marketing 360° Értékelés",
        description: "Második negyedév — marketing csapat személyiségalapú 360 fokos visszajelzési köre.",
        status: "ACTIVE",
        createdBy: adminMembership.userId,
      },
      select: { id: true },
    });

    // Résztvevők: az admin + csak a full marketing tagok (a félig kitöltöttek hiányoznak)
    const campaignParticipants = [adminMembership.userId, ...fullProfiles.map((p) => p.id)];
    for (const userId of campaignParticipants) {
      await prisma.campaignParticipant.create({
        data: { campaignId: campaign.id, userId },
      }).catch(() => {/* skip duplicates */});
    }
    console.log(`   ✅  Kampány létrehozva: ${campaignParticipants.length} résztvevő`);
    console.log(`   ℹ️   Hiányzó résztvevők: ${MARKETING_MEMBERS.filter((m) => !m.full).map((m) => m.username).join(", ")}`);

    // ── Done ───────────────────────────────────────────────────────────────────
    console.log(`
🎉  Kész!

   Marketing csapat: http://localhost:3000/team/${team.id}
   Org kampányok:    http://localhost:3000/org/${org.id}?tab=campaigns
   Q2 kampány:       http://localhost:3000/org/${org.id}/campaigns/${campaign.id}

   Tagok:
   ✅ Farkas Nóra   — teljes profil + HEXACO
   ✅ Simon Ádám    — teljes profil + HEXACO
   ✅ Papp Judit    — teljes profil + HEXACO
   ⚠️  Lőrincz Bence — onboarding kész, teszt hiányzik
   ⚠️  Hegedűs Petra — onboarding sem kész
`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("❌  Hiba:", (e as Error).message);
  process.exit(1);
});
