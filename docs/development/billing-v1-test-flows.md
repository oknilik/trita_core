# Billing V1 — Tesztelési flow-k (felületi belépési pontok)

> Minden flow-hoz: hol indulsz → mit kattintasz → mit látsz → mit ellenőrizz

---

## 1. Org subscription indítás (trial)

**Ki:** Org Admin, nincs subscription
**Honnan indulsz:** `/org/[orgId]/settings`

```
Org Settings oldal
  → "Előfizetés aktiválása" gomb
  → /billing/checkout?plan=org_monthly
  → Stripe Embedded Checkout (kártya adatok)
  → Sikeres fizetés → /billing/return
  → Webhook: checkout.session.completed
```

**Ellenőrizd:**
- [ ] Subscription DB-ben: status = trialing, stripeSubscriptionId kitöltve
- [ ] Org status: ACTIVE
- [ ] BillingEventLog: event processed
- [ ] Billingo: NEM készül számla (trial, nincs fizetés)

**Alternatív belépési pontok (ugyanaz a flow):**
- `/billing/upgrade` → "Fizetés →" gomb
- `/pricing` → Org tab → "Fizetés →" gomb
- `OrgSubscriptionBanner` (bármely org oldalon) → "Előfizetés aktiválása"

---

## 2. Trial lejárat → első fizetés

**Ki:** Org Admin, trialing subscription
**Honnan indulsz:** automatikus (Stripe test clock-kal gyorsítható)

```
Trial lejár (14 nap)
  → Stripe: customer.subscription.updated (trialing → active)
  → Stripe: invoice.paid (első fizetett invoice)
  → Webhook handler:
    1. Subscription sync (active)
    2. Order confirmation email küldés
    3. Billingo számla create
    4. BillingDocumentLink mentés
```

**Ellenőrizd:**
- [ ] Subscription DB: status = active
- [ ] Email: order confirmation megérkezett
- [ ] Billingo: számla létrejött (invoiceNumber nem üres)
- [ ] BillingDocumentLink: stripeInvoiceId + billingoDocumentId kitöltve
- [ ] Subscription.billingoLastDocumentId kitöltve

**Stripe CLI teszt:**
```bash
stripe trigger invoice.paid
```

---

## 3. Subscription megújítás (renewal)

**Ki:** Org Admin, active subscription
**Honnan indulsz:** automatikus (30/365 nap múlva)

```
Következő billing cycle
  → Stripe: invoice.paid (renewal)
  → Webhook handler:
    1. Idempotency check
    2. Existing doc check (nincs dupla számla)
    3. Billingo számla create
    4. BillingDocumentLink mentés
```

**Ellenőrizd:**
- [ ] Új BillingDocumentLink rekord (különböző stripeInvoiceId mint az előző)
- [ ] Subscription.billingoLastDocumentId frissült
- [ ] NEM dupla számla (ha a webhook kétszer jön)
- [ ] Order confirmation email NEM küldődik újra

---

## 4. Self Plus vásárlás (one-time)

**Ki:** Bejelentkezett user (org-on kívül is lehet)
**Honnan indulsz:** profil oldal locked szekció

```
Profil / Results oldal
  → Locked szekció → "Upgrade to Plus" gomb
  → /api/billing/purchase (POST, tier: "self_plus")
  → Stripe checkout
  → Webhook: checkout.session.completed (mode: payment)
  → Purchase create + Billingo számla
```

**Ellenőrizd:**
- [ ] Purchase DB: tier = "self_plus", status = "completed", invoiceStatus = "issued"
- [ ] Billingo számla: "Trita Self Plus", €9
- [ ] BillingDocumentLink: sourceType = "purchase"
- [ ] User access: Plus funkciók feloldva

---

## 5. Team Snapshot vásárlás (one-time)

**Ki:** Team kontextusú user
**Honnan indulsz:** `/pricing` → Team tab, vagy direkt link

```
Pricing oldal
  → Team Snapshot kártya → "Vásárlás" gomb
  → /api/billing/purchase (POST, tier: "team_snapshot")
  → Stripe checkout
  → Webhook: checkout.session.completed
  → Purchase create + Billingo számla
```

**Ellenőrizd:**
- [ ] Purchase DB: tier = "team_snapshot", invoiceStatus = "issued"
- [ ] Billingo számla: "Trita Team Snapshot", €99

---

## 6. Candidate credit vásárlás

**Ki:** Org Admin/Manager
**Honnan indulsz:** `/hiring/[orgId]`

```
Hiring dashboard
  → "Új jelölt hozzáadása" → nincs credit
  → Credit status bar → "Kreditek kezelése →"
  → /org/[orgId]/settings → credit szekció
  → Vagy: /billing/checkout?plan=candidate_1 (vagy candidate_5, candidate_10)
  → Stripe checkout (one-time payment)
  → Webhook: checkout.session.completed (type: candidate_addon)
  → Credits added + Billingo számla
```

**Ellenőrizd:**
- [ ] Subscription.candidateCredits += N
- [ ] CandidateCredit rekord: type = "purchase", amount = N
- [ ] Billingo számla: "Trita jelöltértékelés – N kredit"
- [ ] BillingDocumentLink: sourceType = "candidate_addon"
- [ ] Dupla webhook → nincs dupla credit

---

## 7. Fizetési hiba (payment failure)

**Ki:** Org Admin, active subscription
**Honnan indulsz:** automatikus (Stripe test kártya: 4000 0000 0000 0341)

```
Invoice fizetés sikertelen
  → Stripe: invoice.payment_failed
  → Webhook handler:
    1. Subscription sync (past_due)
    2. NEM készül Billingo számla
```

**Ellenőrizd:**
- [ ] Subscription DB: status = past_due
- [ ] Policy engine: policyState = restricted
- [ ] UI: write műveletek disabled (create, manage, invite)
- [ ] UI: read/list/observerInvite megtartva
- [ ] OrgSubscriptionBanner: "restricted" állapot megjelenik

**Felületi ellenőrzés:**
- `/org/[orgId]` → restricted banner látható
- `/org/[orgId]/settings` → "Számlázás kezelése" gomb → Stripe portal (kártyafrissítés)

---

## 8. Subscription törlés (cancel)

**Ki:** Org Admin
**Honnan indulsz:** `/org/[orgId]/settings` → "Számlázás kezelése"

```
Org Settings
  → "Számlázás kezelése" (BillingPortalButton)
  → Stripe Billing Portal megnyílik
  → "Cancel subscription" kattintás
  → Stripe: customer.subscription.updated (cancelAtPeriodEnd = true)
  → ... period end ...
  → Stripe: customer.subscription.deleted
  → Webhook: subscription sync → canceled
```

**Ellenőrizd:**
- [ ] cancelAtPeriodEnd fázis: subscription.cancelAtPeriodEnd = true, de status még active
- [ ] Period end után: subscription.status = canceled
- [ ] < 30 nap: policyState = restricted
- [ ] > 30 nap: policyState = frozen (read only)
- [ ] Org settings: "Reaktiválás" gomb megjelenik

**Felületi ellenőrzés:**
- `/org/[orgId]/settings` → subscription státusz "canceled" + "Reaktiválás" CTA

---

## 9. Refund (admin akció)

**Ki:** Admin (Stripe dashboard-ból)
**Honnan indulsz:** Stripe Dashboard → Payments → adott fizetés → Refund

```
Stripe Dashboard
  → Payment kiválasztása → "Refund" gomb
  → Stripe: charge.refunded
  → Webhook handler:
    1. Purchase lookup (paymentIntentId alapján)
    2. Eredeti Billingo document lookup
    3. Stornó document create
    4. Purchase: status = "refunded", invoiceStatus = "corrected"
```

**Ellenőrizd:**
- [ ] BillingDocumentLink: documentType = "correction", status = "corrected"
- [ ] Purchase: invoiceStatus = "corrected"
- [ ] Billingo: stornó document létrejött
- [ ] Dupla refund webhook → nincs dupla stornó

---

## 10. Admin reconciliation

**Ki:** Trita admin
**Honnan indulsz:** API (egyelőre nincs admin UI, csak endpoint)

```
GET /api/admin/billing
  → event log (100 legutóbbi)
  → retry stats (failed, retryable, exhausted, processed)
  → retryable events lista

POST /api/admin/billing { eventId: "evt_xxx" }
  → failed event reset for retry
```

**Ellenőrizd:**
- [ ] Event log tartalmazza az összes feldolgozott webhook-ot
- [ ] Failed event-ek retryable flag-gel jelölve
- [ ] Reset after retry: status = processing

---

## Belépési pont összefoglaló

| Felület | CTA | Mire jó | Ki éri el |
|---------|-----|---------|-----------|
| `/org/[id]/settings` | Aktiválás / Portal / Reaktiválás | Subscription lifecycle | Org Admin |
| `/billing/upgrade` | Plan kártyák | Plan választás | Org Admin |
| `/billing/checkout?plan=xxx` | Stripe Embedded Checkout | Fizetés | Org Admin |
| `/pricing` | Plan kártyák | Marketing → checkout | Bárki |
| `/hiring/[orgId]` | Credit status bar | Credit kezelés link | Manager+ |
| Profil locked szekció | "Upgrade to Plus" | Self Plus vásárlás | Bejelentkezett user |
| Dashboard paywall | "Trial indítása →" | Observer access | Bejelentkezett user |
| Stripe Billing Portal | Cancel / Payment update | Subscription kezelés | Org Admin |
| Stripe Dashboard | Refund | Admin refund | Trita admin |
| `/api/admin/billing` | API endpoint | Reconciliation | Trita admin |
