# Notification Hub — Feladatlista

## Fázis 1: Adatréteg
- [x] 1.1 — `Notification` model + `NotificationType` enum a `prisma/schema.prisma`-ba
- [x] 1.2 — `prisma db push` (migráció)
- [x] 1.3 — `src/lib/notifications.ts` — `createNotification()` + `createOrgNotification()` helpers
- [x] 1.4 — `src/lib/i18n/notifications.ts` — összes típus HU/EN fordítás (15 típus × title + body)
- [x] 1.5 — Regisztráció `src/lib/i18n/index.ts`-ben

## Fázis 2: API végpontok
- [x] 2.1 — `GET /api/notifications` — lista (max 20, non-dismissed, userId auth)
- [x] 2.2 — `GET /api/notifications/unread-count` — olvasatlan szám (polling endpoint)
- [x] 2.3 — `POST /api/notifications/mark-read` — `{ ids: string[] }` vagy `{ all: true }`
- [x] 2.4 — `DELETE /api/notifications/[id]` — soft dismiss (dismissed: true)

## Fázis 3: UI komponensek
- [x] 3.1 — `NotificationBell.tsx` — bell SVG ikon + unread badge + 30s polling
- [x] 3.2 — `NotificationPanel.tsx` — dropdown lista (380px) + mark all read + dismiss + empty state + relatív idő
- [x] 3.3 — `nav-header-ui.tsx` integráció — bell beillesztése separator és user menü közé, `"notifications"` dropdown key
- [x] 3.4 — Mobil notification bell a mobile nav szekcióban

## Fázis 4: Event integration
- [x] 4.1 — `OBSERVER_COMPLETED` → `api/observer/submit/route.ts` (inviter user)
- [x] 4.2 — `RESULT_READY` → `api/assessment/submit/route.ts` (user)
- [x] 4.3 — `ORG_INVITE_RECEIVED` → `api/org/[id]/invite/route.ts` (invited user)
- [x] 4.4 — `CAMPAIGN_LAUNCHED` / `CAMPAIGN_CLOSED` → campaign PATCH handler (org members)
- [x] 4.5 — `PAYMENT_FAILED` → `billing/handlers/invoice-failed.ts` (org admins)
- [x] 4.6 — `PURCHASE_CONFIRMED` → `billing/handlers/checkout-completed.ts` (buyer)
- [x] 4.7 — `ORG_INVITE_ACCEPTED` → `lib/acceptance/service.ts` (org admins)
- [x] 4.8 — `SUBSCRIPTION_FROZEN` → `billing/handlers/subscription-sync.ts` (org admins)
- [x] 4.9 — `TRIAL_ENDING_SOON` / `TRIAL_EXPIRED` → lazy check org dashboard load

## Fázis 5: Polish
- [x] 5.1 — Relatív idő formázás ("2 perce", "3 órája", "5 napja" / "2m ago", "3h ago")
- [x] 5.2 — Keyboard accessibility (Escape bezárás)
- [ ] 5.3 — Teljes role tesztelés (INDIVIDUAL, ORG_MEMBER, ORG_MANAGER, ORG_ADMIN)

---

## Architekturális döntések

- **i18n kulcsok a DB-ben** — `titleKey` + `bodyKey` + `vars` JSON → nyelv váltásnál a régi értesítések is az aktuális nyelven
- **Polling** (30s) — nincs WebSocket/SSE, a `DashboardAutoRefresh` mintáját követjük
- **Soft-delete** — `dismissed: boolean` flag, nem tényleges törlés
- **Fan-out** — `createOrgNotification()` egy `createMany` hívás az org tagjainak (minRole szűrés)
- **Lazy trial check** — cron job helyett org dashboard load-nál ellenőrizzük a trial státuszt, deduplicated (3/7 napos ablak)
