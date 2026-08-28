import { readFileSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";
import test from "node:test";

const source = readFileSync(
  join(process.cwd(), "src/app/(marketing)/blog/[slug]/page.tsx"),
  "utf8",
);

test("a blogcikk az egységes, finom visszavezérlőt használja", () => {
  assert.match(source, /<EditorialBackControl/);
  assert.match(source, /href="\/blog"/);
  assert.doesNotMatch(source, /<ArrowLeft|←/u);
});

test("a cikkfejléc a publikus felületek puhább kártyanyelvét követi", () => {
  assert.match(source, /rounded-\[20px\] border border-sand bg-surface-card\/70/);
  assert.match(source, /rounded-\[24px\] border border-sand/);
  assert.match(source, /sm:rounded-\[28px\]/);
});

test("az MDX szerkesztői blokkok nem használják a régi tízpixeles kártyasugarat", () => {
  assert.doesNotMatch(source, /rounded-\[10px\]/);
  assert.match(source, /function Callout[\s\S]*?rounded-\[20px\]/);
  assert.match(source, /function StatCard[\s\S]*?rounded-\[18px\]/);
  assert.match(source, /function CompareTable[\s\S]*?rounded-\[20px\]/);
  assert.match(source, /function KeyInsight[\s\S]*?rounded-\[20px\]/);
});
