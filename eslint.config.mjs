import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // UI-egységesítés (2026-07-22, F2): a 10px alatti betűméret a11y-padló
  // alá megy — tilos (a skála legkisebb szerepe a text-micro, 10px).
  // Terv: docs/development/ui-unification-plan.md
  {
    files: ["src/**/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/text-\\[[1-9]px\\]/]",
          message:
            "10px alatti betűméret tilos (a11y-padló). Használd a típus-skálát: text-micro (10px) a legkisebb — ld. docs/development/ui-unification-plan.md",
        },
        {
          selector: "TemplateElement[value.raw=/text-\\[[1-9]px\\]/]",
          message:
            "10px alatti betűméret tilos (a11y-padló). Használd a típus-skálát: text-micro (10px) a legkisebb — ld. docs/development/ui-unification-plan.md",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Agent-worktree-k (saját .next build-artifactokkal) nem lint-célpontok
    ".claude/**",
  ]),
]);

export default eslintConfig;
