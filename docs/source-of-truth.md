# Source of Truth — Engineering Guide

Ez a dokumentum rögzíti, hogy a platform fő domain döntései hol születnek meg.

## 1) Journey truth = Journey Engine

- Source of truth: `src/lib/journey/engine.ts` (`resolveJourney`)
- Mit ad vissza: destination, stage, activeSurface, next best action, experience hints, restriction flags
- Következmény: route/page/nav nem hozhat saját párhuzamos home/CTA/state döntést

## 2) Acceptance truth = Shared Acceptance Service

- Source of truth: `src/lib/acceptance/service.ts`
- Felelősség: token validáció, auth-állapot, acceptance state, membership mutation, handoff context
- Következmény: `/join/*` és `/apply/*` route csak orchestration + render, nem domain decision tree

## 3) Billing truth = Stripe Webhook + Subscription State

- Source of truth:
  - Stripe esemény-feldolgozás: `src/app/api/webhooks/stripe/route.ts`
  - Subscription state számítás: `src/lib/subscription.ts` (`getSubscriptionState`)
- Következmény: UI/page nem számol saját billing státuszt; webhook által írt állapotot olvasunk

## 4) Access truth = Policy Engine

- Source of truth:
  - capability modell: `src/lib/capabilities.ts`
  - access döntés: `src/lib/policy-engine.ts` (`getAccessPolicy`, `can`, `resolveCapabilities`)
  - org policy service handoff: `src/lib/policy-service.ts`
- Következmény: page/API nem implementálhat saját role+subscription branchinget

## 5) UI truth = Render + orchestration only

- UI réteg (page/component/route) feladata:
  - input összegyűjtése
  - központi service hívása
  - render/redirect/orchestration
- UI réteg nem teheti:
  - duplikált home decision
  - duplikált acceptance decision
  - duplikált billing/policy decision

## Guardrail checklist (PR reviewhoz)

- Van-e page-level domain döntés, ami központi engine/service-be való?
- Van-e párhuzamos logika a journey/acceptance/policy mellett?
- Ugyanazt az ágat több helyen implementáljuk-e?
- Ha átmeneti kivétel van: jelölve van-e `TODO` + indoklás + target cleanup pont?

## Test quality gate

- No-test-no-merge policy: `docs/testing-quality-gate.md`
- Test ownership by layer: `docs/test-ownership.md`
- CI enforce: `.github/workflows/tests.yml` (`Quality Gate` job)
- Lokális ellenőrzés: `pnpm test:quality-gate` / `pnpm test:quality-gate:staged`
