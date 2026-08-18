import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // UI-egységesítés (2026-08-18, F4): a típus-skála immár LEFEDI a teljes
  // felületet (hero 42 · display 34 · title 26 · heading 20 · body 15 ·
  // caption 13 · note 11 · micro 10) + a Tailwind alap-fokok (xs/sm/base) —
  // ezért minden arbitrary text-[Npx] tilos, nem csak a 10px alattiak.
  // Szándékos kivétel (dekoratív, aria-hidden miniatűr) csak sor-szintű
  // lint-kikapcsolás + indoklás mellett.
  // Terv: docs/development/ui-unification-plan.md
  {
    files: ["src/**/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/text-\\[[0-9]+px\\]/]",
          message:
            "Arbitrary betűméret tilos. Használd a típus-skálát (text-hero/display/title/heading/body/caption/note/label/micro) vagy a Tailwind alap-fokokat (text-xs/sm/base) — ld. docs/development/ui-unification-plan.md",
        },
        {
          selector: "TemplateElement[value.raw=/text-\\[[0-9]+px\\]/]",
          message:
            "Arbitrary betűméret tilos. Használd a típus-skálát (text-hero/display/title/heading/body/caption/note/label/micro) vagy a Tailwind alap-fokokat (text-xs/sm/base) — ld. docs/development/ui-unification-plan.md",
        },
      ],
    },
  },
  // Fluid címsor-lépték (2026-08-18): a `text-[clamp(...)]` átcsúszott a fenti
  // px-mintán, ezért a marketing-lapok 8 kézi clamp-képlete visszaszivárgott
  // (tipográfiai audit #7). A közös lépték a `text-fluid-title` (28→42) és a
  // `text-fluid-display` (44→60) @utility a globals.css-ben.
  // Kivétel: a /pilot és a /contact hero-léptéke SZÁNDÉKOSAN egyedi maradt
  // (audit #7 lezáró döntése) — ezt a két lapot a szabály kihagyja.
  {
    files: ["src/**/*.tsx"],
    ignores: ["src/app/(marketing)/pilot/**", "src/app/(marketing)/contact/**"],
    rules: {
      // FIGYELEM: a flat config nem fűzi össze a rule-opciókat — ez a blokk
      // teljesen felülírja a fentit, ezért a px-szelektorokat is viszi.
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/text-\\[[0-9]+px\\]/]",
          message:
            "Arbitrary betűméret tilos. Használd a típus-skálát (text-hero/display/title/heading/body/caption/note/label/micro) vagy a Tailwind alap-fokokat (text-xs/sm/base) — ld. docs/development/ui-unification-plan.md",
        },
        {
          selector: "TemplateElement[value.raw=/text-\\[[0-9]+px\\]/]",
          message:
            "Arbitrary betűméret tilos. Használd a típus-skálát (text-hero/display/title/heading/body/caption/note/label/micro) vagy a Tailwind alap-fokokat (text-xs/sm/base) — ld. docs/development/ui-unification-plan.md",
        },
        {
          selector: "Literal[value=/text-\\[clamp\\(/]",
          message:
            "Kézi clamp() betűméret tilos. Használd a közös fluid léptéket (text-fluid-title / text-fluid-display) vagy a típus-skálát — ld. docs/tipografiai-audit.md #7",
        },
        {
          selector: "TemplateElement[value.raw=/text-\\[clamp\\(/]",
          message:
            "Kézi clamp() betűméret tilos. Használd a közös fluid léptéket (text-fluid-title / text-fluid-display) vagy a típus-skálát — ld. docs/tipografiai-audit.md #7",
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
