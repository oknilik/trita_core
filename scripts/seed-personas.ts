/**
 * seed-personas.ts — bejelentkezhető dummy userek minden archetípus-kimenethez.
 *
 * A személyiségtípus a két legerősebb TRITAN-dimenzióból áll össze
 * (src/lib/personality-type.ts) → 6×5 = 30 rendezett kombináció.
 * Minden kombinációhoz egy Clerk teszt-user + UserProfile + determinisztikus
 * AssessmentResult készül.
 *
 * Belépés (Clerk dev instance teszt-módja):
 *   /sign-in → email (lásd kiírt táblázat) → kód: 424242
 *
 * Futtatás:
 *   pnpm seed:personas                 # mind a 48 persona (30 archetípus + 18 feszültség-pár)
 *   pnpm seed:personas --observers 3   # + 3 observer-válasz personánként
 *   pnpm seed:personas --only inte-open,temp-reso
 *   pnpm seed:personas --clean         # persona-eredmények törlése + újraseed
 *   pnpm seed:personas --list          # csak a táblázat, seed nélkül
 *
 * Előfeltétel: CLERK_SECRET_KEY (sk_test_…) és DATABASE_URL az .env(.local)-ban.
 * Éles (sk_live) kulccsal a script elutasítja a futást.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { PrismaClient, type RelationshipType } from "@prisma/client";
import {
  type Persona,
  buildAllPersonas,
  buildFacets,
} from "./personas.shared";

// ─── Env ──────────────────────────────────────────────────────────────────────

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
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
      /* próbáljuk a következőt */
    }
  }
}

loadEnv();

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY ?? "";
const CLERK_API = "https://api.clerk.com/v1";

// ─── Clerk Backend API (nyers REST — pnpm alatt a @clerk/backend nem elérhető) ─

async function clerkFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${CLERK_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

async function findClerkUserByEmail(email: string): Promise<string | null> {
  const res = await clerkFetch(`/users?email_address=${encodeURIComponent(email)}&limit=1`);
  if (!res.ok) throw new Error(`Clerk user-keresés hiba (${res.status}): ${await res.text()}`);
  const users = (await res.json()) as Array<{ id: string }>;
  return users[0]?.id ?? null;
}

async function ensureClerkUser(persona: Persona): Promise<string> {
  const existing = await findClerkUserByEmail(persona.email);
  if (existing) return existing;

  const res = await clerkFetch("/users", {
    method: "POST",
    body: JSON.stringify({
      email_address: [persona.email],
      first_name: persona.label,
      last_name: "(persona)",
      skip_password_requirement: true,
    }),
  });
  if (!res.ok) throw new Error(`Clerk user-létrehozás hiba (${res.status}): ${await res.text()}`);
  const user = (await res.json()) as { id: string };
  return user.id;
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

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

const RELATIONSHIPS: RelationshipType[] = ["FRIEND", "COLLEAGUE", "FAMILY", "PARTNER", "OTHER"];
const DURATIONS = ["LT_1", "1_3", "3_5", "5P"];

function printTable(personas: Persona[]) {
  console.log("\n┌─ Personák — belépés: /sign-in → email → kód: 424242 ─┐\n");
  const slugWidth = Math.max(...personas.map((p) => p.slug.length));
  const labelWidth = Math.max(...personas.map((p) => p.label.length));
  for (const p of personas) {
    console.log(
      `  ${p.slug.padEnd(slugWidth)}  ${p.label.padEnd(labelWidth)}  ${p.email}` +
        (p.tensionKey ? `  [pár: ${p.tensionKey}]` : ""),
    );
  }
  console.log(`\n  Összesen: ${personas.length} persona\n`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs();
  let personas = buildAllPersonas();

  if ("help" in args) {
    console.log(`
Persona seed — bejelentkezhető dummy user minden archetípus- és feszültségpár-kimenethez (48 db)

  pnpm seed:personas                 mind a 48 persona (30 archetípus + 18 feszültség-pár)
  pnpm seed:personas --observers 3   + observer-válaszok personánként
  pnpm seed:personas --only inte-open,temp-reso   csak a felsorolt slugok
  pnpm seed:personas --clean         korábbi persona-eredmények törlése + újraseed
  pnpm seed:personas --list          táblázat kiírása seed nélkül

Belépés: /sign-in → persona-email → kód: 424242 (Clerk dev teszt-mód)
`);
    return;
  }

  if ("only" in args) {
    const wanted = new Set(args.only.split(",").map((s) => s.trim().toLowerCase()));
    personas = personas.filter((p) => wanted.has(p.slug));
    if (personas.length === 0) {
      console.error("❌  A --only szűrő egyetlen personát sem talált.");
      process.exit(1);
    }
  }

  if ("list" in args) {
    printTable(personas);
    return;
  }

  if (!CLERK_SECRET_KEY.startsWith("sk_test_")) {
    console.error(
      "❌  CLERK_SECRET_KEY hiányzik vagy nem dev-kulcs (sk_test_…). " +
        "A persona-seed csak fejlesztői Clerk instance-on futtatható.",
    );
    process.exit(1);
  }

  const observerCount = Math.max(0, parseInt(args.observers ?? "0", 10) || 0);
  const clean = "clean" in args;
  const prisma = new PrismaClient();

  try {
    for (const persona of personas) {
      const clerkId = await ensureClerkUser(persona);

      const profile = await prisma.userProfile.upsert({
        where: { clerkId },
        update: {
          email: persona.email,
          username: persona.label,
          testType: "TRITAN",
          onboardedAt: new Date(),
          consentedAt: new Date(),
          locale: "hu",
        },
        create: {
          clerkId,
          email: persona.email,
          username: persona.label,
          testType: "TRITAN",
          testTypeAssignedAt: new Date(),
          onboardedAt: new Date(),
          consentedAt: new Date(),
          locale: "hu",
        },
      });

      if (clean) {
        const invites = await prisma.observerInvitation.findMany({
          where: { inviterId: profile.id },
          select: { id: true },
        });
        if (invites.length > 0) {
          const ids = invites.map((i) => i.id);
          await prisma.observerDraft.deleteMany({ where: { invitationId: { in: ids } } });
          await prisma.observerAssessment.deleteMany({ where: { invitationId: { in: ids } } });
          await prisma.observerInvitation.deleteMany({ where: { inviterId: profile.id } });
        }
        await prisma.assessmentResult.deleteMany({ where: { userProfileId: profile.id } });
      }

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
              dimensions: persona.dimensions,
              facets: buildFacets(persona.dimensions),
              answers: [],
              questionCount: 60,
            } as object,
          },
        });
      }

      const existingObservers = await prisma.observerInvitation.count({
        where: { inviterId: profile.id, status: "COMPLETED" },
      });
      for (let i = existingObservers; i < observerCount; i++) {
        const invitation = await prisma.observerInvitation.create({
          data: {
            inviterId: profile.id,
            observerEmail: `observer${i + 1}-${persona.slug}@seed.test`,
            testType: "TRITAN",
            status: "COMPLETED",
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            completedAt: new Date(),
          },
        });
        // Determinisztikus eltérés a self-képtől: observerenként ±(6..14)
        const shift = (i % 2 === 0 ? 1 : -1) * (6 + i * 4);
        const obsDimensions: Record<string, number> = {};
        for (const [dim, value] of Object.entries(persona.dimensions)) {
          obsDimensions[dim] = Math.max(0, Math.min(100, value + shift));
        }
        await prisma.observerAssessment.create({
          data: {
            invitationId: invitation.id,
            relationshipType: RELATIONSHIPS[i % RELATIONSHIPS.length],
            knownDuration: DURATIONS[i % DURATIONS.length],
            scores: {
              type: "likert",
              dimensions: obsDimensions,
              facets: buildFacets(obsDimensions),
              answers: [],
              questionCount: 60,
            } as object,
            confidence: 3 + (i % 3),
          },
        });
      }

      console.log(
        `✅  ${persona.slug.padEnd(9)} ${persona.label} — clerkId: ${clerkId}` +
          (observerCount > 0 ? `  (+${observerCount} observer)` : ""),
      );
    }

    printTable(personas);
    console.log("🎉  Kész. Belépés után: /profile/results\n");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("❌  Hiba:", (e as Error).message);
  process.exit(1);
});
