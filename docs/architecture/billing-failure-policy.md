# Billingo Failure Policy

> Státusz: ✅ Implemented (kódban érvényesítve)

---

## Alapelv

```
Stripe/local subscription sync first, Billingo invoice second.
```

A Billingo API hívás **soha nem blokkolja** a Stripe webhook pénzügyi feldolgozását. Ha a Billingo hiba, a felhasználó pénzügyi állapota és platform hozzáférése nem sérül.

---

## Viselkedés Billingo hiba esetén

| Handler | Stripe/local action | Billingo hiba hatása |
|---------|--------------------|---------------------|
| `checkout-completed` (purchase) | Purchase created ✅ | `invoiceStatus = "failed"`, `BillingEventLog.retryable = true` |
| `checkout-completed` (candidate addon) | Credits added ✅ | Számla nem készül, log warning |
| `invoice-paid` (subscription) | Subscription synced ✅ | Számla nem készül, `traceBillingEvent(failed)` |
| `refund` | Purchase status updated ✅ | Stornó nem készül, `BillingEventLog.retryable = true` |

---

## Retry szabályok

| Kérdés | Válasz |
|--------|--------|
| Mi a retry source of truth? | `BillingEventLog` — `status = "failed"` AND `retryable = true` AND `retryCount < 3` |
| Mi számít retry-safe eseménynek? | Olyan event, ahol a Stripe-oldali feldolgozás sikeres volt, csak a Billingo hívás hibázott |
| Mi történik második Billingo siker esetén? | `BillingDocumentLink` idempotent check: ha `stripeInvoiceId` vagy `stripeCheckoutSessionId`-re már van issued doc, skip |
| Hogyan zárod ki a duplikált dokumentumot? | `invoice-paid`: `BillingDocumentLink.findFirst({ stripeInvoiceId })` check a Billingo hívás előtt |
| Ki indíthat retry-t? | Admin — `POST /api/admin/billing { eventId }` → `resetEventForRetry()` |
| Hányszor retry-olható? | Max 3× (`MAX_RETRY_COUNT`) — utána `exhausted` |

---

## Miért non-blocking?

1. **A felhasználó nem érezheti** — ha a Billingo API lassú vagy hibás, a checkout UX nem törhet el
2. **A subscription state nem sérülhet** — ha a számla nem készül el, a user akkor is active
3. **Az admin beavatkozhat** — a reconciliation view mutatja a failed event-eket, a retry gomb elérhető
4. **A compliance kockázat kezelhető** — pár órás/napos késés a számlakiállításban elfogadható, a teljes hiány nem

---

## Anti-pattern-ek (NE csináld)

- ❌ Ne tedd blocking-gá a Billingo hívást a webhook handler-ben
- ❌ Ne dobd újra a Billingo hibát a handler catch-ből (a Stripe webhook 500-at kapna és újrapróbálná az egész eventet)
- ❌ Ne hozz létre számlát a return page-ről (az UX layer, nem truth source)
- ❌ Ne retry-olj Billingo hívást szinkron a webhook handler-ben (rate limit + timeout kockázat)
