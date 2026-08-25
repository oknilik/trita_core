import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const shellSource = readFileSync(
  path.join(process.cwd(), "src/components/assessment/AssessmentFlowShell.tsx"),
  "utf8",
);

test("az assessment shell megtartja a közös szélesség- és igazítási szerződést", () => {
  assert.match(shellSource, /width === "compact" \? "max-w-xl" : "max-w-2xl"/);
  assert.match(shellSource, /centered \? "items-center justify-center py-12" : ""/);
});

test("a közös assessment főakció legalább 44px magas", () => {
  assert.match(
    shellSource,
    /assessmentPrimaryActionClass[\s\S]*min-h-\[44px\]/,
  );
});

test("az intro és a státusz ugyanarra a kompakt shellre épül", () => {
  const compactCenteredUsages = shellSource.match(
    /<AssessmentFlowShell width="compact" centered>/g,
  );

  assert.equal(compactCenteredUsages?.length, 2);
  assert.match(shellSource, /<StatePanel tone=\{tone\} title=\{title\} body=\{body\} action=\{action\} \/>/);
});
