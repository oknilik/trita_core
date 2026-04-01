# Test Structure & Naming

This project uses a layered `tests/` structure to keep test intent explicit and discoverable.

Layer ownership reference:

- `docs/test-ownership.md`

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

## Integration DB bootstrap

Integration tests run against a dedicated test database and **must not** use the dev DB.

1. Copy `.env.test.example` to `.env.test` (or `.env.test.local`).
2. Set `TEST_DATABASE_URL` (and optionally `TEST_DIRECT_URL`) to an isolated DB.
3. Run `pnpm test:integration`.

What happens automatically on `test:integration`:

- bootstrap: `prisma migrate deploy` on test DB
- reset: truncate current schema tables (excluding `_prisma_migrations`)
- seed: deterministic baseline data via `scripts/seed-test-db.ts`
- test run
- cleanup: schema reset after suite

## CI pipeline split

CI runs test layers in separate jobs:

- `unit`
- `integration`
- `client`
- `e2e`

This keeps failures isolated by layer (flaky E2E cannot hide unit/integration/client failures).
Artifacts are uploaded per layer:

- logs for failed/successful runs
- E2E screenshots/videos/traces and Playwright report
- coverage directory upload (when present)

## Functional block execution

To see test output in domain-level blocks (for example `journey`, `assessment`, `join`, `policy`), use:

- `pnpm test:blocks` — runs `unit` grouped by functional domains
- `pnpm test:blocks:all` — runs `unit + integration + client` in functional blocks
- `pnpm test:blocks:full` — runs `unit + integration + client + e2e` in functional blocks

Each block is printed with a dedicated header and a final PASS/FAIL summary, so it is easy to see which functional area broke.

## UI migration smoke + surface guardrail

For major UI refactors, run the dedicated smoke pack:

- `pnpm test:ui:smoke:list` — list checks + entrypoint coverage map
- `pnpm test:ui:smoke` — run full UI migration smoke suite
- `pnpm test:ui:surface` — run self/team/org surface character guardrail only

Related playbook:

- `docs/ui-migration-regression-playbook.md`
