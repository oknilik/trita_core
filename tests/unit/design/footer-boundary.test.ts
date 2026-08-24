import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const footer = readFileSync(path.join(ROOT, "src/components/Footer.tsx"), "utf8");

test("a közös footer nem fed rá az előtte álló oldalra", () => {
  assert.doesNotMatch(footer, /className="[^"]*-mt-(?:10|14)[^"]*"/);
  assert.match(footer, /data-site-footer/);
  assert.match(footer, /pt-8 md:pt-10/);
});

test("a hullám és a footer-felület azonos tokennel, varratfedéssel kapcsolódik", () => {
  assert.match(footer, /fill="var\(--color-surface-inverse\)"/);
  assert.match(footer, /from-\[var\(--color-surface-inverse\)\]/);
  assert.match(footer, /data-footer-surface[\s\S]*?-mt-px/);
});
