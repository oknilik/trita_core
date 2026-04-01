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

## Shared test toolkit

Use the common helper layer instead of hand-crafted inline fixtures when possible:

- `tests/factories/user-factory.ts` — test user + profile fixtures
- `tests/factories/org-team-factory.ts` — org/team/membership/invite fixtures
- `tests/factories/subscription-factory.ts` — subscription records and snapshots
- `tests/factories/journey-fixture-builder.ts` — journey context/state/resolution builders
- `tests/helpers/auth-mock.ts` — reusable auth context mocks
- `tests/helpers/local-storage-mock.ts` — in-memory `localStorage` test double
- `tests/helpers/fake-timer.ts` — `node:test` timer helpers
- `tests/helpers/seeded-db-reset.ts` — dependency-aware seeded DB cleanup helper

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
