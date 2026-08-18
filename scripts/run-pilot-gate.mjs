#!/usr/bin/env node

import { spawn } from "node:child_process";
import { resolveE2eRuntimeEnv } from "./e2e-runtime-env.mjs";
import { resolveIntegrationTestDbEnv } from "./test-db-env.mjs";

const PILOT_TESTS = [
  "tests/e2e/assessment/assessment-flow.test.ts",
  "tests/e2e/observer/observer-flow.test.ts",
  "tests/e2e/analytics/analytics-write-smoke.test.ts",
];

function run(command, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", env });

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

async function main() {
  // A resolver megtagadja a futást, ha a teszt-DB azonos a dev DB-vel.
  const testDbEnv = resolveIntegrationTestDbEnv();
  const gatePort = process.env.TRITA_PILOT_GATE_PORT ?? "4199";
  const env = {
    ...process.env,
    ...resolveE2eRuntimeEnv(),
    ...testDbEnv,
    ANALYTICS_ENABLED: "1",
    ANALYTICS_SALT: process.env.ANALYTICS_SALT ?? "pilot-gate-isolated-test-salt",
    PLAYWRIGHT_BASE_URL: `http://127.0.0.1:${gatePort}`,
    PLAYWRIGHT_PORT: gatePort,
    TRITA_PILOT_GATE: "1",
  };

  console.log("[pilot-gate] isolated DB: migrate + reset + seed");
  await run("node", ["scripts/test-integration-bootstrap.mjs"], env);

  try {
    console.log("[pilot-gate] assessment + observer + analytics critical paths");
    await run(
      "npx",
      ["playwright", "test", "--project=chromium", ...PILOT_TESTS],
      env,
    );
    console.log("[pilot-gate] PASS — pilot release gate is green");
  } finally {
    console.log("[pilot-gate] cleaning isolated DB");
    await run("node", ["scripts/test-integration-cleanup.mjs"], env);
  }
}

main().catch((error) => {
  console.error("[pilot-gate] FAIL", error.message);
  process.exit(1);
});
