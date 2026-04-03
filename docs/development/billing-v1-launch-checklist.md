# Billing V1 Launch Checklist

> Cél: a billing rendszer első éles üzembe állítása
> Státusz: checklist — nem indult

---

## Előfeltételek (external)

### Stripe Dashboard
- [ ] **Self Plus** price létrehozva (one-time, €9) → `STRIPE_PRICE_SELF_PLUS=price_xxx`
- [ ] **Team Snapshot** price létrehozva (one-time, €99) → `STRIPE_PRICE_TEAM_SNAPSHOT=price_xxx`
- [ ] **Team Deep Dive** price létrehozva (one-time, €990) → `STRIPE_PRICE_TEAM_DEEP_DIVE=price_xxx`
- [ ] **Team Monthly** külön price (recurring, €49/hó) → `STRIPE_PRICE_TEAM_MONTHLY`
- [ ] **Team Annual** külön price (recurring, €470/év) → `STRIPE_PRICE_TEAM_ANNUAL`
- [ ] **Org Monthly** külön price (recurring, €149/hó) → `STRIPE_PRICE_ORG_MONTHLY`
- [ ] **Org Annual** külön price (recurring, €1430/év) → `STRIPE_PRICE_ORG_ANNUAL`
- [ ] **Extra Seat** price-ek (havi + éves) szétválasztva, ha kell
- [ ] Production webhook endpoint regisztrálva: `https://trita.app/api/webhooks/stripe`
- [ ] Webhook events: `checkout.session.completed`, `customer.subscription.created/updated/deleted`, `invoice.paid`, `invoice.payment_failed`, `charge.refunded`
- [ ] Production webhook signing secret → `STRIPE_WEBHOOK_SECRET`
- [ ] Customer Portal engedélyezve (cancel, payment method update)

### Billingo
- [ ] Fiók létrehozva / meglévő fiók API access
- [ ] API kulcs generálva → `BILLINGO_API_KEY`
- [ ] Számlatömb (block) létrehozva → `BILLINGO_BLOCK_ID`
- [ ] Cégadatok kitöltve (cégnév, adószám, cím, bankszámlaszám)

### Env változók (production)
- [ ] Minden fenti `STRIPE_PRICE_*` kitöltve valós price ID-kkel
- [ ] `BILLINGO_API_KEY` és `BILLINGO_BLOCK_ID` kitöltve
- [ ] `STRIPE_WEBHOOK_SECRET` production secret

---

## Prisma migráció

- [ ] Migration létrehozva: `npx prisma migrate dev --name billing_v1`
  - Subscription: +`stripeLatestInvoiceId`, `planType`, `billingInterval`, `currentPeriodStart`, `billingoLastDocumentId`
  - Purchase: +`productType`, `grossAmount`, `billingoDocumentId`, `billingoDocumentNumber`, `invoiceStatus`
  - Új: `BillingEventLog`, `BillingoPartnerLink`, `BillingDocumentLink`
- [ ] Migration review-zva (nincs destructive change, minden nullable)
- [ ] Staging/test DB-n futtatva
- [ ] Production DB-n futtatva

---

## Kód TODO-k lezárása

4 maradék TODO a billing kódban:

- [ ] `partner-resolver.ts:126` — `countryCode: "HU"` → tényleges org billing profile-ból (ha van profil oldal, onnan; ha nincs, maradhat HU default)
- [ ] `partner-resolver.ts:139` — `countryCode: "HU"` → tényleges user billing profile-ból (ugyanaz)
- [ ] `invoice-items.ts:64` — EUR→HUF árfolyam: MNB napi árfolyam API, vagy fix rate elfogadása V1-ben (dokumentált döntés kell)
- [ ] `invoice-failed.ts:53` — dunning/reminder hook: admin email vagy skip V1-ben

### Döntés szükséges

| Kérdés | Opciók | Javasolt V1 |
|--------|--------|-------------|
| EUR→HUF árfolyam | MNB API / fix rate / Stripe-ból | Fix rate (400 HUF/EUR), dokumentálva |
| Country code source | User/org billing profil / mindig HU | V1: HU default, V2: billing address |
| Dunning email | Automatikus / admin kézi / skip | V1: skip (policy engine restricted-re vált, az elég) |

---

## Funkcionális tesztelés

### Stripe CLI lokális teszt
- [ ] `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- [ ] Test clock beállítva (trial szimuláláshoz)

### One-time purchase flow
- [ ] Self Plus vásárlás → checkout → webhook → Purchase DB-ben → Billingo számla
- [ ] Team Snapshot vásárlás → checkout → webhook → Purchase → Billingo számla
- [ ] Candidate Pack (5×) → checkout → webhook → credits added → Billingo számla
- [ ] Dupla webhook → nincs dupla purchase / dupla számla

### Subscription flow
- [ ] Team monthly checkout → trial starts → subscription DB-ben (trialing)
- [ ] Trial lejárat → `customer.subscription.updated` (trialing→active) → DB active
- [ ] Első `invoice.paid` → Billingo számla + order confirmation email
- [ ] Renewal `invoice.paid` → újabb Billingo számla (nem duplikált)
- [ ] Cancel → `subscription.deleted` → DB canceled → policy restricted/frozen

### Payment failure
- [ ] `invoice.payment_failed` → subscription past_due → policy restricted
- [ ] Nincs Billingo számla (helyes — nincs fizetés)

### Refund
- [ ] Stripe dashboardból full refund → `charge.refunded` → Billingo stornó document
- [ ] Purchase.invoiceStatus → corrected
- [ ] Dupla refund webhook → nincs dupla stornó

### Admin reconciliation
- [ ] `GET /api/admin/billing` → event log + retry stats
- [ ] Failed event → `POST /api/admin/billing { eventId }` → reset for retry

### Idempotency
- [ ] Ugyanaz a webhook event kétszer küldve → második skip-elve
- [ ] `BillingEventLog` rekord created + processed

---

## Edge case tesztelés

- [ ] Checkout indítás → user bezárja a böngészőt → nincs webhook → nincs purchase (helyes)
- [ ] Billingo API timeout → purchase created, invoiceStatus = "failed", event retryable
- [ ] Billingo API 429 rate limit → automatic retry (max 2×) a billingo-client-ben
- [ ] Subscription checkout → Stripe hiba → nincs session → frontend error (helyes)
- [ ] Invalid webhook signature → 400 response (nem feldolgozva)

---

## Policy engine validáció

- [ ] `trialing` subscription → full access (create, manage, invite)
- [ ] `active` subscription → full access
- [ ] `past_due` subscription → restricted (read, list, observerInvite only)
- [ ] `canceled` < 30 nap → restricted
- [ ] `canceled` > 30 nap → frozen (read only)
- [ ] Nincs subscription → none (read, list only)

---

## Monitoring (V1 minimum)

- [ ] `BillingEventLog` tábla nem nő korlátlanul → cleanup policy (90 nap processed events)
- [ ] Admin értesítés ha failed event count > 5 (manuális check V1-ben)
- [ ] Billingo API health check elérhető: `GET /api/billing/health`

---

## Dokumentáció véglegesítés

- [ ] `billing-failure-policy.md` — átolvasva, production-ready
- [ ] `billing-access-states.md` — átolvasva, policy engine kóddal összhangban
- [ ] `billing-event-matrix.md` — handler fájl nevek frissek
- [ ] `billing-product-mapping.md` — price ID-k frissítve a valós értékekkel
- [ ] `billing-correction-policy.md` — V1/V2 határ egyértelmű
- [ ] `billing-architecture-diagrams.md` — current vs target tábla naprakész
- [ ] `stripe-billingo-integration.md` — státusz frissítve "V1 launched"-ra

---

## Go / No-Go kritériumok

**GO ha:**
- [ ] Minden Stripe price ID valós és tesztelve
- [ ] Billingo API key aktív és test számla sikeresen készült
- [ ] Prisma migration lefutott production-ön
- [ ] A 7 funkcionális teszt flow mindegyike legalább egyszer lefutott
- [ ] 36 billing unit teszt zöld
- [ ] Admin reconciliation endpoint elérhető
- [ ] Legalább 1 teljes purchase + 1 subscription + 1 refund end-to-end tesztelve

**NO-GO ha:**
- Bármelyik Stripe price ID hiányzik vagy placeholder
- Billingo API nem válaszol vagy auth hibás
- Migration nem futott le
- Idempotency teszt fail (dupla számla kockázat)
