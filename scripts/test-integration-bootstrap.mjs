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
  const integrationEnv = {
    ...process.env,
    ...resolveIntegrationTestDbEnv(),
  };

  await run("npx", ["prisma", "migrate", "deploy", "--schema", "prisma/schema.prisma"], integrationEnv);
  await run("npx", ["tsx", "scripts/reset-test-db.ts"], integrationEnv);
  await run("npx", ["tsx", "scripts/seed-test-db.ts"], integrationEnv);
}

main().catch((error) => {
  console.error("[integration-bootstrap]", error.message);
  process.exit(1);
});
