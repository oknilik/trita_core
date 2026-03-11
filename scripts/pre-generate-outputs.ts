/**
 * Pre-generate coaching debrief outputs for all H/M/L dimension combinations.
 *
 * Combinations:
 *   HEXACO : 3^6 = 729
 *   Total per locale : 729
 *
 * Usage:
 *   pnpm pregen:outputs
 *   pnpm pregen:outputs -- --locale en
 *   pnpm pregen:outputs -- --dry-run
 *   pnpm pregen:outputs -- --concurrency 3
 *   pnpm pregen:outputs -- --provider openai --model gpt-4.1-mini
 *   pnpm pregen:outputs -- --temperature 0.7
 *   pnpm pregen:outputs -- --rewrite-model claude-3-5-haiku-latest --min-quality-score 80
 */

import { PrismaClient } from "@prisma/client";
import Anthropic from "@anthropic-ai/sdk";
import { buildCacheKey, buildManagerPromptWithContext } from "../src/lib/manager-engine";
import { auditGeneratedContent, validateGeneratedContent } from "../src/lib/output-quality";

const prisma = new PrismaClient();
const anthropic = new Anthropic();

// ─── CLI args ─────────────────────────────────────────────────────────────────

type Provider = "anthropic" | "openai";
type ScoreLevel = "h" | "m" | "l";

const args = process.argv.slice(2);
const getArg = (flag: string) => {
  const i = args.lastIndexOf(flag);
  return i !== -1 ? args[i + 1] : undefined;
};
const hasFlag = (flag: string) => args.includes(flag);

const LOCALE      = getArg("--locale")      ?? "hu";
const DRY_RUN     = hasFlag("--dry-run");
const FORCE       = hasFlag("--force");
const CONCURRENCY = parseInt(getArg("--concurrency") ?? "3", 10);
const rawProvider = (getArg("--provider") ?? "anthropic").toLowerCase();
const PROVIDER: Provider = rawProvider === "openai" ? "openai" : "anthropic";
const MODEL = getArg("--model") ?? (PROVIDER === "openai" ? "gpt-4.1-mini" : "claude-haiku-4-5-20251001");
const TEMPERATURE = Number.parseFloat(getArg("--temperature") ?? "0.65");
const QUALITY_MIN_SCORE = parseInt(getArg("--min-quality-score") ?? "78", 10);
const REWRITE_ON_FAIL = !hasFlag("--no-rewrite");
const REWRITE_MAX_ATTEMPTS = parseInt(getArg("--rewrite-max-attempts") ?? "1", 10);

const rawRewriteProvider = (getArg("--rewrite-provider") ?? PROVIDER).toLowerCase();
const REWRITE_PROVIDER: Provider = rawRewriteProvider === "openai" ? "openai" : "anthropic";
const REWRITE_MODEL = getArg("--rewrite-model")
  ?? (REWRITE_PROVIDER === "openai" ? "gpt-4.1-mini" : "claude-haiku-4-5-20251001");
const REWRITE_TEMPERATURE = Number.parseFloat(getArg("--rewrite-temperature") ?? "0.35");

if (rawProvider !== "openai" && rawProvider !== "anthropic") {
  console.error(`Invalid --provider value: "${rawProvider}". Use "anthropic" or "openai".`);
  process.exit(1);
}

if (rawRewriteProvider !== "openai" && rawRewriteProvider !== "anthropic") {
  console.error(`Invalid --rewrite-provider value: "${rawRewriteProvider}". Use "anthropic" or "openai".`);
  process.exit(1);
}

if (!Number.isInteger(CONCURRENCY) || CONCURRENCY < 1) {
  console.error(`Invalid --concurrency value: "${getArg("--concurrency") ?? "3"}". Must be an integer >= 1.`);
  process.exit(1);
}

if (!Number.isInteger(QUALITY_MIN_SCORE) || QUALITY_MIN_SCORE < 0 || QUALITY_MIN_SCORE > 100) {
  console.error(`Invalid --min-quality-score value: "${getArg("--min-quality-score") ?? "78"}". Must be in 0..100.`);
  process.exit(1);
}

if (!Number.isInteger(REWRITE_MAX_ATTEMPTS) || REWRITE_MAX_ATTEMPTS < 0) {
  console.error(`Invalid --rewrite-max-attempts value: "${getArg("--rewrite-max-attempts") ?? "1"}". Must be >= 0.`);
  process.exit(1);
}

if (!Number.isFinite(REWRITE_TEMPERATURE) || REWRITE_TEMPERATURE < 0 || REWRITE_TEMPERATURE > 1) {
  console.error(`Invalid --rewrite-temperature value: "${getArg("--rewrite-temperature") ?? "0.35"}". Must be in 0..1.`);
  process.exit(1);
}

if (PROVIDER === "openai" && !process.env.OPENAI_API_KEY && !DRY_RUN) {
  console.error("Missing OPENAI_API_KEY for --provider openai.");
  process.exit(1);
}

if (REWRITE_ON_FAIL && REWRITE_PROVIDER === "openai" && !process.env.OPENAI_API_KEY && !DRY_RUN) {
  console.error("Missing OPENAI_API_KEY for rewrite provider openai.");
  process.exit(1);
}

if ((PROVIDER === "anthropic" || (REWRITE_ON_FAIL && REWRITE_PROVIDER === "anthropic"))
  && !process.env.ANTHROPIC_API_KEY
  && !DRY_RUN) {
  console.error("Missing ANTHROPIC_API_KEY for Anthropic generation.");
  process.exit(1);
}

// ─── Dimension definitions ────────────────────────────────────────────────────

const TEST_DIMS: Record<string, string[]> = {
  HEXACO: ["A", "C", "E", "H", "O", "X"],
};

// Representative score for each H/M/L level (must match categorizeScore thresholds)
const LEVEL_SCORE: Record<ScoreLevel, number> = {
  h: 75, // HIGH  (>65)
  m: 50, // MED   (35–65)
  l: 25, // LOW   (<35)
};

const LEVELS = ["h", "m", "l"] as const;

// ─── Combination enumeration ──────────────────────────────────────────────────

function* enumerateCombinations(
  dims: string[]
): Generator<Record<string, number>> {
  const total = Math.pow(3, dims.length);
  for (let i = 0; i < total; i++) {
    const scores: Record<string, number> = {};
    let n = i;
    for (const dim of dims) {
      scores[dim] = LEVEL_SCORE[LEVELS[n % 3]];
      n = Math.floor(n / 3);
    }
    yield scores;
  }
}

// ─── Generator ────────────────────────────────────────────────────────────────

type GenerationParams = {
  provider: Provider;
  model: string;
  temperature: number;
};

async function generateWithAnthropic(prompt: string, params: GenerationParams): Promise<string> {
  const response = await anthropic.messages.create({
    model: params.model,
    max_tokens: 4096,
    temperature: params.temperature,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.type === "text" ? textBlock.text : "";
}

function extractOpenAIOutputText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const data = payload as Record<string, unknown>;

  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const output = Array.isArray(data.output) ? data.output : [];
  const parts: string[] = [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const msg = item as Record<string, unknown>;
    const content = Array.isArray(msg.content) ? msg.content : [];
    for (const entry of content) {
      if (!entry || typeof entry !== "object") continue;
      const chunk = entry as Record<string, unknown>;
      if (typeof chunk.text === "string" && chunk.text.trim()) {
        parts.push(chunk.text.trim());
      }
    }
  }
  if (parts.length > 0) return parts.join("\n");

  const choices = Array.isArray(data.choices) ? data.choices : [];
  for (const choice of choices) {
    if (!choice || typeof choice !== "object") continue;
    const msg = (choice as Record<string, unknown>).message;
    if (!msg || typeof msg !== "object") continue;
    const content = (msg as Record<string, unknown>).content;
    if (typeof content === "string" && content.trim()) return content.trim();
    if (Array.isArray(content)) {
      const compact = content
        .map((c) => (c && typeof c === "object" && typeof (c as Record<string, unknown>).text === "string"
          ? ((c as Record<string, unknown>).text as string)
          : ""))
        .filter(Boolean)
        .join("\n")
        .trim();
      if (compact) return compact;
    }
  }

  return "";
}

async function generateWithOpenAI(prompt: string, params: GenerationParams): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: params.model,
      input: prompt,
      temperature: params.temperature,
      max_output_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI API ${response.status}: ${errorBody.slice(0, 240)}`);
  }

  const payload = await response.json();
  return extractOpenAIOutputText(payload);
}

async function generateText(prompt: string, params: GenerationParams): Promise<string> {
  return params.provider === "openai"
    ? generateWithOpenAI(prompt, params)
    : generateWithAnthropic(prompt, params);
}

type QualityCheck = {
  ok: boolean;
  score: number;
  issues: string[];
};

type GenerateOneResult = {
  content: string;
  modelUsed: string;
  score: number;
  rewriteAttempts: number;
};

function evaluateQuality(content: string, locale: string): QualityCheck {
  const validationErrors = validateGeneratedContent(content, locale);
  const audit = auditGeneratedContent(content, locale);
  const issues = [...validationErrors];

  if (audit.score < QUALITY_MIN_SCORE) {
    issues.push(`quality score ${audit.score} < ${QUALITY_MIN_SCORE}`);
    issues.push(...audit.reasons);
  }

  return {
    ok: issues.length === 0,
    score: audit.score,
    issues,
  };
}

function buildRewritePrompt(params: {
  locale: string;
  content: string;
  issues: string[];
  minScore: number;
}): string {
  const issueLines = params.issues.map((issue) => `- ${issue}`).join("\n");

  if (params.locale === "hu") {
    return `Az alábbi coaching debrief szöveget javítsd úgy, hogy természetesebb, emberibb, gördülékenyebb magyar legyen, miközben a struktúra renderelhető marad.

Minőségi cél: legalább ${params.minScore}/100.
Észlelt problémák:
${issueLines}

Kritikus szabályok:
- Tartsd meg pontosan az 5 kötelező ## szekciófejlécet.
- Ne használj ### alcímeket.
- Ne hagyj el kötelező szekciót.
- A "Következő lépések" rész maradjon számozott, konkrét, cselekvésorientált.
- A "Coaching kérdések" rész maradjon számozott.
- Kerüld a sablonos, ismétlődő fordulatokat.

Javítandó szöveg:
---
${params.content}
---`;
  }

  return `Rewrite the coaching debrief below to be more natural and human while preserving render-safe structure.

Quality target: at least ${params.minScore}/100.
Detected issues:
${issueLines}

Critical rules:
- Keep the exact 5 required ## section headings.
- No ### subheadings.
- Do not remove required sections.
- Keep "Next Steps" as numbered, concrete, action-oriented items.
- Keep "Coaching Questions" as numbered items.
- Avoid repetitive stock phrases.

Text to rewrite:
---
${params.content}
---`;
}

async function generateOne(
  testType: string,
  selfScores: Record<string, number>,
  locale: string
): Promise<GenerateOneResult> {
  const prompt = await buildManagerPromptWithContext({
    testType,
    selfScores,
    observerAvgScores: null,
    locale,
  });

  const baseParams: GenerationParams = {
    provider: PROVIDER,
    model: MODEL,
    temperature: TEMPERATURE,
  };

  let content = await generateText(prompt, baseParams);
  let quality = evaluateQuality(content, locale);

  if (quality.ok) {
    return {
      content,
      modelUsed: baseParams.model,
      score: quality.score,
      rewriteAttempts: 0,
    };
  }

  if (!REWRITE_ON_FAIL || REWRITE_MAX_ATTEMPTS === 0) {
    throw new Error(`Quality gate failed: ${quality.issues.join("; ")}`);
  }

  const rewriteParams: GenerationParams = {
    provider: REWRITE_PROVIDER,
    model: REWRITE_MODEL,
    temperature: REWRITE_TEMPERATURE,
  };

  for (let attempt = 1; attempt <= REWRITE_MAX_ATTEMPTS; attempt++) {
    const rewritePrompt = buildRewritePrompt({
      locale,
      content,
      issues: quality.issues.slice(0, 12),
      minScore: QUALITY_MIN_SCORE,
    });

    content = await generateText(rewritePrompt, rewriteParams);
    quality = evaluateQuality(content, locale);
    if (quality.ok) {
      return {
        content,
        modelUsed: rewriteParams.model,
        score: quality.score,
        rewriteAttempts: attempt,
      };
    }
  }

  throw new Error(`Quality gate failed after ${REWRITE_MAX_ATTEMPTS} rewrite attempt(s): ${quality.issues.join("; ")}`);
}

// ─── Concurrency helper ───────────────────────────────────────────────────────

async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number,
  onDone?: (completed: number, total: number) => void
): Promise<T[]> {
  const results: T[] = [];
  let index = 0;
  let completed = 0;
  const total = tasks.length;

  async function worker() {
    while (index < total) {
      const i = index++;
      results[i] = await tasks[i]();
      completed++;
      onDone?.(completed, total);
    }
  }

  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const testTypes = Object.keys(TEST_DIMS);

  // Build all combinations
  const jobs: Array<{ testType: string; scores: Record<string, number>; cacheKey: string }> = [];

  for (const testType of testTypes) {
    const dims = TEST_DIMS[testType];
    if (!dims) {
      console.error(`Unknown test type: ${testType}`);
      process.exit(1);
    }
    for (const scores of enumerateCombinations(dims)) {
      const cacheKey = buildCacheKey(testType, scores, null, LOCALE);
      jobs.push({ testType, scores, cacheKey });
    }
  }

  console.log(`\nPre-generation plan:`);
  console.log(`  Test types : ${testTypes.join(", ")}`);
  console.log(`  Locale     : ${LOCALE}`);
  console.log(`  Provider   : ${PROVIDER}`);
  console.log(`  Model      : ${MODEL}`);
  console.log(`  Temperature: ${TEMPERATURE}`);
  console.log(`  Min quality: ${QUALITY_MIN_SCORE}`);
  console.log(`  Rewrite    : ${REWRITE_ON_FAIL ? `on (${REWRITE_MAX_ATTEMPTS} attempts max)` : "off"}`);
  if (REWRITE_ON_FAIL) {
    console.log(`  Rewrite via: ${REWRITE_PROVIDER}/${REWRITE_MODEL} @ ${REWRITE_TEMPERATURE}`);
  }
  console.log(`  Total      : ${jobs.length} combinations`);
  console.log(`  Concurrency: ${CONCURRENCY}`);
  console.log(`  Dry run    : ${DRY_RUN}`);

  if (DRY_RUN) {
    console.log(`\nDry run — no API calls made.\n`);
    await prisma.$disconnect();
    return;
  }

  // Filter already-cached combinations (skip if --force)
  const existingKeys = FORCE ? new Set<string>() : new Set(
    (await prisma.generatedOutput.findMany({
      where: { cacheKey: { in: jobs.map((j) => j.cacheKey) } },
      select: { cacheKey: true },
    })).map((r) => r.cacheKey)
  );

  const pending = jobs.filter((j) => !existingKeys.has(j.cacheKey));

  console.log(`\n  Already cached : ${FORCE ? "ignored (--force)" : existingKeys.size}`);
  console.log(`  To generate    : ${pending.length}\n`);

  if (pending.length === 0) {
    console.log("Nothing to do — all combinations already cached.");
    await prisma.$disconnect();
    return;
  }

  let errors = 0;
  let rewrittenCount = 0;
  let rewriteAttemptsTotal = 0;
  const tasks = pending.map((job) => async () => {
    try {
      const generated = await generateOne(job.testType, job.scores, LOCALE);
      if (generated.rewriteAttempts > 0) {
        rewrittenCount++;
        rewriteAttemptsTotal += generated.rewriteAttempts;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma.generatedOutput.upsert as any)({
        where: { cacheKey: job.cacheKey },
        create: {
          managerId: null,
          clientId: null,
          cacheKey: job.cacheKey,
          content: generated.content,
          model: generated.modelUsed,
          qualityScore: generated.score,
        },
        update: {
          content: generated.content,
          model: generated.modelUsed,
          qualityScore: generated.score,
          hitCount: 0,
        },
      });
    } catch (err) {
      errors++;
      console.error(`\nFailed [${job.cacheKey}]:`, (err as Error).message);
    }
  });

  await runWithConcurrency(tasks, CONCURRENCY, (done, total) => {
    const pct = Math.round((done / total) * 100);
    process.stdout.write(`\r  Progress: ${done}/${total} (${pct}%)  `);
  });

  console.log(`\n\nDone.`);
  if (errors > 0) {
    console.log(`  Errors: ${errors} (check logs above)`);
  }
  console.log(`  Generated: ${pending.length - errors}`);
  if (REWRITE_ON_FAIL) {
    console.log(`  Rewritten: ${rewrittenCount} outputs (${rewriteAttemptsTotal} rewrite attempts total)`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
