# Notification Type Matrix

| Type | Trigger | Recipient Policy | Category | Priority | targetUrl | Source |
|------|---------|------------------|----------|----------|-----------|--------|
| `OBSERVER_COMPLETED` | observer submit | Inviter user | observer | normal | /profile/results | observer_invitation |
| `RESULT_READY` | assessment submit | Self user | assessment | normal | /profile/results | assessment_result |
| `PURCHASE_CONFIRMED` | checkout completed | Buyer user | billing | normal | /profile/results | purchase |
| `ORG_INVITE_RECEIVED` | org invite | Invited user | org | normal | /org/{id} | org_invite |
| `ORG_INVITE_ACCEPTED` | acceptance service | Org admins | org | normal | /org/{id}?tab=members | org_membership |
| `CAMPAIGN_LAUNCHED` | campaign PATCH→ACTIVE | All org members | campaign | normal | /org/{id}?tab=campaigns | campaign |
| `CAMPAIGN_CLOSED` | campaign PATCH→CLOSED | All org members | campaign | normal | /org/{id}?tab=campaigns | campaign |
| `TEAM_MEMBER_ADDED` | team join | All org members | org | low | — | — |
| `PAYMENT_FAILED` | invoice.payment_failed | Org admins | billing | high | /org/{id}?tab=billing | stripe_invoice |
| `SUBSCRIPTION_FROZEN` | subscription.deleted | Org admins | billing | high | /org/{id}?tab=billing | stripe_subscription |
| `TRIAL_ENDING_SOON` | lazy check (dashboard) | Org admins | billing | high | /org/{id}?tab=billing | subscription_trial |
| `TRIAL_EXPIRED` | lazy check (dashboard) | Org admins | billing | high | /org/{id}?tab=billing | subscription_trial |
| `LOW_CANDIDATE_CREDITS` | — (not yet wired) | Org admins | billing | normal | /org/{id}?tab=billing | — |
| `MEMBER_COMPLETED_ASSESSMENT` | — (not yet wired) | Org managers+ | assessment | low | — | — |
| `CAMPAIGN_MILESTONE` | — (not yet wired) | Org managers+ | campaign | normal | — | — |

## Guardrails

1. **New type** → add to this matrix + i18n + orchestrator method + policy entry
2. **Route handlers** → never call repository directly, always via orchestrator
3. **Role-sensitive type** → add to `policy.ts` `ORG_NOTIFICATION_MIN_ROLE`
4. **Actionable type** → must have `link` / targetUrl
