# K2 — Billing Event Matrix

> A webhook handler implementáció referenciaforrása.

---

## Event → Action → Számla mátrix

| Stripe event | Trita action | Billingo action | Local state effect | Handler fájl |
|---|---|---|---|---|
| `checkout.session.completed` (mode=payment) | Purchase create | Invoice create | purchase.status = completed, invoiceStatus = issued | `handlers/checkout-completed.ts` |
| `checkout.session.completed` (mode=payment, type=candidate_addon) | Credit add | Invoice create | subscription.candidateCredits += N | `handlers/checkout-completed.ts` |
| `checkout.session.completed` (mode=subscription) | Subscription sync | — (invoice.paid triggerel) | subscription upsert, org activate | `handlers/checkout-completed.ts` |
| `invoice.paid` | Subscription period sync | Invoice create | subscription.status = active, period sync | `handlers/invoice-paid.ts` |
| `invoice.payment_failed` | Subscription state sync | — | subscription.status = past_due | `handlers/invoice-failed.ts` |
| `customer.subscription.created` | Subscription upsert | — | subscription created (trialing/active) | `handlers/subscription-sync.ts` |
| `customer.subscription.updated` | Subscription field sync | — | fields updated (status, period, cancel flag) | `handlers/subscription-sync.ts` |
| `customer.subscription.deleted` | Subscription → canceled | — | subscription.status = canceled | `handlers/subscription-sync.ts` |
| `charge.refunded` | Purchase status update | Stornó/correction | purchase.invoiceStatus = voided | `handlers/refund.ts` |

---

## Trigger szabályok

| Számla típus | Trigger event | Miért |
|---|---|---|
| One-time purchase számla | `checkout.session.completed` | A fizetés és a checkout egy lépésben történik |
| Recurring subscription számla | `invoice.paid` | A subscription-hoz Stripe generál invoice-t, mi arra reagálunk |
| Stornó / helyesbítő | `charge.refunded` | Refund után a korábbi számla érvénytelenítendő |

**Soha nem triggerel számlát:**
- `customer.subscription.created` — csak state sync
- `customer.subscription.updated` — csak state sync
- `customer.subscription.deleted` — csak state sync
- `invoice.payment_failed` — nincs sikeres fizetés, nincs számla
- Redirect / return URL — kliens-oldali, nem megbízható

---

## Idempotency szabályok

| Event | Idempotency key | Skip feltétel |
|---|---|---|
| `checkout.session.completed` | `event.id` + `session.id` | Purchase/Credit már létezik ezzel a session ID-vel |
| `invoice.paid` | `event.id` + `invoice.id` | BillingDocumentLink már létezik ezzel a stripeInvoiceId-vel |
| `charge.refunded` | `event.id` | BillingDocumentLink correction már létezik |
| Subscription events | `event.id` | BillingEventLog processed |
