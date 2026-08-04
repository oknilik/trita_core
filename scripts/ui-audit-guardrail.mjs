#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { appendFile, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const HEX_PATTERN = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const ARBITRARY_TW_PATTERN =
  /\b(?:bg|text|border|from|to|via|ring|stroke|fill|shadow|outline)-\[[^\]]+\]/g;

function getArg(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) return null;
  return value;
}

function getMode() {
  const modeArg = getArg("--mode");
  const mode = (modeArg ?? process.env.UI_AUDIT_ENFORCEMENT ?? "warn").toLowerCase();
  if (mode !== "warn" && mode !== "strict") return "warn";
  return mode;
}

function parseThreshold(rawValue) {
  if (!rawValue) return null;
  const parsed = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function countMatches(input, pattern) {
  const matches = input.match(pattern);
  return matches ? matches.length : 0;
}

function execNodeScript(filePath, args = []) {
  return execFileSync("node", [filePath, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function gitDiff(base, head) {
  try {
    if (base && head) {
      return execFileSync("git", ["diff", "--unified=0", `${base}...${head}`], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
    }

    return execFileSync("git", ["diff", "--unified=0", "HEAD~1...HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return "";
  }
}

function parseDiffMetrics(diff) {
  let currentFile = null;
  let nextLineNumber = null;

  let arbitraryAdded = 0;
  let arbitraryRemoved = 0;
  let hexAdded = 0;
  const newHexEntries = [];

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

    if (line.startsWith("+") && !line.startsWith("+++")) {
      const content = line.slice(1);
      const hexMatches = content.match(HEX_PATTERN);
      const arbitraryCount = countMatches(content, ARBITRARY_TW_PATTERN);

      if (hexMatches) {
        hexAdded += hexMatches.length;
        newHexEntries.push({
          file: currentFile ?? "unknown",
          line: nextLineNumber ?? 0,
          values: [...new Set(hexMatches.map((entry) => entry.toLowerCase()))],
          snippet: content.trim(),
        });
      }
      arbitraryAdded += arbitraryCount;

      if (nextLineNumber !== null) nextLineNumber += 1;
      continue;
    }

    if (line.startsWith("-") && !line.startsWith("---")) {
      const content = line.slice(1);
      arbitraryRemoved += countMatches(content, ARBITRARY_TW_PATTERN);
      continue;
    }

    if (line.startsWith(" ")) {
      if (nextLineNumber !== null) nextLineNumber += 1;
    }
  }

  return {
    newHardcodedHex: {
      totalOccurrences: hexAdded,
      filesCount: new Set(newHexEntries.map((entry) => entry.file)).size,
      entries: newHexEntries,
    },
    arbitraryTailwind: {
      addedOccurrences: arbitraryAdded,
      removedOccurrences: arbitraryRemoved,
      netIncrease: arbitraryAdded - arbitraryRemoved,
    },
  };
}

function buildSummaryMarkdown(payload) {
  const {
    mode,
    base,
    head,
    report,
    diffMetrics,
    warnings,
    failures,
    duplicateThreshold,
    panelThreshold,
  } = payload;

  const lines = [];
  lines.push("## UI Audit Guardrail");
  lines.push("");
  lines.push(`- Mode: \`${mode}\``);
  lines.push(`- Compared range: \`${base && head ? `${base}...${head}` : "HEAD~1...HEAD"}\``);
  lines.push(`- Files scanned: \`${report.filesScanned}\``);
  lines.push("");
  lines.push("### PR delta");
  lines.push("");
  lines.push(`- New hardcoded hex (added lines): \`${diffMetrics.newHardcodedHex.totalOccurrences}\``);
  lines.push(`- Arbitrary Tailwind net increase: \`${diffMetrics.arbitraryTailwind.netIncrease}\``);
  lines.push("");
  lines.push("### Current totals");
  lines.push("");
  lines.push(`- Hardcoded hex total: \`${report.metrics.hardcodedHex.totalOccurrences}\``);
  lines.push(`- Arbitrary Tailwind total: \`${report.metrics.arbitraryTailwind.totalOccurrences}\``);
  lines.push(`- Duplicate recipe redundant occurrences: \`${report.metrics.duplicateRecipes.redundantOccurrences}\``);
  lines.push(`- min-h-[44px] total: \`${report.metrics.minHeight44.totalOccurrences}\``);
  lines.push(`- Panel recipe total: \`${report.metrics.panelRecipe.totalOccurrences}\``);
  lines.push("");
  lines.push("### Thresholds");
  lines.push("");
  lines.push(`- Duplicate recipe threshold: \`${duplicateThreshold ?? "n/a"}\``);
  lines.push(`- Panel recipe threshold: \`${panelThreshold ?? "n/a"}\``);
  lines.push("");

  if (warnings.length > 0) {
    lines.push("### Warnings");
    lines.push("");
    for (const warning of warnings) {
      lines.push(`- ${warning}`);
    }
    lines.push("");
  }

  if (failures.length > 0) {
    lines.push("### Failures");
    lines.push("");
    for (const failure of failures) {
      lines.push(`- ${failure}`);
    }
    lines.push("");
  } else {
    lines.push("### Result");
    lines.push("");
    lines.push("- Guardrail check passed.");
    lines.push("");
  }

  if (diffMetrics.newHardcodedHex.entries.length > 0) {
    lines.push("<details>");
    lines.push("<summary>New hardcoded hex occurrences</summary>");
    lines.push("");
    for (const entry of diffMetrics.newHardcodedHex.entries.slice(0, 30)) {
      lines.push(
        `- \`${entry.file}:${entry.line}\` ${entry.values.join(", ")} — \`${entry.snippet}\``,
      );
    }
    if (diffMetrics.newHardcodedHex.entries.length > 30) {
      lines.push(`- ... and ${diffMetrics.newHardcodedHex.entries.length - 30} more`);
    }
    lines.push("");
    lines.push("</details>");
    lines.push("");
  }

  return lines.join("\n");
}

function appendStepSummary(content) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;
  return appendFile(summaryPath, `${content}\n`, "utf8").catch(() => undefined);
}

async function main() {
  const mode = getMode();
  const base = getArg("--base");
  const head = getArg("--head");
  const artifactsDir = getArg("--artifacts-dir") ?? "artifacts/ui-audit";
  const duplicateThreshold = parseThreshold(
    getArg("--duplicate-threshold") ?? process.env.UI_DUPLICATE_RECIPE_THRESHOLD ?? null,
  );
  const panelThreshold = parseThreshold(
    getArg("--panel-threshold") ?? process.env.UI_PANEL_RECIPE_THRESHOLD ?? null,
  );

  const reportRaw = execNodeScript(path.resolve("scripts/ui-audit.mjs"), ["--json"]);
  const report = JSON.parse(reportRaw);

  const diff = gitDiff(base, head);
  const diffMetrics = parseDiffMetrics(diff);

  const warnings = [];
  const failures = [];

  if (diffMetrics.newHardcodedHex.totalOccurrences > 0) {
    const message = `New hardcoded hex detected in PR diff (${diffMetrics.newHardcodedHex.totalOccurrences}).`;
    warnings.push(message);
    if (mode === "strict") failures.push(message);
  }

  if (diffMetrics.arbitraryTailwind.netIncrease > 0) {
    warnings.push(
      `Arbitrary Tailwind usage increased by ${diffMetrics.arbitraryTailwind.netIncrease} in PR diff.`,
    );
  }

  if (
    mode === "strict" &&
    duplicateThreshold !== null &&
    report.metrics.duplicateRecipes.redundantOccurrences > duplicateThreshold
  ) {
    failures.push(
      `Duplicate recipe redundant occurrences (${report.metrics.duplicateRecipes.redundantOccurrences}) exceed threshold (${duplicateThreshold}).`,
    );
  }

  if (
    mode === "strict" &&
    panelThreshold !== null &&
    report.metrics.panelRecipe.totalOccurrences > panelThreshold
  ) {
    failures.push(
      `Panel recipe count (${report.metrics.panelRecipe.totalOccurrences}) exceeds threshold (${panelThreshold}).`,
    );
  }

  const summaryMarkdown = buildSummaryMarkdown({
    mode,
    base,
    head,
    report,
    diffMetrics,
    warnings,
    failures,
    duplicateThreshold,
    panelThreshold,
  });

  await mkdir(artifactsDir, { recursive: true });
  const summaryPath = path.join(artifactsDir, "summary.md");
  const reportPath = path.join(artifactsDir, "report.json");
  const diffPath = path.join(artifactsDir, "diff-metrics.json");

  await writeFile(summaryPath, `${summaryMarkdown}\n`, "utf8");
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(diffPath, `${JSON.stringify(diffMetrics, null, 2)}\n`, "utf8");

  console.log(summaryMarkdown);
  await appendStepSummary(summaryMarkdown);

  if (warnings.length > 0) {
    for (const warning of warnings) {
      console.warn(`[ui-audit][warn] ${warning}`);
    }
  }

  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(`[ui-audit][fail] ${failure}`);
    }
    process.exit(1);
  }

  process.exit(0);
}

if (!existsSync(path.resolve("scripts/ui-audit.mjs"))) {
  console.error("[ui-audit] Missing dependency script: scripts/ui-audit.mjs");
  process.exit(1);
}

main().catch((error) => {
  console.error("[ui-audit] Guardrail execution failed.");
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
