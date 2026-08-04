// A manuális tesztkatalógus integritás-őrzője: a generátor sémáját a
// katalógus minden bejegyzésének tartania kell, különben az átadott
// teszt-Excel csendben hiányos lenne.
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const CATALOG_DIR = path.resolve(process.cwd(), "tests/manual/catalog");

test("a manuális tesztkatalógus érvényes és konzisztens", async () => {
  const { loadCatalog, validateCases } = await import(
    "../../../scripts/lib/manual-test-catalog.mjs"
  );
  const cases = await loadCatalog(CATALOG_DIR);
  assert.ok(cases.length > 0, "a katalógus nem lehet üres");
  const errors = validateCases(cases);
  assert.deepEqual(errors, [], `katalógus-hibák:\n${errors.join("\n")}`);
});

test("minden P1-es esetnek van várt kimenete és lépéssora", async () => {
  const { loadCatalog } = await import(
    "../../../scripts/lib/manual-test-catalog.mjs"
  );
  const cases = await loadCatalog(CATALOG_DIR);
  for (const c of cases.filter((x: { priority: string }) => x.priority === "P1")) {
    assert.ok(
      String(c.steps).length >= 20,
      `${c.id}: a P1-es eset lépéssora túl rövid`,
    );
    assert.ok(
      String(c.expected).length >= 15,
      `${c.id}: a P1-es eset várt kimenete túl rövid`,
    );
  }
});
