# Stripe / Billingo Architektúra Diagramok

---

## 1. Rendszerarchitektúra — Három truth réteg

```mermaid
graph TB
    subgraph "External Services"
        Stripe["☁️ Stripe<br/><i>Payment Truth</i>"]
        Billingo["☁️ Billingo<br/><i>Invoice / Compliance Truth</i>"]
        NAV["🏛️ NAV<br/><i>Adóhatóság</i>"]
    end

    subgraph "Trita Backend — Orchestration Truth"
        WebhookRoute["Webhook Route<br/><code>api/webhooks/stripe</code>"]
        Dispatch["Event Dispatch"]

        subgraph "Handlers"
            H_Checkout["checkout-completed"]
            H_InvPaid["invoice-paid"]
            H_InvFailed["invoice-failed"]
            H_SubSync["subscription-sync"]
            H_Refund["refund"]
        end

        subgraph "Service Layer"
            Metadata["stripe-metadata<br/>builder / parser"]
            VatDecision["vat-decision<br/>HU / EU B2B / Intl"]
            PartnerResolver["partner-resolver<br/>user ↔ org"]
            InvoiceItems["invoice-items<br/>product → tétel"]
            Normalizer["invoice-normalizer<br/>payload builder"]
            BillingoClient["billingo-client<br/>API v3"]
            Idempotency["idempotency<br/>BillingEventLog"]
            Retry["retry<br/>admin retry"]
            Tracing["tracing<br/>structured log"]
        end

        subgraph "Database (Prisma)"
            DB_Sub["Subscription"]
            DB_Purchase["Purchase"]
            DB_EventLog["BillingEventLog"]
            DB_PartnerLink["BillingoPartnerLink"]
            DB_DocLink["BillingDocumentLink"]
            DB_Credit["CandidateCredit"]
        end
    end

    subgraph "Trita Frontend"
        Checkout["Checkout Page<br/><code>/billing/checkout</code>"]
        Return["Return Page<br/><code>/billing/return</code>"]
        Settings["Org Settings<br/><code>/org/[id]/settings</code>"]
        AdminView["Admin Billing<br/><code>/api/admin/billing</code>"]
    end

    %% External flows
    Stripe -->|webhook events| WebhookRoute
    BillingoClient -->|API calls| Billingo
    Billingo -->|NAV reporting| NAV

    %% Dispatch
    WebhookRoute --> Dispatch
    Dispatch --> H_Checkout
    Dispatch --> H_InvPaid
    Dispatch --> H_InvFailed
    Dispatch --> H_SubSync
    Dispatch --> H_Refund

    %% Handler → Service
    H_Checkout --> Idempotency
    H_Checkout --> Metadata
    H_Checkout --> PartnerResolver
    H_Checkout --> VatDecision
    H_Checkout --> InvoiceItems
    H_Checkout --> Normalizer
    H_Checkout --> BillingoClient

    H_InvPaid --> Idempotency
    H_InvPaid --> PartnerResolver
    H_InvPaid --> BillingoClient

    H_Refund --> Idempotency
    H_Refund --> BillingoClient

    %% Service → DB
    Idempotency --> DB_EventLog
    PartnerResolver --> DB_PartnerLink
    H_Checkout --> DB_Purchase
    H_Checkout --> DB_Credit
    H_SubSync --> DB_Sub
    H_InvPaid --> DB_Sub
    BillingoClient -.->|doc link| DB_DocLink

    %% Frontend → Stripe
    Checkout -->|Embedded Checkout| Stripe
    Return -->|session status| Stripe
    Settings -->|Billing Portal| Stripe
    AdminView --> DB_EventLog

    %% Styling
    classDef stripe fill:#635bff,stroke:#4b45c6,color:#fff
    classDef billingo fill:#1a73e8,stroke:#1557b0,color:#fff
    classDef nav fill:#c62828,stroke:#8e0000,color:#fff
    classDef handler fill:#f3e5f5,stroke:#7b1fa2,color:#000
    classDef service fill:#e8f5e9,stroke:#2e7d32,color:#000
    classDef db fill:#fff3e0,stroke:#e65100,color:#000

    class Stripe stripe
    class Billingo billingo
    class NAV nav
    class H_Checkout,H_InvPaid,H_InvFailed,H_SubSync,H_Refund handler
    class Metadata,VatDecision,PartnerResolver,InvoiceItems,Normalizer,BillingoClient,Idempotency,Retry,Tracing service
    class DB_Sub,DB_Purchase,DB_EventLog,DB_PartnerLink,DB_DocLink,DB_Credit db
```

---

## 2. Egyszeri vásárlás flow (One-time purchase)

```mermaid
sequenceDiagram
    participant User
    participant Trita as Trita Frontend
    participant API as Trita API
    participant Stripe
    participant WH as Webhook Handler
    participant Billingo

    User->>Trita: Kattint "Vásárlás"
    Trita->>API: POST /api/billing/purchase
    API->>Stripe: checkout.sessions.create(mode: payment)
    Stripe-->>API: { clientSecret }
    API-->>Trita: { clientSecret }
    Trita->>Stripe: Embedded Checkout UI
    User->>Stripe: Kártya adatok megadása
    Stripe-->>Trita: Redirect → /billing/return

    Note over Stripe,WH: Webhook (async)
    Stripe->>WH: checkout.session.completed
    WH->>WH: Idempotency check
    WH->>WH: Purchase create (DB)
    WH->>WH: Partner resolve
    WH->>WH: VAT decision (HU/EU/Intl)
    WH->>WH: Invoice item build
    WH->>Billingo: createInvoiceDocument()
    Billingo-->>WH: { documentId, invoiceNumber }
    WH->>WH: BillingDocumentLink save
    WH->>WH: purchase.invoiceStatus = "issued"
```

---

## 3. Subscription flow (Recurring)

```mermaid
sequenceDiagram
    participant User
    participant Trita as Trita Frontend
    participant API as Trita API
    participant Stripe
    participant WH as Webhook Handler
    participant Billingo

    User->>Trita: Kattint "Előfizetés indítása"
    Trita->>API: POST /api/billing/checkout
    API->>Stripe: checkout.sessions.create(mode: subscription)
    Stripe-->>API: { clientSecret }
    API-->>Trita: { clientSecret }
    Trita->>Stripe: Embedded Checkout UI

    Note over Stripe,WH: Trial starts
    Stripe->>WH: checkout.session.completed
    WH->>WH: Subscription upsert (trialing)
    WH->>WH: Org activate (PENDING_SETUP → ACTIVE)

    Stripe->>WH: customer.subscription.created
    WH->>WH: Subscription state sync

    Note over Stripe,WH: Trial ends → first payment
    Stripe->>WH: customer.subscription.updated (trialing → active)
    WH->>WH: Subscription state → active
    WH->>WH: Send order confirmation email

    Stripe->>WH: invoice.paid
    WH->>WH: Idempotency check
    WH->>WH: Partner resolve
    WH->>WH: VAT decision
    WH->>Billingo: createInvoiceDocument()
    Billingo-->>WH: { documentId }
    WH->>WH: BillingDocumentLink save

    Note over Stripe,WH: Monthly renewal
    Stripe->>WH: invoice.paid (renewal)
    WH->>Billingo: createInvoiceDocument()
```

---

## 4. Refund / stornó flow

```mermaid
sequenceDiagram
    participant Admin
    participant Stripe
    participant WH as Webhook Handler
    participant Billingo
    participant DB

    Admin->>Stripe: Refund kiadás (Dashboard)

    Stripe->>WH: charge.refunded
    WH->>WH: Idempotency check
    WH->>DB: Purchase lookup (by paymentIntentId)

    alt Teljes refund
        WH->>DB: BillingDocumentLink lookup (original invoice)
        WH->>Billingo: createCorrectionDocument(originalDocId)
        Billingo-->>WH: { correctionDocId }
        WH->>DB: BillingDocumentLink save (type: correction)
        WH->>DB: purchase.invoiceStatus = "voided"
        WH->>DB: purchase.status = "refunded"
    else Részleges refund
        WH->>WH: Log warning — manuális kezelés szükséges
        WH->>DB: purchase.status marad "completed"
    end
```

---

## 5. Payment failure flow

```mermaid
sequenceDiagram
    participant Stripe
    participant WH as Webhook Handler
    participant DB
    participant PolicyEngine as Policy Engine

    Stripe->>WH: invoice.payment_failed
    WH->>WH: Idempotency check
    WH->>DB: Subscription sync (status → past_due)

    Note over DB,PolicyEngine: Következő page load
    PolicyEngine->>DB: getSubscriptionState()
    DB-->>PolicyEngine: status = "past_due"
    PolicyEngine-->>PolicyEngine: policyState = "restricted"
    PolicyEngine-->>PolicyEngine: Write capabilities disabled
```

---

## 6. Adatmodell kapcsolatok

```mermaid
erDiagram
    Organization ||--o| Subscription : has
    Organization ||--o{ CandidateCredit : tracks

    Subscription {
        string stripeCustomerId
        string stripeSubscriptionId
        string stripeLatestInvoiceId
        string planType
        string billingInterval
        string status
        string billingoLastDocumentId
    }

    Purchase {
        string stripeCheckoutSessionId
        string stripePaymentIntentId
        string productType
        int grossAmount
        string billingoDocumentId
        string invoiceStatus
    }

    BillingEventLog {
        string eventId UK
        string eventType
        string objectId
        string status
        boolean retryable
        int retryCount
    }

    BillingoPartnerLink {
        string billingoPartnerId UK
        string userId
        string organizationId
        string countryCode
        string taxNumber
    }

    BillingDocumentLink {
        string sourceType
        string sourceId
        string stripeInvoiceId
        string billingoDocumentId
        string documentType
        string status
    }

    UserProfile ||--o{ Purchase : makes
    BillingoPartnerLink }o--|| UserProfile : "self purchases"
    BillingoPartnerLink }o--|| Organization : "org purchases"

    Purchase ||--o{ BillingDocumentLink : "invoice link"
    Subscription ||--o{ BillingDocumentLink : "invoice link"
```

---

## 7. VAT decision tree

```mermaid
flowchart TD
    Start([Country Code input]) --> IsHU{country == HU?}

    IsHU -->|Igen| HU[🇭🇺 Magyar ügyfél<br/>HUF · 27% ÁFA<br/>Magyar nyelvű számla]

    IsHU -->|Nem| IsEU{EU ország?}

    IsEU -->|Nem| INTL[🌍 Nemzetközi<br/>EUR · ÁFA mentes<br/>Angol számla]

    IsEU -->|Igen| HasVAT{Van EU VAT szám?}

    HasVAT -->|Igen| EU_B2B[🇪🇺 EU B2B<br/>EUR · Reverse charge<br/>Angol számla]

    HasVAT -->|Nem| INTL

    style HU fill:#e8f5e9,stroke:#2e7d32
    style EU_B2B fill:#e3f2fd,stroke:#1565c0
    style INTL fill:#fff3e0,stroke:#e65100
```
