# I2 — Billing és fizetési folyamat audit

> Dátum: 2026-04-08  
> Scope: jelenlegi checkout, fizetés, visszatérés, webhook és billing admin útvonalak állapota  
> Cél: pontos folyamatkép + töréspontok + refaktor irány

---

## 1. Rövid állapotkép

A custom Trita checkout UI (Stripe Payment Elementtel) **részben kész**, de a flow még hibrid:

- van új út (`/api/billing/create-payment` + `/billing/checkout`)
- bent maradt két legacy API (`/api/billing/checkout`, `/api/billing/purchase`)
- a post-payment finalizáció több helyre szóródik (`/billing/return`, `/billing/success`, webhook)

Jelenleg emiatt több fizetési ág törik vagy bizonytalan.

---

## 2. Jelenlegi billing/fizetési folyamatok (tényleges térkép)

## 2.1 Belépési pontok

| Belépési pont | Link minta | Szándék | Megjegyzés |
|---|---|---|---|
| Pricing Team panel | `/billing/checkout?plan=team_snapshot` vagy `team_monthly/annual` | csomagvásárlás | `team_snapshot` jelenleg inkompatibilis paraméterezés |
| Pricing Org panel | `/billing/checkout?plan=org_monthly/annual` | subscription | alapvetően helyes |
| Hiring paywall | `/billing/checkout?plan=candidate_addon` | candidate addon | inkompatibilis paraméter a custom API-hoz |
| Org product cards | `/billing/checkout?tier=team_snapshot` és `/billing/checkout?plan=candidate_5` | one-time + addon | ez a legközelebb áll a jelenlegi custom contracthoz |
| Profile/results upgrade | `/billing/checkout?tier=self_plus` | one-time | helyes |

## 2.2 Checkout orchestration

| Réteg | Fájl | Funkció |
|---|---|---|
| Checkout page | `src/app/billing/checkout/page.tsx` | auth + alap guard, majd kliens checkout komponens |
| Client init | `src/app/billing/checkout/EmbeddedCheckoutClient.tsx` | `/api/billing/create-payment` hívás, state kezelés |
| Payment UI | `src/components/billing/TritaCheckoutForm.tsx` | PaymentElement render + `stripe.confirmPayment` |
| Új fizetési API | `src/app/api/billing/create-payment/route.ts` | PI/subscription/trial/candidate intent létrehozás |

## 2.3 Fizetési módok (új custom API szerint)

| Mód | Input | Stripe objektum | Return URL | DB finalizáció jelenleg |
|---|---|---|---|---|
| One-time (`self_plus`, `team_snapshot`, `team_deep_dive`) | `tier` | PaymentIntent | `/billing/success?payment_intent=...` | `success` oldalon |
| Subscription első indulás | `plan=team/org_*` | Subscription (`trial_period_days`) | org billing tab | API közvetlenül ír DB-be |
| Subscription trial után aktiválás | `plan=team/org_*` | PaymentIntent (`subscription_activation`) | `/billing/return?payment_intent=...&plan=...` | `return` oldalon próbál DB-be írni |
| Candidate addon | `candidatePack=candidate_1/5/10` | PaymentIntent | `/billing/return?payment_intent=...&addon=candidate` | `return` oldalon credit jóváírás lenne |

## 2.4 Legacy, még bent lévő ágak

| API | Stripe minta | Állapot |
|---|---|---|
| `/api/billing/checkout` | embedded checkout session | legacy, párhuzamosan bent |
| `/api/billing/purchase` | embedded checkout session | legacy, párhuzamosan bent |

Webhook route továbbra is checkout session eseményekre optimalizált (`checkout.session.completed`), nem PaymentIntent-first finalizációra.

---

## 3. Konkrét töréspontok (confirmált)

## P0 — Kritikus

1. `billing/return` korai redirect rövidre zárja a PaymentIntent ágakat  
   - Fájl: `src/app/billing/return/page.tsx`  
   - A `resolveBillingReturnResolution()` ha nincs `session_id`, `kind: "redirect"`-et ad.  
   - Ezután azonnal `redirect(...)` fut, ezért a lejjebb lévő `payment_intent`-es subscription activation és candidate addon logika nem fut le.  
   - Következmény: payment sikeres lehet, de lokális state nem frissül.

2. Hiring paywall hibás candidate addon paramétert ad  
   - Fájl: `src/app/hiring/[orgId]/_components/HiringPaywall.tsx`  
   - Link: `?plan=candidate_addon`  
   - Az új API `candidatePack` értékeket vár (`candidate_1|5|10`).  
   - Következmény: checkout init hiba.

3. Team Snapshot pricing link hibásan `plan`-t használ `tier` helyett  
   - Fájl: `src/components/pricing/TeamTierPanel.tsx`  
   - Link: `?plan=team_snapshot`  
   - Az új API-ban `team_snapshot` one-time tier, nem subscription plan enum.  
   - Következmény: `INVALID_INPUT` és checkout init hiba.

4. PaymentIntent alapú ágak túlzottan böngésző returnre támaszkodnak  
   - One-time purchase (`/billing/success`) és candidate/subscription activation (`/billing/return`) finalizációja page loadhoz kötött.  
   - Ha user nem tér vissza (bezár tabot, redirect megszakad), nincs garantált szerveroldali lezárás webhookból.  
   - Következmény: fizetés és DB truth szétcsúszhat.

## P1 — Magas

5. Párhuzamos checkout architektúra (legacy + custom)  
   - Két API stratégia él egyszerre, más metadata contracttal.  
   - Debug és regressziók nehezen követhetők.

6. Finalizációs felelősség több rétegbe szórva  
   - `return`, `success`, webhook mind írhat billing adatot.  
   - Idempotencia részben megoldott, de a logika nem egy központi orchestratorban él.

---

## 4. Hol érdemes egyszerűsíteni/refaktorálni

## 4.1 Egységes checkout intent contract

Javaslat: egyetlen normalizált input schema (`CheckoutIntentInput`) minden entry pointból.

Minimum mezők:
- `productType` (`self_plus`, `team_snapshot`, `team_deep_dive`, `team_subscription`, `org_subscription`, `candidate_pack`)
- `billingInterval` (`monthly|annual|null`)
- `candidatePackSize` (`1|5|10|null`)
- `teamId` (ha releváns)
- `source` (pricing, hiring, org_billing, profile stb.)

Ezzel megszűnik a `tier` vs `plan` vs `candidatePack` inkompatibilitás.

## 4.2 Egyetlen post-payment orchestrator

Javaslat: központi `finalizePaymentOutcome(...)` service.

Feladat:
- PaymentIntent/CheckoutSession státusz lekérés
- idempotens domain mutáció (purchase/subscription/credits)
- billing document side-effect
- final handoff cél visszaadása

A `return` és `success` page csak orchestrator hívás + render legyen.

## 4.3 Webhook-first truth vagy explicit dual-truth policy

Dönteni kell:
- A) webhook-first (ajánlott): kliens return csak UX, nem truth
- B) dual fallback: return/success írhat, de központi idempotens orchestratoron át

Most hibrid van, dokumentálatlan precedence-szel.

## 4.4 Legacy endpointek kivezetése

- `/api/billing/checkout` és `/api/billing/purchase` deprecate flag alá
- usage inventory után fokozatos kikapcsolás
- végül törlés

## 4.5 Observability

Minden fizetési döntéshez közös trace mezők:
- `entryPoint`
- `productType`
- `stripeObjectType` (`pi|session|subscription`)
- `finalizationPath` (`webhook|return|success`)
- `outcome`

---

## 5. Javasolt azonnali hotfix sorrend (következő kör)

1. `billing/return` flow fix: payment_intent ág értékelése **redirect előtt**.  
2. Hiring paywall link javítás `candidate_addon` -> `candidate_5` (vagy picker).  
3. Team pricing snapshot link javítás `plan=team_snapshot` -> `tier=team_snapshot`.  
4. Checkout entrypoint paraméter-normalizáló helper bevezetés (UI oldali stabilitás).  
5. PaymentIntent finalizáció központosítása (legalább `success` + `return` közös service-re).

---

## 6. Nyitott döntési pontok a következő beszélgetéshez

1. Webhook-first truthra átállunk teljesen, vagy marad explicit fallback?  
2. Candidate addon UX: fix packok (1/5/10) vagy mennyiségi slider?  
3. One-time purchase létrehozása maradjon return/success oldalon, vagy webhook eventre kössük át?  
4. Legacy embedded checkout API-kat milyen ütemben vezetjük ki?

