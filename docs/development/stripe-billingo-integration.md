# Stripe / Billingo integrációs terv

> Dátum: 2026-04-03
> Státusz: terv — implementáció nem kezdődött

---

## Jelenlegi állapot a kódbázisban

### Stripe — AKTÍV, PRODUCTION-READY

| Elem | Állapot | Fájl |
|------|---------|------|
| Subscription model | ✅ Kész | `prisma/schema.prisma` (Subscription) |
| Purchase model | ✅ Kész | `prisma/schema.prisma` (Purchase) |
| CandidateCredit model | ✅ Kész | `prisma/schema.prisma` (CandidateCredit) |
| Checkout session creation | ✅ Kész | `src/app/api/billing/checkout/route.ts` |
| One-time purchase | ✅ Kész | `src/app/api/billing/purchase/route.ts` |
| Billing portal | ✅ Kész | `src/app/api/billing/portal/route.ts` |
| Webhook handler | ✅ Kész | `src/app/api/webhooks/stripe/route.ts` |
| Subscription helpers | ✅ Kész | `src/lib/subscription.ts` |
| Credit system | ✅ Kész | `src/lib/candidate-credits.ts` |
| Seat billing sync | ✅ Kész | `src/lib/seat-billing.ts` |
| Return resolution | ✅ Kész | `src/lib/billing/return-resolution.ts` |

**Kezelt webhook eventek:**
- `checkout.session.completed` — one-time purchase + subscription + candidate addon
- `customer.subscription.created` / `updated` / `deleted` — state sync
- `invoice.paid` / `invoice.payment_failed` — payment tracking

**Meglévő metadata contract (checkout session-ök):**
- Subscription: `{ orgId }`
- One-time purchase: `{ type: "one_time_purchase", tier, userProfileId, orgId, teamId }`
- Candidate addon: `{ orgId, type: "candidate_addon", creditCount, actorId }`

**Meglévő Prisma mezők a Subscription modellen:**
`stripeCustomerId`, `stripeSubscriptionId`, `stripePriceId`, `status`, `trialEndsAt`, `currentPeriodEnd`, `cancelAtPeriodEnd`, `candidateCredits`

**Meglévő Prisma mezők a Purchase modellen:**
`stripePaymentIntentId`, `stripeCheckoutSessionId`, `amount`, `currency`, `status`, `tier`, `metadata`

### Billingo — NEM LÉTEZIK

Nulla referencia a kódbázisban. Nincs kliens, nincs partner model, nincs invoice tracking.

### Ismert hiányosságok

- `STRIPE_PRICE_SELF_PLUS`, `STRIPE_PRICE_TEAM_SNAPSHOT`, `STRIPE_PRICE_TEAM_DEEP_DIVE` — nincsenek a `.env`-ben
- Nincs `charge.refunded` / `charge.dispute` webhook handler
- Nincs invoice/receipt tracking a DB-ben (Stripe-ra bízva)
- Nincs idempotency log (event ID alapú deduplikáció ad-hoc)
- Nincs retry mechanizmus hibás webhook feldolgozásra

---

## Célarchitektúra

```
Stripe = payment truth
Billingo = invoice / compliance truth
Trita backend = orchestration truth
```

**Kötelező szabályok:**
1. Webhook creates truth — redirect soha nem hoz létre számlát
2. One-time purchase trigger: `checkout.session.completed`
3. Recurring számla trigger: `invoice.paid`
4. State sync: `subscription.created/updated/deleted`, `invoice.payment_failed`
5. Minden webhook feldolgozás idempotens
6. Magyar és külföldi számlázás azonos orchestration modellen
7. Country/VAT logika explicit decision hook-ban
8. Minimál retry support V1-ben

---

## WORKSTREAM A — Domain model és adatbázis

### A1. Billing domain audit
> **Állapot:** elvégezhető azonnal — a fenti "Jelenlegi állapot" szekció a kiindulás

**Lépések:**
1. Auditálni a meglévő `Purchase`, `Subscription`, `CandidateCredit` modelleket
2. Összevetni a backlog-ban javasolt mezőkkel
3. Dokumentálni: meglévő mezők, hiányzó mezők, migration impact
4. Output: `docs/audits/billing-domain-audit.md`

**Teszt:** nincs (audit dokumentum)

### A2. Prisma schema bővítés
> **Előfeltétel:** A1 kész

**Meglévő modellek kiegészítése:**

Purchase — hiányzó mezők:
- `productType` (string) — explicit termék típus
- `billingInterval` (string, nullable) — "monthly" | "annual" | null
- `grossAmount` (int) — bruttó összeg centben
- `billingoDocumentId` (string, nullable)
- `billingoDocumentNumber` (string, nullable)
- `invoiceStatus` (string) — "pending" | "issued" | "failed" | "not_applicable"

Subscription — hiányzó mezők:
- `stripeLatestInvoiceId` (string, nullable)
- `planType` (string, nullable) — "team" | "org" | "scale"
- `billingInterval` (string, nullable)
- `currentPeriodStart` (DateTime, nullable)
- `billingoLastDocumentId` (string, nullable)

**Új modellek:**

```
BillingEventLog
  id, provider, eventId (unique), eventType, objectId,
  status ("processed" | "failed" | "skipped"),
  processedAt, errorMessage?, retryable, retryCount,
  lastRetryAt?, createdAt

BillingoPartnerLink
  id, userId?, organizationId?, billingoPartnerId,
  email, countryCode, taxNumber?, euVatNumber?,
  currency, locale, createdAt, updatedAt
  @@unique([billingoPartnerId])

BillingDocumentLink
  id, sourceType ("purchase" | "subscription_invoice"),
  sourceId, stripeInvoiceId?, stripeCheckoutSessionId?,
  billingoDocumentId, billingoDocumentNumber?,
  documentType ("invoice" | "correction" | "proforma"),
  status ("issued" | "voided" | "corrected"),
  createdAt
```

**Lépések:**
1. Schema módosítás
2. `npx prisma generate`
3. Migration script készítés (nem futtatás — review first)
4. Meglévő tesztek futtatása — nincs regresszió

**Teszt:** `npx prisma validate` + meglévő unit tesztek zöldek

---

## WORKSTREAM B — Stripe metadata contract

### B1. Központi metadata schema
> **Előfeltétel:** A2 kész

**Fájl:** `src/lib/billing/stripe-metadata.ts`

**Lépések:**
1. Típusdefiníció: `StripeSessionMetadata` interface
2. Builder: `buildCheckoutMetadata(input)` → metadata object
3. Parser: `parseCheckoutMetadata(raw)` → typed result | null
4. Zod validáció a parser-ben

**Kötelező metadata mezők:**
```typescript
interface StripeSessionMetadata {
  tritaUserId: string;
  organizationId?: string;
  teamId?: string;
  productType: "self_plus" | "team_snapshot" | "candidate_pack" | "team_subscription" | "org_subscription";
  billingInterval?: "monthly" | "annual";
  seatCount?: string;
  candidatePackSize?: string;
  locale: "hu" | "en";
  currency: "eur" | "huf";
  billingCountry?: string;
  vatNumber?: string;
}
```

**Teszt:**
- metadata builder round-trip (build → parse → eredeti input)
- parse invalid input → null
- parse hiányzó required mezők → null
- parse extra mezők → ignorálva

### B2. Checkout/session creator refactor
> **Előfeltétel:** B1 kész

**Érintett fájlok:**
- `src/app/api/billing/checkout/route.ts`
- `src/app/api/billing/purchase/route.ts`

**Lépések:**
1. Meglévő ad-hoc metadata objecteket cserélni `buildCheckoutMetadata()` hívásra
2. Minden checkout session-höz egységes metadata
3. A `return_url`-eket nem változtatni

**Scope (5 checkout típus):**
- self_plus, team_snapshot (one-time)
- candidate_pack (one-time)
- team_subscription, org_subscription (recurring)

**Teszt:**
- Meglévő billing webhook integration tesztek zöldek
- Új unit teszt: checkout metadata tartalmazza az elvárt mezőket

---

## WORKSTREAM C — Billingo service layer

### C1. Billingo API kliens
> **Előfeltétel:** nincs — párhuzamosan indítható

**Fájl:** `src/lib/billing/billingo-client.ts`

**Lépések:**
1. Billingo API v3 kliens (fetch-based, nincs SDK)
2. Auth: API key header
3. Rate limit kezelés (429 → retry)
4. Error mapping: `mapBillingoError(response)` → typed error

**Minimum műveletek:**
- `findOrCreatePartner(input)` → partnerId
- `updatePartnerIfNeeded(partnerId, input)` → void
- `createInvoiceDocument(input)` → { documentId, documentNumber }
- `createCorrectionDocument(originalDocumentId)` → { documentId }
- `getDocument(documentId)` → document

**Env változók:**
```
BILLINGO_API_KEY=
BILLINGO_BLOCK_ID=
```

**Teszt:**
- Mock-alapú unit teszt minden művelethez
- Error mapping teszt (400, 401, 429, 500)
- Rate limit retry teszt

### C2. Partner resolver service
> **Előfeltétel:** C1 + A2 (BillingoPartnerLink model)

**Fájl:** `src/lib/billing/partner-resolver.ts`

**Szabályok:**
| Termék típus | Partner | Resolve alap |
|---|---|---|
| self_plus | User | UserProfile.email |
| team_snapshot | User | UserProfile.email |
| candidate_pack | Organization | Organization owner email |
| team/org subscription | Organization | Organization owner email |

**Lépések:**
1. `resolvePartnerForPurchase(purchase, user)` → BillingoPartnerLink
2. `resolvePartnerForSubscription(subscription, org)` → BillingoPartnerLink
3. Ha létezik link → update if needed
4. Ha nem létezik → create partner + save link

**Teszt:**
- Új user → partner creation
- Meglévő partner → update
- Org purchase → org partner, nem user

### C3. Invoice payload normalizer
> **Előfeltétel:** C1 + H1 (country/VAT decision hook)

**Fájl:** `src/lib/billing/invoice-normalizer.ts`

**Input:** partner, country, currency, locale, product type, billing interval, VAT decision
**Output:** Billingo-ready invoice payload

**Teszt:**
- HU B2C → HUF, magyar számla
- EU B2B + valid VAT → EUR, reverse charge
- Non-EU → EUR, international

---

## WORKSTREAM D — Stripe webhook orchestration

### D1. Webhook handler refactor
> **Előfeltétel:** B1 + A2

**Jelenlegi fájl:** `src/app/api/webhooks/stripe/route.ts` (321 sor, monolitikus)

**Cél struktúra:**
```
src/app/api/webhooks/stripe/route.ts          — signature verify + dispatch
src/lib/billing/handlers/checkout-completed.ts — one-time + subscription checkout
src/lib/billing/handlers/invoice-paid.ts       — recurring invoice
src/lib/billing/handlers/invoice-failed.ts     — payment failure
src/lib/billing/handlers/subscription-sync.ts  — created/updated/deleted
src/lib/billing/handlers/refund.ts             — charge.refunded
```

**Lépések:**
1. Handler function-öket kiemelni külön fájlokba
2. Dispatch switch a route.ts-ben
3. Egységes error handling és logging
4. Refund handler hozzáadás (jelenleg nincs)

**Teszt:**
- Meglévő webhook integration tesztek zöldek
- Dispatch routing teszt: minden event type a helyes handler-be megy

### D2. Idempotency layer
> **Előfeltétel:** A2 (BillingEventLog model)

**Fájl:** `src/lib/billing/idempotency.ts`

**Lépések:**
1. `isEventProcessed(eventId)` → boolean (BillingEventLog lookup)
2. `markEventProcessed(eventId, type, objectId, status)` → void
3. `markEventFailed(eventId, error, retryable)` → void
4. Minden handler elején: check → skip if already processed
5. Minden handler végén: mark processed

**Teszt:**
- Duplikált event → skipped
- Failed event retryable → újrafuttatható
- Failed event non-retryable → nem futtatható újra

---

## WORKSTREAM E — Egyszeri vásárlások számlázása

### E1. `checkout.session.completed` handler bővítés
> **Előfeltétel:** C1 + C2 + C3 + D2

**Lépések (a meglévő handler kiegészítése):**
1. Event validáció (meglévő)
2. Metadata parse → `parseCheckoutMetadata()`
3. Purchase lookup/create (meglévő)
4. **ÚJ:** Partner resolve → `resolvePartnerForPurchase()`
5. **ÚJ:** Invoice payload normalizálás
6. **ÚJ:** Billingo számla create → `createInvoiceDocument()`
7. **ÚJ:** `BillingDocumentLink` mentés
8. **ÚJ:** Purchase `invoiceStatus` frissítés

**Támogatott productType-ok:** self_plus, team_snapshot, candidate_pack

**Teszt:**
- self_plus purchase → Billingo számla created
- team_snapshot purchase → Billingo számla created
- candidate_pack → Billingo számla created
- Duplicate event → nincs dupla számla
- Billingo API hiba → invoiceStatus = "failed", retryable = true

### E2. Purchase → invoice item mapping
> **Előfeltétel:** E1

**Fájl:** `src/lib/billing/invoice-items.ts`

**Mapping:**
| productType | Billingo tételnév (HU) | Billingo tételnév (EN) | Egységár |
|---|---|---|---|
| self_plus | Trita Self Plus | Trita Self Plus | €9 |
| team_snapshot | Trita Team Snapshot | Trita Team Snapshot | €99 |
| candidate_pack_1 | Trita jelöltértékelés – 1 kredit | Trita candidate assessment – 1 credit | €39 |
| candidate_pack_5 | Trita jelöltértékelés – 5 kredit | Trita candidate assessment – 5 credits | €33.15/db |
| candidate_pack_10 | Trita jelöltértékelés – 10 kredit | Trita candidate assessment – 10 credits | €31.20/db |

**Teszt:**
- Minden productType → helyes tételnév és egységár

---

## WORKSTREAM F — Subscription state sync és számlázás

### F1. `customer.subscription.created` handler
> **Előfeltétel:** D1 + D2
> **Jelenlegi állapot:** létezik, state sync-et csinál. Bővítés kell az idempotency layer-rel.

**Teszt:** subscription created → local DB-ben trialing/incomplete/active

### F2. `invoice.paid` handler bővítés
> **Előfeltétel:** C1 + C2 + C3 + D2

A recurring invoice fő számlázási triggere. Jelenleg csak logol + sync-el.

**Bővítés lépések:**
1. Stripe invoice lookup (meglévő)
2. Subscription resolve (meglévő)
3. **ÚJ:** Partner resolve
4. **ÚJ:** Billingo számla create
5. **ÚJ:** BillingDocumentLink mentés
6. Subscription state → active (meglévő)
7. Current period sync (meglévő)

**Teszt:**
- First invoice paid → Billingo számla
- Renewal invoice paid → Billingo számla
- Duplicate → nincs dupla számla

### F3. Subscription invoice item mapping
> **Előfeltétel:** F2

**Mapping:**
| planType + interval | Tételnév (HU) | Tételnév (EN) |
|---|---|---|
| team + monthly | Trita Team előfizetés – havi | Trita Team subscription – monthly |
| team + annual | Trita Team előfizetés – éves | Trita Team subscription – annual |
| org + monthly | Trita Org előfizetés – havi | Trita Org subscription – monthly |
| org + annual | Trita Org előfizetés – éves | Trita Org subscription – annual |

**Teszt:** minden kombináció → helyes tételnév

### F4. `invoice.payment_failed` handler
> **Jelenlegi állapot:** létezik, sync-el. Kiegészítés: idempotency + logging.

**Nem készül Billingo számla** — csak state sync.

**Teszt:** failed payment → subscription status = past_due

### F5. `customer.subscription.updated` handler
> **Jelenlegi állapot:** létezik, sync-el + email küld.

**Kezelendő:** interval váltás, upgrade/downgrade, quantity change, cancelAtPeriodEnd, reactivation.

**Teszt:** plan change → DB frissül; cancel → cancelAtPeriodEnd = true

### F6. `customer.subscription.deleted` handler
> **Jelenlegi állapot:** létezik, sync-el.

**Teszt:** subscription deleted → status = canceled, access policy frissül

---

## WORKSTREAM G — Refund, stornó, helyesbítés

### G1. Refund event handler
> **Előfeltétel:** D1 + Billingo számla creation (E1/F2)

**Event:** `charge.refunded`

**Lépések:**
1. Eredeti purchase/subscription invoice azonosítás
2. BillingDocumentLink lookup
3. Correction strategy: teljes refund → stornó, részleges → helyesbítő
4. Billingo stornó/helyesbítő document create
5. BillingDocumentLink mentés

**Teszt:** full refund → stornó document; partial → helyesbítő

### G2. Correction policy dokumentáció
> Mikor stornó, mikor helyesbítő, mikor manuális

---

## WORKSTREAM H — Külföldi és magyar számlázási logika

### H1. Country / VAT decision hook
> **Előfeltétel:** nincs — párhuzamosan indítható

**Fájl:** `src/lib/billing/vat-decision.ts`

**Kategóriák:**
| Kategória | Feltétel | Számla típus |
|---|---|---|
| HU customer | countryCode = "HU" | HUF, magyar ÁFA |
| EU B2B | EU ország + valid EU VAT | EUR, reverse charge |
| Nemzetközi | egyéb | EUR, ÁFA mentes |

**Input:** countryCode, taxNumber, euVatNumber, partnerType
**Output:** `{ vatCategory, currency, locale, vatRate, reverseCharge }`

**Teszt:**
- HU → HUF, 27% ÁFA
- DE + EU VAT → EUR, reverse charge
- US → EUR, ÁFA mentes
- HU + EU VAT → HUF (HU mindig HU)

### H2. Külföldi invoice támogatás
> **Előfeltétel:** H1 + C3

Ugyanaz az orchestration, de: devizás számla, idegen nyelvű számla, külföldi partner.

---

## WORKSTREAM I — Admin, reconciliation, megfigyelhetőség

### I1. Billing reconciliation admin nézet
**Minimum oszlopok:** event id, event type, source entity, Stripe object id, Billingo document id, status, error, createdAt

### I2. Retry mechanizmus
**Minimum:** `BillingEventLog.retryable`, retryCount, admin endpoint manuális újrafuttatáshoz, idempotens existence check

### I3. Billing logolás
**Minimum mezők:** stripeEventId, eventType, productType, sourceEntityId, billingoPartnerId, billingoDocumentId, resultStatus, errorCode

---

## WORKSTREAM J — Tesztek

### J1. Unit tesztek
**Scope:**
- metadata parser/builder round-trip
- invoice item mapping (purchase + subscription)
- partner resolver (user vs org)
- invoice payload normalizer (HU/EU/intl)
- subscription state mapper
- idempotency logic (processed/skipped/failed)
- country/VAT decision hook

### J2. Webhook integration / contract tesztek
**Minimum esetek:**
1. self_plus purchase success → Purchase + Billingo számla
2. team_snapshot purchase success → Purchase + Billingo számla
3. candidate_pack purchase success → Credits + Billingo számla
4. subscription created with trial → local DB trialing
5. first invoice.paid → Billingo számla + subscription active
6. renewal invoice.paid → Billingo számla
7. payment failed → subscription past_due
8. subscription canceled → subscription canceled
9. duplicate webhook → nincs dupla számla/purchase
10. refund flow → stornó document

### J3. E2E sanity pass
**Minimum flow-k:**
- self_plus vásárlás (checkout → webhook → számla)
- team subscription indítás (checkout → trial → first payment → számla)
- candidate pack purchase (checkout → credits → számla)
- failed payment → restricted state
- refund/correction smoke

---

## WORKSTREAM K — Dokumentáció

### K1. Source of truth doc
Stripe = payment, Billingo = compliance, Trita = orchestration

### K2. Event matrix doc (P0 — implementáció referencia)

| Stripe event | Trita action | Billingo action | Local state effect |
|---|---|---|---|
| `checkout.session.completed` | Purchase create / credit add | Invoice create | purchase.status = completed |
| `invoice.paid` | Subscription sync | Invoice create | subscription.status = active |
| `invoice.payment_failed` | Subscription sync | — | subscription.status = past_due |
| `customer.subscription.created` | Subscription upsert | — | subscription created/updated |
| `customer.subscription.updated` | Subscription sync | — | fields updated |
| `customer.subscription.deleted` | Subscription → canceled | — | status = canceled |
| `charge.refunded` | Purchase status update | Stornó/correction | invoiceStatus = voided |

### K3. Product billing mapping doc
Termékek → Stripe price ID → Billingo tételnév → trigger event

---

## Prioritás

### P0 — MVP (first invoicing capability)
1. A1 billing domain audit
2. K2 event matrix doc
3. A2 Prisma schema bővítés
4. B1 metadata schema
5. B2 checkout creator refactor
6. H1 country/VAT decision hook
7. C1 Billingo kliens
8. C2 partner resolver
9. D1 webhook refactor (handler szétbontás)
10. D2 idempotency layer
11. E1 checkout.session.completed handler (+ Billingo)
12. F1 subscription.created handler (idempotency bővítés)
13. F2 invoice.paid handler (+ Billingo)
14. F4 invoice.payment_failed handler (idempotency)

### P1 — Teljes lefedettség
15. C3 invoice payload normalizer
16. E2 purchase item mapping
17. F3 subscription item mapping
18. F5 subscription.updated handler (bővítés)
19. F6 subscription.deleted handler (bővítés)
20. H2 külföldi invoice támogatás
21. I1 reconciliation admin view
22. I2 retry mechanizmus
23. J1 unit tesztek
24. J2 webhook integration tesztek
25. K1 source of truth doc
26. K3 product billing mapping doc

### P2 — Hardening
27. G1 refund flow
28. G2 correction policy
29. I3 structured tracing
30. J3 E2E sanity pass
