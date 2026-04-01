#!/usr/bin/env node

import { execFileSync } from "node:child_process";

const TEST_FILE_RE = /\.(?:test|spec)\.(?:ts|tsx)$/;

const PROTECTED_MODULE_PATTERNS = {
  journey: [
    /^src\/lib\/journey\//,
    /^src\/app\/dashboard\//,
    /^src\/components\/journey\//,
    /^src\/app\/journey\//,
  ],
  join: [
    /^src\/app\/join\//,
    /^src\/app\/apply\//,
    /^src\/lib\/acceptance\//,
    /^src\/app\/api\/team\/join\/route\.ts$/,
    /^src\/app\/api\/org\/join\/route\.ts$/,
    /^src\/app\/api\/org\/switch\/route\.ts$/,
  ],
  observer: [
    /^src\/app\/observe\//,
    /^src\/lib\/observer\//,
    /^src\/app\/api\/observer\//,
  ],
  billing: [
    /^src\/app\/billing\//,
    /^src\/app\/api\/billing\//,
    /^src\/app\/api\/webhooks\/stripe\/route\.ts$/,
    /^src\/lib\/subscription\.ts$/,
    /^src\/lib\/billing\//,
  ],
  assessment: [
    /^src\/app\/assessment\//,
    /^src\/components\/assessment\//,
    /^src\/lib\/assessment(?:\/|-)/,
    /^src\/app\/api\/assessment\//,
  ],
  policy: [
    /^src\/lib\/policy(?:-engine|-service)?\.ts$/,
    /^src\/lib\/capabilities\.ts$/,
    /^src\/lib\/policy\//,
    /^src\/app\/api\/org\//,
  ],
};

const CRITICAL_FLOW_PATTERNS = [
  /^src\/lib\/journey\/(?:engine|engine-core|guardrails|home|context|state)\.ts$/,
  /^src\/lib\/acceptance\/service\.ts$/,
  /^src\/app\/(?:join|apply|observe|assessment|billing)\//,
  /^src\/app\/dashboard\/page\.tsx$/,
  /^src\/app\/api\/team\/join\/route\.ts$/,
  /^src\/app\/api\/org\/join\/route\.ts$/,
  /^src\/app\/api\/org\/switch\/route\.ts$/,
  /^src\/app\/api\/webhooks\/stripe\/route\.ts$/,
  /^src\/lib\/subscription\.ts$/,
  /^src\/lib\/policy(?:-engine|-service)?\.ts$/,
];

function readArg(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) return null;
  return value;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function normalizePath(filePath) {
  return filePath.replaceAll("\\", "/");
}

function loadChangedFiles() {
  const staged = hasFlag("--staged");
  const base = readArg("--base");
  const head = readArg("--head");

  let diffOutput = "";

  if (staged) {
    diffOutput = git(["diff", "--cached", "--name-only", "--diff-filter=ACMR"]);
  } else if (base && head) {
    diffOutput = git(["diff", "--name-only", "--diff-filter=ACMR", `${base}...${head}`]);
  } else {
    try {
      diffOutput = git(["diff", "--name-only", "--diff-filter=ACMR", "HEAD~1...HEAD"]);
    } catch {
      diffOutput = "";
    }
  }

  return diffOutput
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map(normalizePath)
    .sort();
}

function isProtectedModuleFile(filePath) {
  return Object.values(PROTECTED_MODULE_PATTERNS).some((patterns) =>
    patterns.some((pattern) => pattern.test(filePath)),
  );
}

function listTouchedProtectedModules(files) {
  return Object.entries(PROTECTED_MODULE_PATTERNS)
    .filter(([, patterns]) => files.some((file) => patterns.some((pattern) => pattern.test(file))))
    .map(([moduleName]) => moduleName);
}

function isCriticalFlowChange(filePath) {
  return CRITICAL_FLOW_PATTERNS.some((pattern) => pattern.test(filePath));
}

function hasTestChange(files, folderPrefix) {
  return files.some((file) => file.startsWith(folderPrefix) && TEST_FILE_RE.test(file));
}

function logHeader(title) {
  console.log(`\n=== ${title} ===`);
}

function main() {
  const changedFiles = loadChangedFiles();

  if (changedFiles.length === 0) {
    console.log("Quality gate: no changed files detected, skipping.");
    process.exit(0);
  }

  const protectedModuleFiles = changedFiles.filter(isProtectedModuleFile);
  const touchedModules = listTouchedProtectedModules(changedFiles);
  const criticalFlowChanged = changedFiles.some(isCriticalFlowChange);

  const hasUnit = hasTestChange(changedFiles, "tests/unit/");
  const hasIntegration = hasTestChange(changedFiles, "tests/integration/");
  const hasE2E = hasTestChange(changedFiles, "tests/e2e/");

  const failures = [];

  if (protectedModuleFiles.length > 0) {
    if (!hasUnit) {
      failures.push(
        "Protected modules changed, but no unit test update found under tests/unit/**/*.test.{ts,tsx}.",
      );
    }
    if (!hasIntegration) {
      failures.push(
        "Protected modules changed, but no integration test update found under tests/integration/**/*.test.{ts,tsx}.",
      );
    }
  }

  if (criticalFlowChanged && !hasE2E) {
    failures.push(
      "Critical flow files changed, but no E2E test update found under tests/e2e/**/*.test.{ts,tsx}.",
    );
  }

  logHeader("Quality Gate Summary");
  console.log(`Changed files: ${changedFiles.length}`);
  if (touchedModules.length > 0) {
    console.log(`Touched protected modules: ${touchedModules.join(", ")}`);
  } else {
    console.log("Touched protected modules: none");
  }
  console.log(`Critical flow changed: ${criticalFlowChanged ? "yes" : "no"}`);
  console.log(`Unit test changes: ${hasUnit ? "yes" : "no"}`);
  console.log(`Integration test changes: ${hasIntegration ? "yes" : "no"}`);
  console.log(`E2E test changes: ${hasE2E ? "yes" : "no"}`);

  if (failures.length === 0) {
    console.log("\nQuality gate passed.");
    process.exit(0);
  }

  logHeader("Failures");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }

  if (protectedModuleFiles.length > 0) {
    logHeader("Protected Module File Changes");
    for (const file of protectedModuleFiles) {
      console.error(`- ${file}`);
    }
  }

  process.exit(1);
}

main();
