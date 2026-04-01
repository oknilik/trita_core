# Journey Entry Point Inventory (A1)

Last updated: 2026-04-01

Goal: identify every relevant entry/redirect point and mark where journey decisions are still local instead of centralized.

## Status Legend

- `Centralized`: journey decision comes from central service (`resolveJourney`, membership pipeline).
- `Hybrid`: central base exists, but local fallback/branch still decides some outcomes.
- `Local`: route/component/helper makes its own business decision.

## Inventory

| Entry point | Current decision logic location | Centralized? | Desired target handoff | Cleanup priority |
|---|---|---|---|---|
| Sign-in / Sign-up guard for already signed-in users | `src/proxy.ts` (`isAuthRoute` -> redirect `/dashboard`) | Local | Redirect to `/platform/home` (or `JOURNEY_HOME_HANDOFF_PATH`) | High |
| Sign-in success (email + Google SSO) | `src/app/(auth)/sign-in/page.tsx` (`safeRedirectUrl ?? JOURNEY_HOME_HANDOFF_PATH`) | Centralized | Keep current handoff | Low |
| Sign-up success (email + Google SSO) | `src/app/(auth)/sign-up/page.tsx` (`safeRedirectUrl ?? /onboarding?intent=...`) | Hybrid | Keep onboarding for fresh users, but avoid hardcoded post-auth routing outside orchestrated flow | Medium |
| Home `/` signed-in entry | `src/app/page.tsx` (redirect to `JOURNEY_HOME_HANDOFF_PATH`) | Centralized | Keep current handoff | Low |
| Onboarding page gate | `src/app/onboarding/page.tsx` (`resolveJourney(...).home.destination`) | Centralized | Keep current handoff | Low |
| Onboarding finish (self wizard submit) | `src/app/onboarding/OnboardingClient.tsx` (`router.push("/assessment")`) | Local | Replace with `/platform/home` handoff (engine decides obligation) | High |
| Onboarding finish (org wizard submit) | `src/app/onboarding/OrgOnboardingWizard.tsx` (`router.push(JOURNEY_HOME_HANDOFF_PATH)`) | Centralized | Keep current handoff | Low |
| Try flow root `/try` for signed-in users | `src/app/try/page.tsx` (redirect `/assessment`) | Local | Evaluate switch to `/platform/home` (unless explicit product rule keeps assessment-first) | Medium |
| Try completion page | `src/app/try/complete/page.tsx` (client-side redirects) | Local | Keep acquisition-local logic; no journey decision duplication | Low |
| Try claim flow | `src/app/try/claim/page.tsx` (client redirects to sign-up/profile) | Local | Keep claim-specific flow, but prefer handoff after successful claim where feasible | Medium |
| Team join page gate | `src/app/join/[token]/page.tsx` + `resolveMembershipJoinPageAccess` | Centralized | Keep membership pipeline | Low |
| Org join page gate | `src/app/join/org/[inviteId]/page.tsx` + `resolveMembershipJoinPageAccess` | Centralized | Keep membership pipeline | Low |
| Team join submit | `src/app/join/[token]/JoinClient.tsx` (`joinResult.nextPath`) | Centralized | Keep `nextPath` from pipeline | Low |
| Org join submit | `src/app/join/org/[inviteId]/JoinOrgClient.tsx` (`joinResult.nextPath`) | Centralized | Keep `nextPath` from pipeline | Low |
| Join APIs | `src/app/api/team/join/route.ts`, `src/app/api/org/join/route.ts`, `src/app/api/org/switch/route.ts` -> membership service | Centralized | Keep `nextPath` from `resolveJourney` | Low |
| Apply flow `/apply/[token]` | `src/app/apply/[token]/page.tsx` | Local (domain-specific) | Keep candidate-specific logic (not a journey-home decision) | Low |
| Billing checkout page auth/role gate | `src/app/billing/checkout/page.tsx` | Hybrid | Keep role checks; non-admin fallback already handoff | Low |
| Billing embedded return | `src/app/billing/return/page.tsx` | Local | After successful return, handoff via engine instead of static profile/hiring links where possible | High |
| Legacy billing success | `src/app/billing/success/page.tsx` (`REDIRECT_MAP`) | Local | Deprecate in favor of engine handoff path | High |
| Legacy one-time purchase checkout | `src/app/api/billing/purchase/route.ts` (`success_url=/billing/success`, `cancel_url=/billing`) | Local | Route to engine handoff-compatible success/cancel endpoints | High |
| Billing upgrade gate | `src/app/billing/upgrade/page.tsx` (fallback to handoff) | Hybrid | Keep current behavior | Low |
| Billing portal return URL | `src/app/api/billing/portal/route.ts` (`return_url` to handoff) | Centralized | Keep current handoff | Low |
| `/dashboard` entry | `src/app/dashboard/page.tsx` (`resolveJourney`) + legacy query forwarding | Hybrid | Keep engine resolution; eventually remove legacy query compatibility branch | Medium |
| `/platform/home` alias | `src/app/platform/home/page.tsx` re-export dashboard | Centralized | Keep alias | Low |
| Deep link `/assessment` | `src/app/assessment/page.tsx` (`/onboarding`, `/profile/results?retake=true`) | Local | Move home-like redirects behind engine/context resolver | High |
| Deep link `/profile/results` | `src/app/profile/results/page.tsx` (`redirect("/assessment")` branches) | Local | Keep data-validity guards, avoid duplicating journey-home decisions | Medium |
| Deep link `/team/[id]` | `src/app/team/[id]/page.tsx` (membership/access/subscription redirects) | Hybrid | Keep resource access checks; avoid home-decision duplication | Medium |
| Deep link `/org/[id]` | `src/app/org/[id]/page.tsx` (role/subscription redirects) | Hybrid | Keep org authorization checks; keep home fallback centralized | Medium |
| Deep link `/hiring/[orgId]` | `src/app/hiring/[orgId]/page.tsx` + `requireOrgContext`/`requireActiveSubscription` | Hybrid | Keep domain access control; no separate home logic | Low |
| Org root `/org` | `src/app/org/page.tsx` (membership-based redirect) | Local | Consider replacing with engine home/team/org handoff | Medium |
| Team root `/team` | `src/app/team/page.tsx` (`redirect("/org")` when no memberships) | Local | Consider engine handoff fallback to remove local branch | Medium |
| Signed-in nav home link (shell) | `src/app/layout.tsx` passes `resolveJourney(...).home.destination` | Centralized | Keep current handoff | Low |
| Signed-in nav rendering | `src/components/layout/nav-header-ui.tsx` uses `homeHref` + local active heuristics | Hybrid | Keep `homeHref` source; avoid adding decision branches here | Low |
| Signed-in nav fallback | `src/components/NavBar.tsx` receives `signedInHomeHref` | Centralized | Keep current handoff | Low |
| Auth/org guard helpers | `src/lib/auth.ts` (contains `/dashboard` and other static redirects) | Local | Replace static redirects with handoff-aware targets incrementally | High |
| Subscription guard helpers | `src/lib/require-active-subscription.ts`, `src/lib/require-observer-access.ts` | Local | Keep access policy, but avoid using them for home decisions | Medium |
| Middleware-level handoff | `src/proxy.ts` | Local | Replace `/dashboard` redirect with `/platform/home` | High |
| Server actions redirect points | No `use server` journey redirect actions found | N/A | Keep none; route handlers should return `nextPath` from central services | Low |

## Key Findings

1. Core journey orchestration is already in place (`resolveJourney`) at `/dashboard`, root layout, and membership join pipeline.
2. Main remaining duplication risk is in legacy/static redirects: middleware auth guard, `auth.ts` helpers, assessment/profile deep-link branches, and billing success/return routing.
3. Join pipeline is mostly consolidated and already hands off through engine-derived `nextPath`.

## Guardrail Notes

- Do not add new static `/dashboard` redirects in pages/helpers.
- For new entrypoints, default to `/platform/home` unless the route is explicitly domain-specific (e.g. candidate apply, checkout return processing step).
- Resource access checks (org/team ownership, role, subscription state) may remain local, but they should not also decide global journey home.
