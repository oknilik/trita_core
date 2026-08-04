# Functional Audit Follow-up

> Date: 2026-04-01
> Scope: Team wiring, billing links, dashboard copy, org access

---

## Validated Issues (Fixed)

### 1. Team profile tab not wired (`df5b137`)
- **Problem**: "Csapatkép megtekintése" CTAs navigated to `/team/[id]?tab=profile` but the page ignored the `tab` query param — always showed the overview.
- **Root cause**: `TeamPageShell` (tab router) and `TeamProfileTab` were built but never integrated into the server page.
- **Fix**: Added `searchParams` handling to the team page. When `tab=profile`, the existing `TeamProfileTab` renders with heatmap + insights data. Back link returns to overview.
- **Remaining**: `TeamPageShell`, `TeamOverviewTab`, `TeamMembersTab`, `TeamIntelligence`, `TeamCsapatszerepSection`, `TeamMap`, `DynamicsMap`, `RoleFitMap` are dead code — not imported anywhere. Decision needed: integrate or remove.
  - Files: `src/components/team/TeamPageShell.tsx`, `TeamOverviewTab.tsx`, `TeamMembersTab.tsx`, `TeamIntelligence.tsx`, `TeamCsapatszerepSection.tsx`, `TeamMap.tsx`, `DynamicsMap.tsx`, `RoleFitMap.tsx`

### 2. Billing nav links pointed to non-existent `/billing` route (`105f372`)
- **Problem**: `nav-header-ui.tsx` (desktop + mobile) linked to `/billing` which has no page — 404 for users.
- **Root cause**: Billing management lives at `/org/[id]/settings`, not at a top-level `/billing` route. The `/billing/checkout`, `/billing/upgrade`, `/billing/return` sub-routes exist but `/billing` itself does not.
- **Fix**: Changed 4 nav links (desktop: 2, mobile: 2) to point to `/org/${org.id}/settings`. Also fixed `acceptance/service.ts` policy_restricted fallback from `/billing` to `/billing/upgrade`.
- **Remaining**: No `/billing` landing page exists. If a generic billing hub is desired, create it. For now, org settings is the entry point.

### 3. Dashboard blocking reasons displayed in English (`87e04cd`)
- **Problem**: Journey engine's `computeBlockingReasons()` in `state.ts` produced hardcoded English `detail` strings (e.g. "Need at least 3 team members."). These appeared on the admin dashboard's "Needs attention" panel.
- **Root cause**: The `blockingReasons` were generated without locale awareness. The `ia-contract.ts` layer passed `reason.code` and `reason.detail` directly to the UI.
- **Fix**: Added `localizeBlockingCode()` and `localizeBlockingDetail()` in `ia-contract.ts` that translate both code titles and dynamic detail strings based on dashboard locale.
- **Note**: The self dashboard's "next best action" copy was already correctly localized via the `txt()` helper in `next-best-action.ts`. The issue was specifically in the `riskAttentionPanel` items shown on admin/team dashboards.

### 4. Org dashboard guard too strict (`e0a81a8`)
- **Problem**: `/org/[id]` required `ORG_ADMIN`, but per capability-matrix.md, `ORG_MANAGER` has full operational capabilities (`create`, `manage`, `invite`, `launchCampaign`, `candidateEvaluate`).
- **Root cause**: Guard was `hasOrgRole(memberRole, "ORG_ADMIN")` — likely a conservative initial implementation.
- **Fix**: Changed to `hasOrgRole(memberRole, "ORG_MANAGER")`. Admin-only pages (`/settings`, `/setup`) remain restricted to `ORG_ADMIN`.
- **Remaining**: ORG_MEMBER still cannot access `/org/[id]`. This is intentional — members access team-level pages, not the org dashboard.

---

## Corrected Assumptions

| Assumption | Reality |
|---|---|
| `/org/[id]` is broken/missing | It exists and works, was just admin-gated. Now manager-accessible. |
| `/org/[id]/settings` is missing | Fully implemented with subscription status, Stripe portal, seat management. |
| Dashboard copy is hardcoded English | The `next-best-action.ts` `txt()` helper already provides HU/EN. Issue was in the `blockingReasons` detail strings only. |
| Team profile tab doesn't exist | `TeamProfileTab` was fully implemented but never wired into the route. |

---

## Remaining TODO

### Dead team components (decision needed)
- `src/components/team/TeamPageShell.tsx` — 200-line tab router, never imported
- `src/components/team/TeamOverviewTab.tsx` — 426 lines, never used
- `src/components/team/TeamMembersTab.tsx` — 165 lines, never used
- `src/components/team/TeamIntelligence.tsx` — visualization, never used
- `src/components/team/TeamCsapatszerepSection.tsx` — Csapatszerep analysis, never used
- `src/components/team/TeamMap.tsx`, `DynamicsMap.tsx`, `RoleFitMap.tsx` — graph visualizations, never used
- **Decision**: If these are planned for future use, keep with TODO markers. Otherwise, delete to reduce maintenance burden.

### `/billing` landing page
- No page exists at `/billing`. All references now point elsewhere.
- If a self-user billing hub is needed (non-org users managing Plus subscription), create `/billing/page.tsx`.

### German (de) locale gap in journey layer
- `JourneyResolverLocale` only supports `"hu" | "en"`. The main i18n system supports `"de"` as well.
- Low priority — German users fall back to English in journey CTA copy.

### `?tab=members` on team page
- Team page CTAs also reference `?tab=members` but this tab is not wired. The member list is shown inline in the overview.
- Low impact — the overview already shows members, so the URL change is cosmetic only.
