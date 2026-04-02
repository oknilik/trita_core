# Observer Flow — Teljes Lifecycle Inventory

> Állapot: 2026-04-01
> Source of truth: API route fájlok + Prisma schema

---

## Áttekintés

Az observer flow lehetővé teszi, hogy egy user (inviter) meghívjon másokat (observer), hogy kitöltsék ugyanazt a személyiségtesztet az inviter-ről. Az eredmények anonimizáltan jelennek meg, és minimum 2 observer szükséges az összehasonlítás megjelenítéséhez.

---

## 1. Invite létrehozás

**Route:** `POST /api/observer/invite`
**Fájl:** `src/app/api/observer/invite/route.ts`

**Input:**
- `email` (opcionális) — ha megadja, emailt küldünk
- `name` (1-100 karakter, opcionális)
- `observerType` — `INTERNAL` | `EXTERNAL` | `ANONYMOUS`
- `externalContext` (max 200 karakter, opcionális)

**Validációk:**
| Szabály | Hiba kód |
|---------|----------|
| User autentikált + van profil | 401 |
| Van testType (onboarding kész) | `NO_TEST_TYPE` |
| Nem saját email | `SELF_INVITE` |
| Nincs aktív meghívó erre az emailre | `DUPLICATE_INVITE_EMAIL` |
| Max 5 aktív meghívó | `INVITE_LIMIT_REACHED` |

**Token generálás:** Prisma `@default(cuid())` — egyedi, kriptográfiailag biztonságos

**Lejárat:** 30 nap (`expiresAt = now + 30d`)

**Email küldés:**
- Async (fire-and-forget, `after()` callback)
- Resend API (`sendObserverInviteEmail()`)
- Response tartalmazza: `emailSent: boolean`

**Output:**
```json
{ "id": "...", "token": "...", "expiresAt": "...", "emailSent": true }
```

---

## 2. Invite listázás

**Route:** `GET /api/observer/invite`

**Output:** Inviter összes meghívója (desc createdAt), max a `src/app/profile/results/page.tsx`-ben 10 db

---

## 3. Invite törlés

**Route:** `DELETE /api/observer/invite/[id]`
**Fájl:** `src/app/api/observer/invite/[id]/route.ts`

**Szabályok:**
- Csak az inviter törölheti (ownership check)
- `COMPLETED` státuszú NEM törölhető (400)
- `PENDING` / `CANCELED` → status = `CANCELED` (soft delete, adat megmarad)

---

## 4. Observer entry page

**Route:** `GET /observe/[token]`
**Fájl:** `src/app/observe/[token]/page.tsx`

**Server-side guard-ok (sorrend):**

```
Token lookup → nem találat → 404
     ↓
Status = COMPLETED → "Már kitöltötted" képernyő
     ↓
Status = CANCELED → "Meghívó nem aktív" képernyő
     ↓
expiresAt < now → "Meghívó lejárt" képernyő
     ↓
Status = PENDING → ObserverClient renderelés
```

**Draft recovery:** Ha van `ObserverDraft` a DB-ben, azt átadja a kliensnek `initialDraft`-ként.

**SEO:** `robots: { index: false, nocache: true }` — publikus, de nem indexelt

---

## 5. Observer kliens fázisok

**Komponens:** `src/app/observe/[token]/ObserverClient.tsx`

```
intro → assessment → confidence → done
```

| Fázis | Tartalom | Mentés |
|-------|----------|-------|
| **intro** | Kapcsolat típusa + ismertségi idő | Draft sync (DB + localStorage) |
| **assessment** | Kérdések (5/oldal), Likert 1-5 | Debounced draft sync (2s) + localStorage |
| **confidence** | Bizonyossági rating 1-5 (opcionális) | — |
| **done** | Siker képernyő + regisztráció CTA | — |

**Resume logika:** Ha draft létezik, az első megválaszolatlan oldalra ugrik.

**Checkpointok:** Toast értesítés 25%, 50%, 75%-nál.

---

## 6. Observer draft sync

**Route:** `POST /api/observer/draft` (mentés) | `DELETE /api/observer/draft` (törlés)
**Fájl:** `src/app/api/observer/draft/route.ts`

**POST input:**
- `token`, `phase`, `relationshipType`, `knownDuration`, `answers` (Record<string, number>), `currentPage`

**Szabályok:**
- Token alapú (nincs auth szükséges)
- Invitation PENDING kell legyen
- Upsert: létrehozás vagy frissítés

**DB modell:** `ObserverDraft` — `invitationId` unique constraint

---

## 7. Observer submit

**Route:** `POST /api/observer/submit`
**Fájl:** `src/app/api/observer/submit/route.ts`

**Validációk:**
| Szabály | Hiba kód |
|---------|----------|
| Token létezik | `INVALID_TOKEN` |
| Status ≠ COMPLETED | `ALREADY_USED` |
| Status ≠ CANCELED | `INVITE_CANCELED` |
| Nem lejárt | `INVITE_EXPIRED` |
| Minden kérdés megválaszolva | `MISSING_ANSWER` |
| Nincs duplikált válasz | `DUPLICATE_ANSWER` |
| Likert 1-5 | `INVALID_LIKERT_ANSWER` |

**Feldolgozás (egyetlen tranzakció):**
1. `calculateScores(testType, answers)` → scoring
2. `ObserverAssessment` létrehozás (scores, confidence, relationship)
3. `ObserverInvitation` status → `COMPLETED`, `completedAt` = now
4. `ObserverDraft` törlés

**Email trigger:** Ha 2+ observer COMPLETED → `sendObserverCompletionEmail()` az inviter-nek

---

## 8. State transition diagram

```
                    ┌─────────┐
                    │ PENDING │ ← invite létrehozás
                    └────┬────┘
                         │
              ┌──────────┼──────────┐
              ▼          │          ▼
        ┌──────────┐     │    ┌──────────┐
        │ CANCELED │     │    │ EXPIRED  │
        └──────────┘     │    └──────────┘
        (inviter töröl)  │    (30 nap lejárt)
                         │
                         ▼
                   ┌───────────┐
                   │ COMPLETED │ ← observer submit
                   └───────────┘
                   (nem törölhető)
```

---

## 9. Eredmény kapcsolat

**Aggregálás helye:** `src/app/profile/results/page.tsx`

```typescript
// Lekérdezés: inviter összes COMPLETED observer assessment-je
const completedObservers = await prisma.observerAssessment.findMany({
  where: { invitation: { inviterId: profile.id, status: "COMPLETED" } },
  select: { scores: true },
});

// Átlagolás dimenziónként (H, E, X, A, C, O)
// Minimum 2 observer kell az összehasonlításhoz
```

**Megjelenítés:**
- `ComparisonTab` — self vs observer radar/heatmap
- `ObserverComparison` komponens — observer count badge, confidence átlag
- Anonimizált: nincs egyéni observer adat, csak aggregált átlag

---

## 10. Dashboard integráció

**Route:** `GET /api/dashboard/status`

**Exposed metrikák:**
- `pendingInvites` — aktív, nem lejárt PENDING meghívók száma
- `completedObserver` — COMPLETED observer assessment-ek száma

**Használat:** Nav badge, dashboard stat kártyák, `DashboardAutoRefresh` polling

---

## 11. Email templates

| Email | Trigger | Tartalom |
|-------|---------|----------|
| **Invite email** | Meghívó létrehozás (ha van email) | Link + inviter név + anonimitás biztosítás |
| **Reminder email** | Admin kézi küldés | Invite email + "Emlékeztető:" prefix |
| **Completion email** | 2+ observer COMPLETED | Értesítés az inviter-nek |

**Locale detection:** `.hu` email domain → HU, egyébként EN

---

## Korlátok és szabályok

| Korlát | Érték |
|--------|-------|
| Max aktív meghívó / user | 5 |
| Meghívó lejárat | 30 nap |
| Kérdések / oldal | 5 |
| Min observer összehasonlításhoz | 2 |
| Confidence rating | 1-5 (opcionális) |
| Draft auto-save delay | 2 másodperc |
| Self-invite | ❌ Blokkolva |
| Duplikált email invite | ❌ Blokkolva |
| Completed invite törlés | ❌ Blokkolva |
| Duplikált answer submit-nál | ❌ Elutasítva |

---

## Fájl referencia

| Komponens | Fájl |
|-----------|------|
| Invite API (POST/GET) | `src/app/api/observer/invite/route.ts` |
| Invite DELETE | `src/app/api/observer/invite/[id]/route.ts` |
| Link validáció | `src/app/api/observer/link/route.ts` |
| Observer entry page | `src/app/observe/[token]/page.tsx` |
| Observer client | `src/app/observe/[token]/ObserverClient.tsx` |
| Draft sync API | `src/app/api/observer/draft/route.ts` |
| Submit API | `src/app/api/observer/submit/route.ts` |
| Dashboard status | `src/app/api/dashboard/status/route.ts` |
| Profile results (aggregálás) | `src/app/profile/results/page.tsx` |
| Comparison komponens | `src/components/dashboard/ObserverComparison.tsx` |
| Email templates | `src/lib/emails.ts` |
| Scoring engine | `src/lib/scoring.ts` |
| DB schema | `prisma/schema.prisma` |
