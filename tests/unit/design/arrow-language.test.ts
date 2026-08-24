import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TRANSLATION_FILES = [
  "src/lib/i18n/common.ts",
  "src/lib/i18n/landing.ts",
  "src/lib/i18n/results.ts",
  "src/lib/i18n/org.ts",
  "src/lib/i18n/assessment.ts",
  "src/lib/mode-copy.ts",
];

test("a CTA- és navigációs feliratok nem tartalmaznak dekoratív nyílvéget", () => {
  const violations = TRANSLATION_FILES.flatMap((file) => {
    const source = readFileSync(path.join(ROOT, file), "utf8");
    return source
      .split("\n")
      .map((line, index) => ({ file, line, lineNumber: index + 1 }))
      .filter(({ line }) => / →["'`]\s*[,}]/.test(line));
  });

  assert.deepEqual(
    violations,
    [],
    `A nyíl az ikonrétegbe tartozik, nem a fordításba:\n${violations
      .map(({ file, lineNumber }) => `${file}:${lineNumber}`)
      .join("\n")}`,
  );
});

test("az auth CTA-k és a súgó nem hozzák vissza a régi nyílglyph-eket", () => {
  const files = [
    "src/app/(auth)/sign-in/page.tsx",
    "src/app/(auth)/sign-up/page.tsx",
    "src/components/help/HelpWidget.tsx",
  ];

  for (const file of files) {
    const source = readFileSync(path.join(ROOT, file), "utf8");
    assert.equal(source.includes("→"), false, `${file}: nyers előrenyíl maradt`);
    assert.equal(source.includes("←"), false, `${file}: nyers visszanyíl maradt`);
  }
});
