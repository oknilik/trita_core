# A1 — Billing Domain Audit

> Dátum: 2026-04-03
> Source: `prisma/schema.prisma`, `src/lib/billing/`, `src/app/api/billing/`, `src/app/api/webhooks/stripe/`

---

## Meglévő modellek

### Subscription
| Mező | Típus | Állapot |
|------|-------|---------|
| `id` | String @id | ✅ |
| `orgId` | String @unique | ✅ |
| `stripeCustomerId` | String? @unique | ✅ |
| `stripeSubscriptionId` | String? @unique | ✅ |
| `stripePriceId` | String? | ✅ |
| `status` | String @default("trialing") | ✅ |
| `trialEndsAt` | DateTime? | ✅ |
| `currentPeriodEnd` | DateTime? | ✅ |
| `cancelAtPeriodEnd` | Boolean @default(false) | ✅ |
| `candidateCredits` | Int @default(0) | ✅ |
| `createdAt` | DateTime | ✅ |
| `updatedAt` | DateTime | ✅ |
| `stripeLatestInvoiceId` | — | ❌ hiányzik |
| `planType` | — | ❌ hiányzik (kódban `getPlanTier()` kalkulálja `stripePriceId`-ból) |
| `billingInterval` | — | ❌ hiányzik |
| `currentPeriodStart` | — | ❌ hiányzik |
| `billingoLastDocumentId` | — | ❌ hiányzik |

### Purchase
| Mező | Típus | Állapot |
|------|-------|---------|
| `id` | String @id | ✅ |
| `userProfileId` | String | ✅ |
| `orgId` | String? | ✅ |
| `teamId` | String? | ✅ |
| `tier` | String | ✅ |
| `stripePaymentIntentId` | String? | ✅ |
| `stripeCheckoutSessionId` | String? | ✅ |
| `amount` | Int | ✅ (centben) |
| `currency` | String @default("eur") | ✅ |
| `status` | String @default("completed") | ✅ |
| `includesAdvisory` | Boolean | ✅ |
| `includedCredits` | Int | ✅ |
| `metadata` | Json? | ✅ |
| `createdAt` / `updatedAt` | DateTime | ✅ |
| `productType` | — | ❌ hiányzik (jelenleg `tier` mező tölti be ezt a szerepet) |
| `billingInterval` | — | ❌ hiányzik (nem releváns one-time-nál, de consistency) |
| `grossAmount` | — | ❌ hiányzik |
| `billingoDocumentId` | — | ❌ hiányzik |
| `billingoDocumentNumber` | — | ❌ hiányzik |
| `invoiceStatus` | — | ❌ hiányzik |

### CandidateCredit
| Mező | Típus | Állapot |
|------|-------|---------|
| `id`, `orgId`, `type`, `amount`, `balance`, `note`, `actorId`, `createdAt` | — | ✅ teljes |

### Nem létező modellek
| Model | Cél |
|-------|-----|
| `BillingEventLog` | Webhook event dedup + retry + debug |
| `BillingoPartnerLink` | Billingo partner ID ↔ Trita user/org mapping |
| `BillingDocumentLink` | Stripe invoice/checkout ↔ Billingo document mapping |

---

## Migration impact

- A meglévő Subscription és Purchase mezőbővítések nullable-ként adhatók hozzá → **nincs adatvesztés**
- Az új modellek üres táblák → **nincs conflict**
- A `tier` → `productType` nem csere, hanem kiegészítés — a `tier` marad, a `productType` explicit szintet ad
- A `planType` a Subscription-ön redundáns a `getPlanTier()` kalkulációval — de explicit mező egyértelműbb a Billingo számla generálásnál
