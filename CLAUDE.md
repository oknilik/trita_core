# Trita - Project Context

## What is this project?
**Trita** is a 3-layer behavioral intelligence platform with dual academic + product purpose.

**Layer 1 — Research (KÉSZ / production)**: University thesis platform. Comparative validity of
HEXACO-PI-R, modified HEXACO, and BFAS. Randomly assigns one test per user (priority-balanced),
collects self + observer assessments, generates comparative results. Goal: ~50 completions per
core test type with observer validation.

**Layer 2 — B2B/Org (IN PROGRESS — `PHASE_2_redesign` branch)**: Multi-tenant organization
management, 360° campaign orchestration, team analytics, and Stripe-gated subscription billing.
Organizations can invite members, run structured 360° feedback campaigns, and view team heatmaps.

**Layer 3 — Coach/Career (EJTVE)**: Not being built. Insufficient value/complexity tradeoff.

**Active branch**: `PHASE_2_redesign` — 76+ files, 9400+ lines, significantly diverged from `main`.
All new B2B features live here. Design system also upgraded to Design B in this branch.

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
│   │   ├── admin/                    # Admin dashboard (research stats, Design B)
│   │   │   ├── page.tsx
│   │   │   └── _components/
│   │   │       ├── AdminStatCard.tsx
│   │   │       ├── AdminMetricsGrid.tsx
│   │   │       ├── AdminTabNav.tsx
│   │   │       └── AdminTableSection.tsx
│   │   ├── org/[id]/                 # Org dashboard (Design B)
│   │   │   ├── page.tsx              # Org overview + campaign list
│   │   │   └── campaigns/
│   │   │       ├── page.tsx          # Campaigns index (redirect)
│   │   │       └── [campaignId]/
│   │   │           └── page.tsx      # Campaign detail + participants
│   │   ├── billing/                  # Stripe billing (Design B)
│   │   │   ├── page.tsx              # Billing overview
│   │   │   └── upgrade/page.tsx      # Upgrade / paywall gate
│   │   ├── apply/[token]/page.tsx    # Org invite acceptance
│   │   ├── team/[id]/page.tsx        # Team analytics / heatmap
│   │   ├── blog/                     # Blog (static content)
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
│   │   │   ├── org/[id]/
│   │   │   │   ├── route.ts              # GET org data, POST create campaign
│   │   │   │   ├── campaigns/route.ts    # GET campaigns list
│   │   │   │   └── campaigns/[campaignId]/route.ts  # POST add participants, PATCH status
│   │   │   ├── billing/
│   │   │   │   ├── checkout/route.ts     # POST create Stripe checkout session
│   │   │   │   └── portal/route.ts       # POST create Stripe billing portal session
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
│   │   ├── org/
│   │   │   ├── CampaignList.tsx      # Campaign list with inline AddMembersPanel
│   │   │   ├── CampaignStatusButton.tsx  # Status transition button (DRAFT→ACTIVE→CLOSED)
│   │   │   └── AddParticipantButton.tsx  # Checkbox member picker for campaign participants
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
│   │   ├── auth.ts                   # Authentication helpers (requireOrgContext, hasOrgRole)
│   │   ├── subscription.ts           # getOrgSubscription, hasAccess, trialDaysLeft
│   │   ├── require-active-subscription.ts  # Server guard: redirect to /billing/upgrade if no active sub
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
│   ├── seed-assessment.ts            # CLI: seed test data with optional observers
│   └── seed-org-team.ts              # CLI: seed org + members + tests + observers + campaign + subscription
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

### B2B/Org Layer

#### Organization Management
- Route: `/org/[id]` — org overview, member list, active campaign banner, campaign list
- `requireOrgContext(orgId)` — server-side auth guard: validates membership + returns `{ profileId, role, org }`
- `hasOrgRole(role, minRole)` — hierarchical check: ORG_ADMIN > ORG_MANAGER > ORG_MEMBER
- Members: `OrganizationMember.@@unique([userId])` — one user in one org at a time
- Org invite flow: `OrganizationPendingInvite` → `/apply/[token]`

#### Subscription / Billing
- Stripe-based billing, one `Subscription` record per org
- `requireActiveSubscription()` — server guard used on all org-gated pages; redirects to `/billing/upgrade`
- `hasAccess(sub)`: active OR (trialing AND trialEndsAt > now)
- Billing portal: `/billing` — manage, upgrade, cancel
- Seed script auto-creates `active` subscription (1-year `currentPeriodEnd`)

#### 360° Campaigns
- Status flow: DRAFT → ACTIVE → CLOSED (closing is permanent, no undo)
- `CampaignList` — inline add-member panel (`AddMembersPanel`), optimistic count update, `router.refresh()`
- `CampaignStatusButton` — manager-only status transition with confirmation for CLOSED
- `AddParticipantButton` — checkbox picker for available org members not yet in campaign
- Active campaign banner on org page: emerald, anchor-scrolls to `#campaigns`
- Campaign detail: `/org/[id]/campaigns/[campaignId]` — participants list + add participants + status transition
- Only managers (`hasOrgRole(role, "ORG_MANAGER")`) can add participants or change status
- API: `POST /api/org/[id]/campaigns/[campaignId]` — add participants (`{ userIds }`)
- API: `PATCH /api/org/[id]/campaigns/[campaignId]` — status transition (`{ status }`)

#### Teams
- `Team` + `TeamMember` models for sub-org groupings
- Team analytics route: `/team/[id]` — heatmap, insights
- `TeamHeatmap`, `TeamInsights` components

#### Seed Script (org)
```bash
pnpm seed:org-team --email user@example.com --members 6 --clean
```
- Creates org, active subscription, N fake members with full profiles
- Seeds completed HEXACO assessments for all members
- Seeds observer invitations (2 per member, COMPLETED)
- Seeds 360° campaign (ACTIVE, all members as participants)
- `--clean`: removes existing org/data for that email before re-seeding

### Fake Door Feature Validation
- `UpcomingFeaturesCTA` component shows upcoming features (team analysis, communication insights, 360° feedback)
- Clicking → records interest in `FeatureInterest` table
- Feature keys: `"team"`, `"comm"`, `"360"`
- Unique per (userProfileId, featureKey) — one vote per feature per user
- API: `POST /api/features/interest`

### Admin Dashboard
- Route: `/admin` — research statistics and monitoring
- **Design**: Design B (trita B tokens — see Design System section)
- **Tab navigation**: `AdminTabNav` — 3 tabs: Áttekintés / Kutatás / Emlékeztetők
  - Active tab: `text-[#c8410a]` underline; inactive: `text-[#a09a90]`
- **Components**:
  - `AdminStatCard` — stat card with `borderTopColor: "#c8410a"` accent; no `color` prop
  - `AdminMetricsGrid` — grid of `AdminStatCard` components
  - `AdminTableSection` — tabular data display
- Page eyebrow: `font-mono text-xs uppercase tracking-widest text-[#c8410a]` — `// admin`
- Page heading: `font-playfair text-3xl text-[#1a1814]`

### API Error Handling
- API routes return short error codes (e.g., `"INVITE_LIMIT_REACHED"`, `"INVALID_TOKEN"`)
- Client localizes via `t(\`error.${code}\`, locale)` with fallback to generic error message
- Error codes in `i18n.ts`: `NO_TEST_TYPE`, `INVITE_LIMIT_REACHED`, `SELF_INVITE`, `INVALID_TOKEN`,
  `ALREADY_USED`, `INVITE_CANCELED`, `INVITE_EXPIRED`, `ANSWER_COUNT_MISMATCH`, `DUPLICATE_ANSWER`,
  `MISSING_ANSWER`, `INVALID_LIKERT_ANSWER`, `EMAIL_SEND_FAILED`, `FORBIDDEN`, `INVALID_INPUT`
- B2B/Org API routes return `{ error: "FORBIDDEN" }` (403) for role/access violations
- `INVALID_INPUT` used for Zod parse failures on org/campaign routes

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
- `OrgRole`: ORG_ADMIN, ORG_MANAGER, ORG_MEMBER (hierarchical — ORG_ADMIN > ORG_MANAGER > ORG_MEMBER)
- `OrgStatus`: ACTIVE, SUSPENDED
- `SubscriptionStatus`: trialing, active, past_due, canceled, unpaid, none
- `CampaignStatus`: DRAFT, ACTIVE, CLOSED (irreversible flow — no going back)

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

**Organization** — multi-tenant org unit
- id, name, slug (unique), status (OrgStatus), createdAt
- Relations: members, pendingInvites, subscription, campaigns, teams

**OrganizationMember** — org membership
- id, orgId, userId, role (OrgRole), joinedAt
- `@@unique([userId])` — one user can only be in ONE org at a time
- Auth helpers: `requireOrgContext(orgId)` → `{ profileId, role, org }`, `hasOrgRole(role, minRole)`

**OrganizationPendingInvite** — email-based invite to join org
- id, orgId, email, role, token (unique), expiresAt, createdAt

**Team** — sub-unit within an org (for team analytics/heatmap)
- id, orgId, name, createdAt

**TeamMember** — user in a team
- id, teamId, userId, joinedAt
- `@@unique([teamId, userId])`

**Subscription** — Stripe billing record per org
- id, orgId (unique), stripeCustomerId, stripeSubscriptionId, stripePriceId
- status (SubscriptionStatus), trialEndsAt, currentPeriodEnd, cancelAtPeriodEnd
- Access guard: `requireActiveSubscription()` → redirects to `/billing/upgrade` if no active/trial sub
- `hasAccess(sub)`: returns true if `status === "active"` OR (`status === "trialing"` AND `trialEndsAt > now`)

**Campaign** — 360° feedback campaign within an org
- id, orgId, creatorId, name, description, status (CampaignStatus), createdAt, closedAt
- Status flow: DRAFT → ACTIVE → CLOSED (closing is permanent)

**CampaignParticipant** — user added to a campaign
- id, campaignId, userId, addedAt
- `@@unique([campaignId, userId])`

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

Two design systems coexist. **Design A** is legacy (research/self layer). **Design B** is active
for all new pages (B2B/org layer, admin). When editing any org/admin/billing/campaign page,
always use Design B tokens.

---

### Design A — Legacy (research/self layer)

Used in: assessment, dashboard, observe, onboarding, profile, landing, auth.

**Color tokens (Tailwind)**
| Role | Token |
|------|-------|
| Primary | `indigo-600` / hover `indigo-700` |
| Primary light | `indigo-50` / `indigo-100` |
| Background | `white` / `gray-50` |
| Border | `gray-100` / `gray-200` |
| Text primary | `gray-900` |
| Text body | `gray-600` |
| Text secondary | `gray-500` |
| Danger | `rose-50/100/700/900` |

**Gradients**
```
Page bg:       bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50
CTA button:    bg-gradient-to-r from-indigo-600 to-purple-600
Progress:      bg-gradient-to-r from-indigo-500 to-purple-500
```

**Typography**: Geist Sans (primary), Geist Mono (code)

**Standard card**: `rounded-xl border border-gray-100 bg-white p-6 md:p-8`

---

### Design B — Active (B2B/org layer + admin)

Used in: `/org/`, `/admin/`, `/billing/`, `/apply/`, `/team/`, campaign pages.
**Never mix Design A Tailwind color classes into Design B pages.**

**Color tokens (hex — always hardcoded, not Tailwind color names)**
| Role | Value | Usage |
|------|-------|-------|
| Page background | `#faf9f6` | `bg-[#faf9f6]` on `min-h-dvh` |
| Card/surface | `white` | Card backgrounds |
| Border | `#e8e4dc` | All borders, dividers |
| Text primary | `#1a1814` | Headings, strong text |
| Text body | `#3d3a35` | Paragraphs, labels |
| Text muted | `#5a5650` | Subtitles, secondary |
| Text faint | `#a09a90` | Captions, placeholders |
| Accent (brand) | `#c8410a` | CTAs, eyebrows, active states |
| Accent hover | `#b53a09` | Button hover |
| Accent light | `#c8410a/10` or `#fff5f0` | Badge bg |

**Typography**
| Element | Classes |
|---------|---------|
| Page eyebrow | `font-mono text-xs uppercase tracking-widest text-[#c8410a]` — format: `// szekció neve` |
| Page title | `font-playfair text-3xl text-[#1a1814] md:text-4xl` |
| Section heading | `font-playfair text-xl text-[#1a1814]` |
| Card heading | `text-sm font-semibold text-[#1a1814]` |
| Body | `text-sm text-[#3d3a35]` |
| Muted/subtitle | `text-sm text-[#5a5650]` |
| Caption | `text-xs text-[#3d3a35]/50` |
| Faint label | `font-mono text-xs uppercase tracking-widest text-[#a09a90]` |

**Font**: `font-playfair` (headings), Geist Sans (body), Geist Mono (eyebrows/labels)
**Page wrapper**: `min-h-dvh bg-[#faf9f6]` (NOT `min-h-screen`)

**Cards & Sections**
```
Standard card:   rounded-2xl border border-[#e8e4dc] bg-white p-6 shadow-sm md:p-8
Light section:   rounded-xl border border-[#e8e4dc] bg-[#faf9f6] p-4
Error alert:     rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700
```

**Buttons**
```
Primary:   min-h-[44px] rounded-lg bg-[#c8410a] px-5 text-sm font-semibold text-white
           transition hover:bg-[#b53a09] disabled:cursor-not-allowed disabled:opacity-50
Secondary: min-h-[44px] rounded-lg border border-[#e8e4dc] bg-white px-5
           text-sm font-semibold text-[#3d3a35] transition hover:border-[#c8410a]/40 hover:text-[#c8410a]
Danger:    min-h-[44px] rounded-lg border border-rose-200 bg-white px-5
           text-sm font-semibold text-rose-700 transition hover:bg-rose-50
```

**Status badges**
```
Active (ACTIVE):  bg-emerald-50 text-emerald-700
Closed (CLOSED):  bg-[#e8e4dc] text-[#3d3a35]
Draft (DRAFT):    bg-amber-50 text-amber-700
Badge shape:      rounded-full px-2.5 py-0.5 text-xs font-semibold
```

**Back link pattern**
```tsx
<Link href="..." className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#3d3a35] transition-colors hover:text-[#c8410a]">
  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 3L5 8l5 5" />
  </svg>
  Vissza / Back to ...
</Link>
```

**Page structure template (Design B)**
```tsx
<div className="min-h-dvh bg-[#faf9f6]">
  <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 md:gap-12">
    {/* Header */}
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a]">// szekció</p>
      <h1 className="mt-1 font-playfair text-3xl text-[#1a1814] md:text-4xl">Cím</h1>
      <p className="mt-2 text-sm text-[#5a5650]">Alcím</p>
    </div>
    {/* Cards */}
    <section className="rounded-2xl border border-[#e8e4dc] bg-white p-6 shadow-sm md:p-8">
      <p className="mb-1 font-mono text-xs uppercase tracking-widest text-[#c8410a]">// szekció</p>
      <h2 className="mb-5 font-playfair text-xl text-[#1a1814]">...</h2>
    </section>
  </main>
</div>
```

---

### Shared (both systems)

**Spacing**
| Context | Value |
|---------|-------|
| Page max width | `max-w-5xl` (main), `max-w-3xl` (assessment), `max-w-md` (auth) |
| Card padding | `p-6 md:p-8` |
| Section gap | `gap-6` or `gap-8` |

**Border Radius**
| Element | Class |
|---------|-------|
| Buttons, inputs | `rounded-lg` |
| Cards (A) | `rounded-xl` |
| Cards (B) | `rounded-2xl` |
| Badges | `rounded-full` |

**Min touch target**: `min-h-[44px]` on every button, link, and input — BOTH systems.

**Responsive**: Only `md:` breakpoint. Mobile-first always. Grid: `grid-cols-1` → `md:grid-cols-2/3`.

**Animations (Framer Motion — Design A only)**
| Pattern | Values |
|---------|--------|
| Card enter | `initial={{ opacity: 0, x: 50 }}` → `animate={{ opacity: 1, x: 0 }}` 0.3s |
| Card exit | `exit={{ opacity: 0, x: -50 }}` |
| Button hover | `whileHover={{ scale: 1.02 }}` |
| Button tap | `whileTap={{ scale: 0.98 }}` |

### Illustrations (Doodle Style — Design A)

**Stílus**: Kézzel rajzolt, minimalista doodle illusztrációk inline SVG-ként.
- Stroke width: `4px`, `strokeLinecap="round"`, `strokeLinejoin="round"`, stroke: `#111827`
- ViewBox: `360x200` (inner pages), `360x280` (landing); háttér: `#F8FAFC`
- Pasztel blob palette: `#E0E7FF`, `#EDE9FE`, `#C7D2FE`, `#D1FAE5`, `#CCFBF1`, `#FCE7F3`, `#FFEDD5`, `#FEF3C7`, `#DBEAFE`

| Komponens | Fájl | Kontextus |
|-----------|------|-----------|
| AssessmentDoodle | `components/illustrations/` | Teszt kitöltés |
| DashboardDoodle | `components/illustrations/` | Eredmények |
| ProfileDoodle | `components/illustrations/` | Profil |
| DoodleIllustration | `components/landing/` | Landing |

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
- 44px minimum touch targets on all interactive elements (`min-h-[44px]`)
- After ALL mutations (API POST/PATCH/DELETE): call `router.refresh()` — no full page reload

### Design B Rules (org/admin/billing pages)
- ALWAYS use `min-h-dvh` (not `min-h-screen`) for page wrappers
- NEVER use Tailwind color names (`gray-`, `indigo-`, `purple-`) on Design B pages — always hex tokens
- Page eyebrow: `font-mono text-xs uppercase tracking-widest text-[#c8410a]` with `// szekció neve` format
- Headings: `font-playfair` — never `font-bold` for h1/h2 on Design B pages
- Cards: `rounded-2xl border border-[#e8e4dc] bg-white p-6 shadow-sm md:p-8`
- Primary action: `bg-[#c8410a]` hover `bg-[#b53a09]`
- Border color: `#e8e4dc` everywhere (not gray-100/200)
- Status badges: emerald=ACTIVE, amber=DRAFT, `#e8e4dc`/`#3d3a35`=CLOSED

### Org-specific Patterns
- `requireOrgContext(orgId)` — always the first auth call on org pages
- `requireActiveSubscription()` — always after `requireOrgContext` on gated pages
- `hasOrgRole(role, "ORG_MANAGER")` — gates all write actions (add participants, status transitions)
- Campaign status transitions are irreversible: never offer a "back" button from CLOSED
- `OrganizationMember.@@unique([userId])` — a user can only be in ONE org; code must respect this
- Org API error responses: `{ error: "FORBIDDEN" }` for role violations, `{ error: "INVALID_INPUT" }` for bad payloads

---

## Parked Features (post-research production)

A kutatási MVP-ből ideiglenesen kikerültek, de itt dokumentálva maradnak,
hogy a kutatás után könnyen visszahozhatók legyenek.

### Stripe individual plan (self-layer)
- Az org-szintű Stripe integráció aktív (B2B layer). Az egyéni/self-layer fizetési rendszer parkolóban.
- Tervezett: Free/Pro plan per user, `UserProfile.stripeCustomerId`, `plan`, `planExpiresAt`
- Pricing page: `/pricing` — Free vs Pro összehasonlítás
- Checkout success: `/checkout/success`
- Webhook: `/api/stripe/webhook` — subscription lifecycle

### Pro/Free plan rendszer (individual)
- `src/lib/plan.ts` — `getUserPlan()` helper (parkolóban)
- Dashboard Pro badge + upgrade banner
- `AssessmentResult.premiumUnlocked`

### Candidate hiring layer
- `CandidateInvite` + `CandidateResult` modellek a sémában megvannak
- `/apply/[token]` kandidáns meghívó flow
- `/share/[token]` eredmény megosztás
- Parkolóban: nem elég értékes az aktuális fókuszhoz

### Env változók (megőrizni .env-ben kommentként)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID`
- `RESEND_API_KEY`

### Visszaállítás lépései (individual plan)
1. Prisma séma: `stripeCustomerId`, `plan`, `planExpiresAt` a `UserProfile`-ra
2. API route-ok: `/api/stripe/checkout`, `/api/stripe/webhook`
3. `lib/plan.ts` visszakapcsolása
4. Dashboard Pro badge + Pricing page
5. Middleware: `/checkout` route védelem
