# Notification Hub V1.5 Architecture

## Flow

```
Route / Service
  ↓ domain event
Orchestrator (src/lib/notifications/orchestrator.ts)
  ↓ builds NotificationIntent[]
  ↓ calls Policy (src/lib/notifications/policy.ts) for recipient resolution
  ↓
Repository (src/lib/notifications/repository.ts)
  ↓ dedup check (dedupeKey)
  ↓ persist to Notification table
  ↓
NotificationBell (polling /api/notifications/unread-count every 30s)
  ↓ user opens panel
NotificationPanel (fetches /api/notifications on open)
```

## Module Structure

```
src/lib/notifications/
├── index.ts           — public API (re-exports orchestrator methods)
├── orchestrator.ts    — business logic: event → intent → persist
├── repository.ts      — DB layer: create, batch create, dedup
├── policy.ts          — recipient rules: role-based org fan-out
└── types.ts           — NotificationIntent, category, priority, source types
```

## Key Principles

1. **Route handlers never call repository directly** — always via orchestrator
2. **Orchestrator methods are domain-named** — `handleObserverCompleted()`, not `createNotification()`
3. **Dedup via `dedupeKey`** — composite key (type:sourceId or type:sourceId:userId), unique per user
4. **Recipient policy is centralized** — `policy.ts` defines minRole per type
5. **Source tracking** — `sourceType` + `sourceId` for audit trail
6. **i18n in DB** — titleKey + bodyKey + vars, rendered client-side via tf()

## Notification Model

| Field | Type | Purpose |
|-------|------|---------|
| `category` | string | assessment / observer / org / campaign / billing / system |
| `priority` | string | low / normal / high |
| `sourceType` | string? | observer_invitation / campaign / stripe_invoice / ... |
| `sourceId` | string? | foreign key to source record |
| `actorUserId` | string? | who triggered this |
| `dedupeKey` | string? | unique per (dedupeKey, userId) |
| `readAt` | DateTime? | timestamp of read (null = unread) |
| `dismissedAt` | DateTime? | timestamp of dismiss |

## Future Channels

When email digest or push is added:
1. Add `channel` field to Notification (or separate ChannelDelivery model)
2. Orchestrator decides which channels per type
3. Repository handles per-channel persistence
4. New delivery services (email, push) read from repository
