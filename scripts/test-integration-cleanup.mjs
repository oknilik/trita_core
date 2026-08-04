#!/usr/bin/env node

import { spawn } from "node:child_process";
import { resolveIntegrationTestDbEnv } from "./test-db-env.mjs";

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

async function main() {
  // Ld. test-integration-bootstrap.mjs: a szülő által előkészített env-et
  // nem oldjuk fel újra.
  const integrationEnv =
    process.env.TRITA_INTEGRATION_TEST_DB === "1"
      ? { ...process.env }
      : { ...process.env, ...resolveIntegrationTestDbEnv() };

  await run("npx", ["tsx", "scripts/reset-test-db.ts"], integrationEnv);
}

main().catch((error) => {
  console.error("[integration-cleanup]", error.message);
  process.exit(1);
});
