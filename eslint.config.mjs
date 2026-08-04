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
  // Logging (2026-07-29): console-hívás tilos az src alatt — szerveren a
  // @/lib/logger (getRequestLogger), kliensen a @/lib/client-logger a
  // belépési pont. A két logger-fájl belső console-sink-je eslint-disable
  // kommenttel jelölt kivétel.
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-console": "error",
    },
  },
  // Aláhúzás-konvenció (2026-08-04, lint-nullázás): a `_`-prefixű paraméter
  // szándékosan nem használt (interfész-konform szignatúra, pl. a
  // template-objektumok greeting(_name) tagjai). Csak paraméterekre és
  // catch-változókra vonatkozik — a sima lokálisokra nem.
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
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
