import { readFileSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";
import test from "node:test";

const source = readFileSync(
  join(process.cwd(), "src/app/(marketing)/blog/[slug]/page.tsx"),
  "utf8",
);
const tocSource = readFileSync(
  join(process.cwd(), "src/components/blog/ArticleToc.tsx"),
  "utf8",
);
const ctaSource = readFileSync(
  join(process.cwd(), "src/components/blog/BlogJourneyCta.tsx"),
  "utf8",
);
const shareSource = readFileSync(
  join(process.cwd(), "src/components/blog/ShareRow.tsx"),
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

test("a tartalomjegyzék és a journey CTA ugyanazt a puha felületi rendszert használja", () => {
  assert.match(tocSource, /rounded-\[20px\]/);
  assert.match(ctaSource, /rounded-\[20px\]/);
  assert.match(ctaSource, /rounded-\[24px\]/);
  assert.match(ctaSource, /getButtonClassName/);
  assert.doesNotMatch(ctaSource, /rounded-\[10px\]/);
});

test("a megosztás mobilon törhet, de nem rajzol részleges elválasztóvonalat", () => {
  assert.match(source, /flex flex-wrap items-center/);
  assert.match(source, /max-\[360px\]:w-full/);
  assert.doesNotMatch(source, /w-full border-t border-sand/);
  assert.match(shareSource, /aria-label=\{labels\.copyLink\}/);
  assert.match(shareSource, /aria-label="LinkedIn"/);
  assert.match(shareSource, /aria-label="Email"/);
  assert.match(shareSource, /FOCUS_RING_CLASS/);
});

test("az előző, következő és kapcsolódó cikkek az egységes navigációs kártyát követik", () => {
  assert.match(source, /<BackChevronIcon size="sm" tone="accent" \/>/);
  assert.match(source, /<BackChevronIcon size="sm" tone="accent" className="rotate-180" \/>/);
  assert.doesNotMatch(source, /ChevronRightIcon/);
  assert.match(source, /relatedPosts[\s\S]*?rounded-\[20px\]/);
  assert.match(source, /FOCUS_RING_CLASS/);
});
