# Test Structure & Naming

This project uses a layered `tests/` structure to keep test intent explicit and discoverable.

## Directory layout

- `tests/unit/` — pure domain/module tests (fast, deterministic)
- `tests/integration/` — multi-module + DB/API integration tests
- `tests/client/` — React client/component tests (Vitest + RTL + MSW)
- `tests/e2e/` — browser-level end-to-end tests (Playwright)
- `tests/fixtures/` — reusable static fixture payloads
- `tests/factories/` — typed data factories/builders
- `tests/helpers/` — shared test utilities

## Naming convention

- Test files: `*.test.ts` or `*.spec.ts`
- Keep names behavior-oriented, for example:
  - `journey/guardrails.test.ts`
  - `acceptance/service.integration.test.ts`
  - `assessment/progress-race.test.ts`
- Group by domain first, then concern.

## Rule of thumb

- New business logic should add at least:
  - 1 unit test (`tests/unit/...`)
  - 1 integration test (`tests/integration/...`) when behavior crosses boundaries.
