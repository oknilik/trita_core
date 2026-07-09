#!/usr/bin/env node

import { spawn } from "node:child_process";
import { resolveIntegrationTestDbEnv } from "./test-db-env.mjs";

const REQUIRED_ENTRYPOINTS = [
  "onboarding",
  "join",
  "apply",
  "observe",
  "profile/results",
  "org dashboard",
  "team dashboard",
];

const CHECKS = [
  {
    id: "surface-character",
    title: "Surface character guardrail",
    kind: "command",
    command: "node",
    args: ["scripts/ui-surface-guardrail.mjs"],
    covers: ["self/team/org visual character"],
  },
  {
    id: "journey-entrypoints",
    title: "E2E critical entrypoint smoke (guest handoff)",
    kind: "command",
    command: "npx",
    args: ["playwright", "test", "tests/e2e/journey/journey-entrypoints-smoke.test.ts"],
    covers: ["onboarding", "join"],
  },
  {
    id: "assessment-flow",
    title: "E2E assessment flow smoke",
    kind: "command",
    command: "npx",
    args: ["playwright", "test", "tests/e2e/assessment/assessment-flow.test.ts"],
    covers: ["assessment progression stability (supports profile/results path)"],
  },
  {
    id: "observer-flow",
    title: "E2E observe flow smoke",
    kind: "command",
    command: "npx",
    args: ["playwright", "test", "tests/e2e/observer/observer-flow.test.ts"],
    covers: ["observe"],
  },
  {
    id: "join-apply-integration",
    title: "Integration join/apply smoke",
    kind: "integration",
    files: [
      "tests/integration/join/join-acceptance-matrix.integration.test.ts",
      "tests/integration/apply/apply-flow.integration.test.ts",
    ],
    covers: ["join", "apply"],
  },
  {
    id: "journey-destination-integration",
    title: "Integration journey destination smoke",
    kind: "integration",
    files: [
      "tests/integration/journey/journey-contract.integration.test.ts",
      "tests/integration/journey/guardrails.integration.test.ts",
    ],
    covers: ["profile/results", "org dashboard", "team dashboard"],
  },
];

function parseArgs(argv) {
  const flags = new Set(argv);
  const onlyArg = argv.find((arg) => arg.startsWith("--only="));
  const only = onlyArg
    ? new Set(
        onlyArg
          .replace("--only=", "")
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean),
      )
    : null;

  return {
    list: flags.has("--list"),
    dryRun: flags.has("--dry-run"),
    only,
  };
}

function selectChecks(only) {
  if (!only) return CHECKS;
  return CHECKS.filter((check) => only.has(check.id));
}

function printChecklistCoverage(selectedChecks) {
  console.log("");
  console.log("UI Smoke Coverage Map");
  console.log("=".repeat(80));

  for (const entrypoint of REQUIRED_ENTRYPOINTS) {
    const covering = selectedChecks.filter((check) =>
      check.covers.some((item) => item.toLowerCase().includes(entrypoint)),
    );
    const labels = covering.length > 0 ? covering.map((item) => item.id).join(", ") : "none";
    console.log(`- ${entrypoint}: ${labels}`);
  }
}

function run(command, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env,
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} exited with code ${code ?? 1}`));
    });
  });
}

async function runCommandCheck(check, options = {}) {
  const env = { ...process.env, ...(options.extraEnv ?? {}) };
  await run(check.command, check.args, env);
}

async function runIntegrationChecks(checks, dryRun) {
  if (checks.length === 0) return;

  const integrationEnv = resolveIntegrationTestDbEnv();
  const env = { ...process.env, ...integrationEnv };

  if (dryRun) {
    console.log("[dry-run] node scripts/test-integration-bootstrap.mjs");
    for (const check of checks) {
      console.log(`[dry-run] npx tsx --test ${check.files.join(" ")}`);
    }
    console.log("[dry-run] node scripts/test-integration-cleanup.mjs");
    return;
  }

  await run("node", ["scripts/test-integration-bootstrap.mjs"], env);
  try {
    for (const check of checks) {
      console.log("");
      console.log(`[ui-smoke] ${check.title}`);
      await run("npx", ["tsx", "--test", ...check.files], {
        ...env,
        NODE_OPTIONS: process.env.NODE_OPTIONS
          ? `${process.env.NODE_OPTIONS} --conditions=react-server`
          : "--conditions=react-server",
      });
    }
  } finally {
    await run("node", ["scripts/test-integration-cleanup.mjs"], env);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const selectedChecks = selectChecks(args.only);

  if (selectedChecks.length === 0) {
    console.error("No checks selected. Use --only=<id1,id2> with valid check ids.");
    process.exit(1);
  }

  if (args.list) {
    console.log("Available UI smoke checks:");
    for (const check of CHECKS) {
      console.log(`- ${check.id}: ${check.title}`);
    }
    printChecklistCoverage(selectedChecks);
    process.exit(0);
  }

  printChecklistCoverage(selectedChecks);

  const commandChecks = selectedChecks.filter((check) => check.kind === "command");
  const integrationChecks = selectedChecks.filter((check) => check.kind === "integration");

  for (const check of commandChecks) {
    console.log("");
    console.log(`[ui-smoke] ${check.title}`);
    if (args.dryRun) {
      console.log(`[dry-run] ${check.command} ${check.args.join(" ")}`);
      continue;
    }
    await runCommandCheck(check);
  }

  await runIntegrationChecks(integrationChecks, args.dryRun);

  console.log("");
  console.log("UI smoke checks passed.");
}

main().catch((error) => {
  console.error("[ui-smoke] failed");
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});

