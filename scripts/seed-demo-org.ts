/**
 * Demo-szervezet seed: "Horizont Kft." + "Horizont csapat" 5 BEJELENTKEZHETŐ
 * taggal, kitöltött TRITAN self-profillal, observer-adat NÉLKÜL — kampány-
 * flow-k (mérési kör, meghívók, tag-nézet) végigpróbálásához úgy, hogy az
 * egyes userek nevében el lehet járni.
 *
 * Futtatás:
 *   npx tsx scripts/seed-demo-org.ts            # létrehozás (idempotens)
 *   npx tsx scripts/seed-demo-org.ts --teardown # teljes törlés (org + userek DB-ből)
 *
 * Belépés (Clerk dev teszt-mód): /sign-in → email → kód: 424242
 *   horizont-anna+clerk_test@trita.io    (Horizont Anna — ORG_ADMIN)
 *   horizont-balazs+clerk_test@trita.io  (Horizont Balázs)
 *   horizont-csilla+clerk_test@trita.io  (Horizont Csilla)
 *   horizont-daniel+clerk_test@trita.io  (Horizont Dániel)
 *   horizont-eszter+clerk_test@trita.io  (Horizont Eszter)
 *
 * A platform-admin (ADMIN_EMAILS első címe) ORG_CONSULTANT-ként kerül be,
 * hogy a saját fiókodból indíthass mérést a szervezetben. Aktív team-
 * előfizetést is kap az org (12 hó), így a kampány-képességek nyitottak.
 *
 * Előfeltétel: CLERK_SECRET_KEY (sk_test_…) és DATABASE_URL az .env(.local)-ban.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";
import { buildFacets } from "./personas.shared";

for (const file of [".env.local", ".env"]) {
  try {
    const content = readFileSync(resolve(process.cwd(), file), "utf-8");
    for (const line of content.split("\n")) {
      const m = /^([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line.trim());
      if (m) {
        const [, key, raw] = m;
        if (!process.env[key]) {
          process.env[key] = raw.replace(/^['"]|['"]$/g, "").trim();
        }
      }
    }
  } catch {
    // nincs ilyen fájl — oké
  }
}

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY ?? "";
const CLERK_API = "https://api.clerk.com/v1";

const ORG_NAME = "Horizont Kft.";
const TEAM_NAME = "Horizont csapat";

async function clerkFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${CLERK_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

async function findClerkUserByEmail(email: string): Promise<string | null> {
  const res = await clerkFetch(`/users?email_address=${encodeURIComponent(email)}&limit=1`);
  if (!res.ok) throw new Error(`Clerk user-keresés hiba (${res.status}): ${await res.text()}`);
  const users = (await res.json()) as Array<{ id: string }>;
  return users[0]?.id ?? null;
}

async function ensureClerkUser(email: string, firstName: string, lastName: string): Promise<string> {
  const existing = await findClerkUserByEmail(email);
  if (existing) return existing;
  const res = await clerkFetch("/users", {
    method: "POST",
    body: JSON.stringify({
      email_address: [email],
      first_name: firstName,
      last_name: lastName,
      skip_password_requirement: true,
    }),
  });
  if (!res.ok) throw new Error(`Clerk user-létrehozás hiba (${res.status}): ${await res.text()}`);
  const user = (await res.json()) as { id: string };
  return user.id;
}

// Öt, egymástól jól elütő, determinisztikus HEXACO-profil
const USERS = [
  {
    email: "horizont-anna+clerk_test@trita.io",
    username: "Horizont Anna",
    firstName: "Horizont",
    lastName: "Anna",
    role: "ORG_ADMIN" as const,
    // Módszeres szervező: magas THOR+INTE
    dimensions: { INTE: 76, RESO: 50, TEMP: 48, ADAP: 55, THOR: 86, OPEN: 52 },
  },
  {
    email: "horizont-balazs+clerk_test@trita.io",
    username: "Horizont Balázs",
    firstName: "Horizont",
    lastName: "Balázs",
    role: "ORG_MEMBER" as const,
    // Energikus kapcsolatépítő: magas TEMP+ADAP
    dimensions: { INTE: 52, RESO: 44, TEMP: 84, ADAP: 74, THOR: 50, OPEN: 58 },
  },
  {
    email: "horizont-csilla+clerk_test@trita.io",
    username: "Horizont Csilla",
    firstName: "Horizont",
    lastName: "Csilla",
    role: "ORG_MEMBER" as const,
    // Kísérletező újító: magas OPEN, alacsonyabb THOR
    dimensions: { INTE: 55, RESO: 58, TEMP: 60, ADAP: 52, THOR: 40, OPEN: 88 },
  },
  {
    email: "horizont-daniel+clerk_test@trita.io",
    username: "Horizont Dániel",
    firstName: "Horizont",
    lastName: "Dániel",
    role: "ORG_MEMBER" as const,
    // Nyugodt stabilizáló: alacsony RESO, kiegyensúlyozott
    dimensions: { INTE: 62, RESO: 30, TEMP: 45, ADAP: 66, THOR: 60, OPEN: 48 },
  },
  {
    email: "horizont-eszter+clerk_test@trita.io",
    username: "Horizont Eszter",
    firstName: "Horizont",
    lastName: "Eszter",
    role: "ORG_MEMBER" as const,
    // Empatikus támogató: magas RESO+ADAP
    dimensions: { INTE: 60, RESO: 82, TEMP: 50, ADAP: 78, THOR: 54, OPEN: 56 },
  },
];

async function teardown(prisma: PrismaClient) {
  const org = await prisma.organization.findFirst({
    where: { name: ORG_NAME },
    select: { id: true },
  });
  if (org) {
    await prisma.organization.delete({ where: { id: org.id } });
    console.log(`🗑  Org törölve: ${ORG_NAME}`);
  }
  const emails = USERS.map((u) => u.email);
  const profiles = await prisma.userProfile.findMany({
    where: { email: { in: emails } },
    select: { id: true, email: true },
  });
  for (const p of profiles) {
    await prisma.assessmentResult.deleteMany({ where: { userProfileId: p.id } });
    await prisma.assessmentDraft.deleteMany({ where: { userProfileId: p.id } });
    await prisma.userProfile.delete({ where: { id: p.id } }).catch(() => {
      console.log(`⚠️  ${p.email} profil nem törölhető (kapcsolódó adat) — megtartva`);
    });
  }
  console.log("ℹ️  A Clerk-userek megmaradnak (újra-seedelésnél újrahasznosulnak).");
}

async function main() {
  if (!CLERK_SECRET_KEY.startsWith("sk_test_")) {
    console.error("❌  CLERK_SECRET_KEY hiányzik vagy nem dev-kulcs (sk_test_…).");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    if (process.argv.includes("--teardown")) {
      await teardown(prisma);
      return;
    }

    // 1) Userek: Clerk + UserProfile + kitöltött self-eredmény (observer NINCS)
    const profiles: Array<{ id: string; role: string; username: string }> = [];
    for (const u of USERS) {
      const clerkId = await ensureClerkUser(u.email, u.firstName, u.lastName);
      const profile = await prisma.userProfile.upsert({
        where: { clerkId },
        update: {
          email: u.email,
          username: u.username,
          testType: "TRITAN",
          onboardedAt: new Date(),
          consentedAt: new Date(),
          locale: "hu",
        },
        create: {
          clerkId,
          email: u.email,
          username: u.username,
          testType: "TRITAN",
          testTypeAssignedAt: new Date(),
          onboardedAt: new Date(),
          consentedAt: new Date(),
          locale: "hu",
        },
      });
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
            scores: {
              type: "likert",
              dimensions: u.dimensions,
              facets: buildFacets(u.dimensions),
              answers: [],
              questionCount: 60,
            } as object,
          },
        });
      }
      profiles.push({ id: profile.id, role: u.role, username: u.username });
      console.log(`✅  ${u.username} — ${u.email}`);
    }

    // 2) Org (owner: Anna) + aktív team-előfizetés
    const owner = profiles[0];
    let org = await prisma.organization.findFirst({
      where: { name: ORG_NAME },
      select: { id: true },
    });
    if (!org) {
      org = await prisma.organization.create({
        data: { name: ORG_NAME, ownerId: owner.id },
        select: { id: true },
      });
    }
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 12);
    await prisma.subscription.upsert({
      where: { orgId: org.id },
      create: {
        orgId: org.id,
        status: "active",
        planType: "team",
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
      },
      update: {
        status: "active",
        planType: "team",
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
        trialEndsAt: null,
        cancelAtPeriodEnd: false,
      },
    });

    // 3) Tagságok + csapat
    for (const p of profiles) {
      await prisma.organizationMember.upsert({
        where: { orgId_userId: { orgId: org.id, userId: p.id } },
        create: { orgId: org.id, userId: p.id, role: p.role },
        update: { role: p.role, leftAt: null },
      });
    }
    let team = await prisma.team.findFirst({
      where: { orgId: org.id, name: TEAM_NAME },
      select: { id: true },
    });
    if (!team) {
      team = await prisma.team.create({
        data: { name: TEAM_NAME, orgId: org.id, ownerId: owner.id },
        select: { id: true },
      });
    }
    for (const p of profiles) {
      await prisma.teamMember.upsert({
        where: { teamId_userId: { teamId: team.id, userId: p.id } },
        create: { teamId: team.id, userId: p.id, role: "member" },
        update: {},
      });
    }

    // 4) Platform-admin mint tanácsadó — a saját fiókodból indíthatsz mérést
    const adminEmail = (process.env.ADMIN_EMAILS ?? "").split(",")[0]?.trim();
    if (adminEmail) {
      const admin = await prisma.userProfile.findFirst({
        where: { email: { equals: adminEmail, mode: "insensitive" }, deleted: false },
        select: { id: true },
      });
      if (admin) {
        await prisma.organizationMember.upsert({
          where: { orgId_userId: { orgId: org.id, userId: admin.id } },
          create: { orgId: org.id, userId: admin.id, role: "ORG_CONSULTANT" },
          update: { role: "ORG_CONSULTANT", leftAt: null },
        });
        console.log(`🎓  Tanácsadó hozzárendelve: ${adminEmail}`);
      }
    }

    console.log(`\n🏢  Org: ${ORG_NAME} (${org.id})`);
    console.log(`👥  Csapat: ${TEAM_NAME} (${team.id}) — 5 tag, kitöltött profillal, observer nélkül`);
    console.log("\n🔑  Belépés: /sign-in → email → kód: 424242");
    for (const u of USERS) console.log(`    ${u.email}${u.role === "ORG_ADMIN" ? "  (ORG_ADMIN)" : ""}`);
    console.log();
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
