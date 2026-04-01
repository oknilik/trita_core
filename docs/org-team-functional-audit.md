# Org / Team Functional Audit

Date: 2026-04-01

Scope:
- `org` and `team` signed-in surfaces
- route wiring
- in-surface CTA/navigation behavior
- live app sanity on `http://localhost:3000` where possible

Method:
- code audit of route files, shells, nav components, and linked tabs
- localhost route sanity from signed-out state
- focus on functional gaps, dummy UI, and misleading navigation

## Executive Summary

The biggest break is on the team surface: the live route at `src/app/team/[id]/page.tsx` only partially supports the tab/query IA that the rest of the UI still links to. This creates multiple broken or misleading CTAs.

The org surface is in a better state: the core tab shell is wired and implemented, but there are still discoverability and role/UX mismatches, especially for org managers versus org admins.

## Confirmed Functional Gaps

### 1. Team page only partially supports its own tab IA

Severity: High

Evidence:
- Live route: [src/app/team/[id]/page.tsx](/Users/leinadoknilik/trita/codebase/src/app/team/[id]/page.tsx)
- Legacy shell with full tabs: [src/components/team/TeamPageShell.tsx](/Users/leinadoknilik/trita/codebase/src/components/team/TeamPageShell.tsx)

What is happening:
- The live team page reads `searchParams.tab`, but only has a special branch for `tab=profile`.
- Everything else falls through to the default overview render.
- Meanwhile multiple CTAs and nav items still point to:
  - `?tab=profile`
  - `?tab=members`
- The legacy `TeamPageShell` still defines `overview`, `intelligence`, `profile`, `members`, `belbin`, but it is not used by the live route.

Impact:
- `?tab=members` is effectively broken on the live route.
- The current IA advertises views the page does not actually handle.
- Users can land on URLs that look valid but do not change the content they expect.

Examples:
- Team hero / recommended action / checklist CTAs point to `?tab=members`
- Nav header and mobile nav point to `?tab=members`
- Those targets are not handled by the live route

### 2. Team member-row CTAs are visual only

Severity: High

Evidence:
- [src/app/team/[id]/page.tsx](/Users/leinadoknilik/trita/codebase/src/app/team/[id]/page.tsx)

What is happening:
- In the member list, the “profile” and “remind” affordances are rendered as plain `span`s.
- One of them even has `cursor-pointer`, but there is no click handler and no link target.

Impact:
- The UI suggests an action that does nothing.
- This is a direct UX break, not just missing polish.

### 3. Team surface has two parallel architectures

Severity: High

Evidence:
- Live route: [src/app/team/[id]/page.tsx](/Users/leinadoknilik/trita/codebase/src/app/team/[id]/page.tsx)
- Unused shell: [src/components/team/TeamPageShell.tsx](/Users/leinadoknilik/trita/codebase/src/components/team/TeamPageShell.tsx)

What is happening:
- The server page hand-builds a dashboard-like experience.
- The old client shell still exists with tabs and dedicated views.
- The rest of the product still links as if the old shell contract were active.

Impact:
- Navigation contracts are inconsistent.
- Fixes will keep regressing until the team surface has one source of truth.

### 4. Org route access and org nav discoverability are misaligned

Severity: Medium

Evidence:
- Route guard: [src/app/org/[id]/page.tsx](/Users/leinadoknilik/trita/codebase/src/app/org/[id]/page.tsx)
- Nav gating: [src/components/layout/nav-header-ui.tsx](/Users/leinadoknilik/trita/codebase/src/components/layout/nav-header-ui.tsx)

What is happening:
- The org page allows `ORG_MANAGER` and above.
- The signed-in top nav only exposes the org dropdown for `isAdmin`.

Impact:
- Org managers can have access to the org surface but may not get a first-class entrypoint to it.
- This feels like a broken or hidden route even when the route itself is valid.

### 5. Org shell tab state is client-side and only initialized once

Severity: Medium

Evidence:
- [src/components/org/OrgPageShell.tsx](/Users/leinadoknilik/trita/codebase/src/components/org/OrgPageShell.tsx)

What is happening:
- `activeTab` is initialized from `useSearchParams()` into local state.
- After that, the shell uses local state and does not explicitly resync when search params change.

Impact:
- Same-route query navigation is at risk of desync.
- This is especially risky because many links target `/org/[id]?tab=...`.

Note:
- This is a confirmed implementation smell and likely bug vector.
- It should be treated as a stabilization target even if not every path is visibly broken right now.

### 6. Notification bell in signed-in shell is decorative

Severity: Medium

Evidence:
- [src/components/layout/nav-header-ui.tsx](/Users/leinadoknilik/trita/codebase/src/components/layout/nav-header-ui.tsx)

What is happening:
- The bell renders as a clickable button in desktop and mobile.
- There is no handler, route, or dropdown behind it.

Impact:
- Cross-surface dummy control.
- Users can reasonably assume it should open notifications.

## Lower-Confidence or Secondary Gaps

### 7. Legacy SidebarUI contains stale team/org IA and old avatar behavior

Severity: Low

Evidence:
- [src/components/layout/SidebarUI.tsx](/Users/leinadoknilik/trita/codebase/src/components/layout/SidebarUI.tsx)

What is happening:
- The component still links to the old tab structure.
- It still uses avatar image/localStorage behavior (`trita_avatar`) instead of the newer avatar policy.
- Current code search did not show an active usage site.

Impact:
- Not necessarily a live bug today.
- It is a regression trap and can silently reintroduce stale IA if reused.

### 8. Team/profile wording is inconsistent with the actual surface contract

Severity: Low

Evidence:
- `Személyiségprofil` links inside team nav/header point to `/team/[id]?tab=profile`

What is happening:
- The label suggests a stable destination.
- On the live route only one special-case branch supports it, while the rest of the tab system is absent.

Impact:
- Wording reinforces a navigation promise that is only partially true.

## What Looks Correct

### Org tab shell itself is implemented

Evidence:
- [src/components/org/OrgPageShell.tsx](/Users/leinadoknilik/trita/codebase/src/components/org/OrgPageShell.tsx)
- [src/components/org/OrgOverviewTab.tsx](/Users/leinadoknilik/trita/codebase/src/components/org/OrgOverviewTab.tsx)
- [src/components/org/OrgTeamsTab.tsx](/Users/leinadoknilik/trita/codebase/src/components/org/OrgTeamsTab.tsx)
- [src/components/org/OrgMembersTab.tsx](/Users/leinadoknilik/trita/codebase/src/components/org/OrgMembersTab.tsx)
- [src/components/org/OrgCampaignsTab.tsx](/Users/leinadoknilik/trita/codebase/src/components/org/OrgCampaignsTab.tsx)

Observation:
- Unlike the team surface, the org tab structure is actually wired into the live route.
- The main org problem is less “missing view” and more role/discoverability mismatch plus some client-state fragility.

## Priority Fix Order

1. Collapse the team surface to one tab contract.
2. Remove or fix dead team CTAs (`members`, row actions).
3. Align org entrypoints with actual manager/admin permissions.
4. Make org shell tab state derive robustly from search params.
5. Remove or wire the decorative bell.
6. Delete or explicitly deprecate `SidebarUI` if it is no longer part of the active shell system.

## Suggested Implementation Tasks

### P0

- Refactor `team/[id]` so every linked `tab` value is actually handled, or remove unsupported tab links from all live entrypoints.
- Convert member-row faux actions into real links/buttons or remove them.

### P1

- Align org nav visibility with `ORG_MANAGER` access if that is the intended product rule.
- Add search-param synchronization hardening to `OrgPageShell`.

### P2

- Remove or wire the notification bell.
- Remove or deprecate `SidebarUI`.

## Localhost Sanity Notes

Signed-out checks from localhost:
- `/org` -> `307` redirect to `/`
- `/team` -> `307` redirect to `/`

This is expected for unauthenticated state and does not contradict the signed-in functional findings above.
