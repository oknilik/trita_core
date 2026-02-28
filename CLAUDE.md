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
- **Email**: Resend
- **Webhooks**: Svix (Clerk webhook processing)
- **Analytics**: Vercel Analytics + Speed Insights
- **Package Manager**: pnpm

---

## Project Structure
```
codebase/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   ├── sign-in/              # Custom sign-in (useSignIn)
│   │   │   │   ├── page.tsx
│   │   │   │   └── sso-callback/     # Google OAuth callback
│   │   │   └── sign-up/              # Custom sign-up (useSignUp)
│   │   │       ├── page.tsx
│   │   │       └── sso-callback/
│   │   ├── assessment/               # Dynamic assessment (testType-based)
│   │   │   ├── page.tsx              # Server: retake guard (redirect if results exist)
│   │   │   ├── AssessmentClient.tsx  # Client: localStorage draft + beforeunload warning
│   │   │   └── loading.tsx
│   │   ├── dashboard/                # Results + observer comparison + invites
│   │   │   ├── page.tsx              # Server: generateMetadata, observer confidence
│   │   │   └── loading.tsx
│   │   ├── observe/[token]/          # Public observer assessment (no auth)
│   │   │   ├── page.tsx              # Server: token validation, status checks
│   │   │   ├── ObserverClient.tsx    # Client: intro → assessment → confidence → done
│   │   │   └── loading.tsx
│   │   ├── onboarding/               # Post-signup demographic onboarding
│   │   │   ├── page.tsx
│   │   │   ├── OnboardingClient.tsx
│   │   │   └── loading.tsx
│   │   ├── profile/                  # User profile management
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── loading.tsx
│   │   ├── admin/                    # Admin dashboard (research stats)
│   │   │   ├── page.tsx
│   │   │   └── _components/
│   │   │       ├── AdminStatCard.tsx
│   │   │       ├── AdminMetricsGrid.tsx
│   │   │       └── AdminTableSection.tsx
│   │   ├── privacy/page.tsx          # Privacy policy
│   │   ├── research/page.tsx         # Research info page
│   │   ├── api/
│   │   │   ├── assessment/
│   │   │   │   ├── submit/route.ts   # Multi-test score calculation + save
│   │   │   │   ├── draft/route.ts    # GET/POST server-side assessment draft
│   │   │   │   └── questions/route.ts # GET questions by test type
│   │   │   ├── observer/
│   │   │   │   ├── invite/route.ts       # POST create / GET list invitations
│   │   │   │   ├── invite/[id]/route.ts  # DELETE single invitation (→ CANCELED)
│   │   │   │   ├── draft/route.ts        # GET/POST observer draft state
│   │   │   │   ├── submit/route.ts       # Save observer assessment + confidence
│   │   │   │   └── link/route.ts         # GET observer link validation
│   │   │   ├── profile/
│   │   │   │   ├── delete/route.ts       # Anonymize + Clerk delete
│   │   │   │   ├── locale/route.ts       # GET/POST user locale preference
│   │   │   │   ├── status/route.ts       # GET user profile status
│   │   │   │   └── onboarding/route.ts   # POST onboarding demographic data
│   │   │   ├── dashboard/
│   │   │   │   └── status/route.ts       # GET dashboard data (results, invites, observer aggregates)
│   │   │   ├── feedback/
│   │   │   │   ├── route.ts              # POST satisfaction feedback
│   │   │   │   └── dimension/route.ts    # POST dimension-level accuracy feedback
│   │   │   ├── survey/route.ts           # POST research survey responses
│   │   │   ├── features/
│   │   │   │   └── interest/route.ts     # POST feature interest (fake door validation)
│   │   │   └── webhooks/clerk/route.ts   # Clerk event sync
│   │   ├── layout.tsx                # Root layout + ClerkProvider + generateMetadata (i18n)
│   │   ├── page.tsx                  # Landing page (research context)
│   │   ├── not-found.tsx             # 404 page
│   │   ├── icon.tsx                  # Favicon generator
│   │   ├── apple-icon.tsx            # Apple touch icon
│   │   ├── robots.ts                 # SEO robots.txt
│   │   └── sitemap.ts                # SEO sitemap
│   ├── components/
│   │   ├── assessment/
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── QuestionCard.tsx
│   │   │   ├── ScaleSelector.tsx     # Likert scale selector (1-5)
│   │   │   ├── SliderSelector.tsx
│   │   │   ├── ABSelector.tsx
│   │   │   └── EvaluatingScreen.tsx  # Loading/evaluating screen
│   │   ├── dashboard/
│   │   │   ├── RadarChart.tsx         # Generic radar chart (5-6 dimensions)
│   │   │   ├── DimensionCard.tsx      # Single dimension score card
│   │   │   ├── DimensionHighlights.tsx # Dimension insights/highlights
│   │   │   ├── ProfileInsights.tsx    # Profile result insights
│   │   │   ├── InviteSection.tsx      # Observer invite management (create/copy/delete)
│   │   │   ├── ObserverComparison.tsx # Self vs observer comparison (with confidence avg)
│   │   │   ├── RetakeButton.tsx       # Retake CTA with ConfirmModal
│   │   │   ├── DiscardDraftButton.tsx # Discard in-progress draft
│   │   │   ├── FeedbackForm.tsx       # Satisfaction + dimension feedback form
│   │   │   ├── ResearchSurvey.tsx     # Post-assessment research survey
│   │   │   ├── DashboardTabs.tsx      # Tab navigation for dashboard sections
│   │   │   ├── DashboardAutoRefresh.tsx # Polls for new observer results
│   │   │   ├── AnimatedBar.tsx        # Animated dimension bar
│   │   │   ├── JourneyProgress.tsx    # Research study progress tracker
│   │   │   ├── HashScroll.tsx         # Hash-based scroll behavior
│   │   │   └── UpcomingFeaturesCTA.tsx # Fake door feature validation CTA
│   │   ├── landing/
│   │   │   ├── HeroSection.tsx
│   │   │   ├── FeatureCards.tsx
│   │   │   ├── HowItWorks.tsx
│   │   │   ├── StatsSection.tsx
│   │   │   ├── BottomCTA.tsx
│   │   │   ├── DoodleIllustration.tsx
│   │   │   └── FadeIn.tsx
│   │   ├── illustrations/
│   │   │   ├── AssessmentDoodle.tsx
│   │   │   ├── DashboardDoodle.tsx
│   │   │   └── ProfileDoodle.tsx
│   │   ├── ui/
│   │   │   ├── Modal.tsx             # Reusable modal/dialog
│   │   │   ├── Picker.tsx            # Date/option picker
│   │   │   └── Toast.tsx             # Toast notification
│   │   ├── Footer.tsx
│   │   ├── LocaleProvider.tsx        # Client locale state + persistence
│   │   ├── LocaleSwitcher.tsx        # Header language switcher
│   │   ├── MobileDrawer.tsx          # Mobile navigation drawer
│   │   ├── NavBar.tsx                # Localized main navigation (active link highlighting)
│   │   ├── SkeletonLoader.tsx        # Shared skeleton loader component
│   │   ├── TritaLogo.tsx
│   │   └── UserMenu.tsx
│   ├── lib/
│   │   ├── prisma.ts                 # Singleton Prisma client
│   │   ├── auth.ts                   # Authentication helpers
│   │   ├── seo.ts                    # SEO metadata helpers
│   │   ├── assignTestType.ts         # Priority-balanced test type assignment (core first)
│   │   ├── scoring.ts                # Scoring logic per test type
│   │   ├── profile-engine.ts         # Profile result calculations
│   │   ├── profile-content.ts        # Dimension descriptions and insights content
│   │   ├── i18n.ts                   # Translation dictionary + t/tf helpers
│   │   ├── i18n-server.ts            # Server locale resolver (cookie/header)
│   │   ├── onboarding-options.ts     # Onboarding field definitions (gender, education, etc.)
│   │   ├── countries.ts              # Country list for selection
│   │   ├── design-tokens.ts          # Color palette and design tokens
│   │   ├── doodles.ts                # Doodle illustration mappings
│   │   ├── emails.ts                 # Email template helpers
│   │   ├── resend.ts                 # Resend email service wrapper
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
├── scripts/
│   └── seed-assessment.ts            # CLI: seed test data with optional observers
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
3. **Onboarding**: demographic data collection (birthYear, gender, education, occupation, country, etc.)
4. Gets randomly assigned ONE test type (priority-balanced)
5. Completes the assigned assessment
6. Sees results on adaptive dashboard (radar chart + dimension insights)
7. Fills out **satisfaction feedback** + **dimension accuracy feedback**
8. Fills out **research survey** (post-assessment)
9. Can invite 1+ observers (friends/colleagues) via unique link
10. Observer fills out the SAME test type about the inviter (public, no auth required)
11. Observer provides: relationship type + known duration + confidence rating
12. Observer can optionally register → gets own random test type (viral loop)
13. User sees anonymized observer comparison on dashboard

### Random Assignment
- **Balanced distribution**: all three core types (HEXACO, HEXACO_MODIFIED, BIG_FIVE) are filled evenly
- Logic: pick the type with the fewest participants; ties broken randomly
- Stored in `UserProfile.testType` + `testTypeAssignedAt`
- Once assigned, never changes
- Implementation: `assignTestType.ts` uses `TEST_TYPES` from `questions/index.ts`

### Onboarding
- Triggered after first sign-up, before test assignment
- Collects demographic data: birthYear, gender, education, occupation, occupationStatus, workSchedule, companySize, studyLevel, unemploymentDuration, country
- Stored on `UserProfile`; `onboardedAt` timestamp marks completion
- Field definitions centralized in `lib/onboarding-options.ts`
- API: `POST /api/profile/onboarding`

### Observer Flow
- Public link: `/observe/{token}` (no auth required)
- Token-based, expires in 30 days
- Same test type as inviter
- Questions use observer wording or instruction: "Gondolj arra a személyre, aki meghívott"
- **Confidence rating**: separate phase between last question and submission; observer rates certainty (1-5, optional)
  - DB field: `ObserverAssessment.confidence` (`Int?`)
  - Purpose: research quality filter — low-confidence responses can be excluded/weighted in SPSS analysis
- Anonymized for the user: can't see which observer gave which scores
- DB maintains full connections for research analysis
- After completion: observer can optionally register → gets own test type
- UI phases: intro (relationship + duration) → assessment (questions) → confidence → done
- **Server-side draft**: observer answers synced to `ObserverDraft` via `/api/observer/draft`
- Meghívók:
  - Max 5 aktív meghívó link felhasználónként
  - Meghívó törlése → státusz `CANCELED`, eredmények megmaradnak; COMPLETED nem törölhető
  - Email meghívás támogatott (Resend), a listában látszik a cím vagy „anonim"
  - Regisztráló observer összeköthető a meghívóval (`observerProfileId`)
  - Inaktív (lejárt/canceled) meghívó oldal információs státusszal tér vissza
  - Dashboard mutatja a beérkezett meghívókat; pendingre kattintva kitölthető
  - Link automatikus clipboard-copy nincs; másolás csak listából explicit gombbal
  - Self-invite prevention: API rejects if inviter's email matches observer email (case-insensitive)
  - Email send failure: API returns `emailSent: boolean` in response; client shows info toast if email failed
  - Duration values stored as locale-independent keys: `"LT_1"`, `"1_3"`, `"3_5"`, `"5P"`
  - `observeToken` param: preserved across sign-in ↔ sign-up links and Google SSO redirects

### Feedback System
- **Satisfaction feedback** (`SatisfactionFeedback`):
  - `agreementScore` (1-5): overall accuracy rating
  - `observerFeedbackUsefulness` (1-5): how useful observer comparison was
  - `siteUsefulness` (1-5): overall site usefulness
  - `freeformFeedback`: optional text
  - `interestedInUpdates`: boolean (email opt-in for future results)
  - API: `POST /api/feedback`
- **Dimension feedback** (`DimensionFeedback`):
  - Per-dimension accuracy rating (1-5) + optional comment
  - Unique per (assessmentResultId, dimensionCode)
  - API: `POST /api/feedback/dimension`
- Both collected via `FeedbackForm` component on dashboard

### Research Survey
- Post-assessment survey for research depth (`ResearchSurvey` model)
- Fields: selfAccuracy, priorTest, positionLevel, studyField, industry, motivation, sharingIntent, feedbackSources, has360Process, personalityImportance, observerUsefulness
- Collected via `ResearchSurvey` component on dashboard
- API: `POST /api/survey`

### Fake Door Feature Validation
- `UpcomingFeaturesCTA` component shows upcoming features (team analysis, communication insights, 360° feedback)
- Clicking → records interest in `FeatureInterest` table
- Feature keys: `"team"`, `"comm"`, `"360"`
- Unique per (userProfileId, featureKey) — one vote per feature per user
- API: `POST /api/features/interest`

### Admin Dashboard
- Route: `/admin` — research statistics and overview
- Components: `AdminStatCard`, `AdminMetricsGrid`, `AdminTableSection`
- Shows aggregate data for research monitoring

### API Error Handling
- API routes return short error codes (e.g., `"INVITE_LIMIT_REACHED"`, `"INVALID_TOKEN"`)
- Client localizes via `t(\`error.${code}\`, locale)` with fallback to generic error message
- Error codes in `i18n.ts`: `NO_TEST_TYPE`, `INVITE_LIMIT_REACHED`, `SELF_INVITE`, `INVALID_TOKEN`,
  `ALREADY_USED`, `INVITE_CANCELED`, `INVITE_EXPIRED`, `ANSWER_COUNT_MISMATCH`, `DUPLICATE_ANSWER`,
  `MISSING_ANSWER`, `INVALID_LIKERT_ANSWER`, `EMAIL_SEND_FAILED`

### Assessment UX
- **Server-side draft sync**: answers saved to `AssessmentDraft` (DB) via `/api/assessment/draft`; also mirrored to `trita_draft_{testType}` localStorage
- **beforeunload warning**: browser warns if navigating away with unsaved answers
- **Retake guard**: if user already has results and visits `/assessment`, redirected to `/dashboard?retake=true`
  - Dashboard shows `ConfirmModal` → on confirm navigates to `/assessment?confirmed=true`
  - `RetakeButton` component handles both manual click and auto-open from redirect
- **EvaluatingScreen**: shown during scoring/submission

### Dashboard Enhancements
- Observer comparison shows observer count in label: "Mások (X)" / "Others (X)"
- Average confidence displayed when available (from `ObserverAssessment.confidence`)
- `generateMetadata` on dashboard and assessment pages (locale-aware titles)
- Data loading is split into targeted parallel queries (`assessmentResult`, sent/received invites, observer aggregates)
- Observer confidence average is computed with DB-side aggregate (`observerAssessment.aggregate`) instead of client-side scanning
- `DashboardAutoRefresh`: polls for new observer results automatically
- `JourneyProgress`: shows user's progress through the research study steps
- `DashboardTabs`: tab-based navigation between results, observer, and research survey sections
- `DimensionHighlights` + `ProfileInsights`: narrative insights per dimension from `profile-content.ts`

### Loading States
- Skeleton `loading.tsx` files for `/dashboard`, `/assessment`, `/observe/[token]`, `/onboarding`, `/profile` (Next.js Suspense boundaries)
- Shared `SkeletonLoader` component for reuse
- `ConfirmModal`: `confirmText` and `cancelText` are required props (no hardcoded defaults); `loadingText` optional prop for loading state

### NavBar & Layout
- Active link highlighting via `usePathname()` — active route gets `text-indigo-600`
- `MobileDrawer`: slide-in mobile navigation drawer
- `Footer` component on all pages

### SEO
- `robots.ts`: programmatic robots.txt generation
- `sitemap.ts`: programmatic sitemap generation
- `lib/seo.ts`: shared metadata helper functions
- `generateMetadata()` on all major pages (locale-aware `<title>`)
- `icon.tsx` / `apple-icon.tsx`: programmatic favicon generation

### Email (Observer invites)
- `RESEND_API_KEY` (required)
- `RESEND_FROM_EMAIL` (optional)
- `NEXT_PUBLIC_APP_URL` (used to build invite links)
- Templates in `lib/emails.ts`, Resend client in `lib/resend.ts`

### Scoring
- **HEXACO / HEXACO_MODIFIED:** 6 dims, average per dimension → 0-100%, reverse scoring support
- **Big Five (BFAS):** 5 dims (O,C,E,A,N), same Likert logic
- Profile insights generated by `profile-engine.ts` using content from `profile-content.ts`

### Seed Script
```bash
pnpm seed:assessment --email user@example.com --type HEXACO --observers 3 --clean
```
- `--email`: required user email
- `--type`: HEXACO | HEXACO_MODIFIED | BIG_FIVE (default: HEXACO)
- `--observers`: number of observer assessments (default: 0)
- `--clean`: delete existing assessments before seeding

---

## Database Schema

### Enums
- `TestType`: HEXACO, HEXACO_MODIFIED, BIG_FIVE
- `RelationshipType`: FRIEND, COLLEAGUE, FAMILY, PARTNER, OTHER
- `InvitationStatus`: PENDING, COMPLETED, EXPIRED, CANCELED

### Models

**UserProfile**
- Core: id, clerkId, email, username, deleted, locale
- Demographics (from onboarding): birthYear, gender, education, occupation, occupationStatus, workSchedule, companySize, studyLevel, unemploymentDuration, country, onboardedAt
- Research: testType, testTypeAssignedAt, consentedAt
- Relations: assessmentResults, assessmentDraft, sentInvitations, receivedInvitations, satisfactionFeedback, researchSurvey, featureInterests

**AssessmentDraft** — in-progress self-assessment (server-synced)
- id, userProfileId, testType, answers (JSON), currentPage, timestamps

**AssessmentResult** — completed self-assessment
- id, userProfileId, scores (JSON), testType, isSelfAssessment, timestamp
- Relations: dimensionFeedback

**ObserverInvitation** — peer assessment invite
- id, token, inviterId, observerProfileId, observerEmail, observerName, testType, status, expiresAt, completedAt

**ObserverDraft** — in-progress observer assessment (server-synced)
- id, invitationId, phase, relationshipType, knownDuration, answers (JSON), currentPage, timestamps

**ObserverAssessment** — completed observer assessment
- id, invitationId, relationshipType, knownDuration, scores (JSON), confidence (1-5 optional), timestamp

**ResearchSurvey** — post-assessment research survey
- id, userProfileId, selfAccuracy, priorTest, positionLevel, studyField, industry, motivation, sharingIntent, feedbackSources, has360Process, personalityImportance, observerUsefulness

**SatisfactionFeedback** — satisfaction/usefulness feedback
- id, userProfileId, agreementScore, observerFeedbackUsefulness, siteUsefulness, freeformFeedback, interestedInUpdates, timestamp

**DimensionFeedback** — dimension-level accuracy ratings
- id, assessmentResultId, dimensionCode, accuracyRating (1-5), comment, timestamps
- Unique: (assessmentResultId, dimensionCode)

**FeatureInterest** — fake door validation
- id, userProfileId, featureKey ("team", "comm", "360"), timestamp
- Unique: (userProfileId, featureKey)

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
