# K3 — Product Billing Mapping

> Trita termékek → Stripe price → Billingo tételnév → trigger event

---

## Egyszeri vásárlások (one-time)

| Termék | Stripe mode | Stripe price env | Trigger event | Billingo tételnév (HU) | Nettó ár |
|--------|-------------|------------------|---------------|------------------------|----------|
| Self Plus | payment | `STRIPE_PRICE_SELF_PLUS` | `checkout.session.completed` | Trita Self Plus | €9 |
| Team Snapshot | payment | `STRIPE_PRICE_TEAM_SNAPSHOT` | `checkout.session.completed` | Trita Team Snapshot | €99 |
| Team Deep Dive | payment | `STRIPE_PRICE_TEAM_DEEP_DIVE` | `checkout.session.completed` | Trita Team Deep Dive | €990 |
| Candidate Credit 1× | payment | dynamic price_data | `checkout.session.completed` | Trita jelöltértékelés – 1 kredit | €39 |
| Candidate Credit 5× | payment | dynamic price_data | `checkout.session.completed` | Trita jelöltértékelés – 5 kredit | €33.15/db |
| Candidate Credit 10× | payment | dynamic price_data | `checkout.session.completed` | Trita jelöltértékelés – 10 kredit | €31.20/db |

---

## Előfizetések (recurring)

| Termék | Stripe mode | Stripe price env | Számla trigger | Billingo tételnév (HU) |
|--------|-------------|------------------|----------------|------------------------|
| Team havi | subscription | `STRIPE_PRICE_TEAM_MONTHLY` | `invoice.paid` | Trita Team előfizetés – havi |
| Team éves | subscription | `STRIPE_PRICE_TEAM_ANNUAL` | `invoice.paid` | Trita Team előfizetés – éves |
| Org havi | subscription | `STRIPE_PRICE_ORG_MONTHLY` | `invoice.paid` | Trita Org előfizetés – havi |
| Org éves | subscription | `STRIPE_PRICE_ORG_ANNUAL` | `invoice.paid` | Trita Org előfizetés – éves |
| Extra seat havi | subscription addon | `STRIPE_PRICE_EXTRA_SEAT_MONTHLY` | `invoice.paid` | (seat line item a fő számlán) |
| Extra seat éves | subscription addon | `STRIPE_PRICE_EXTRA_SEAT_ANNUAL` | `invoice.paid` | (seat line item a fő számlán) |

---

## Metadata contract

Minden checkout session tartalmazza (B1 contract):

```
trita_user_id       — UserProfile.id
organization_id     — Organization.id (ha van)
product_type        — "self_plus" | "team_snapshot" | ...
billing_interval    — "monthly" | "annual" (subscription-nél)
locale              — "hu" | "en"
currency            — "eur"
```

Legacy kulcsok (backward compat, fokozatosan kivezetendő):
```
orgId, type, tier, userProfileId, teamId, creditCount, actorId
```

---

## Hiányzó Stripe price ID-k (.env)

A következő price ID-k referálva vannak a kódban de nincsenek a `.env`-ben:
- `STRIPE_PRICE_SELF_PLUS`
- `STRIPE_PRICE_TEAM_SNAPSHOT`
- `STRIPE_PRICE_TEAM_DEEP_DIVE`

Ezeket a Stripe Dashboard-on kell létrehozni és a `.env`-be beírni.
