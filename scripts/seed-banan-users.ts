/**
 * Banán-csapat: 2 BEJELENTKEZHETŐ sima tag seedelése (peer feedback próbához).
 *
 * A meglévő seed-banan-demo tagjai nem Clerk-userek (nem lehet velük belépni) —
 * ez a szkript két valódi Clerk teszt-usert hoz létre, feltöltött TRITAN
 * profillal, org- és csapat-tagsággal.
 *
 * Futtatás:
 *   npx tsx scripts/seed-banan-users.ts                  # a "Banán" nevű csapatba
 *   npx tsx scripts/seed-banan-users.ts --team <teamId>  # konkrét csapatba
 *   npx tsx scripts/seed-banan-users.ts --team-name Banán
 *
 * Belépés (Clerk dev teszt-mód): /sign-in → email → kód: 424242
 *   banan-panna+clerk_test@trita.io   (Banán Panna)
 *   banan-david+clerk_test@trita.io   (Banán Dávid)
 *
 * Előfeltétel: CLERK_SECRET_KEY (sk_test_…) és DATABASE_URL az .env(.local)-ban.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";
import { buildFacets } from "./personas.shared";

// .env(.local) betöltés (a personas-seed mintája)
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

// Két, egymástól jól elütő, determinisztikus profil
const USERS = [
  {
    email: "banan-panna+clerk_test@trita.io",
    username: "Banán Panna",
    firstName: "Banán",
    lastName: "Panna",
    // Empatikus hídépítő jelleg: magas RESO+ADAP
    dimensions: { INTE: 58, RESO: 84, TEMP: 52, ADAP: 76, THOR: 46, OPEN: 55 },
  },
  {
    email: "banan-david+clerk_test@trita.io",
    username: "Banán Dávid",
    firstName: "Banán",
    lastName: "Dávid",
    // Elvhű rendszerépítő jelleg: magas THOR+INTE
    dimensions: { INTE: 78, RESO: 48, TEMP: 55, ADAP: 44, THOR: 84, OPEN: 50 },
  },
];

async function main() {
  const args = parseArgs();

  if (!CLERK_SECRET_KEY.startsWith("sk_test_")) {
    console.error("❌  CLERK_SECRET_KEY hiányzik vagy nem dev-kulcs (sk_test_…).");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    // Cél-csapat
    const team = args.team
      ? await prisma.team.findUnique({
          where: { id: args.team },
          select: { id: true, name: true, orgId: true },
        })
      : await prisma.team.findFirst({
          where: { name: args["team-name"] ?? "Banán" },
          orderBy: { createdAt: "desc" },
          select: { id: true, name: true, orgId: true },
        });
    if (!team || !team.orgId) {
      console.error(
        "❌  Nem találtam a cél-csapatot (vagy nincs org-ja). " +
          "Futtasd előbb: pnpm seed:banan --org <orgId>, vagy add meg: --team <teamId>.",
      );
      process.exit(1);
    }
    console.log(`🍌  Cél-csapat: ${team.name} (${team.id})`);

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

      await prisma.organizationMember.upsert({
        where: { orgId_userId: { orgId: team.orgId, userId: profile.id } },
        create: { orgId: team.orgId, userId: profile.id, role: "ORG_MEMBER" },
        update: { leftAt: null },
      });
      await prisma.teamMember.upsert({
        where: { teamId_userId: { teamId: team.id, userId: profile.id } },
        create: { teamId: team.id, userId: profile.id, role: "member" },
        update: {},
      });

      console.log(`✅  ${u.username} — ${u.email} (clerkId: ${clerkId})`);
    }

    console.log("\n🔑  Belépés: /sign-in → email → kód: 424242");
    console.log("    banan-panna+clerk_test@trita.io");
    console.log("    banan-david+clerk_test@trita.io\n");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
