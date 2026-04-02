# Join / Apply Inventory (B1)

Last updated: 2026-04-01

Goal: map every `/join/*` and `/apply/*` entry branch, including token semantics, auth behavior, acceptance/mutation path, redirect behavior, and error handling.

## Shared Join Pipeline (Core)

Central service: `src/lib/membership-onboarding/server.ts`

Main orchestrator functions:
- `resolveMembershipInviteResolution(...)`
- `resolveMembershipJoinPageAccess(...)`
- `joinMembershipFromInvite(...)`
- `switchMembershipContextFromInvite(...)`
- `runJoinTransaction(...)`
- `resolveJoinNextPath(...)` (handoff to `resolveJourney(...)`)

Common join steps implemented here:
1. Invite lookup + token validation (`teamPendingInvite` or `organizationPendingInvite`)
2. Auth actor resolution (`resolveMembershipJoinActor`)
3. Profile completeness gating
4. Optional org switch gating (team invite + different active org)
5. Acceptance mutation transaction
6. Journey handoff (`nextPath` from journey engine)

## Route Inventory

| Route | Token type | Auth requirement | Acceptance logic location | Membership mutation | Redirect logic | Error handling |
|---|---|---|---|---|---|---|
| `/join/[token]` (page) | `TeamPendingInvite.id` (team invite id; includes reusable/open invites too) | Optional at page hit; unauth is redirected by resolver | `resolveMembershipJoinPageAccess({ kind: "team" ... })` | No mutation here (render gate only) | `access.type === "redirect"` goes to sign-up with `redirect_url` or already-accepted `redirectTo`; ready states render `JoinClient` | `notFound()` if invite missing/invalid state; wrong invite kind also `notFound()` |
| `/join/org/[inviteId]` (page) | `OrganizationPendingInvite.id` | Optional at page hit; unauth redirected by resolver | `resolveMembershipJoinPageAccess({ kind: "org" ... })` | No mutation here (render gate only) | Same pattern: sign-up redirect or ready render of `JoinOrgClient`; accepted-in-current-org can redirect via `redirectTo` | `notFound()` on invalid/missing/unsupported state; wrong invite kind also `notFound()` |
| `/apply/[token]` (page) | `CandidateInvite.token` | Public (no auth) | Local page logic in `src/app/apply/[token]/page.tsx` | None on page load | No redirect; renders one of: intro/assessment UI, completed screen, canceled screen, expired screen | `notFound()` if token not found; status-based fallback UI for `COMPLETED`/`CANCELED`/expired |
| `/api/team/join` (POST) | `inviteId` = `TeamPendingInvite.id` | Required (`auth()`) | `joinMembershipFromInvite({ kind: "team" ... })` | Via `runJoinTransaction`: upsert `organizationMember` (`ORG_MEMBER`), upsert `teamMember`, delete non-reusable pending invite, set active org context | Returns `{ ok, inviteState, nextPath }`; client navigates to `nextPath` (journey engine output) | `401 UNAUTHORIZED`, `400 INVALID_INPUT`, plus mapped `MembershipOnboardingError` statuses (`INVITE_NOT_FOUND` 404, `PROFILE_INCOMPLETE` 409, `ALREADY_IN_ORG` 409, etc.) |
| `/api/org/join` (POST) | `inviteId` = `OrganizationPendingInvite.id` | Required (`auth()`) | `joinMembershipFromInvite({ kind: "org" ... })` | Via `runJoinTransaction`: upsert `organizationMember` with invite role, delete org pending invite, set active org context, trigger `syncSeatBilling` | Returns `{ ok, inviteState, nextPath }`; client navigates to `nextPath` | Same error model as team join endpoint |
| `/api/org/switch` (POST) | `inviteId` = team invite id used for context switch | Required (`auth()`) | `switchMembershipContextFromInvite(...)` | Uses `runJoinTransaction` team branch with `skipOrgMembershipCreate: false` to ensure target org membership + team membership; sets active org context | Returns `{ ok, nextPath }`; client navigates to `nextPath` | `401 UNAUTHORIZED`, `400 INVALID_INPUT`, `404 INVITE_NOT_FOUND`, `409 PROFILE_INCOMPLETE`, and generic membership onboarding errors |
| `/api/profile/onboarding` (POST) (join support step) | N/A (profile payload) | Required (`auth()`) | Local API in `src/app/api/profile/onboarding/route.ts`; called before join accept for incomplete profile | Updates `userProfile` (`username`, `birthYear`, `gender`, optional consent/onboarded timestamps, etc.) | No redirect (JSON response only); join client continues with join API call | `401 Unauthorized`, `400 Invalid payload` with zod details |
| `/api/candidate/[token]/submit` (POST) (apply completion) | `CandidateInvite.token` | Public | Local API in `src/app/api/candidate/[token]/submit/route.ts` | Creates `candidateResult`; updates `candidateInvite.status = COMPLETED` and `completedAt` | No server redirect; client sets local `done` state | `400 INVALID_INPUT`, `404 INVALID_TOKEN`, `400 ALREADY_USED`, `400 INVITE_EXPIRED`, `400 DUPLICATE_ANSWER`, `400 MISSING_ANSWER`; concurrent duplicate guarded (`P2002` => `ALREADY_USED`) |
| `/api/candidate/[token]/progress` (PATCH) (apply autosave/progress sync) | `CandidateInvite.token` | Public | Local API in `src/app/api/candidate/[token]/progress/route.ts` | Updates `candidateInvite.draftAnsweredCount` and first `draftStartedAt` | No redirect; client uses `{ revoked: true }` signal to swap to revoked screen | `400 INVALID_INPUT`; non-valid token/status returns `{ ok: false }`; canceled invite returns `{ ok: false, revoked: true }` |
| `/api/candidate/[token]` (GET) (apply token check helper) | `CandidateInvite.token` | Public | Local API in `src/app/api/candidate/[token]/route.ts` | None | No redirect; validation payload only | `404 INVALID_TOKEN`, `410 ALREADY_USED`, `410 INVITE_EXPIRED` |

## Join Flow State Branches (Current Behavior)

From `resolveMembershipInviteResolution(...)`:
- `INVITE_NOT_FOUND`
- `INVITED_UNAUTHENTICATED`
- `INVITED_AUTHENTICATED_PROFILE_INCOMPLETE`
- `INVITED_AUTHENTICATED_ORG_SWITCH_REQUIRED` (team invite only)
- `INVITED_READY_TO_JOIN`
- `INVITE_ACCEPTED` (idempotent path; returns journey `nextPath`)

Notes:
- Team invite + different active org does not auto-join; it requires explicit switch flow.
- Already accepted invite returns idempotent success and journey-based `nextPath`.
- `MEMBERSHIP_INVITE_STATES` includes `INVITED_AUTHENTICATED_ALREADY_IN_OTHER_ORG`, but current resolver path does not actively return it.

## Redirect / Handoff Summary

- Join success redirect is centralized via `nextPath` from `resolveJourney(...)` (`resolveJoinNextPath`).
- Join pages do not hardcode post-join destinations.
- Apply flow remains standalone (candidate journey), with page-local state transitions instead of journey-home redirects.

## Error Model Summary

- Join endpoints normalize domain errors through `MembershipOnboardingError` (HTTP status + error code + optional `details`).
- Apply endpoints return token/status specific errors and are resilient to duplicate submits.
- Join page access uses explicit `not_found`/`redirect`/`ready` tri-state contract to avoid ad-hoc route logic.
