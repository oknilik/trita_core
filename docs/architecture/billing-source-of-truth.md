# K1 — Billing Source of Truth

---

## Három truth réteg

| Réteg | Rendszer | Felelősség |
|-------|----------|------------|
| **Payment truth** | Stripe | Fizetés, checkout, subscription lifecycle, payment state |
| **Invoice/compliance truth** | Billingo | Hivatalos számla kiállítás, NAV compliance, stornó/helyesbítés |
| **Orchestration truth** | Trita backend | Webhook feldolgozás, partner resolve, számla trigger, link mentés |

---

## Fő szabályok

1. **Webhook creates truth** — redirect soha nem hoz létre számlát vagy módosít állapotot
2. **One-time purchase trigger:** `checkout.session.completed`
3. **Recurring invoice trigger:** `invoice.paid`
4. **State sync events:** `customer.subscription.created/updated/deleted`, `invoice.payment_failed`
5. **Minden webhook feldolgozás idempotens** — `BillingEventLog.eventId` alapú deduplikáció
6. **Magyar és külföldi számlázás azonos orchestration modellen** — a `resolveVatDecision()` hook dönti el a paramétereket
7. **Retry minimálisan V1-ben is támogatott** — `BillingEventLog.retryable` + manuális retry

---

## Adat flow

```
Stripe webhook event
  ↓
route.ts — signature verify + dispatch
  ↓
handler (checkout-completed / invoice-paid / subscription-sync / etc.)
  ↓
idempotency check (BillingEventLog)
  ↓
local state update (Subscription / Purchase upsert)
  ↓
partner resolve (BillingoPartnerLink)
  ↓
VAT decision (vat-decision.ts)
  ↓
invoice payload normalize (invoice-normalizer.ts)
  ↓
Billingo API call (billingo-client.ts)
  ↓
BillingDocumentLink mentés
  ↓
markEventProcessed
```

---

## Mi hol él

| Adat | Hol | Miért |
|------|-----|-------|
| Subscription állapot (active/trialing/past_due/canceled) | Trita DB + Stripe | Stripe = truth, Trita = cache szinkronból |
| Purchase rekord | Trita DB | Stripe checkout session-höz kötve |
| Credit egyenleg | Trita DB (`Subscription.candidateCredits`) | Atomikus dekrementálás |
| Számla (invoice) | Billingo | NAV compliance — Trita csak a linket tárolja |
| Partner adat | Billingo + Trita (`BillingoPartnerLink`) | Billingo = truth, Trita = lookup cache |
| Webhook event log | Trita DB (`BillingEventLog`) | Idempotency + retry + debug |
