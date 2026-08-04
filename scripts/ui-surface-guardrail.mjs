#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";

async function read(relativePath) {
  const absolute = path.resolve(relativePath);
  return readFile(absolute, "utf8");
}

function assertContains(content, needle, message, failures) {
  if (!content.includes(needle)) {
    failures.push(message);
  }
}

async function main() {
  const failures = [];

  const [globalsCss, shell, card, eyebrow, surfaceHero] = await Promise.all([
    read("src/app/globals.css"),
    read("src/components/layout/PlatformPageShell.tsx"),
    read("src/components/ui/primitives/Card.tsx"),
    read("src/components/ui/primitives/SectionEyebrow.tsx"),
    read("src/components/ui/patterns/SurfaceHero.tsx"),
  ]);

  const requiredSurfaceTokens = [
    "--color-surface-self-accent",
    "--color-surface-team-accent",
    "--color-surface-org-accent",
    "--color-surface-self-accent-soft",
    "--color-surface-team-accent-soft",
    "--color-surface-org-accent-soft",
  ];

  for (const token of requiredSurfaceTokens) {
    assertContains(
      globalsCss,
      token,
      `Missing required surface token in globals.css: ${token}`,
      failures,
    );
  }

  const requiredVariants = ["self", "team", "org"];

  for (const variant of requiredVariants) {
    assertContains(
      shell,
      `${variant}: "var(--color-surface-${variant}-accent)"`,
      `PlatformPageShell is missing ${variant} accent mapping.`,
      failures,
    );
    assertContains(
      eyebrow,
      `${variant}: "text-surface-${variant}-accent"`,
      `SectionEyebrow is missing ${variant} tone class mapping.`,
      failures,
    );
    assertContains(
      card,
      `${variant}: "data-[surface=${variant}]`,
      `Card primitive is missing ${variant} surface mapping.`,
      failures,
    );
  }

  for (const variant of requiredVariants) {
    assertContains(
      surfaceHero,
      `${variant}: {`,
      `SurfaceHero is missing ${variant} theme variant.`,
      failures,
    );
  }

  if (failures.length > 0) {
    console.error("UI surface guardrail failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("UI surface guardrail passed: self/team/org character tokens and variants are present.");
}

main().catch((error) => {
  console.error("[ui-surface-guardrail] execution failed");
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});

