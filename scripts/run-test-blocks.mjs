#!/usr/bin/env node

import { readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { resolveIntegrationTestDbEnv } from "./test-db-env.mjs";

const rawArgs = process.argv.slice(2);
const flags = new Set(rawArgs);
const includeE2e = flags.has("--with-e2e");
const failFast = flags.has("--fail-fast");

const TEST_FILE_RE = /\.(?:test|spec)\.(?:ts|tsx)$/;
const SUPPORTED_LAYERS = ["unit", "integration", "client", "e2e"];

function parseLayers() {
  const layersArg = rawArgs.find((arg) => arg.startsWith("--layers="));
  const parsed = layersArg
    ? layersArg
        .replace("--layers=", "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : ["unit"];

  const unique = Array.from(new Set(parsed));
  for (const layer of unique) {
    if (!SUPPORTED_LAYERS.includes(layer)) {
      throw new Error(`Unsupported layer "${layer}". Supported: ${SUPPORTED_LAYERS.join(", ")}`);
    }
  }

  if (includeE2e && !unique.includes("e2e")) {
    unique.push("e2e");
  }

  return unique;
}

const layers = parseLayers();

const LAYER_ROOTS = {
  unit: ["tests/unit"],
  integration: ["tests/integration"],
  client: ["tests/client"],
  e2e: ["tests/e2e"],
};

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

function isTestFile(file) {
  return TEST_FILE_RE.test(file);
}

async function collectLayerFiles(layer) {
  const roots = LAYER_ROOTS[layer] ?? [];
  const absoluteRoots = roots.map((root) => path.resolve(process.cwd(), root));
  const files = (await Promise.all(absoluteRoots.map((root) => walkFiles(root)))).flat();
  return files
    .map((file) => path.relative(process.cwd(), file))
    .filter(isTestFile)
    .sort();
}

function normalizePath(value) {
  return value.split(path.sep).join("/");
}

function groupByDomain(layer, files) {
  const grouped = new Map();

  for (const file of files) {
    const normalized = normalizePath(file);
    const parts = normalized.split("/");
    const domain = parts[2] ?? "core";
    const key = `${layer}:${domain}`;
    const current = grouped.get(key);
    if (current) {
      current.files.push(file);
      continue;
    }
    grouped.set(key, { layer, domain, files: [file] });
  }

  return Array.from(grouped.values()).sort((a, b) => {
    if (a.layer !== b.layer) return a.layer.localeCompare(b.layer);
    return a.domain.localeCompare(b.domain);
  });
}

function printHeader(title) {
  const divider = "=".repeat(80);
  console.log("");
  console.log(divider);
  console.log(title);
  console.log(divider);
}

function formatSeconds(ms) {
  return (ms / 1000).toFixed(2);
}

async function runDomainBlock(block, extraEnv = {}) {
  const label = `${block.layer.toUpperCase()} / ${block.domain.toUpperCase()}`;
  printHeader(`[test:block] ${label} (${block.files.length} file${block.files.length === 1 ? "" : "s"})`);

  const startedAt = Date.now();
  try {
    if (block.layer === "unit" || block.layer === "integration") {
      await run("npx", ["tsx", "--test", ...block.files], {
        env: {
          ...process.env,
          ...extraEnv,
          NODE_OPTIONS: mergeNodeOptions("--conditions=react-server"),
        },
      });
    } else if (block.layer === "client") {
      await run("npx", ["vitest", "run", ...block.files], {
        env: {
          ...process.env,
          ...extraEnv,
        },
      });
    } else if (block.layer === "e2e") {
      await run("npx", ["playwright", "test", ...block.files], {
        env: {
          ...process.env,
          ...extraEnv,
        },
      });
    } else {
      throw new Error(`Unknown test layer: ${block.layer}`);
    }

    const durationMs = Date.now() - startedAt;
    console.log(`[test:block] PASS ${label} (${formatSeconds(durationMs)}s)`);
    return {
      ...block,
      status: "pass",
      durationMs,
      errorMessage: null,
    };
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[test:block] FAIL ${label} (${formatSeconds(durationMs)}s)`);
    console.error(`[test:block] ${errorMessage}`);
    return {
      ...block,
      status: "fail",
      durationMs,
      errorMessage,
    };
  }
}

async function runIntegrationBlocks(blocks) {
  if (blocks.length === 0) return [];

  const integrationEnv = resolveIntegrationTestDbEnv();
  const processWithIntegrationEnv = {
    ...process.env,
    ...integrationEnv,
  };

  printHeader("[test:block] INTEGRATION BOOTSTRAP");
  await run("node", ["scripts/test-integration-bootstrap.mjs"], {
    env: processWithIntegrationEnv,
  });

  const results = [];
  try {
    for (const block of blocks) {
      const result = await runDomainBlock(block, integrationEnv);
      results.push(result);
      if (failFast && result.status === "fail") {
        break;
      }
    }
  } finally {
    printHeader("[test:block] INTEGRATION CLEANUP");
    await run("node", ["scripts/test-integration-cleanup.mjs"], {
      env: processWithIntegrationEnv,
    });
  }

  return results;
}

function printLayerSkip(layer) {
  console.log(`[test:block] no test files for layer "${layer}", skipping`);
}

function printSummary(results) {
  printHeader("[test:block] SUMMARY");
  if (results.length === 0) {
    console.log("No matching test blocks found.");
    return;
  }

  for (const result of results) {
    const status = result.status === "pass" ? "PASS" : "FAIL";
    const label = `${result.layer}/${result.domain}`;
    console.log(
      `${status.padEnd(5)} ${label.padEnd(24)} files=${String(result.files.length).padEnd(2)} duration=${formatSeconds(result.durationMs)}s`,
    );
  }

  const failed = results.filter((result) => result.status === "fail");
  if (failed.length === 0) {
    console.log(`All ${results.length} block(s) passed.`);
    return;
  }

  console.error(`${failed.length} block(s) failed.`);
}

async function main() {
  const allResults = [];

  for (const layer of layers) {
    const layerFiles = await collectLayerFiles(layer);
    if (layerFiles.length === 0) {
      printLayerSkip(layer);
      continue;
    }

    const blocks = groupByDomain(layer, layerFiles);

    if (layer === "integration") {
      const results = await runIntegrationBlocks(blocks);
      allResults.push(...results);
      if (failFast && results.some((result) => result.status === "fail")) {
        break;
      }
      continue;
    }

    for (const block of blocks) {
      const result = await runDomainBlock(block);
      allResults.push(result);
      if (failFast && result.status === "fail") {
        printSummary(allResults);
        process.exit(1);
      }
    }
  }

  printSummary(allResults);
  const failedCount = allResults.filter((result) => result.status === "fail").length;
  process.exit(failedCount > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
