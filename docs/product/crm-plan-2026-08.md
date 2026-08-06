# Trita admin-CRM — terv (2026-08-05)

> Két független terv (sales-first / integration-first) bíráló szintézise.
> Státusz: JÓVÁHAGYOTT TERV — megvalósítás ezen a branchen.

# Trita admin-CRM — bírálat és VÉGSŐ egyesített terv

## I. Összevetés (repo-ellenőrzéssel)

Mindkét terv ténybeli állításait ellenőriztem a kódbázisban — mindkettő pontosan hivatkozik (Inquiry-séma `prisma/schema.prisma:848–869`, admin-PATCH action-minta `src/app/api/admin/inquiries/route.ts:10–17`, rate-card/kalkulátor `src/lib/quote/`, sweep + egyetlen cron `src/lib/notifications/sweep.ts` / `src/app/api/cron/release-steps`, kézi SQL-migráció precedens `20260804120000_add_compare_invite`). A döntés tehát nem tényeken, hanem architektúra-kompromisszumokon múlik.

| Szempont | Terv A (sales-first, külön Deal) | Terv B (integration-first, Inquiry=deal) | Ítélet |
|---|---|---|---|
| **Adatmodell-egyszerűség** | 3 új tábla + 1 FK; de tisztán additív | 2 új tábla + Inquiry-bővítés; kevesebb sor, DE az Inquiry kettős szerepet kap (esemény ÉS folyamat) | **Papíron B, valójában A.** A delta-különbség 1 tábla; cserébe A megőrzi az „esemény ≠ folyamat” szétválasztást — visszatérő ügyfél második megkeresése B-ben új pipeline-sor vagy kézi hack, A-ban `Inquiry.dealId` csatolás. |
| **Napi használat sebessége** | „Ma” panel + halasztó chipek + **naplózás+következő lépés EGY API-hívásban** + Enter-mentős gyors-naplózó | Composer + follow-up chipek hasonlóan jók; DE minden support-kérdés a pipeline-ban ül, amíg kézzel LOST-ra nem zárják | **A.** A kvalifikációs kapu (Beérkező ≠ Pipeline) tartja tisztán a napi nézetet; B-ben a pipeline-t a support-zaj szemeteli, és a „Nem sales” lezárás LOST-ként torzítja a win-rate-et. |
| **Meglévő infra újrahasznosítása** | requireAdmin, action-PATCH minta, sweep+cron, DashboardPrimitives, notification-recept — mintaszinten mindent újrahasznosít | Ugyanezek + a meglévő inquiries-tab/PATCH/UI KÓDSZINTEN is továbbél; quoteNo, virtuális timeline-elem, stage-stepper | **B.** B itt erősebb: kevesebb új felület, a meglévő tab evolúciója. Több konkrét ötlete átemelendő. |
| **Kockázat** | Tisztán additív: 0 adat-migráció, 0 érintés a nem-admin felületeken | A státusz-átértelmezés **7+ fájlon** gyűrűzik (ellenőrizve: `AdminInquiriesSection`, `OrgInquiriesTab`, `OrgPageShell`, `/api/org/[id]/inquiries`, admin `page.tsx` badge, `OverviewTab`), köztük a **tanácsadói cockpit** — nem admin-only felület. A `CLOSED→LOST` UPDATE a jóhiszeműen lezárt support-kérdéseket örökre „vesztett dealnek” címkézi. | **Egyértelműen A.** B legnagyobb gyengéje: az `Inquiry.status` a `isConsultantSurface`-ön (org-cockpit) is él — a pipeline-szemantika (WON/LOST, expectedValue, lostReason) kiszivárogna egy jövőben többszereplős tanácsadói felületre. |

**Verdikt: az A terv a gerinc** (Deal külön entitás, Inquiry érintetlen intake marad), **B-ből beemelve**: quoteNo-sorszámozás, telefon-mező (A-ból kimaradt, pedig a UI-ja tel: linket ígér!), strukturált lostReason-értékkészlet, virtuális „eredeti megkeresés” timeline-elem, SENT-től immutábilis quote + „másolat”-flow, DRAFT-törlés, `INQUIRY_RECEIVED` notif-link finomítás, Cmd/Ctrl-Enter a composerben, fázisonként önállóan szállítható vágás.

---

## II. VÉGSŐ egyesített terv

### 0. Rendszerkép és rögzített döntések

**Mi épül:** új `crm` fül az `/admin`-on (Ma / Beérkező / Pipeline / Lezártak), deal-részletnézet (`/admin/crm/[dealId]`) idővonallal és gyors-naplózóval, plusz a meglévő `QuoteCalculator` perzisztens `Quote`-tal. Minden a meglévő mintákra: `requireAdmin()`, action-alapú PATCH, notification hub + sweep + a meglévő napi cron, DashboardPrimitives.

1. **Inquiry = intake-esemény (érintetlen), Deal = pipeline-folyamat.** Az `Inquiry.status` marad `NEW|IN_PROGRESS|CLOSED` — a tanácsadói org-cockpit (`OrgInquiriesTab`, `/api/org/[id]/inquiries`) **egyetlen sora sem változik**. Az Inquiry opcionális `dealId` FK-t kap: több inquiry köthető egy dealhez.
2. **Nincs Contact/Company modell.** Kontakt denormalizáltan a Dealen (`contactName/contactEmail/contactPhone/company`); a „fiók” a won-ágon a meglévő `Organization`.
3. **Stage-ek/státuszok sima Stringek** (a szerep-mintát követve). Deal: `NEW | DISCOVERY | QUOTED | WON | LOST | DORMANT`. Quote: `DRAFT | SENT | ACCEPTED | DECLINED | EXPIRED`. Nincs CONTACTED/QUALIFIED külön — egy usernek a DISCOVERY lefedi, a DORMANT pedig kiveszi a parkolt leadet a napi nyomás alól.
4. **Pipeline-fegyelem = `nextActionAt`+`nextActionNote`.** Nem DB-kényszer; next action nélküli nyitott deal vizuálisan warning, és minden naplózás felajánlja a következő lépést UGYANABBAN a hívásban.
5. **Quote = pillanatkép** (input + result + akkori rate card JSON-ban), `quoteNo` sorszámmal (B-ből). SENT-től immutábilis; módosítás = másolat új DRAFT-ként, friss rate carddal újraszámolva. Belső számok (effektív óradíj, padló, warningok) SOHA nem kerülnek ügyfél-felületre.
6. **Admin-only, HU-only** (AdminNav-precedens). Tanácsadói kiterjesztés (isConsultantSurface) későbbi, i18n-nel együtt.
7. **Tudatos NEM-célok (v1):** email-sync/IMAP/BCC, automata ügyfél-email a CRM-ből, kanban-drag&drop, fájlmellékletek, multi-user ownership, külön riporting, Inquiry hard-delete (GDPR-törlés backlog).

### 1. Adatmodell (Prisma)

```prisma
// ============================================
// CRM (belső, admin-only)
// ============================================
// Deal = egy értékesítési folyamat. Stage: NEW | DISCOVERY | QUOTED |
// WON | LOST | DORMANT (String, a szerep-mintát követve — nem enum).
// Az Inquiry érintetlen intake marad; több inquiry köthető egy dealhez.
// Pipeline-fegyelem: nextActionAt/-Note — enélkül a nyitott deal warning.

model Deal {
  id             String    @id @default(cuid())
  title          String    // pl. "Acme Kft. — 2 csapat + Observer 360"
  contactName    String
  contactEmail   String
  contactPhone   String?   // B-ből: telefonos follow-uphoz (tel: link)
  company        String?
  stage          String    @default("NEW")
  source         String    @default("inquiry") // inquiry|referral|outbound|event|other
  expectedValue  Int?      // becsült nettó Ft — pipeline-összesítéshez
  nextActionAt   DateTime?
  nextActionNote String?
  adminNote      String?   // háttér: döntéshozó, motiváció, kontextus
  outcomeKind    String?   // B-ből strukturáltan: price|timing|no_response|competitor|budget|other
  outcomeNote    String?   // win/loss tanulság szövegesen
  closedAt       DateTime?
  lastActivityAt DateTime? // denormalizált: activity-create frissíti
  organizationId String?
  userProfileId  String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  organization Organization? @relation(fields: [organizationId], references: [id], onDelete: SetNull)
  userProfile  UserProfile?  @relation(fields: [userProfileId], references: [id], onDelete: SetNull)
  inquiries    Inquiry[]
  activities   CrmActivity[]
  quotes       Quote[]

  @@index([stage, nextActionAt])
  @@index([contactEmail])
  @@index([organizationId])
}

// Kézi bejegyzés (hívás/email/meeting/jegyzet) és rendszer-esemény
// (SYSTEM: ajánlat kiküldve, stage-váltás, org aktiválva) EGY idővonalon.
model CrmActivity {
  id         String   @id @default(cuid())
  dealId     String
  kind       String   // CALL | EMAIL_OUT | EMAIL_IN | MEETING | NOTE | SYSTEM
  summary    String   // egysoros — a lista ebből él
  body       String?
  occurredAt DateTime @default(now()) // visszadátumozható
  createdAt  DateTime @default(now())

  deal Deal @relation(fields: [dealId], references: [id], onDelete: Cascade)

  @@index([dealId, occurredAt])
}

// Mentett ajánlat: kalkulátor-input + kimenet + az AKKORI rate card
// pillanatképe. SENT-től immutábilis; módosítás = másolat új DRAFT-ként.
// Belső számok (óradíj, padló, warningok) admin-only maradnak.
model Quote {
  id               String    @id @default(cuid())
  quoteNo          Int       @unique @default(autoincrement()) // formatQuoteNo() → "TRT-2026-0007"
  dealId           String
  title            String?   // default: "{company ?? contactName} — {YYYY-MM-DD}"
  status           String    @default("DRAFT") // DRAFT|SENT|ACCEPTED|DECLINED|EXPIRED
  input            Json      // QuoteInput (íráskor zod-validált)
  result           Json      // calculateQuote() teljes kimenete
  rateCardSnapshot Json      // az érvényes RateCard mentéskor
  netTotal         Int       // result.netTotal kiemelve — lista + pipeline-érték SQL-ből
  discountPct      Int       @default(0)
  validUntil       DateTime? // create-kor opcionális; mark_sent default +30 nap
  sentAt           DateTime?
  decidedAt        DateTime?
  declineReason    String?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  deal Deal @relation(fields: [dealId], references: [id], onDelete: Cascade)

  @@index([dealId, createdAt])
  @@index([status, validUntil])
}

model Inquiry {
  // ...meglévő mezők és status-értékkészlet VÁLTOZATLANUL...
  dealId String?
  deal   Deal?   @relation(fields: [dealId], references: [id], onDelete: SetNull)
  @@index([dealId])
}
// Organization: + deals Deal[] · UserProfile: + deals Deal[]
// NotificationType enum: + CRM_NEXT_ACTION_DUE, + CRM_QUOTE_EXPIRING
```

**Migrációk** (kézzel írt SQL, `YYYYMMDDHHMMSS_snake_case`, 1–3 soros magyar fejléc, `TIMESTAMP(3)`; minta: `20260804120000_add_compare_invite`):
1. `20260805120000_add_crm_deal_activity` — Deal + CrmActivity CREATE, Inquiry.dealId + FK (SET NULL) + index. **Nincs adat-UPDATE** — additív.
2. `20260805130000_add_crm_quote` — Quote CREATE (quoteNo SERIAL/sequence + unique), FK CASCADE, 2 index.
3. `20260805140000_add_crm_notification_types` — `ALTER TYPE "NotificationType" ADD VALUE ...` ×2 (minta: `20260804121000_add_reflection_prompt_type`).

Test-DB: a meglévő `test:integration:bootstrap` (`migrate deploy`) automatikusan felveszi.

### 2. Lib-réteg — `src/lib/crm/` + quote-kiegészítés

- **`constants.ts`**: `DEAL_STAGES`, `OPEN_DEAL_STAGES` (NEW|DISCOVERY|QUOTED|DORMANT), HU címkék + chip-tone map minden stage/kind/státuszhoz, `ACTIVITY_KINDS`, `QUOTE_STATUSES`, `DEAL_SOURCES`, `OUTCOME_KINDS` (B értékkészlete), `POSTPONE_PRESETS` (+1/+3/+7/+14 nap), `QUOTE_DEFAULT_VALIDITY_DAYS = 30`.
- **`guards.ts`** (pure): `isOpenStage()`; `canTransitionQuote(from,to)` (DRAFT→SENT; SENT→ACCEPTED|DECLINED|EXPIRED; más tiltott); `resolveDueBucket(nextActionAt, now)` → overdue|today|upcoming|none; `buildDealTitleFromInquiry()`; `resolveCrmDueWindow(now)` (reflection-sweep ablak-minta); `formatQuoteNo(no, createdAt)` → "TRT-2026-0007" (B-ből).
- **`deals.ts`** (server): `getPipelineSnapshot()`, `getDueDeals(now)`, `getIntakeInquiries()` (NEW + dealId:null), `getDealDetail(id)`; `createDeal(input)` / `createDealFromInquiry(inquiryId, overrides)` (kontakt-másolás, inquiry.dealId set, inquiry status→IN_PROGRESS, nyitó SYSTEM-activity); `logActivity(dealId, {...}, nextAction?)` — **egy tranzakcióban** activity + lastActivityAt + opcionális next action (a 10 mp-es flow magja); `attachInquiryToOpenDeal(inquiryId, email)` (case-insensitive email-match a legfrissebb nyitott dealre; siker: link + SYSTEM-activity — best-effort try/catch); `handleOrgAccessGranted(orgId, action, months?)`.
- **`quotes.ts`** (server): `createQuote(dealId, input, title?, validUntil?)` — `loadRateCard()` → zod-validált input → `calculateQuote()` **szerver-oldali újraszámolás** (a kliens sosem küld összeget) → create snapshotokkal; `markQuoteSent(id, validUntil?)` — tranzakció: SENT+sentAt+validUntil(default +30d), deal→QUOTED (ha NEW/DISCOVERY), SYSTEM-activity; `markQuoteAccepted(id)` — ACCEPTED + **deal→WON** + closedAt + SYSTEM-activity; `markQuoteDeclined(id, reason?)`; `duplicateQuote(id)` (input átemelve, friss rate carddal ÚJRAszámolva, DRAFT); `deleteDraftQuote(id)` (B-ből, csak DRAFT).
- **`quoteInputSchema`** a `src/lib/quote/rate-card.ts`-be: a `QuoteInput` (calculate.ts:16–29) 1:1 zod-tükre a meglévő `QUOTE_STEPS`/`DISCOUNT_KINDS` enumokkal.

### 3. API — `/api/admin/crm/*` (requireAdmin try/catch→401, Zod, rövid hibakódok, mutáció után kliens `router.refresh()`; GET-ek nincsenek — a tab/detail szerver-komponens a lib-en át olvas, meglévő `_tabs` minta)

| Route | Metódus | Akciók / body |
|---|---|---|
| `crm/deals` | POST | `{title?, contactName, contactEmail, contactPhone?, company?, source, expectedValue?, inquiryId?, organizationId?, nextActionAt?, nextActionNote?}` — inquiryId esetén `createDealFromInquiry` |
| `crm/deals/[id]` | PATCH | discriminated union `action`: `set_stage {stage∈OPEN}` · `set_next_action {at, note}` · `clear_next_action` · `set_details {...}` · `set_note` · `link_org`/`unlink_org` · `link_user`/`unlink_user` · `attach_inquiry`/`detach_inquiry` · `close_won {outcomeKind?, outcomeNote?}` · `close_lost {outcomeKind, outcomeNote?}` (kind KÖTELEZŐ — `LOST_REASON_REQUIRED`) · `reopen {stage}` |
| `crm/deals/[id]/activities` | POST | `{kind∈ACTIVITY_KINDS\{SYSTEM}, summary(1..300), body?, occurredAt?, nextActionAt?, nextActionNote?}` — **naplózás + következő lépés EGY hívásban** |
| `crm/activities/[id]` | PATCH/DELETE | `{summary?, body?, occurredAt?}`; SYSTEM-kind nem szerkeszthető/törölhető (`NOT_EDITABLE`) |
| `crm/quotes` | POST | `{dealId, title?, validUntil?, input: quoteInputSchema}` |
| `crm/quotes/[id]` | PATCH/DELETE | PATCH `action`: `update_input` (csak DRAFT — `QUOTE_NOT_DRAFT`) · `mark_sent {validUntil?}` · `mark_accepted` · `mark_declined {reason?}` · `set_valid_until`; őr: `canTransitionQuote` (`INVALID_TRANSITION`). DELETE: csak DRAFT (`ONLY_DRAFT_DELETABLE`) |
| `crm/quotes/[id]/duplicate` | POST | — (lejárt/elutasított ajánlatból új DRAFT) |

Hibakódok: `DEAL_NOT_FOUND`, `INVALID_STAGE`, `INVALID_TRANSITION`, `LOST_REASON_REQUIRED`, `QUOTE_NOT_DRAFT`, `ONLY_DRAFT_DELETABLE`, `NOT_EDITABLE`, `VALIDATION_ERROR`.

### 4. UI

**4.1 `crm` admin-tab** (`AdminTabId` += "crm"; NavItem az Ügyfelek csoportban a „Kérdések” felett; badge: esedékes+lejárt next-action count). `_tabs/CrmTab.tsx` (szerver) → `components/admin/crm/AdminCrmSection.tsx` (kliens), panelek a napi hurok sorrendjében:
1. **„Ma” panel** (DashboardPanel warm): lejárt + ma esedékes dealek; sor-akciók: Megnyitás · halasztó chipek (+1/+3/+7 — egy PATCH) · „Kész” → Modal: naplózás + új következő lépés (egy POST). Üres állapot: „Minden esedékes lépés megvan mára.”
2. **Beérkező**: NEW, deal nélküli inquiry-k. „Pipeline-ba” (Modal előtöltve → POST deals) · „Nem sales” (meglévő inquiry-PATCH CLOSED — a pipeline-statisztikát nem érinti!). Email-match nyitott dealre → „már pipeline-ban” jelzés + csatolás-ajánlat.
3. **Pipeline**: stage-csoportos LISTA (nem kanban), fejlécben darab + expectedValue-összeg; felül DashboardMetricCard-sor (nyitott érték, kint lévő SENT-összeg, 30 napos win-rate). Sor: cím, cég, utolsó aktivitás kora, next action (state-error ha lejárt, warning-chip ha NINCS), quote-státusz ikon.
4. **Lezártak (90 nap)**: WON/LOST + outcomeKind/Note + összeg.

**4.2 Deal-részletnézet** `src/app/(app)/admin/crm/[dealId]/page.tsx` (szerver: requireAdmin + getDealDetail → kliens `DealDetail`):
- Fejléc: cím (inline), cég, kontakt (mailto + **tel:** link), stage-chip + váltó (close-ágon Modal: outcomeKind-select + note), expectedValue, forrás-badge, org/user link/unlink.
- Következő-lépés kártya: dátum+jegyzet, halasztó chipek; üresen nyitott dealnél warning-keret + CTA.
- **Gyors-naplózó sáv** (mindig látható): kind-pillek + egysoros input + **Enter/Cmd-Enter = mentés** (B-ből); kibontva: body, visszadátum, „következő lépés ezután”.
- **Idővonal**: activities desc, kind-ikonnal; SYSTEM halványabban, mono-eyebrow; **legalul virtuális elem a csatolt inquiry-k eredeti üzenetével** (B-ből).
- **Ajánlatok panel**: quoteNo · title · netTotal · effektív óradíj (result-ból) · státusz-chip · validUntil; akciók: Kiküldve/Elfogadva/Elutasítva/Másolat/Törlés(DRAFT); „Új ajánlat” → `/admin/quote?dealId=...`.
- Kapcsolt kérdések listája üzenet-előnézettel.

**4.3 QuoteCalculator-integráció**: props `{dealId?, initialInput?, sourceQuoteId?}`; `quote/page.tsx` olvassa `?dealId=`/`?from=`; deal-fejléc + cím-default `"{company} — {date}"` (B-ből); „Mentés ajánlatként” gomb (title + opcionális validUntil, POST → redirect a részletnézetre); mentés után quoteNo látszik + vevő-szöveg vágólap (quoteNo-val, validUntil-lal — belső számok nélkül) + „Megjelölés kiküldöttnek”. Deal nélkül sandbox marad; AdminNav továbbra sem linkeli.

**4.4 Design**: DashboardPrimitives, Button/TextField/Modal, SectionEyebrow mono; state-tokenek (WON/ACCEPTED→success, LOST/DECLINED/lejárt→error, SENT/esedékes→warning, DORMANT→muted); 7 tipográfiai szerep-utility, `min-h-[44px]`, mobile-first (a „Ma” panel telefonon is menjen).

### 5. Integrációk

1. **`submitInquiry()`** (`src/lib/inquiries.ts`): create után `attachInquiryToOpenDeal()` best-effort try/catch — a contact-flow-t nem törheti. **Nincs auto-deal-létrehozás** — a pipeline-ba kerülés kvalifikációs döntés. Jövőbeni pilot/founding-űrlap a `submitInquiry`-n át saját `source`-szal automatikusan a Beérkezőbe érkezik.
2. **`/api/admin/org-access`** activate/trial sikeres ága után `handleOrgAccessGranted()`: linkelt nyitott deal → WON + closedAt + SYSTEM-activity („Org-hozzáférés aktiválva, N hónap”); extend/set_credits WON dealen csak activity (ügyfél-történet); nincs linkelt deal → no-op. Idempotens.
3. **Quote ACCEPTED → deal WON** automatikusan; az org-access hook ilyenkor már csak activity-t ír.
4. **Notification hub**: `CRM_NEXT_ACTION_DUE` + `CRM_QUOTE_EXPIRING` a 7 lépéses recepttel (enum-migráció → schema → NOTIFICATION_TYPE_META → i18n HU+EN → orchestrator-handler + re-export → admin-címzés a `handleInquiryReceived` mintájára). dedupeKey: `CRM_NEXT_ACTION_DUE:{dealId}:{ISO-nap}`, `CRM_QUOTE_EXPIRING:{quoteId}`. Link a deal-részletnézetre.
5. **Sweep**: `runCrmSweep()` a `sweep.ts`-be, a `runNotificationSweep()` hívja — a meglévő napi cron viszi, ÚJ endpoint nélkül. Feladatok: (a) lejárt next-action → notif; (b) SENT quote validUntil 3 napon belül → notif; (c) SENT quote lejárt → auto-EXPIRED + SYSTEM-activity. Ablak-választó pure exportként.
6. **`INQUIRY_RECEIVED` link-finomítás** (B-ből): az admin-notif a `/admin?tab=crm`-re (Beérkező) mutasson — egy sor az orchestratorban.
7. **Overview KPI** (második kör): pipeline-érték, kint lévő ajánlatok, win-rate, forrás-bontás a meglévő KPI-blokk mellé.
8. **NEM változik**: `/api/org/[id]/inquiries`, `OrgInquiriesTab`, Emlékeztetők-tab, rate-card szerkesztő.

### 6. Tesztterv (új üzleti logika = min. 1 unit + 1 integration; kapu: `pnpm check` 0 hiba, unit+client zöld, lint-adósság nem nő)

**Unit** (`tests/unit/crm/`, node:test + tsx, pure):
- `crm-guards.test.ts`: `canTransitionQuote` teljes mátrix; `isOpenStage`; `resolveDueBucket` határesetek (éjfél/múlt/nincs); `resolveCrmDueWindow`; `formatQuoteNo` (formátum + évváltás).
- `crm-constants.test.ts`: címke-teljesség minden stage/kind/státusz/outcomeKind-hoz (registry-check minta).
- `quote-input-schema.test.ts`: érvényes/érvénytelen inputok; `netTotal` kiemelés = `result.netTotal`.
- dedupeKey-builder tesztek.

**Integration** (`tests/integration/crm/`, test-DB + factory-k + seeded-db-reset):
- `deal-lifecycle`: inquiry → createDealFromInquiry (link, IN_PROGRESS, SYSTEM-activity) → logActivity next actionnel (tranzakció, lastActivityAt) → close_lost outcomeKind-kötelezettség; Deal-delete cascade az activity-kre.
- `quote-persistence`: createQuote → rate card módosítás → snapshot/netTotal változatlan; mark_sent → deal QUOTED + activity; mark_accepted → deal WON; tiltott átmenet → 400; DELETE csak DRAFT.
- `inquiry-auto-attach`: nyitott deal mellett csatol + activity; zárt mellett intake-ben marad; hibaág nem töri a submitot.
- `org-access-won`: activate → linkelt nyitott deal WON + activity; extend WON dealen csak activity; már-WON idempotens.
- `crm-sweep`: lejárt next-action → notif + dedupe (második futás nem duplikál); quote auto-expire.

**Client** (vitest + RTL): gyors-naplózó (Enter/Cmd-Enter küld, ürít, kind-pill váltás); halasztó chipek dátum-számítása; LOST-modal kényszerített outcomeKind; „Ma” panel üres állapot.

**E2E** (Playwright, 1 happy path, második kör): intake → deal → naplózás → ajánlat mentés → SENT → ACCEPTED → WON.

---

## III. Fázisolt megvalósítási sorrend

### ELSŐ KÖR — most épül meg (~4–5 nap, minden lépés önállóan mergelhető)

- **F0 — Alapozás (~0,5 nap):** `crm/constants.ts` + `guards.ts` (+ formatQuoteNo), `quoteInputSchema` a rate-card.ts-be, unit tesztek. Nincs DB-változás.
- **F1 — Pipeline mag (~2 nap):** migráció #1; `deals.ts`; deals+activities API-k; `CrmTab` (Ma/Beérkező/Pipeline/Lezártak) + AdminNav-fül (badge egyelőre statikus count-query nélkül is mehet); deal-részletnézet gyors-naplózóval, idővonallal, virtuális inquiry-elemmel; `submitInquiry` auto-attach. Integration: deal-lifecycle, inquiry-auto-attach. **Ez már önmagában használható CRM.**
- **F2 — Ajánlat-réteg (~1,5 nap):** migráció #2; `quotes.ts`; quotes API-k; QuoteCalculator dealId-integráció + „Mentés ajánlatként”; Ajánlatok-panel státusz-akciókkal; org-access → `handleOrgAccessGranted` hook. Integration: quote-persistence, org-access-won.

### MÁSODIK KÖR — automatika + polírozás (~1–1,5 nap)

- **F3:** migráció #3 (NotificationType); notif-meta + i18n + orchestrator-handler; `runCrmSweep` bekötése a sweepbe (next-action notif, quote-expiring notif, auto-EXPIRED); AdminNav esedékes-badge élesítése; `INQUIRY_RECEIVED` link-finomítás. Integration: crm-sweep. E2E happy path.
- **F4 (igény szerint, backlog):** Overview KPI-k; napi digest email (csak ha van esedékes tétel); ajánlat-PDF (`design-tokens.ts`); quote-email Resenddel (`emails.ts` recept — ekkor jöhet EmailLog); tanácsadói kiterjesztés `isConsultantSurface` kapuval + i18n; kanban, ha a lista kinövi magát; GDPR inquiry-törlés.

**Érintett fő fájlok:** `prisma/schema.prisma` + 3 kézi migráció · `src/lib/crm/{constants,guards,deals,quotes}.ts` · `src/lib/quote/rate-card.ts` · `src/lib/inquiries.ts` (1 hívás) · `src/app/api/admin/crm/**` (7 route) · `src/app/api/admin/org-access/route.ts` (hook) · `src/app/(app)/admin/{page.tsx,_components/AdminNav.tsx,_tabs/CrmTab.tsx}` · `src/app/(app)/admin/crm/[dealId]/page.tsx` · `src/components/admin/crm/**` · `src/components/admin/quote/QuoteCalculator.tsx` + `src/app/(app)/admin/quote/page.tsx` · `src/lib/notifications/{types,orchestrator,policy,sweep,index}.ts` + `src/lib/i18n/notifications.ts` · tesztek a §6 szerint.

---

## IV. Nyitott döntések

1. **Pipeline-érték számítása**: ha egy dealen van SENT quote, a metrika a quote `netTotal`-ját vagy az `expectedValue`-t számolja? **Javaslat:** SENT quote felülírja az expectedValue-t (a konkrétabb szám nyer); döntés a F2 metrika-implementációnál.
2. **quoteNo évforduló**: globális folyamatos sorszám (autoincrement), az év csak a megjelenítésben (`TRT-2026-0007`) — vagy évente újrainduló számláló (külön sequence-kezelést igényel)? **Javaslat:** globális, egyszerűbb; ha zavaró, később formázási kérdés marad.
3. **Won deal → org-link kötelezettség**: close_won engedett-e organizationId nélkül (pl. egyéni coaching ügy)? **Javaslat:** igen, engedett — a WON-hook úgyis no-op link nélkül; de a close_won modal figyelmeztessen, ha nincs org linkelve.
4. **DORMANT-ébresztés**: kapjon-e a DORMANT deal automatikus „nézz rá” emlékeztetőt (pl. 60 nap múlva sweep-notif), vagy marad tisztán kézi? **Javaslat:** v1-ben kézi (nextActionAt szabadon beállítható DORMANT-on is); automatika F4.
5. **Tanácsadói kör hozzáférése a CRM-hez**: ha a platform-tanácsadói kör (isConsultant) bővül, a CRM admin-only marad, vagy per-org szűkített nézetet kapnak? Most nem blokkoló — a döntés az i18n-esítéssel együtt esedékes (F4).