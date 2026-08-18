import assert from "node:assert/strict";
import test from "node:test";
import os from "node:os";
import path from "node:path";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { resolveIntegrationTestDbEnv } from "../../../scripts/test-db-env.mjs";

test("resolveIntegrationTestDbEnv loads dedicated test URL from .env.test", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "trita-test-db-env-"));

  try {
    await writeFile(
      path.join(tempDir, ".env.test"),
      [
        'TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/trita_integration_test"',
        'TEST_DIRECT_URL="postgresql://postgres:postgres@localhost:5432/trita_integration_test_direct"',
      ].join("\n"),
      "utf8",
    );

    const resolved = resolveIntegrationTestDbEnv({
      cwd: tempDir,
      processEnv: {},
    });

    assert.equal(
      resolved.DATABASE_URL,
      "postgresql://postgres:postgres@localhost:5432/trita_integration_test",
    );
    assert.equal(
      resolved.DIRECT_URL,
      "postgresql://postgres:postgres@localhost:5432/trita_integration_test_direct",
    );
    assert.equal(resolved.TRITA_INTEGRATION_TEST_DB, "1");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("resolveIntegrationTestDbEnv rejects when test DB matches dev DB", () => {
  assert.throws(
    () =>
      resolveIntegrationTestDbEnv({
        processEnv: {
          DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/trita_dev",
          TEST_DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/trita_dev",
        },
      }),
    /must not match DATABASE_URL/,
  );
});

test("resolveIntegrationTestDbEnv corrects reversed Neon pooled and direct URLs", () => {
  const direct = "postgresql://user:pass@ep-test.eu-central-1.aws.neon.tech/neondb?sslmode=require";
  const pooled =
    "postgresql://user:pass@ep-test-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require";

  const resolved = resolveIntegrationTestDbEnv({
    processEnv: {
      DATABASE_URL: "postgresql://user:pass@ep-dev-pooler.eu-central-1.aws.neon.tech/neondb",
      TEST_DATABASE_URL: direct,
      TEST_DIRECT_URL: pooled,
    },
  });

  assert.equal(resolved.DATABASE_URL, pooled);
  assert.equal(resolved.DIRECT_URL, direct);
});
