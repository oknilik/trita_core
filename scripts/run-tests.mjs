#!/usr/bin/env node

import { readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";

const layer = process.argv[2];
const flags = new Set(process.argv.slice(3));

const isWatch = flags.has("--watch");
const isUi = flags.has("--ui");

const TEST_FILE_RE = /\.(?:test|spec)\.(?:ts|tsx)$/;

const UNIT_ROOTS = ["src", "test", "tests"];
const E2E_ROOTS = ["e2e", "tests/e2e"];

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

function isUnitTestFile(file) {
  return (
    TEST_FILE_RE.test(file) &&
    !file.includes(".integration.test.") &&
    !file.includes(".client.test.")
  );
}

function isIntegrationTestFile(file) {
  return file.includes(".integration.test.") && TEST_FILE_RE.test(file);
}

function isClientTestFile(file) {
  return (
    TEST_FILE_RE.test(file) &&
    (file.includes(".client.test.") || file.includes(".component.test."))
  );
}

function isE2eTestFile(file) {
  return TEST_FILE_RE.test(file);
}

function printSkip(layerName) {
  console.log(`[test:${layerName}] no matching test files, skipping`);
}

async function runNodeTsxTests(files, layerName) {
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

  const args = ["playwright", "test"];
  if (isUi) {
    args.push("--ui");
  }
  if (isWatch) {
    args.push("--headed");
  }
  await run("npx", args);
}

async function main() {
  if (!layer) {
    throw new Error("Missing test layer argument: unit|integration|client|e2e");
  }

  if (layer === "unit") {
    const files = await collectFiles(UNIT_ROOTS, isUnitTestFile);
    await runNodeTsxTests(files, "unit");
    return;
  }

  if (layer === "integration") {
    const files = await collectFiles(UNIT_ROOTS, isIntegrationTestFile);
    await runNodeTsxTests(files, "integration");
    return;
  }

  if (layer === "client") {
    const files = await collectFiles(UNIT_ROOTS, isClientTestFile);
    await runClientTests(files);
    return;
  }

  if (layer === "e2e") {
    const files = await collectFiles(E2E_ROOTS, isE2eTestFile);
    await runE2eTests(files);
    return;
  }

  throw new Error(`Unknown test layer: ${layer}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
