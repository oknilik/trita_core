#!/usr/bin/env node

import { readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { resolveIntegrationTestDbEnv } from "./test-db-env.mjs";
import { resolveE2eRuntimeEnv } from "./e2e-runtime-env.mjs";

const layer = process.argv[2];
const flags = new Set(process.argv.slice(3));

const isWatch = flags.has("--watch");
const isUi = flags.has("--ui");

const TEST_FILE_RE = /\.(?:test|spec)\.(?:ts|tsx)$/;

const UNIT_ROOTS = ["tests/unit"];
const INTEGRATION_ROOTS = ["tests/integration"];
const CLIENT_ROOTS = ["tests/client"];
const E2E_ROOTS = ["tests/e2e"];

function mergeNodeOptions(extra) {
  const current = process.env.NODE_OPTIONS?.trim();
  return current ? `${current} ${extra}` : extra;
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      ...options,
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

function hasBinary(binary) {
  const result = spawnSync("npx", ["--no-install", binary, "--version"], {
    stdio: "ignore",
  });
  return result.status === 0;
}

async function walkFiles(startDir) {
  if (!existsSync(startDir)) return [];

  const entries = await readdir(startDir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const absolute = path.join(startDir, entry.name);
      if (entry.isDirectory()) {
        return walkFiles(absolute);
      }
      if (entry.isFile()) {
        return [absolute];
      }
      return [];
    }),
  );
  return nested.flat();
}

async function collectFiles(roots, predicate) {
  const absoluteRoots = roots.map((root) => path.resolve(process.cwd(), root));
  const files = (await Promise.all(absoluteRoots.map((root) => walkFiles(root)))).flat();
  return files
    .map((file) => path.relative(process.cwd(), file))
    .filter((file) => predicate(file))
    .sort();
}

function isTestFile(file) {
  return TEST_FILE_RE.test(file);
}

function printSkip(layerName) {
  console.log(`[test:${layerName}] no matching test files, skipping`);
}

async function runNodeTsxTests(files, layerName, extraEnv = {}) {
  if (files.length === 0) {
    printSkip(layerName);
    return;
  }

  const args = ["tsx", "--test"];
  if (isWatch) {
    args.push("--watch");
  }
  args.push(...files);

  await run("npx", args, {
    env: {
      ...process.env,
      ...extraEnv,
      NODE_OPTIONS: mergeNodeOptions("--conditions=react-server"),
    },
  });
}

async function runClientTests(files) {
  if (files.length === 0) {
    printSkip("client");
    return;
  }
  if (!hasBinary("vitest")) {
    throw new Error("Client tests found but vitest is not installed");
  }

  const args = ["vitest", isWatch ? "" : "run"].filter(Boolean);
  args.push(...files);
  await run("npx", args);
}

async function runE2eTests(files) {
  if (files.length === 0) {
    printSkip("e2e");
    return;
  }
  if (!hasBinary("playwright")) {
    throw new Error("E2E tests found but playwright is not installed");
  }

  // CI-ben (és dedikált teszt-DB-vel helyben) csak TEST_DATABASE_URL érkezik:
  // a fixture-öket seedelő playwright-process és a webServer (next dev) is a
  // DATABASE_URL-t olvassa, a nyers Postgresen pedig séma sincs. Ha van
  // feloldható teszt-DB env, képezzük le és bootstrapoljuk (migrate+reset+
  // seed) — enélkül az e2e fázis CI-ben mindig „Environment variable not
  // found: DATABASE_URL" hibával halt el. Teszt-DB env híján a korábbi
  // viselkedés él: a meglévő (dev) környezet öröklődik változatlanul.
  let e2eDbEnv = null;
  try {
    e2eDbEnv = resolveIntegrationTestDbEnv();
  } catch {
    // nincs teszt-DB konfigurálva — helyi dev-DB elleni futás
  }
  if (e2eDbEnv) {
    const bootstrapEnv = { ...process.env, ...e2eDbEnv };
    await run("node", ["scripts/test-integration-bootstrap.mjs"], {
      env: bootstrapEnv,
    });
  }

  const args = ["playwright", "test"];
  if (isUi) {
    args.push("--ui");
  }
  if (isWatch) {
    args.push("--headed");
  }
  // A playwright-process env-je öröklődik a webServer-parancsra (next dev) —
  // a runtime-fallbackok így CI-ben és helyben is ugyanazt a hermetikus
  // környezetet adják.
  await run("npx", args, {
    env: { ...process.env, ...resolveE2eRuntimeEnv(), ...(e2eDbEnv ?? {}) },
  });
}

async function main() {
  if (!layer) {
    throw new Error("Missing test layer argument: unit|integration|client|e2e");
  }

  if (layer === "unit") {
    const files = await collectFiles(UNIT_ROOTS, isTestFile);
    await runNodeTsxTests(files, "unit");
    return;
  }

  if (layer === "integration") {
    const files = await collectFiles(INTEGRATION_ROOTS, isTestFile);
    if (files.length === 0) {
      printSkip("integration");
      return;
    }

    const integrationEnv = resolveIntegrationTestDbEnv();
    const processWithIntegrationEnv = {
      ...process.env,
      ...integrationEnv,
    };

    await run("node", ["scripts/test-integration-bootstrap.mjs"], {
      env: processWithIntegrationEnv,
    });

    try {
      await runNodeTsxTests(files, "integration", integrationEnv);
    } finally {
      await run("node", ["scripts/test-integration-cleanup.mjs"], {
        env: processWithIntegrationEnv,
      });
    }
    return;
  }

  if (layer === "client") {
    const files = await collectFiles(CLIENT_ROOTS, isTestFile);
    await runClientTests(files);
    return;
  }

  if (layer === "e2e") {
    const files = await collectFiles(E2E_ROOTS, isTestFile);
    await runE2eTests(files);
    return;
  }

  throw new Error(`Unknown test layer: ${layer}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
