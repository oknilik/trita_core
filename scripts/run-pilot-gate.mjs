#!/usr/bin/env node

import { spawn } from "node:child_process";
import { resolveE2eRuntimeEnv } from "./e2e-runtime-env.mjs";
import { resolveIntegrationTestDbEnv } from "./test-db-env.mjs";

// A kapu KÉT rétegből áll.
//
// MIÉRT VÁLTOZOTT (2026-08-23-i audit, P1-12): a kapu korábban CSAK a három
// e2e-t futtatta — közülük az observer a playbook szerint NEM része a Scan
// v1-nek, a Scan v1 három rétege (self → bizalmi háló → pulse) és a rá épülő
// riport-lépések viszont egyáltalán nem szerepeltek benne. A kapu tehát nem
// azt védte, amit a pilot ténylegesen futtat.
//
// A Scan v1 lánc integrációs fedése ezért BEKERÜL a kapuba. Az observer marad:
// előre egyeztetett kiegészítőként ma is élő út, és a tokenes flow törése
// ügyfél előtt derülne ki.

/** Adatbázis-szintű lánc (node:test) — a mérési út perzisztenciája. */
const PILOT_INTEGRATION_TESTS = [
  "tests/integration/team/scan-v1-lane.integration.test.ts",
  "tests/integration/campaigns/step-release.integration.test.ts",
];

/** Böngésző-szintű kritikus utak (Playwright). */
const PILOT_E2E_TESTS = [
  "tests/e2e/assessment/assessment-flow.test.ts",
  "tests/e2e/assessment/assessment-authed-flow.test.ts",
  "tests/e2e/observer/observer-flow.test.ts",
  "tests/e2e/analytics/analytics-write-smoke.test.ts",
  "tests/e2e/accessibility/keyboard-focus.test.ts",
  "tests/e2e/accessibility/axe-critical-routes.test.ts",
  "tests/e2e/policy/capability-gate.test.ts",
  "tests/e2e/team/team-intelligence-visual.test.ts",
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
    // Előbb a lánc: ha a mérési út perzisztenciája törött, a böngésző-szintű
    // futtatás percei feleslegesek — és a hibát is nehezebb lokalizálni.
    console.log("[pilot-gate] Scan v1 measurement lane (integration)");
    await run(
      "npx",
      ["tsx", "--test", ...PILOT_INTEGRATION_TESTS],
      { ...env, NODE_OPTIONS: [process.env.NODE_OPTIONS, "--conditions=react-server"].filter(Boolean).join(" ") },
    );

    console.log("[pilot-gate] assessment + observer + analytics critical paths");
    await run(
      "npx",
      ["playwright", "test", "--project=chromium", ...PILOT_E2E_TESTS],
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
