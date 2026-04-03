# G2 — Számlázási korrekciós szabályzat

---

## Mikor stornó, mikor helyesbítő

| Helyzet | Akció | Billingo művelet | Automatikus? |
|---------|-------|------------------|-------------|
| **Teljes refund** (charge.amount_refunded == charge.amount) | Stornó | `createCorrectionDocument()` → eredeti számla érvénytelen | ✅ Igen |
| **Részleges refund** | Helyesbítő számla | Manuális — nem automatizált V1-ben | ❌ Manuális |
| **Dispute (chargeback)** | Stornó | Manuális — Stripe dispute flow kezelés | ❌ Manuális |
| **Subscription downgrade** mid-cycle | Proration credit | Stripe kezeli az invoice-on — nem generál külön stornót | — |
| **Subscription cancel** with immediate effect | — | Nem generál stornót — a következő invoice nem jön | — |
| **Téves számla** (admin hiba) | Manuális stornó + új számla | Admin UI-ból | ❌ Manuális |

---

## Automatizált flow (V1)

```
charge.refunded event
  ↓
refund handler
  ↓
Teljes refund?
  ├── Igen → eredeti Billingo dokumentum lookup
  │         → createCorrectionDocument(originalDocId)
  │         → BillingDocumentLink mentés (type: "correction", status: "voided")
  │         → purchase.invoiceStatus = "voided"
  └── Nem → log warning, manuális kezelés szükséges
```

---

## V2 tervek

- Részleges refund → automatikus helyesbítő számla (az eredeti számla marad, új negatív tétel)
- Dispute → automatikus stornó + admin értesítés
- Subscription proration → Billingo credit note

---

## Fontos szabályok

1. **Stornó csak kiállított számlára** — ha `invoiceStatus !== "issued"`, nem stornózunk
2. **Idempotens** — duplikált refund webhook nem hoz létre dupla stornót (BillingDocumentLink check)
3. **Failed stornó → retryable** — ha a Billingo API hibázik, az event `retryable: true` marad
4. **Részleges refund-nál a purchase status "completed" marad** — csak teljes refund-nál "refunded"
