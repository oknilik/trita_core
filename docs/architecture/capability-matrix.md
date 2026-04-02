# Capability Matrix (Role × Subscription × Capability)

Ez a dokumentum a jelenlegi központi policy engine tényleges viselkedését írja le.
Source of truth:
- `src/lib/capabilities.ts`
- `src/lib/policy-engine.ts`

Cél:
- visszakövethetővé tenni, hogy melyik role + subscription/purchase kombináció milyen capabilityt ad
- egységes referencia legyen page/API gatinghez

## Capability készlet

`read`, `list`, `create`, `manage`, `invite`, `launchCampaign`, `candidateEvaluate`, `billingManage`, `orgAdminManage`, `export`, `observerInvite`

## Állapot normalizálás

A policy engine a döntés előtt `policyState`-re normalizál:
- `none`
- `trialing`
- `active`
- `past_due`
- `restricted`
- `frozen`

Megjegyzés:
- `past_due` jelenleg átmeneti read/list/export policy (UX-ban restricted-ként kezeljük).

## Plan címkék → policy input

Ez a matrix a következő üzleti címkéket használja:
- `Free` = self-only, nincs Plus/Snapshot purchase
- `Plus` = self-only, Plus hozzáférés (`hasObserverAccess` vagy equivalent tier)
- `Snapshot` = self-only, snapshot/deep-dive típusú purchase tier (`team_snapshot`, `team_deep_dive`, stb.)
- `Team` = org membership + aktív team subscription
- `Org` = org membership + aktív org/scale subscription
- `Restricted` = org membership + `policyState` = `restricted` vagy `past_due`
- `Frozen` = org membership + `policyState` = `frozen`

## Matrix A — Self-Only (Free / Plus / Snapshot)

Role itt mindig `Self-Only` (nincs org membership).

| Plan | read | list | observerInvite | export | create/manage/invite/campaign/candidate/billing/admin |
|---|---|---|---|---|---|
| Free | ✓ | ✓ | ✗ | ✗ | ✗ |
| Plus | ✓ | ✓ | ✓ | ✓* | ✗ |
| Snapshot | ✓ | ✓ | ✓ | ✓* | ✗ |

\* `export` akkor jár, ha a hívó `purchaseState.canExportPersonal = true` értéket ad a policy engine-nek.

## Matrix B — Team / Org (aktív: `trialing` vagy `active`)

| Role | read | list | create | manage | invite | launchCampaign | candidateEvaluate | export | observerInvite | billingManage | orgAdminManage |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Org Member | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ |
| Org Manager | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Org Admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

Megjegyzés:
- `Team` és `Org` plan aktív állapotban ugyanarra a capability policy-re fut; a különbségek inkább domain-feature oldalon jelennek meg.

## Matrix C — Restricted / Frozen (org context)

### Restricted (`policyState = restricted vagy past_due`)

| Role | read | list | export | observerInvite | create/manage/invite/launchCampaign/candidateEvaluate | billingManage | orgAdminManage |
|---|---|---|---|---|---|---|---|
| Org Member | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Org Manager | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Org Admin | ✓ | ✓ | ✗ | ✓ | ✗ | ✓ | ✗ |

### Frozen (`policyState = frozen`)

| Role | read | list | observerInvite | export | create/manage/invite/launchCampaign/candidateEvaluate | billingManage | orgAdminManage |
|---|---|---|---|---|---|---|---|
| Org Member | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Org Manager | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Org Admin | ✓ | ✗ | ✓ | ✗ | ✗ | ✓ | ✗ |

## Döntési szabályok röviden

1. `read` + `list` minden autentikált usernek alapból jár.
2. Org scoped capabilityk (`create/manage/invite/launchCampaign/candidateEvaluate/billingManage/orgAdminManage`) csak org contextben értelmezhetők.
3. Role gating:
   - Member: nincs manager-level capability
   - Manager: manager-level capabilityk lehetnek
   - Admin: plusz `billingManage`; `orgAdminManage` csak aktív/trialing állapotban
4. Subscription/policy state gating írhatja felül a role által elérhető capabilityket (restricted/frozen write tiltás).
5. `observerInvite` self-only-ban purchase alapú, org/team contextben membership alapú.

## Visszakövethetőség (code map)

- Capability készlet és base map:
  - `src/lib/capabilities.ts` (`CAPABILITIES`, `SUBSCRIPTION_CAPABILITY_BASE_MAP`)
- State normalizálás:
  - `resolveSubscriptionCapabilityPolicyState(...)` (`src/lib/capabilities.ts`)
- Org role + subscription összefésülés:
  - `resolveOrgCapabilities(...)` (`src/lib/capabilities.ts`)
- Top-level policy döntés:
  - `resolveCapabilities(...)`, `getAccessPolicy(...)`, `can(...)` (`src/lib/policy-engine.ts`)
- Denial reason / upgrade hint:
  - `resolveDeniedCapability(...)` (`src/lib/policy-engine.ts`)

## Guardrail fejlesztési szabály

Új page/API nem implementálhat saját billing/role decision tree-t.
Kötelező:
- `getAccessPolicy(...)` UI gatinghez
- `can(...)` action/API gatinghez
- a matrix módosulásakor tesztfrissítés: `src/lib/policy-engine.test.ts`
