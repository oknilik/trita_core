#!/usr/bin/env node

import { execSync } from "node:child_process";

const HEX_PATTERN = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const FILE_EXCLUDE = [/^src\/app\/globals\.css$/, /^src\/app\/api\//];

function isExcluded(filePath) {
  return FILE_EXCLUDE.some((pattern) => pattern.test(filePath));
}

function main() {
  const diff = execSync(
    "git diff --cached --unified=0 -- src/components src/app",
    { encoding: "utf8" },
  );

  if (!diff.trim()) {
    process.exit(0);
  }

  const violations = [];
  let currentFile = null;
  let nextLineNumber = null;

  for (const rawLine of diff.split("\n")) {
    const line = rawLine;

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

    if (!currentFile || isExcluded(currentFile)) {
      continue;
    }

    if (line.startsWith("+") && !line.startsWith("+++")) {
      const content = line.slice(1);
      const matches = content.match(HEX_PATTERN);
      if (matches) {
        violations.push({
          file: currentFile,
          line: nextLineNumber ?? 0,
          hexes: [...new Set(matches.map((entry) => entry.toLowerCase()))],
          content: content.trim(),
        });
      }
      if (nextLineNumber !== null) {
        nextLineNumber += 1;
      }
      continue;
    }

    if (line.startsWith(" ")) {
      if (nextLineNumber !== null) {
        nextLineNumber += 1;
      }
      continue;
    }

    if (line.startsWith("-")) {
      continue;
    }
  }

  if (violations.length === 0) {
    process.exit(0);
  }

  const details = violations
    .map(
      (entry) =>
        `${entry.file}:${entry.line}  ${entry.hexes.join(", ")}  ${entry.content}`,
    )
    .join("\n");

  console.error(
    [
      "ERROR: New hardcoded hex colors detected in staged UI changes.",
      "Use semantic tokens (Tailwind token classes or var(--color-...)) instead.",
      "",
      details,
    ].join("\n"),
  );

  process.exit(1);
}

main();
