# Billing Access States — Provisioning vs Entitlement vs Payment

> Státusz: ✅ Implemented (policy-engine.ts + subscription.ts)

---

## Három különböző kérdés

| Kérdés | Mi dönti el | Hol él |
|--------|------------|--------|
| **Provisioning**: Van-e a usernek org/subscription? | `Subscription` rekord létezik | DB |
| **Entitlement**: Mit használhat a user? | `policyState` + `capabilities` | `policy-engine.ts` |
| **Payment**: Fizet-e a user? | Stripe subscription status | Stripe (webhook sync) |

Ezek **nem ugyanaz**. Egy user lehet provisionálva (van subscription rekord) de nem fizet (trialing). Vagy fizethet (active) de restricted (past_due grace period lejárt).

---

## Access állapotok

```
                    ┌──────────────┐
                    │   NONE       │ ← nincs subscription
                    │ (no access)  │
                    └──────┬───────┘
                           │ checkout.session.completed
                           ▼
                    ┌──────────────┐
                    │  TRIALING    │ ← 14 napos trial
                    │ (full access)│
                    └──────┬───────┘
                           │ invoice.paid (first)
                           ▼
                    ┌──────────────┐
                    │   ACTIVE     │ ← fizet, teljes hozzáférés
                    │ (full access)│
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
    invoice.payment_failed │    cancel_at_period_end
              ▼            │            ▼
     ┌──────────────┐      │   ┌──────────────┐
     │  PAST_DUE    │      │   │  CANCELING   │
     │ (restricted) │      │   │ (full until  │
     └──────┬───────┘      │   │  period end) │
            │              │   └──────┬───────┘
    30 nap grace           │          │ period end
            ▼              │          ▼
     ┌──────────────┐      │   ┌──────────────┐
     │   FROZEN     │      │   │  CANCELED    │
     │ (read only)  │      │   │ (read only)  │
     └──────────────┘      │   └──────────────┘
                           │
                     renewal invoice.paid
                           │
                    (marad ACTIVE)
```

---

## Policy mapping

| Stripe status | Trita `policyState` | Capabilities | Invoice trigger? |
|---|---|---|---|
| `trialing` (trial_end > now) | `trialing` | Full access (create, manage, invite, stb.) | Nem — nincs fizetés |
| `active` | `active` | Full access | Igen — `invoice.paid` |
| `past_due` | `restricted` | Read + list + observerInvite only | Nem — fizetés sikertelen |
| `canceled` (< 30 nap) | `restricted` | Read + list + observerInvite only | Nem |
| `canceled` (> 30 nap) | `frozen` | Read only | Nem |
| nincs subscription | `none` | Read + list only | Nem |

---

## Org activation timing

| Event | Org status | Miért |
|---|---|---|
| `checkout.session.completed` (subscription mode) | `PENDING_SETUP → ACTIVE` | Platform hozzáférés indul — trial alatt is kell az org dashboard |
| `invoice.paid` (first) | marad `ACTIVE` | Fizetési megerősítés — email küldés |
| `invoice.payment_failed` | marad `ACTIVE` | Még nem frozen — grace period |
| `subscription.deleted` | marad `ACTIVE` (policy restricted/frozen) | Az org nem törlődik, csak a hozzáférés szűkül |

**Fontos:** Az `ACTIVE` org status nem jelenti, hogy a user fizet. Ez provisioning állapot. A tényleges entitlement a `policyState`-ből jön.

---

## Kód referenciák

| Fogalom | Fájl | Funkció |
|---------|------|---------|
| Stripe → policyState mapping | `src/lib/subscription.ts` | `getSubscriptionState()` |
| policyState → capabilities | `src/lib/capabilities.ts` | `resolveSubscriptionCapabilityPolicyState()` |
| Capabilities enforcement | `src/lib/policy-engine.ts` | `can()`, `getAccessPolicy()` |
| Org status transitions | `src/lib/billing/handlers/checkout-completed.ts` | `PENDING_SETUP → ACTIVE` |
