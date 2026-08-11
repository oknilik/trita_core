/**
 * seed-assessment.ts
 *
 * Test data generator — gyorsan hoz létre egy assessment eredményt
 * a DB-ben, opcionálisan observer válaszokkal.
 *
 * Futtatás:
 *   pnpm seed:assessment --email user@example.com --observers 3
 *
 * Opciók:
 *   --email <email>       Felhasználó email (kötelező)
 *   --observers <n>       Observer válaszok száma (alapértelmezett: 0)
 *   --candidates <n>      Candidate (jelölt) assessmentek száma (alapértelmezett: 0)
 *   --team-id <id>        Team ID amelyhez a jelöltek kapcsolódnak (opcionális)
 *   --tritan <values>     Fix TRITAN dimenziók (pl.: H=70,E=40,X=60,A=55,C=80,O=35)
 *   --clean               Törli az összes meglévő assessment eredményt a userhez
 *   --help                Súgó
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { PrismaClient, type RelationshipType } from "@prisma/client";

// ─── Load .env.local ──────────────────────────────────────────────────────────

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
      // not found, try next
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

// ─── Score generation ─────────────────────────────────────────────────────────

function rand(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}

function nearbyScore(base: number, variance = 18): number {
  return Math.max(5, Math.min(95, Math.round(base + (Math.random() - 0.5) * 2 * variance)));
}

// A kiegészítő altruizmus-skála (`I`) 2026-08-11 óta NEM része a rövid
// (TSFI-S, 60 itemes) formának, amit ez a seed emulál (questionCount: 60) —
// ezért nem is generálunk rá pontszámot. Egy valódi mai kitöltés score-JSON-ja
// sem tartalmaz `I`-t, a seedelt soroknak pedig azt kell mutatniuk, amit az
// éles felület kap (a régi, `I`-t hordozó sorokat a felület továbbra is
// megjeleníti, de újat nem gyártunk).
const TRITAN_FACETS: Record<string, string[]> = {
  INTE: ["sincerity", "fairness", "greed_avoidance", "modesty"],
  RESO: ["fearfulness", "anxiety", "dependence", "sentimentality"],
  TEMP: ["social_self_esteem", "social_boldness", "sociability", "liveliness"],
  ADAP: ["forgiveness", "gentleness", "flexibility", "patience"],
  THOR: ["organization", "diligence", "prudence", "perfectionism"],
  OPEN: ["aesthetic_appreciation", "inquisitiveness", "creativity", "unconventionality"],
};

type ScoreJSON = {
  type: "likert";
  dimensions: Record<string, number>;
  facets?: Record<string, Record<string, number>>;
  answers: unknown[];
  questionCount: number;
};

type TritanDimensions = Record<"H" | "E" | "X" | "A" | "C" | "O", number>;

const TRITAN_DIM_CODES = ["H", "E", "X", "A", "C", "O"] as const;

// A CLI a HEXACO-BETŰKET ígéri (`--tritan H=70,E=40,…`), a score-JSON viszont
// a BELSŐ dimenziókódokat használja (INTE/RESO/TEMP/ADAP/THOR/OPEN). A
// generátor korábban a belső kódokkal indexelte a betűkkel kulcsolt objektumot,
// így a `fixed` MINDIG undefined lett: a `--tritan` paraméter némán elveszett,
// és a seed akkor is véletlen pontszámokat írt, ha a hívó fix profilt kért.
const INTERNAL_DIM_BY_LETTER: Record<(typeof TRITAN_DIM_CODES)[number], string> = {
  H: "INTE",
  E: "RESO",
  X: "TEMP",
  A: "ADAP",
  C: "THOR",
  O: "OPEN",
};
const LETTER_BY_INTERNAL_DIM: Record<string, (typeof TRITAN_DIM_CODES)[number]> =
  Object.fromEntries(
    Object.entries(INTERNAL_DIM_BY_LETTER).map(([letter, dim]) => [dim, letter]),
  ) as Record<string, (typeof TRITAN_DIM_CODES)[number]>;

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function parseTritanDimensions(raw: string): TritanDimensions {
  const trimmed = raw.trim();
  const result: Partial<TritanDimensions> = {};

  if (trimmed.startsWith("{")) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      throw new Error("A --tritan JSON formátuma hibás.");
    }
    if (!parsed || typeof parsed !== "object") {
      throw new Error("A --tritan JSON formátuma hibás.");
    }
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      const key = k.trim().toUpperCase();
      if (!TRITAN_DIM_CODES.includes(key as (typeof TRITAN_DIM_CODES)[number])) continue;
      if (typeof v !== "number" || !Number.isFinite(v)) {
        throw new Error(`A --tritan dimenzió értéke szám kell legyen: ${key}`);
      }
      result[key as keyof TritanDimensions] = clampScore(v);
    }
  } else {
    const pairs = trimmed.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
    for (const pair of pairs) {
      const match = pair.match(/^([A-Za-z])\s*[:=]\s*(-?\d+(?:\.\d+)?)$/);
      if (!match) {
        throw new Error(`Érvénytelen --tritan elem: "${pair}". Várt formátum pl. H=70`);
      }
      const key = match[1].toUpperCase();
      const value = Number.parseFloat(match[2]);
      if (!TRITAN_DIM_CODES.includes(key as (typeof TRITAN_DIM_CODES)[number])) {
        throw new Error(`Ismeretlen TRITAN dimenzió: ${key}`);
      }
      if (!Number.isFinite(value)) {
        throw new Error(`Érvénytelen szám: ${pair}`);
      }
      result[key as keyof TritanDimensions] = clampScore(value);
    }
  }

  for (const dim of TRITAN_DIM_CODES) {
    if (result[dim] === undefined) {
      throw new Error(`A --tritan paraméterből hiányzik a(z) ${dim} dimenzió.`);
    }
  }

  return result as TritanDimensions;
}

function generateTritanScores(opts?: {
  fixedDimensions?: TritanDimensions;
  aroundBaseVariance?: number;
}): ScoreJSON {
  const dimensions: Record<string, number> = {};
  const facets: Record<string, Record<string, number>> = {};

  for (const [dim, facetList] of Object.entries(TRITAN_FACETS)) {
    const letter = LETTER_BY_INTERNAL_DIM[dim];
    const fixed = letter ? opts?.fixedDimensions?.[letter] : undefined;
    const variance = opts?.aroundBaseVariance ?? 0;
    const base = fixed === undefined
      ? rand(22, 83)
      : variance > 0
        ? nearbyScore(fixed, variance)
        : clampScore(fixed);
    dimensions[dim] = base;
    facets[dim] = {};
    for (const facet of facetList) {
      facets[dim][facet] = nearbyScore(base);
    }
  }

  return { type: "likert", dimensions, facets, answers: [], questionCount: 60 };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const RELATIONSHIPS: RelationshipType[] = ["FRIEND", "COLLEAGUE", "FAMILY", "PARTNER", "OTHER"];
const DURATIONS = ["LT_1", "1_3", "3_5", "5P"];

const FAKE_CANDIDATES: { name: string; email: string; position: string }[] = [
  { name: "Kovács Péter",    email: "kovacs.peter@seed.test",    position: "Frontend fejlesztő" },
  { name: "Nagy Eszter",     email: "nagy.eszter@seed.test",     position: "Termékmenedzser" },
  { name: "Szabó Dávid",    email: "szabo.david@seed.test",     position: "Backend fejlesztő" },
  { name: "Tóth Réka",      email: "toth.reka@seed.test",       position: "UX designer" },
  { name: "Horváth Balázs", email: "horvath.balazs@seed.test",  position: "DevOps mérnök" },
  { name: "Varga Anna",     email: "varga.anna@seed.test",      position: "Értékesítési vezető" },
  { name: "Kiss Gábor",     email: "kiss.gabor@seed.test",      position: "Adatelemző" },
  { name: "Fekete Zsófia",  email: "fekete.zsofia@seed.test",   position: "Marketingmenedzser" },
  { name: "Balogh Tamás",   email: "balogh.tamas@seed.test",    position: "Ügyfélsikermenedzser" },
  { name: "Molnár Lilla",   email: "molnar.lilla@seed.test",    position: "HR specialista" },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs();

  if ("help" in args) {
    console.log(`
Teszt assessment seed script

Futtatás:
  pnpm seed:assessment [options]

Opciók:
  --email <email>       Felhasználó email (kötelező)
  --observers <n>       Observer válaszok száma  (alapért.: 0)
  --candidates <n>      Jelölt (candidate) assessmentek száma  (alapért.: 0)
  --team-id <id>        Team ID amelyhez a jelöltek kapcsolódnak  (opcionális)
  --tritan <values>     Fix TRITAN dimenziók (pl. H=70,E=40,X=60,A=55,C=80,O=35)
  --clean               Törli az összes korábbi assessment eredményt
  --help                Ez a súgó

Példák:
  pnpm seed:assessment --email me@example.com
  pnpm seed:assessment --email me@example.com --observers 3
  pnpm seed:assessment --email me@example.com --clean --observers 2
  pnpm seed:assessment --email me@example.com --tritan H=70,E=40,X=60,A=55,C=80,O=35
  pnpm seed:assessment --email me@example.com --candidates 5
  pnpm seed:assessment --email me@example.com --candidates 3 --team-id clxyz123 --tritan H=70,E=40,X=60,A=55,C=80,O=35
`);
    return;
  }

  const email = args.email;
  if (!email) {
    console.error("❌  --email megadása kötelező");
    process.exit(1);
  }

  const observerCount = Math.max(0, parseInt(args.observers ?? "0", 10) || 0);
  const candidateCount = Math.max(0, parseInt(args.candidates ?? "0", 10) || 0);
  const teamId = args["team-id"] ?? null;
  const clean = "clean" in args;
  const tritanInput = args.tritan;

  let fixedTritan: TritanDimensions | undefined;
  if (tritanInput) {
    try {
      fixedTritan = parseTritanDimensions(tritanInput);
    } catch (error) {
      console.error(`❌  Hibás --tritan paraméter: ${(error as Error).message}`);
      process.exit(1);
    }
  }

  const prisma = new PrismaClient();

  try {
    // ── Find user ───────────────────────────────────────────────────────────
    console.log(`\n🔍  Felhasználó keresése: ${email}`);
    const profile = await prisma.userProfile.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true, clerkId: true, email: true, testType: true },
    });

    if (!profile) {
      console.error(`❌  Nem találom a felhasználót: ${email}`);
      process.exit(1);
    }
    console.log(`✅  Megtalálva — profile id: ${profile.id}  clerkId: ${profile.clerkId ?? "nincs"}  testType: ${profile.testType ?? "nincs"}`);

    // ── Clean up existing results ───────────────────────────────────────────
    if (clean) {
      const draft = await prisma.assessmentDraft.findUnique({ where: { userProfileId: profile.id } });
      if (draft) {
        await prisma.assessmentDraft.delete({ where: { userProfileId: profile.id } });
        console.log(`🧹  Törölve AssessmentDraft`);
      }

      const results = await prisma.assessmentResult.findMany({
        where: { userProfileId: profile.id },
        select: { id: true },
      });
      if (results.length > 0) {
        const resultIds = results.map((r) => r.id);
        // dimension-feedback targetKey: "<assessmentResultId>:<dimCode>"
        const { count: fbCount } = await prisma.feedback.deleteMany({
          where: {
            kind: "dimension",
            OR: resultIds.map((id) => ({ targetKey: { startsWith: `${id}:` } })),
          },
        });
        if (fbCount > 0) console.log(`🧹  Törölve ${fbCount} dimenzió-feedback`);
      }

      const { count: resultCount } = await prisma.assessmentResult.deleteMany({
        where: { userProfileId: profile.id },
      });
      if (resultCount > 0) console.log(`🧹  Törölve ${resultCount} AssessmentResult`);

      const invites = await prisma.observerInvitation.findMany({
        where: { inviterId: profile.id },
        select: { id: true },
      });
      if (invites.length > 0) {
        const ids = invites.map((i) => i.id);
        await prisma.observerDraft.deleteMany({ where: { invitationId: { in: ids } } });
        await prisma.observerAssessment.deleteMany({ where: { invitationId: { in: ids } } });
        await prisma.observerInvitation.deleteMany({ where: { inviterId: profile.id } });
        console.log(`🧹  Törölve ${invites.length} ObserverInvitation (draft + assessment)`);
      }

      const { count: feedbackCount } = await prisma.feedback.deleteMany({
        where: { userProfileId: profile.id },
      });
      if (feedbackCount > 0) console.log(`🧹  Törölve ${feedbackCount} Feedback`);

      const candidateInvites = await prisma.candidateInvite.findMany({
        where: { managerId: profile.id },
        select: { id: true },
      });
      if (candidateInvites.length > 0) {
        const ids = candidateInvites.map((c) => c.id);
        await prisma.candidateResult.deleteMany({ where: { inviteId: { in: ids } } });
        await prisma.candidateInvite.deleteMany({ where: { managerId: profile.id } });
        console.log(`🧹  Törölve ${candidateInvites.length} CandidateInvite (+ result)`);
      }
    }

    // ── Self assessment ─────────────────────────────────────────────────────
    const selfScores = generateTritanScores({
      fixedDimensions: fixedTritan,
      aroundBaseVariance: 0,
    });
    const result = await prisma.assessmentResult.create({
      data: {
        userProfileId: profile.id,
        testType: "TRITAN",
        isSelfAssessment: true,
        scores: selfScores as object,
      },
    });
    console.log(`✅  AssessmentResult létrehozva: ${result.id}`);
    console.log(`    Dimenziók: ${JSON.stringify(selfScores.dimensions)}`);
    if (fixedTritan) {
      console.log("    (Fix TRITAN bemenet alapján generálva)");
    }

    if (profile.testType !== "TRITAN") {
      await prisma.userProfile.update({
        where: { id: profile.id },
        data: { testType: "TRITAN" },
      });
      console.log(`✅  UserProfile.testType beállítva: TRITAN`);
    }

    // ── Observer assessments ────────────────────────────────────────────────
    if (observerCount > 0) {
      console.log(`\n👥  Observer válaszok generálása: ${observerCount} db`);

      for (let i = 0; i < observerCount; i++) {
        const invitation = await prisma.observerInvitation.create({
          data: {
            inviterId: profile.id,
            observerEmail: `observer${i + 1}@seed.test`,
            testType: "TRITAN",
            status: "COMPLETED",
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            completedAt: new Date(),
          },
        });

        const obsScores = generateTritanScores(
          fixedTritan ? { fixedDimensions: fixedTritan, aroundBaseVariance: 15 } : undefined
        );
        await prisma.observerAssessment.create({
          data: {
            invitationId: invitation.id,
            relationshipType: pick(RELATIONSHIPS),
            knownDuration: pick(DURATIONS),
            scores: obsScores as object,
            confidence: rand(3, 5),
          },
        });

        console.log(`   ✅  Observer ${i + 1}: ${invitation.id}  dims: ${JSON.stringify(obsScores.dimensions)}`);
      }
    }

    // ── Candidate assessments ───────────────────────────────────────────────
    if (candidateCount > 0) {
      console.log(`\n🧑‍💼  Jelölt assessmentek generálása: ${candidateCount} db`);

      if (teamId) {
        const team = await prisma.team.findUnique({ where: { id: teamId }, select: { id: true, name: true } });
        if (!team) {
          console.warn(`⚠️   Team nem található: ${teamId} — jelöltek team nélkül generálódnak`);
        } else {
          console.log(`    Team: ${team.name} (${team.id})`);
        }
      }

      for (let i = 0; i < candidateCount; i++) {
        const fake = FAKE_CANDIDATES[i % FAKE_CANDIDATES.length];

        const invite = await prisma.candidateInvite.create({
          data: {
            managerId: profile.id,
            ...(teamId ? { teamId } : {}),
            email: fake.email,
            name: fake.name,
            position: fake.position,
            status: "COMPLETED",
            testType: "TRITAN",
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            completedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          },
        });

        const candidateScores = generateTritanScores(
          fixedTritan ? { fixedDimensions: fixedTritan, aroundBaseVariance: 20 } : undefined
        );

        await prisma.candidateResult.create({
          data: {
            inviteId: invite.id,
            testType: "TRITAN",
            scores: candidateScores as object,
          },
        });

        console.log(`   ✅  Jelölt ${i + 1}: ${fake.name} (${fake.position})  dims: ${JSON.stringify(candidateScores.dimensions)}`);
      }
    }

    // ── Done ────────────────────────────────────────────────────────────────
    console.log(`\n🎉  Kész! Nyisd meg: http://localhost:3000/dashboard`);
    if (observerCount >= 2) {
      console.log(`    (${observerCount} observer van → az összehasonlítás tab aktív lesz)`);
    } else if (observerCount === 1) {
      console.log(`    (1 observer van → az összehasonlítás tab 2 válasz alatt zárolt)`);
    }
    if (candidateCount > 0) {
      console.log(`    Jelöltek: http://localhost:3000/manager/candidates`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("❌  Hiba:", (e as Error).message);
  process.exit(1);
});
