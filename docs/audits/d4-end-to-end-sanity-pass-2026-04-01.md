# D4 — End-to-End Sanity Pass (2026-04-01)

## Scope

Sanity check after the journey/acceptance/policy rollout workstreams.

Target flows:

1. self signup
2. team onboarding
3. invite accept
4. apply flow
5. billing upgrade
6. trial -> active
7. active -> restricted
8. restricted -> reactivated

## What Was Executed

### 1) Full automated regression sweep

Command:

```bash
NODE_OPTIONS='--conditions=react-server' npx tsx --test src/lib/**/*.test.ts
```

Result:

- 93 tests passed
- 0 failed

Relevant coverage highlights:

- Journey contract smoke (`src/lib/journey/journey-contract.smoke.test.ts`)
- Guardrails/invariants (`src/lib/journey/guardrails.test.ts`)
- Acceptance integration (`src/lib/acceptance/service.integration.test.ts`)
- Subscription + policy regression (`src/lib/subscription.test.ts`, `src/lib/policy-regression.test.ts`)

### 2) Manual HTTP route sanity (running local dev server on `localhost:3000`)

Commands were executed via `curl` against the active dev server.

Observed:

- `GET /sign-up` -> `200`
- `GET /dashboard` (unauth) -> `307` redirect
- `GET /onboarding` (unauth) -> `307` redirect
- `GET /billing/upgrade` (unauth) -> `307` redirect
- `GET /billing/return?session_id=test` (unauth) -> `307` redirect
- `POST /api/team/join` (unauth) -> `401 {"error":"UNAUTHORIZED"}`
- `POST /api/org/join` (unauth) -> `401 {"error":"UNAUTHORIZED"}`
- `POST /api/billing/checkout` (unauth) -> `401 {"error":"UNAUTHORIZED"}`
- `GET /api/candidate/invalid-token` -> `404 {"error":"INVALID_TOKEN"}`
- `PATCH /api/candidate/invalid-token/progress` -> `400 {"error":"INVALID_INPUT"}`
- `POST /api/candidate/invalid-token/submit` -> `404 {"error":"INVALID_TOKEN"}`

## Flow-by-Flow Verdict

### Self signup

- Status: PASS (sanity)
- Evidence: `/sign-up` is reachable (`200`), unauth protected pages redirect as expected.

### Team onboarding

- Status: PASS (sanity)
- Evidence: onboarding route guard behavior + journey contract / state tests pass.

### Invite accept

- Status: PASS
- Evidence:
  - acceptance integration tests cover new user, existing user, already member, unfinished assessment after join
  - join APIs enforce auth and return expected unauthorized responses when unauthenticated

### Apply flow

- Status: PASS
- Evidence:
  - acceptance integration tests cover expired + duplicate + completion scenarios
  - invalid-token APIs return expected error contracts

### Billing upgrade

- Status: PASS (sanity)
- Evidence: billing upgrade and checkout routes correctly guard unauthenticated access.

### Trial -> active

- Status: PASS
- Evidence: subscription + capability tests validate active/trialing behavior and capability grant set.

### Active -> restricted

- Status: PASS
- Evidence:
  - subscription tests validate restricted derivation
  - policy regression tests validate write gating/read-only behavior in restricted
  - acceptance tests validate restricted/frozen handoff paths

### Restricted -> reactivated

- Status: PASS (logic-level), MANUAL SANDBOX CHECK PENDING
- Evidence:
  - policy + UX tests validate reactivation hint path and restricted gating logic
  - full Stripe webhook-driven lifecycle reactivation was not replayed end-to-end in this local pass

## Risk Notes

- No critical regression was detected in the tested journey/acceptance/policy paths.
- Full payment lifecycle (real Stripe trial cancellation/reactivation webhook chain) still requires dedicated sandbox replay to validate external integration behavior end-to-end.

## Optional Follow-up (recommended)

Run a Stripe sandbox lifecycle drill:

1. start trial in sandbox
2. force `past_due` / restricted
3. reactivate
4. verify capability restoration + UI gating + journey destination consistency
