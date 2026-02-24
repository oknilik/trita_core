/**
 * seed-assessment.ts
 *
 * Test data generator — gyorsan hoz létre egy assessment eredményt
 * a DB-ben, opcionálisan observer válaszokkal.
 *
 * Futtatás:
 *   pnpm seed:assessment --email user@example.com --type HEXACO --observers 3
 *
 * Opciók:
 *   --email <email>       Felhasználó email (kötelező)
 *   --type  <type>        HEXACO | HEXACO_MODIFIED | BIG_FIVE  (alapértelmezett: HEXACO)
 *   --observers <n>       Observer válaszok száma (alapértelmezett: 0)
 *   --clean               Törli az összes meglévő assessment eredményt a userhez
 *   --help                Súgó
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { PrismaClient, type TestType, type RelationshipType } from "@prisma/client";

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

const HEXACO_FACETS: Record<string, string[]> = {
  H: ["sincerity", "fairness", "greed_avoidance", "modesty"],
  E: ["fearfulness", "anxiety", "dependence", "sentimentality"],
  X: ["social_self_esteem", "social_boldness", "sociability", "liveliness"],
  A: ["forgivingness", "gentleness", "flexibility", "patience"],
  C: ["organization", "diligence", "prudence", "perfectionism"],
  O: ["aesthetic", "inquisitiveness", "creativity", "unconventionality"],
};

const BIG5_ASPECTS: Record<string, string[]> = {
  O: ["intellect", "openness"],
  C: ["industriousness", "orderliness"],
  E: ["enthusiasm", "assertiveness"],
  A: ["compassion", "politeness"],
  N: ["withdrawal", "volatility"],
};

type ScoreJSON = {
  type: "likert";
  dimensions: Record<string, number>;
  facets?: Record<string, Record<string, number>>;
  aspects?: Record<string, Record<string, number>>;
  answers: unknown[];
  questionCount: number;
};

function generateHexacoScores(): ScoreJSON {
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

  return { type: "likert", dimensions, facets, answers: [], questionCount: 100 };
}

function generateBig5Scores(): ScoreJSON {
  const dimensions: Record<string, number> = {};
  const aspects: Record<string, Record<string, number>> = {};

  for (const [dim, aspectList] of Object.entries(BIG5_ASPECTS)) {
    const base = rand(22, 83);
    dimensions[dim] = base;
    aspects[dim] = {};
    for (const aspect of aspectList) {
      aspects[dim][aspect] = nearbyScore(base);
    }
  }

  return { type: "likert", dimensions, aspects, answers: [], questionCount: 100 };
}

function generateScores(testType: TestType): ScoreJSON {
  return testType === "BIG_FIVE" ? generateBig5Scores() : generateHexacoScores();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const RELATIONSHIPS: RelationshipType[] = ["FRIEND", "COLLEAGUE", "FAMILY", "PARTNER", "OTHER"];
const DURATIONS = ["LT_1", "1_3", "3_5", "5P"];

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
  --type <type>         HEXACO | HEXACO_MODIFIED | BIG_FIVE  (alapért.: HEXACO)
  --observers <n>       Observer válaszok száma  (alapért.: 0)
  --clean               Törli az összes korábbi assessment eredményt
  --help                Ez a súgó

Példák:
  pnpm seed:assessment --email me@example.com
  pnpm seed:assessment --email me@example.com --type BIG_FIVE --observers 4
  pnpm seed:assessment --email me@example.com --clean --observers 2
`);
    return;
  }

  const email = args.email;
  if (!email) {
    console.error("❌  --email megadása kötelező");
    process.exit(1);
  }

  const VALID_TYPES: TestType[] = ["HEXACO", "HEXACO_MODIFIED", "BIG_FIVE"];
  const testType = ((args.type ?? "HEXACO").toUpperCase()) as TestType;
  if (!VALID_TYPES.includes(testType)) {
    console.error(`❌  --type értéke csak: ${VALID_TYPES.join(" | ")} lehet`);
    process.exit(1);
  }

  const observerCount = Math.max(0, parseInt(args.observers ?? "0", 10) || 0);
  const clean = "clean" in args;

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
      // 1. AssessmentDraft
      const draft = await prisma.assessmentDraft.findUnique({ where: { userProfileId: profile.id } });
      if (draft) {
        await prisma.assessmentDraft.delete({ where: { userProfileId: profile.id } });
        console.log(`🧹  Törölve AssessmentDraft`);
      }

      // 2. DimensionFeedback (AssessmentResult-hez kötött, explicit törlés a biztonság kedvéért)
      const results = await prisma.assessmentResult.findMany({
        where: { userProfileId: profile.id },
        select: { id: true },
      });
      if (results.length > 0) {
        const resultIds = results.map((r) => r.id);
        const { count: fbCount } = await prisma.dimensionFeedback.deleteMany({
          where: { assessmentResultId: { in: resultIds } },
        });
        if (fbCount > 0) console.log(`🧹  Törölve ${fbCount} DimensionFeedback`);
      }

      // 3. AssessmentResult
      const { count: resultCount } = await prisma.assessmentResult.deleteMany({
        where: { userProfileId: profile.id },
      });
      if (resultCount > 0) console.log(`🧹  Törölve ${resultCount} AssessmentResult`);

      // 4. Observer invitations + kapcsolódó rekordok (helyes sorrend a FK miatt)
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

      // 5. ResearchSurvey + SatisfactionFeedback (UserProfile-hoz kötöttek, nem cascade)
      const { count: surveyCount } = await prisma.researchSurvey.deleteMany({
        where: { userProfileId: profile.id },
      });
      if (surveyCount > 0) console.log(`🧹  Törölve ResearchSurvey`);

      const { count: satCount } = await prisma.satisfactionFeedback.deleteMany({
        where: { userProfileId: profile.id },
      });
      if (satCount > 0) console.log(`🧹  Törölve SatisfactionFeedback`);
    }

    // ── Self assessment ─────────────────────────────────────────────────────
    const selfScores = generateScores(testType);
    const result = await prisma.assessmentResult.create({
      data: {
        userProfileId: profile.id,
        testType,
        isSelfAssessment: true,
        scores: selfScores as object,
      },
    });
    console.log(`✅  AssessmentResult létrehozva: ${result.id}`);
    console.log(`    Dimenziók: ${JSON.stringify(selfScores.dimensions)}`);

    // Always sync profile.testType to match the new result
    if (profile.testType !== testType) {
      await prisma.userProfile.update({
        where: { id: profile.id },
        data: { testType },
      });
      console.log(`✅  UserProfile.testType frissítve: ${profile.testType ?? "null"} → ${testType}`);
    }

    // ── Observer assessments ────────────────────────────────────────────────
    if (observerCount > 0) {
      console.log(`\n👥  Observer válaszok generálása: ${observerCount} db`);

      for (let i = 0; i < observerCount; i++) {
        const invitation = await prisma.observerInvitation.create({
          data: {
            inviterId: profile.id,
            observerEmail: `observer${i + 1}@seed.test`,
            testType,
            status: "COMPLETED",
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            completedAt: new Date(),
          },
        });

        const obsScores = generateScores(testType);
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

    // ── Done ────────────────────────────────────────────────────────────────
    console.log(`\n🎉  Kész! Nyisd meg: http://localhost:3000/dashboard`);
    if (observerCount >= 2) {
      console.log(`    (${observerCount} observer van → az összehasonlítás tab aktív lesz)`);
    } else if (observerCount === 1) {
      console.log(`    (1 observer van → az összehasonlítás tab 2 válasz alatt zárolt)`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("❌  Hiba:", (e as Error).message);
  process.exit(1);
});
