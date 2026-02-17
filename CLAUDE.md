# Trita - Project Context

## What is this project?
**Trita** is a research platform for a university thesis examining the comparative validity
and observer agreement of modern trait-based personality assessment models.

The primary focus is on **HEXACO-PI-R**, a **theory-consistent modified HEXACO** (reduced,
context-adapted item set), and **Big Five Aspect Scales (BFAS)**.

The app randomly assigns one test type per user (priority-balanced distribution favoring core
instruments), collects self-assessments and observer (peer) assessments, and provides comparative
results. Goal: ~50 completions per core test type, with observer validation.

Long-term vision (post-research): Translate empirically validated personality signals into
practical decision-support tools for career and team contexts.

---

## Tech Stack
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **Auth**: Clerk (custom sign-in/up flows with `useSignIn`/`useSignUp` hooks)
- **Database**: Neon PostgreSQL
- **ORM**: Prisma 6
- **Animations**: Framer Motion
- **Validation**: Zod
- **Package Manager**: pnpm

---

## Project Structure
```
codebase/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── sign-in/              # Custom sign-in (useSignIn)
│   │   │   │   ├── page.tsx
│   │   │   │   └── sso-callback/     # Google OAuth callback
│   │   │   └── sign-up/              # Custom sign-up (useSignUp)
│   │   │       ├── page.tsx
│   │   │       └── sso-callback/
│   │   ├── assessment/               # Dynamic assessment (testType-based)
│   │   │   ├── page.tsx              # Server: retake guard (redirect if results exist)
│   │   │   ├── AssessmentClient.tsx  # Client: localStorage draft + beforeunload warning
│   │   │   └── loading.tsx           # Skeleton loader
│   │   ├── dashboard/                # Results (real DB data) + observer comparison + invites
│   │   │   ├── page.tsx              # Server: generateMetadata, observer confidence
│   │   │   └── loading.tsx           # Skeleton loader
│   │   ├── observe/[token]/          # Public observer assessment (no auth)
│   │   │   ├── page.tsx              # Server: token validation, status checks
│   │   │   ├── ObserverClient.tsx    # Client: intro → assessment → confidence → done
│   │   │   └── loading.tsx           # Skeleton loader
│   │   ├── profile/                  # User profile management
│   │   ├── api/
│   │   │   ├── assessment/submit/    # Multi-test score calculation + save
│   │   │   ├── observer/
│   │   │   │   ├── invite/           # POST create / GET list invitations
│   │   │   │   ├── invite/[id]/      # DELETE single invitation (→ CANCELED)
│   │   │   │   └── submit/           # Save observer assessment (+ confidence)
│   │   │   ├── profile/delete/       # Anonymize + Clerk delete
│   │   │   └── webhooks/clerk/       # Clerk event sync
│   │   ├── layout.tsx                # Root layout + ClerkProvider + generateMetadata (i18n)
│   │   └── page.tsx                  # Landing page (research context)
│   ├── components/
│   │   ├── assessment/               # ProgressBar, QuestionCard, SliderSelector, ABSelector
│   │   ├── dashboard/
│   │   │   ├── RadarChart.tsx         # Generic radar chart (5-6 dimensions)
│   │   │   ├── InviteSection.tsx      # Observer invite management (create/copy/delete)
│   │   │   ├── ObserverComparison.tsx # Self vs observer comparison (with confidence avg)
│   │   │   └── RetakeButton.tsx       # Retake CTA with ConfirmModal
│   │   ├── landing/                  # HeroSection, FeatureCards, BottomCTA, DoodleIllustration
│   │   ├── illustrations/            # AssessmentDoodle, DashboardDoodle, ProfileDoodle
│   │   ├── LocaleProvider.tsx        # Client locale state + persistence
│   │   ├── LocaleSwitcher.tsx        # Header language switcher
│   │   ├── NavBar.tsx                # Localized main navigation (active link highlighting)
│   │   ├── TritaLogo.tsx
│   │   └── UserMenu.tsx
│   ├── lib/
│   │   ├── prisma.ts                 # Singleton Prisma client
│   │   ├── assignTestType.ts         # Priority-balanced test type assignment (core first)
│   │   ├── scoring.ts                # Scoring logic per test type
│   │   ├── i18n.ts                   # Translation dictionary + t/tf helpers
│   │   ├── i18n-server.ts            # Server locale resolver (cookie/header)
│   │   └── questions/
│   │       ├── types.ts              # Common question/test interfaces
│   │       ├── hexaco.ts             # Official HEXACO-PI-R questions (60)
│   │       ├── hexacoModified.ts     # Modified HEXACO questions (same 6 dims)
│   │       ├── big5.ts               # Big Five Aspect Scales (BFAS) questions
│   │       └── index.ts              # Question loader factory
│   └── middleware.ts                 # Clerk route protection (/observe/* is public)
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── .env                              # Environment variables (NEVER commit)
├── CLAUDE.md                         # This file
└── package.json
```

---

## Research Experiment Design

### Research Goal
Comparative analysis of modern trait-based personality models using self-report and
observer-report data, focusing on measurement reliability, self-observer convergence,
and practical applicability.

Key research question for HEXACO_MODIFIED: Can a reduced, context-adapted question bank
achieve comparable observer agreement to the official HEXACO-PI-R?

### Test Types

**Core instruments** (primary analysis, priority in random assignment):

| Code | Name | Format | Dimensions | Questions | Role |
|------|------|--------|------------|-----------|------|
| `HEXACO` | HEXACO-PI-R (official) | Likert 1-5 | H, E, X, A, C, O (6) | 60 | Reference standard |
| `HEXACO_MODIFIED` | HEXACO (modified, context-adapted) | Likert 1-5 | H, E, X, A, C, O (6) | TBD | Research innovation |
| `BIG_FIVE` | Big Five Aspect Scales (BFAS) | Likert 1-5 | O, C, E, A, N (5) | ~50 | Cross-model comparison |

Aspect-level Big Five measurement (BFAS) was chosen due to its higher predictive power for
work-related behavior compared to domain-level Big Five.

Ez a lista bővíthető — új teszttípus hozzáadásához: enum bővítés + kérdésfájl + scoring logika + TestConfig.

### User Flow
1. User arrives → landing page (research explanation + consent)
2. Signs up / signs in (Clerk)
3. Gets randomly assigned ONE test type (priority-balanced)
4. Completes the assigned assessment
5. Sees results on adaptive dashboard (radar chart)
6. Can invite 1+ observers (friends/colleagues) via unique link
7. Observer fills out the SAME test type about the inviter (public, no auth required)
8. Observer provides: relationship type + known duration + confidence rating
9. Observer can optionally register → gets own random test type (viral loop)
10. User sees anonymized observer comparison on dashboard

### Random Assignment
- **Balanced distribution**: all three core types (HEXACO, HEXACO_MODIFIED, BIG_FIVE) are filled evenly
- Logic: pick the type with the fewest participants; ties broken randomly
- Stored in `UserProfile.testType` + `testTypeAssignedAt`
- Once assigned, never changes
- Implementation: `assignTestType.ts` uses `TEST_TYPES` from `questions/index.ts`

### Observer Flow
- Public link: `/observe/{token}` (no auth required)
- Token-based, expires in 30 days
- Same test type as inviter
- Questions use observer wording (E/3) or instruction: "Gondolj arra a személyre, aki meghívott"
- **Confidence rating**: separate phase between last question and submission; observer rates certainty (1-5, optional)
  - DB field: `ObserverAssessment.confidence` (`Int?`)
  - Purpose: research quality filter — low-confidence responses can be excluded/weighted in SPSS analysis
- Anonymized for the user: can't see which observer gave which scores
- DB maintains full connections for research analysis
- After completion: observer can optionally register → gets own test type
- UI phases: intro (relationship + duration) → assessment (questions) → confidence → done
- Meghívók:
  - Max 5 aktív meghívó link felhasználónként
  - Meghívó törlése → státusz `CANCELED`, eredmények megmaradnak; COMPLETED nem törölhető
  - Email meghívás támogatott (Resend), a listában látszik a cím vagy „anonim”
  - Regisztráló observer összeköthető a meghívóval (`observerProfileId`)
  - Inaktív (lejárt/canceled) meghívó oldal információs státusszal tér vissza
  - Dashboard mutatja a beérkezett meghívókat; pendingre kattintva kitölthető
  - Link automatikus clipboard-copy nincs; másolás csak listából explicit gombbal
  - Self-invite prevention: API rejects if inviter's email matches observer email (case-insensitive)
  - Email send failure: API returns `emailSent: boolean` in response; client shows info toast if email failed
  - Duration values stored as locale-independent keys: `"LT_1"`, `"1_3"`, `"3_5"`, `"5P"`
  - `observeToken` param: preserved across sign-in ↔ sign-up links and Google SSO redirects

### API Error Handling
- API routes return short error codes (e.g., `"INVITE_LIMIT_REACHED"`, `"INVALID_TOKEN"`)
- Client localizes via `t(\`error.${code}\`, locale)` with fallback to generic error message
- Error codes in `i18n.ts`: `NO_TEST_TYPE`, `INVITE_LIMIT_REACHED`, `SELF_INVITE`, `INVALID_TOKEN`,
  `ALREADY_USED`, `INVITE_CANCELED`, `INVITE_EXPIRED`, `ANSWER_COUNT_MISMATCH`, `DUPLICATE_ANSWER`,
  `MISSING_ANSWER`, `INVALID_LIKERT_ANSWER`, `EMAIL_SEND_FAILED`

### Assessment UX
- **localStorage draft**: answers saved to `trita_draft_{testType}` on every change; restored on mount; cleared on successful submit
- **beforeunload warning**: browser warns if navigating away with unsaved answers
- **Retake guard**: if user already has results and visits `/assessment`, redirected to `/dashboard?retake=true`
  - Dashboard shows `ConfirmModal` → on confirm navigates to `/assessment?confirmed=true`
  - `RetakeButton` component handles both manual click and auto-open from redirect

### Dashboard Enhancements
- Observer comparison shows observer count in label: "Mások (X)" / "Others (X)"
- Average confidence displayed when available (from `ObserverAssessment.confidence`)
- `generateMetadata` on dashboard and assessment pages (locale-aware titles)
- Data loading is split into targeted parallel queries (`assessmentResult`, sent/received invites, observer aggregates)
- Observer confidence average is computed with DB-side aggregate (`observerAssessment.aggregate`) instead of client-side scanning

### Loading States
- Skeleton `loading.tsx` files for `/dashboard`, `/assessment`, `/observe/[token]` (Next.js Suspense boundaries)
- `ConfirmModal`: `confirmText` and `cancelText` are required props (no hardcoded defaults); `loadingText` optional prop for loading state

### NavBar
- Active link highlighting via `usePathname()` — active route gets `text-indigo-600`

### Email (Observer invites)
- `RESEND_API_KEY` (required)
- `RESEND_FROM_EMAIL` (optional)
- `NEXT_PUBLIC_APP_URL` (used to build invite links)

### Scoring
- **HEXACO / HEXACO_MODIFIED:** 6 dims, average per dimension → 0-100%, reverse scoring support
- **Big Five (BFAS):** 5 dims (O,C,E,A,N), same Likert logic

---

## Test Dimensions

### HEXACO (& HEXACO_MODIFIED)
| Code | Hungarian | English | Badge Color |
|------|-----------|---------|-------------|
| H | Őszinteség-Alázat | Honesty-Humility | `indigo-100/700` |
| E | Érzelmi stabilitás | Emotionality | `purple-100/700` |
| X | Extraverzió | eXtraversion | `blue-100/700` |
| A | Barátságosság | Agreeableness | `green-100/700` |
| C | Lelkiismeretesség | Conscientiousness | `orange-100/700` |
| O | Nyitottság | Openness | `pink-100/700` |

### Big Five Aspect Scales (BFAS)
| Code | Hungarian | English | Chart Color |
|------|-----------|---------|-------------|
| O | Nyitottság | Openness | `#0EA5E9` |
| C | Lelkiismeretesség | Conscientiousness | `#8B5CF6` |
| E | Extraverzió | Extraversion | `#F59E0B` |
| A | Barátságosság | Agreeableness | `#10B981` |
| N | Neuroticizmus | Neuroticism | `#F43F5E` |

---

## Localization (i18n)
- Supported locales: `hu`, `en`, `de`
- Default resolution: `trita_locale` cookie → `Accept-Language` header → fallback `hu`
- Locale switcher persistence: client state + `localStorage` + cookie + (signed-in) `UserProfile.locale`
- LocaleProvider sync order: SSR locale -> client `localStorage` -> signed-in DB locale (`/api/profile/locale`)
- Refreshes are deduplicated and wrapped in transition to reduce visible UI flicker during language switch
- Language switch triggers `router.refresh()`, so server-rendered pages update immediately
- Main UI surfaces (landing, auth, dashboard, profile, observer, invite flow, navigation) use `t()` / `tf()` keys
- Email templates support all locales (fallback to `hu`)
- Test questions are locale-ready; missing question translations fall back to Hungarian
- **Page metadata**: `generateMetadata()` in layout, dashboard, assessment (locale-aware `<title>`)
- **API errors**: error code pattern — API sends codes, client resolves `t(\`error.${code}\`, locale)`
- **No hardcoded Hungarian** in API responses, Modal defaults, or duration values
- Profile page: user can set preferred language (saved to DB, loaded on login)

### Image Strategy
- Critical hero/dashboard doodles use `next/image` for optimized loading (`DoodleIllustration`, dashboard header/sections)
- Decorative non-critical images can remain lazy-loaded where they are outside first viewport

## User Deletion Strategy
Soft delete / anonymization. When a user deletes their account:
1. DB: `clerkId`, `email`, `name` → `null`, `deleted` → `true`
2. Clerk: user fully deleted
3. `AssessmentResult` records are **preserved** and **unlinked** (`userProfileId` → `null`)

---

## Coding Conventions

### General
- Functional components only
- Default exports for pages, named exports for components
- All user-facing UI text must go through i18n keys (`t` / `tf`)
- Zod validation on every API route
- Mobile-first design always

### File Naming
- Components: `PascalCase.tsx`
- Utils/helpers: `camelCase.ts`
- Pages: `page.tsx` (Next.js convention)

### Imports Order
1. External libraries (`react`, `next`, `framer-motion`, `@clerk/nextjs`)
2. Internal aliases (`@/components`, `@/lib`)
3. Relative imports (`./local`)

---

## Design System

### Color Palette

**Brand (Primary)**
| Token | Tailwind | Usage |
|-------|----------|-------|
| Primary | `indigo-600` | Buttons, links, active states |
| Primary hover | `indigo-700` | Button hover |
| Primary light | `indigo-50` / `indigo-100` | Backgrounds, badges |
| Primary text | `indigo-500` | Labels, tags |
| Accent | `purple-500` / `purple-600` | Gradients, secondary accents |

**Neutral**
| Token | Tailwind | Usage |
|-------|----------|-------|
| Background | `white` | Page/card backgrounds |
| Surface | `gray-50` | Input bg, section bg, cards |
| Border | `gray-100` | All borders, dividers |
| Border dark | `gray-200` | Stronger borders, disabled bg |
| Text primary | `gray-900` | Headings, main content |
| Text body | `gray-600` | Paragraphs, descriptions |
| Text secondary | `gray-500` | Captions, metadata, labels |
| Text label | `gray-700` | Form labels, nav items |
| Disabled text | `gray-400` | Disabled button text |

**Semantic**
| Token | Tailwind | Usage |
|-------|----------|-------|
| Danger bg | `rose-50` | Error/delete section bg |
| Danger border | `rose-100` / `rose-200` | Error borders |
| Danger text | `rose-700` | Error messages, danger text |
| Danger heading | `rose-900` | Danger section headings |

### Gradients
```
Page bg (auth, assessment): bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50
CTA button:                  bg-gradient-to-r from-indigo-600 to-purple-600
Progress bar fill:           bg-gradient-to-r from-indigo-500 to-purple-500
Hero card:                   bg-gradient-to-br from-indigo-50 via-white to-purple-50
```

### Typography

**Font**: Geist Sans (primary), Geist Mono (code)

| Element | Classes |
|---------|---------|
| Page title | `text-3xl md:text-4xl font-bold text-gray-900` |
| Section heading | `text-2xl font-semibold text-gray-900` |
| Card heading | `text-lg font-semibold text-gray-900` |
| Body | `text-sm text-gray-600` |
| Label | `text-sm font-semibold text-gray-700` |
| Tag/badge | `text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500` |
| Caption | `text-xs text-gray-500` |

### Spacing

| Context | Value |
|---------|-------|
| Page max width | `max-w-5xl` (main), `max-w-3xl` (assessment), `max-w-md` (auth) |
| Card padding | `p-6 md:p-8` |
| Section gap | `gap-6` or `gap-8` |
| Form element gap | `gap-4` |
| Component inner gap | `gap-2` or `gap-3` |

### Border Radius
| Element | Class |
|---------|-------|
| Buttons, inputs | `rounded-lg` |
| Cards, sections | `rounded-xl` |
| Major containers | `rounded-2xl` |
| Hero containers | `rounded-3xl` |
| Badges, avatars | `rounded-full` |

### Interactive Elements

**Min touch target**: `min-h-[44px]` on every button, link, and input.

**Primary button**
```
min-h-[44px] rounded-lg bg-indigo-600 px-6 text-sm font-semibold text-white
transition hover:bg-indigo-700
disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400
```

**Secondary button (outline)**
```
min-h-[44px] rounded-lg border border-indigo-600 bg-transparent px-8
text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50
```

**Danger button**
```
min-h-[44px] rounded-lg border border-rose-200 bg-white px-5
text-sm font-semibold text-rose-700 transition hover:bg-rose-100
```

**Google OAuth button**
```
min-h-[44px] rounded-lg border border-gray-200 bg-white px-4
text-sm font-semibold text-gray-700 flex items-center justify-center gap-3
transition hover:bg-gray-50
```

**Text input**
```
min-h-[44px] rounded-lg border border-gray-100 bg-gray-50 px-3
text-sm font-normal text-gray-900
focus:border-indigo-300 focus:outline-none
```

**Form label**
```
flex flex-col gap-2 text-sm font-semibold text-gray-700
```

### Cards & Sections

**Standard card**: `rounded-xl border border-gray-100 bg-white p-6 md:p-8`
**Light section**: `rounded-xl border border-gray-100 bg-gray-50 p-4`
**Danger section**: `rounded-xl border border-rose-100 bg-rose-50 p-6`
**Error alert**: `rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700`

### Divider
```
<div className="my-5 flex items-center gap-3">
  <div className="h-px flex-1 bg-gray-100" />
  <span className="text-xs text-gray-400">vagy</span>
  <div className="h-px flex-1 bg-gray-100" />
</div>
```

### Animations (Framer Motion)

| Pattern | Values |
|---------|--------|
| Card enter | `initial={{ opacity: 0, x: 50 }}` → `animate={{ opacity: 1, x: 0 }}` duration `0.3s` |
| Card exit | `exit={{ opacity: 0, x: -50 }}` |
| Menu open | `initial={{ opacity: 0, y: -6, scale: 0.98 }}` → `animate={{ opacity: 1, y: 0, scale: 1 }}` duration `0.15s` |
| Button hover | `whileHover={{ scale: 1.02 }}` |
| Button tap | `whileTap={{ scale: 0.98 }}` |
| Progress bar | Animated width, duration `0.5s`, ease `easeOut` |

### Responsive
- **Breakpoint**: Only `md:` (768px) is used. Mobile-first always.
- **Pattern**: `base-mobile-class md:desktop-class`
- **Grid**: `grid-cols-1` → `md:grid-cols-2` or `md:grid-cols-3`

### Illustrations (Doodle Style)

**Stílus**: Kézzel rajzolt, minimalista doodle illusztrációk inline SVG-ként.

**Technikai jellemzők:**
- Stroke width: `4px`, `strokeLinecap="round"`, `strokeLinejoin="round"`
- Stroke szín: `#111827` (gray-900)
- Fill nélküli vonalrajz a karaktereknél, fehér fill a test/ruhánál
- ViewBox méret: `360x200` (belső oldalak), `360x280` (landing)
- Lekerekített sarkok: `rx="24"`
- Háttér: `#F8FAFC` (gray-50)

**Pasztel színpaletta (amorf háttér-formák):**
| Szín | Hex | Használat |
|------|-----|-----------|
| Lavender | `#E0E7FF` | Elsődleges dekoratív blob |
| Violet | `#EDE9FE` | Másodlagos blob |
| Lila | `#C7D2FE` | Kiegészítő blob |
| Menta | `#D1FAE5` | Zöld tónusú blob |
| Türkiz | `#CCFBF1` | Kiegészítő blob |
| Rózsaszín | `#FCE7F3` | Pink tónusú blob |
| Barack | `#FFEDD5` | Meleg tónusú blob |
| Napsárga | `#FEF3C7` | Sárga tónusú blob |
| Égkék | `#DBEAFE` | Kék tónusú blob |

**Amorf formák:**
- Komplex bezier görbékből álló organikus foltok
- Minden illusztráció 4-6 háttér blobbal rendelkezik
- Változatos méretben, az illusztráció szélein és mögötte
- Átfedhetik egymást, de a karakter mindig felül van

**Karakterek:**
- Kerek fej, egyszerű arc (ív-szemek, mosoly)
- Lekerekített test/ruha fehér fill-lel
- Rövid, egyszerű végtagok
- Minden oldalnak van legalább egy karaktere
- Arckifejezések pozitívak (mosoly, kíváncsiság)
- Opcionális kiegészítők: haj vonalak, csillagok, szívek, felkiáltójelek

**Dekoratív elemek:**
- Kis csillagok (3-4 vonalú, `stroke="#4F46E5"` vagy `"#10B981"`)
- Pontok és körök (`fill` a pasztel palettából)
- Hullámos/íves akcentus vonalak brand színekben
- Kis szívek, pipák, felkiáltójelek ahol tematikusan illik

**Elhelyezés:**
| Komponens | Fájl | Kontextus |
|-----------|------|-----------|
| AssessmentDoodle | `components/illustrations/` | Teszt kitöltés - karakter formmal |
| DashboardDoodle | `components/illustrations/` | Eredmények - karakter diagrammal |
| ProfileDoodle | `components/illustrations/` | Profil - karakter önarckép |
| DoodleIllustration | `components/landing/` | Landing - több karakter együtt |

---

## Important Rules
- NEVER modify or commit `.env` files
- NEVER push secrets to GitHub
- Every new feature → new branch (`feature/feature-name`)
- API routes → Zod validation required
- Mobile-first ALWAYS
- TypeScript strict mode
- Lokalizáció: HU/EN/DE
  - Default locale: `Accept-Language` → `trita_locale` cookie (middleware); user átállítható a fejlécben lévő Locale Switcherrel
  - Állapot: client state + `localStorage` + cookie + (bejelentkezve) `UserProfile.locale` sync GET/POST `/api/profile/locale`
  - Nyelvváltás után `router.refresh()` kötelező, hogy a server oldalak is azonnal frissüljenek
  - UI és e-mail szövegek i18n kulcsokkal; kérdésbankok locale-spec készülnek, HU a fallback
- 44px minimum touch targets on all interactive elements
- `gray-100` borders on all cards and sections
- `indigo-600` as primary action color

---

## Parked Features (post-research production)

A kutatási MVP-ből ideiglenesen kikerültek, de itt dokumentálva maradnak,
hogy a kutatás után könnyen visszahozhatók legyenek.

### LemonSqueezy fizetési integráció
- Checkout API: `/api/lemonsqueezy/checkout` — LemonSqueezy checkout session létrehozás
- Webhook: `/api/lemonsqueezy/webhook` — subscription lifecycle kezelés (created/updated/cancelled/expired)
- HMAC signature verification
- Resend email küldés order confirmation-re
- DB mezők: `UserProfile.lsCustomerId`, `lsSubscriptionId`, `plan`, `planExpiresAt`
- `AssessmentResult.premiumUnlocked`, `lsOrderId`

### Pro/Free plan rendszer
- `src/lib/plan.ts` — `getUserPlan()` helper
- `/api/profile/plan` — GET current plan status
- `/api/profile/plan/test` — DEV-only plan toggle
- Dashboard Pro badge + upgrade banner
- Pricing oldal: `/pricing` — Free vs Pro összehasonlítás
- Checkout success: `/checkout/success` — fizetés utáni visszajelzés

### Env változók (megőrizni .env-ben kommentként)
- `LEMONSQUEEZY_API_KEY`
- `LEMONSQUEEZY_STORE_ID`
- `LEMONSQUEEZY_WEBHOOK_SECRET`
- `RESEND_API_KEY`

### Visszaállítás lépései
1. Prisma séma: visszaadni `lsCustomerId`, `lsSubscriptionId`, `plan`, `planExpiresAt` mezőket
2. API route-ok visszamásolása
3. Dashboard Pro banner + Pricing page visszakapcsolása
4. Middleware-be `/checkout` route védelem
