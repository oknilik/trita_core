/**
 * Audit cached generated coaching outputs and produce a scored fail report.
 *
 * Usage:
 *   pnpm audit:outputs
 *   pnpm audit:outputs -- --locale hu --test-type HEXACO --limit 200 --min-score 78
 *   pnpm audit:outputs -- --out audit-reports/hu-audit.json
 */

import { PrismaClient } from "@prisma/client";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { auditGeneratedContent } from "../src/lib/output-quality";

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const getArg = (flag: string) => {
  const i = args.lastIndexOf(flag);
  return i !== -1 ? args[i + 1] : undefined;
};

const LOCALE = getArg("--locale") ?? "hu";
const TEST_TYPE = getArg("--test-type") ?? "HEXACO";
const LIMIT = parseInt(getArg("--limit") ?? "200", 10);
const MIN_SCORE = parseInt(getArg("--min-score") ?? "78", 10);
const SHOW_FAILS = parseInt(getArg("--show-fails") ?? "20", 10);
const OUT = getArg("--out");

if (!Number.isInteger(LIMIT) || LIMIT < 1) {
  console.error(`Invalid --limit: "${getArg("--limit") ?? "200"}". Must be integer >= 1.`);
  process.exit(1);
}

if (!Number.isInteger(MIN_SCORE) || MIN_SCORE < 0 || MIN_SCORE > 100) {
  console.error(`Invalid --min-score: "${getArg("--min-score") ?? "78"}". Must be integer in 0..100.`);
  process.exit(1);
}

if (!Number.isInteger(SHOW_FAILS) || SHOW_FAILS < 1) {
  console.error(`Invalid --show-fails: "${getArg("--show-fails") ?? "20"}". Must be integer >= 1.`);
  process.exit(1);
}

function clip(text: string, max = 220): string {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= max) return compact;
  return `${compact.slice(0, max)}...`;
}

async function main() {
  const prefix = `${LOCALE}:${TEST_TYPE}:`;
  const outputs = await prisma.generatedOutput.findMany({
    where: { cacheKey: { startsWith: prefix } },
    orderBy: { createdAt: "desc" },
    take: LIMIT,
    select: {
      id: true,
      cacheKey: true,
      content: true,
      model: true,
      createdAt: true,
      hitCount: true,
      managerId: true,
      clientId: true,
    },
  });

  if (outputs.length === 0) {
    console.log(`No outputs found for prefix "${prefix}".`);
    await prisma.$disconnect();
    return;
  }

  const scored = outputs.map((row) => {
    const audit = auditGeneratedContent(row.content, LOCALE);
    return {
      ...row,
      audit,
      failed: audit.score < MIN_SCORE,
      snippet: clip(row.content),
    };
  });

  const failed = scored.filter((s) => s.failed).sort((a, b) => a.audit.score - b.audit.score);
  const avgScore = scored.reduce((sum, s) => sum + s.audit.score, 0) / scored.length;
  const worst = failed.slice(0, SHOW_FAILS);

  const report = {
    generatedAt: new Date().toISOString(),
    filters: {
      locale: LOCALE,
      testType: TEST_TYPE,
      limit: LIMIT,
      minScore: MIN_SCORE,
      prefix,
    },
    summary: {
      scanned: scored.length,
      failed: failed.length,
      pass: scored.length - failed.length,
      passRatePct: Number((((scored.length - failed.length) / scored.length) * 100).toFixed(1)),
      averageScore: Number(avgScore.toFixed(2)),
      averageBreakdown: {
        structure: Number((scored.reduce((sum, s) => sum + s.audit.structureScore, 0) / scored.length).toFixed(2)),
        specificity: Number((scored.reduce((sum, s) => sum + s.audit.specificityScore, 0) / scored.length).toFixed(2)),
        action: Number((scored.reduce((sum, s) => sum + s.audit.actionScore, 0) / scored.length).toFixed(2)),
        naturalness: Number((scored.reduce((sum, s) => sum + s.audit.naturalnessScore, 0) / scored.length).toFixed(2)),
      },
    },
    topFailures: worst.map((s) => ({
      cacheKey: s.cacheKey,
      score: s.audit.score,
      model: s.model,
      createdAt: s.createdAt,
      hitCount: s.hitCount,
      isPregeneratedTemplate: s.managerId === null && s.clientId === null,
      reasons: s.audit.reasons,
      snippet: s.snippet,
    })),
    allFailures: failed.map((s) => ({
      id: s.id,
      cacheKey: s.cacheKey,
      score: s.audit.score,
      structureScore: s.audit.structureScore,
      specificityScore: s.audit.specificityScore,
      actionScore: s.audit.actionScore,
      naturalnessScore: s.audit.naturalnessScore,
      reasons: s.audit.reasons,
      createdAt: s.createdAt,
      hitCount: s.hitCount,
      model: s.model,
      isPregeneratedTemplate: s.managerId === null && s.clientId === null,
    })),
  };

  const defaultOut = path.join(
    process.cwd(),
    "audit-reports",
    `generated-output-audit-${LOCALE}-${TEST_TYPE}-${Date.now()}.json`
  );
  const outPath = OUT ? path.resolve(process.cwd(), OUT) : defaultOut;
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(report, null, 2), "utf8");

  console.log("\nAudit summary:");
  console.log(`  Locale/TestType : ${LOCALE}/${TEST_TYPE}`);
  console.log(`  Scanned         : ${report.summary.scanned}`);
  console.log(`  Failed          : ${report.summary.failed} (threshold: ${MIN_SCORE})`);
  console.log(`  Pass rate       : ${report.summary.passRatePct}%`);
  console.log(`  Avg score       : ${report.summary.averageScore}/100`);
  console.log(`  Report          : ${outPath}`);

  if (worst.length > 0) {
    console.log(`\nLowest ${worst.length} outputs:`);
    for (const item of worst) {
      console.log(`- ${item.cacheKey} | score=${item.audit.score} | ${item.audit.reasons.join(" | ")}`);
    }
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});

