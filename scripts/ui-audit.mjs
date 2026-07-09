#!/usr/bin/env node

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_SCOPE = ["src/app", "src/components"];
const SUPPORTED_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".mdx"]);
const DIR_EXCLUDES = new Set(["node_modules", ".next", ".git", "dist", "build", "coverage"]);
const NEW_HEX_EXCLUDES = [/^src\/app\/globals\.css$/];

const HEX_PATTERN = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const ARBITRARY_TW_PATTERN =
  /\b(?:bg|text|border|from|to|via|ring|stroke|fill|shadow|outline)-\[[^\]]+\]/g;
const MIN_H_44_PATTERN = /min-h-\[44px\]/g;
const PANEL_RECIPE_PATTERN = /rounded-2xl border border-sand bg-white p-6 shadow-sm/g;
const STRING_LITERAL_PATTERN = /(["'`])((?:\\.|(?!\1)[^\\])*)\1/g;

const LATEST_REPORT_PATH = path.resolve("audit-reports/ui-audit/latest.json");
const HISTORY_DIR = path.resolve("audit-reports/ui-audit/history");

function parseArgs(argv) {
  const args = new Set(argv);
  const scopeArg = argv.find((arg) => arg.startsWith("--scope="));
  const scope = scopeArg
    ? scopeArg
        .replace("--scope=", "")
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
    : DEFAULT_SCOPE;

  return {
    scope,
    json: args.has("--json"),
    write: args.has("--write"),
  };
}

async function walkFiles(startPath) {
  if (!existsSync(startPath)) return [];
  const entries = await readdir(startPath, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(startPath, entry.name);
      if (entry.isDirectory()) {
        if (DIR_EXCLUDES.has(entry.name)) return [];
        return walkFiles(fullPath);
      }
      if (!entry.isFile()) return [];
      const ext = path.extname(entry.name).toLowerCase();
      return SUPPORTED_EXTENSIONS.has(ext) ? [fullPath] : [];
    }),
  );
  return nested.flat();
}

function countMatches(input, pattern) {
  const matches = input.match(pattern);
  return matches ? matches.length : 0;
}

function collectMatches(input, pattern) {
  const matches = input.match(pattern);
  return matches ? matches : [];
}

function isClassToken(token) {
  return /^[a-z0-9:/.[\]%_()-]+$/i.test(token);
}

function isVisualRecipeToken(token) {
  const core = token.split(":").at(-1) ?? token;
  return /^(rounded|border|bg|text|shadow|font|tracking|min-h|max-h|min-w|max-w|h-|w-|p[trblxy]?-|m[trblxy]?-|ring|outline|opacity|backdrop|fill|stroke)/.test(
    core,
  );
}

function extractClassRecipes(input) {
  const recipes = [];
  let match;
  while ((match = STRING_LITERAL_PATTERN.exec(input)) !== null) {
    const raw = match[2];
    if (!raw) continue;
    if (raw.includes("${")) continue;
    if (raw.length < 12 || raw.length > 220) continue;
    if (!raw.includes(" ")) continue;
    if (raw.includes("\n")) continue;

    const normalized = raw.trim().replace(/\s+/g, " ");
    const tokens = normalized.split(" ");
    if (tokens.length < 4) continue;

    const classLikeCount = tokens.filter(isClassToken).length;
    if (classLikeCount / tokens.length < 0.8) continue;
    if (!tokens.some(isVisualRecipeToken)) continue;
    if (!tokens.some((token) => token.includes("-") || token.includes(":") || token.startsWith("["))) {
      continue;
    }

    recipes.push(normalized);
  }
  return recipes;
}

function isNewHexExcluded(filePath) {
  return NEW_HEX_EXCLUDES.some((pattern) => pattern.test(filePath));
}

function parseNewHexFromDiff(diff) {
  const findings = [];
  let currentFile = null;
  let nextLineNumber = null;

  for (const line of diff.split("\n")) {
    if (line.startsWith("+++ b/")) {
      currentFile = line.slice("+++ b/".length);
      nextLineNumber = null;
      continue;
    }

    if (line.startsWith("@@")) {
      const match = line.match(/\+(\d+)(?:,\d+)?/);
      nextLineNumber = match ? Number.parseInt(match[1], 10) : null;
      continue;
    }

    if (!currentFile || isNewHexExcluded(currentFile)) {
      continue;
    }

    if (line.startsWith("+") && !line.startsWith("+++")) {
      const content = line.slice(1);
      const matches = content.match(HEX_PATTERN);
      if (matches) {
        findings.push({
          file: currentFile,
          line: nextLineNumber ?? 0,
          hexes: [...new Set(matches.map((entry) => entry.toLowerCase()))],
        });
      }
      if (nextLineNumber !== null) nextLineNumber += 1;
      continue;
    }

    if (line.startsWith(" ")) {
      if (nextLineNumber !== null) nextLineNumber += 1;
      continue;
    }
  }

  const uniqueHexes = new Set(findings.flatMap((item) => item.hexes));
  const totalOccurrences = findings.reduce((sum, item) => sum + item.hexes.length, 0);

  return {
    entries: findings,
    filesCount: new Set(findings.map((item) => item.file)).size,
    uniqueHexCount: uniqueHexes.size,
    uniqueHexes: [...uniqueHexes].sort(),
    totalOccurrences,
  };
}

function runDiffHexAudit(scope, staged) {
  const scopeArgs = scope.join(" ");
  const diffFlag = staged ? "--cached" : "";
  try {
    const diff = execSync(`git diff ${diffFlag} --unified=0 -- ${scopeArgs}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return parseNewHexFromDiff(diff);
  } catch {
    return {
      entries: [],
      filesCount: 0,
      uniqueHexCount: 0,
      uniqueHexes: [],
      totalOccurrences: 0,
    };
  }
}

function toDelta(currentValue, previousValue) {
  if (typeof previousValue !== "number") return null;
  return currentValue - previousValue;
}

function formatDelta(delta) {
  if (delta === null) return "n/a";
  if (delta === 0) return "0";
  return delta > 0 ? `+${delta}` : `${delta}`;
}

function timestampSlug(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
    "-",
    pad(date.getUTCHours()),
    pad(date.getUTCMinutes()),
    pad(date.getUTCSeconds()),
  ].join("");
}

function printSummary(report) {
  console.log("");
  console.log("UI Audit Summary");
  console.log("=".repeat(80));
  console.log(`Scope: ${report.scope.join(", ")}`);
  console.log(`Files scanned: ${report.filesScanned}`);
  console.log("");
  console.log(
    `Hardcoded hex: ${report.metrics.hardcodedHex.totalOccurrences} occurrences in ${report.metrics.hardcodedHex.filesCount} files (unique: ${report.metrics.hardcodedHex.uniqueHexCount}, delta: ${formatDelta(report.trend?.hardcodedHexTotalOccurrencesDelta ?? null)})`,
  );
  console.log(
    `New hardcoded hex (staged): ${report.metrics.newHardcodedHex.staged.totalOccurrences} (unique: ${report.metrics.newHardcodedHex.staged.uniqueHexCount})`,
  );
  console.log(
    `New hardcoded hex (working tree): ${report.metrics.newHardcodedHex.workingTree.totalOccurrences} (unique: ${report.metrics.newHardcodedHex.workingTree.uniqueHexCount})`,
  );
  console.log(
    `Arbitrary Tailwind: ${report.metrics.arbitraryTailwind.totalOccurrences} occurrences in ${report.metrics.arbitraryTailwind.filesCount} files (delta: ${formatDelta(report.trend?.arbitraryTailwindTotalOccurrencesDelta ?? null)})`,
  );
  console.log(
    `Duplicate recipes: ${report.metrics.duplicateRecipes.redundantOccurrences} redundant occurrences across ${report.metrics.duplicateRecipes.recipeVariants} repeated recipes (delta: ${formatDelta(report.trend?.duplicateRecipesRedundantOccurrencesDelta ?? null)})`,
  );
  console.log(
    `min-h-[44px]: ${report.metrics.minHeight44.totalOccurrences} occurrences (delta: ${formatDelta(report.trend?.minHeight44TotalOccurrencesDelta ?? null)})`,
  );
  console.log(
    `Panel recipe count: ${report.metrics.panelRecipe.totalOccurrences} occurrences (delta: ${formatDelta(report.trend?.panelRecipeTotalOccurrencesDelta ?? null)})`,
  );

  if (report.metrics.duplicateRecipes.top.length > 0) {
    console.log("");
    console.log("Top duplicated recipes:");
    for (const entry of report.metrics.duplicateRecipes.top) {
      console.log(
        `- (${entry.count}) ${entry.recipe}  [files: ${entry.files.slice(0, 3).join(", ")}${entry.files.length > 3 ? ", ..." : ""}]`,
      );
    }
  }
}

async function buildReport(scope) {
  const files = (
    await Promise.all(scope.map((entry) => walkFiles(path.resolve(entry))))
  ).flat();
  const relativeFiles = files.map((file) => path.relative(process.cwd(), file).split(path.sep).join("/"));

  let hardcodedHexTotalOccurrences = 0;
  const hardcodedHexFileSet = new Set();
  const hardcodedHexValues = new Set();

  let arbitraryTailwindTotalOccurrences = 0;
  const arbitraryTailwindFileSet = new Set();

  let minHeight44TotalOccurrences = 0;
  let panelRecipeTotalOccurrences = 0;

  const recipeMap = new Map();

  for (const file of relativeFiles) {
    const content = await readFile(path.resolve(file), "utf8");

    const hexMatches = collectMatches(content, HEX_PATTERN);
    if (hexMatches.length > 0) {
      hardcodedHexTotalOccurrences += hexMatches.length;
      hardcodedHexFileSet.add(file);
      for (const match of hexMatches) hardcodedHexValues.add(match.toLowerCase());
    }

    const arbitraryMatches = collectMatches(content, ARBITRARY_TW_PATTERN);
    if (arbitraryMatches.length > 0) {
      arbitraryTailwindTotalOccurrences += arbitraryMatches.length;
      arbitraryTailwindFileSet.add(file);
    }

    minHeight44TotalOccurrences += countMatches(content, MIN_H_44_PATTERN);
    panelRecipeTotalOccurrences += countMatches(content, PANEL_RECIPE_PATTERN);

    const recipes = extractClassRecipes(content);
    for (const recipe of recipes) {
      const existing = recipeMap.get(recipe);
      if (existing) {
        existing.count += 1;
        existing.files.add(file);
      } else {
        recipeMap.set(recipe, { count: 1, files: new Set([file]) });
      }
    }
  }

  const duplicateRecipes = [...recipeMap.entries()]
    .map(([recipe, data]) => ({
      recipe,
      count: data.count,
      files: [...data.files].sort(),
    }))
    .filter((entry) => entry.count > 1)
    .sort((a, b) => b.count - a.count);

  const redundantOccurrences = duplicateRecipes.reduce(
    (sum, entry) => sum + (entry.count - 1),
    0,
  );

  const previous = existsSync(LATEST_REPORT_PATH)
    ? JSON.parse(await readFile(LATEST_REPORT_PATH, "utf8"))
    : null;

  const report = {
    generatedAt: new Date().toISOString(),
    scope,
    filesScanned: relativeFiles.length,
    metrics: {
      hardcodedHex: {
        totalOccurrences: hardcodedHexTotalOccurrences,
        filesCount: hardcodedHexFileSet.size,
        uniqueHexCount: hardcodedHexValues.size,
        uniqueHexValues: [...hardcodedHexValues].sort(),
      },
      newHardcodedHex: {
        staged: runDiffHexAudit(scope, true),
        workingTree: runDiffHexAudit(scope, false),
      },
      arbitraryTailwind: {
        totalOccurrences: arbitraryTailwindTotalOccurrences,
        filesCount: arbitraryTailwindFileSet.size,
      },
      duplicateRecipes: {
        redundantOccurrences,
        recipeVariants: duplicateRecipes.length,
        top: duplicateRecipes.slice(0, 10),
      },
      minHeight44: {
        totalOccurrences: minHeight44TotalOccurrences,
      },
      panelRecipe: {
        totalOccurrences: panelRecipeTotalOccurrences,
      },
    },
    trend: previous
      ? {
          baseGeneratedAt: previous.generatedAt ?? null,
          hardcodedHexTotalOccurrencesDelta: toDelta(
            hardcodedHexTotalOccurrences,
            previous.metrics?.hardcodedHex?.totalOccurrences,
          ),
          arbitraryTailwindTotalOccurrencesDelta: toDelta(
            arbitraryTailwindTotalOccurrences,
            previous.metrics?.arbitraryTailwind?.totalOccurrences,
          ),
          duplicateRecipesRedundantOccurrencesDelta: toDelta(
            redundantOccurrences,
            previous.metrics?.duplicateRecipes?.redundantOccurrences,
          ),
          minHeight44TotalOccurrencesDelta: toDelta(
            minHeight44TotalOccurrences,
            previous.metrics?.minHeight44?.totalOccurrences,
          ),
          panelRecipeTotalOccurrencesDelta: toDelta(
            panelRecipeTotalOccurrences,
            previous.metrics?.panelRecipe?.totalOccurrences,
          ),
        }
      : null,
  };

  return report;
}

async function writeReport(report) {
  await mkdir(path.dirname(LATEST_REPORT_PATH), { recursive: true });
  await mkdir(HISTORY_DIR, { recursive: true });

  await writeFile(LATEST_REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  const historyPath = path.join(HISTORY_DIR, `${timestampSlug(new Date())}.json`);
  await writeFile(historyPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  return { latestPath: LATEST_REPORT_PATH, historyPath };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const report = await buildReport(args.scope);

  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printSummary(report);
  }

  if (args.write) {
    const written = await writeReport(report);
    if (!args.json) {
      console.log("");
      console.log(`Saved latest report: ${path.relative(process.cwd(), written.latestPath)}`);
      console.log(`Saved history report: ${path.relative(process.cwd(), written.historyPath)}`);
    }
  }
}

main().catch((error) => {
  console.error("[ui-audit] Failed to run audit.");
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
