# Notification Hub V1.5 — Feladatlista

## WORKSTREAM A — Audit és domain inventory
- [x] A1 — Notification entrypoint inventory (9 trigger point dokumentálva)
- [x] A2 — Notification type audit (15 type, category/priority/source hozzárendelve)

## WORKSTREAM B — Domain model bővítés
- [x] B1 — Notification modell bővítése (category, priority, sourceType, sourceId, actorUserId, dedupeKey, readAt, dismissedAt)
- [x] B2 — Typed enums: NotificationCategory, NotificationPriority, NotificationSourceType (`types.ts`)
- [x] B3 — Dedupe stratégia: `dedupeKey` + `@@unique([dedupeKey, userId])` constraint + batch dedup

## WORKSTREAM C — Orchestrator + repository
- [x] C1 — Központi orchestrator (`src/lib/notifications/orchestrator.ts`)
- [x] C2 — Domain-oriented API: handleObserverCompleted, handleResultReady, stb. (11 metódus)
- [x] C3 — Repository réteg (`src/lib/notifications/repository.ts`) — persistNotification + persistNotificationBatch

## WORKSTREAM D — Route/handler integrációk átvezetése
- [x] D1 — Observer completed → orchestrator.handleObserverCompleted
- [x] D2 — Result ready → orchestrator.handleResultReady
- [x] D3 — Org invite received → orchestrator.handleOrgInviteReceived
- [x] D4 — Campaign launched/closed → orchestrator.handleCampaignLaunched/Closed
- [x] D5 — Billing handlers → orchestrator.handlePaymentFailed/PurchaseConfirmed/SubscriptionFrozen
- [x] D6 — Acceptance service → orchestrator.handleOrgInviteAccepted

## WORKSTREAM E — Recipient policy és fan-out
- [x] E1 — Központi policy layer (`src/lib/notifications/policy.ts`) — role-based recipient resolution
- [x] E2 — createOrgNotification → repository.persistNotificationBatch + policy.resolveOrgRecipients
- [x] E3 — Role-aware delivery: ORG_NOTIFICATION_MIN_ROLE registry

## WORKSTREAM F — UI/UX erősítés
- [x] F1 — targetUrl / link támogatás a panelben (kattintható notificationok)
- [x] F3 — Read vs dismiss: read + readAt / dismissed + dismissedAt szétválasztás
- [x] F4 — Escape bezárás
- [x] F2 — Category/priority vizuális réteg (category ikon szín + high priority piros dot)
- [ ] F4+ — Focus trapping, keyboard navigáció az itemeken

## WORKSTREAM G — Trial/lifecycle hardening
- [x] G1 — Lazy trial check izolálva az orchestratorba (checkTrialNotifications)
- [x] G2 — Scheduled sweep interface/placeholder (`sweep.ts` + `runNotificationSweep()`)

## WORKSTREAM H — Tesztek
- [x] H1 — Type registry + policy unit tests (10 tests, all green)
- [x] H2 — Dedupe filter unit tests (9 tests, all green)
- [ ] H3 — Route integration tests frissítése
- [ ] H4 — Notification panel client tests

## WORKSTREAM I — Dokumentáció
- [x] I1 — Architecture doc (`docs/architecture/notification-architecture.md`)
- [x] I2 — Type matrix doc (`docs/architecture/notification-type-matrix.md`)
- [x] I3 — Guardrail szabályok (matrix doc-ban)

---

## Modul struktúra

```
src/lib/notifications/
├── index.ts           — public API (re-exports orchestrator)
├── orchestrator.ts    — 11 domain event handler
├── repository.ts      — persist + batch persist + dedup
├── policy.ts          — role-based recipient resolution
└── types.ts           — NotificationIntent, category/priority/source enums, type meta registry
```

## Régi fájl

A `src/lib/notifications.ts` (flat helper) törölve → `src/lib/notifications/` modul váltotta.
