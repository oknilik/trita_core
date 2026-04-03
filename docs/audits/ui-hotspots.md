# UI Hotspot Inventory (Migration Priority)

## Cél

Ez a dokumentum a UI unification migráció induló hotspot-listája, kategorizálva és prioritással rendezve.

Kapcsolódó baseline: `docs/ui-audit-baseline.md` (2026-04-01).

## Prioritási jelölés

- `P0` = kritikus, shared felület vagy nagy duplikáció + core user flow
- `P1` = fontos, de szűkebb hatású vagy részterület-specifikus
- `P2` = opportunisztikus, későbbi hullámban refaktorálható

---

## 1) Button hotspotok

Mérési jel: `min-h-[44px]` előfordulás + core flow érintettség.

| Priority | Fájl | Jel |
|---|---|---|
| P0 | `src/components/org/OrgSetupWizard.tsx` | 7 előfordulás, org onboarding kritikus |
| P0 | `src/components/org/OrgCampaignsTab.tsx` | 6 előfordulás, org action gating kritikus |
| P0 | `src/components/campaign/CampaignWizard.tsx` | 6 előfordulás, campaign create flow |
| P0 | `src/components/dashboard/FeedbackForm.tsx` | 5 előfordulás, dashboard CTA konzisztencia |
| P0 | `src/components/ui/Picker.tsx` | 4 előfordulás, shared komponens szint |
| P1 | `src/app/org/[id]/page.tsx` | 4 előfordulás, org landing |
| P1 | `src/app/hiring/[orgId]/_components/HiringDashboard.tsx` | 4 előfordulás, hiring surface |
| P1 | `src/components/results/InvitationsTab.tsx` | 4 előfordulás, profile/results flow |
| P1 | `src/components/assessment/CsapatszerepQuestionnaire.tsx` | 4 előfordulás, assessment extension |
| P2 | `src/app/observe/[token]/ObserverClient.tsx` | 3 előfordulás, observer token flow |

---

## 2) Panel/Card hotspotok

Mérési jel: exact panel recipe `rounded-2xl border border-sand bg-white p-6 shadow-sm`.

| Priority | Fájl | Jel |
|---|---|---|
| P0 | `src/app/org/[id]/campaigns/[campaignId]/page.tsx` | 5 ismétlődés, campaign detail core |
| P0 | `src/app/org/[id]/settings/page.tsx` | 4 ismétlődés, settings core |
| P0 | `src/app/hiring/[orgId]/candidates/[inviteId]/page.tsx` | 4 ismétlődés, hiring evaluation flow |
| P0 | `src/components/campaign/CampaignWizard.tsx` | 3 ismétlődés, wizard layout |
| P0 | `src/components/org/OrgMembersTab.tsx` | 3 ismétlődés, org member management |
| P1 | `src/components/org/OrgCampaignsTab.tsx` | 2 ismétlődés |
| P1 | `src/components/org/OrgOverviewTab.tsx` | 2 ismétlődés |
| P1 | `src/components/org/OrgTeamsTab.tsx` | 2 ismétlődés |
| P1 | `src/components/team/TeamProfileTab.tsx` | 2 ismétlődés |
| P2 | `src/app/join/[token]/JoinClient.tsx` | 1 ismétlődés, join UX |

---

## 3) Form/Input hotspotok

Mérési jel: `input/textarea/select` sűrűség + flow kritikusság.

| Priority | Fájl | Jel |
|---|---|---|
| P0 | `src/app/onboarding/OrgOnboardingWizard.tsx` | 5 form mező, onboarding kritikus |
| P0 | `src/components/manager/CandidateInviteForm.tsx` | 4 form mező, hiring invite core |
| P0 | `src/components/campaign/CampaignWizard.tsx` | 3 form mező, campaign create |
| P0 | `src/components/org/CampaignList.tsx` | 3 form mező, org campaign operations |
| P1 | `src/app/onboarding/OnboardingClient.tsx` | 3 form mező, signup continuation |
| P1 | `src/app/join/[token]/JoinClient.tsx` | 3 form mező, invite acceptance |
| P1 | `src/app/join/org/[inviteId]/JoinOrgClient.tsx` | 3 form mező, org join flow |
| P1 | `src/components/org/OrgSetupWizard.tsx` | 2 form mező, org creation setup |
| P2 | `src/app/(auth)/sign-in/page.tsx` | 2 form mező, auth UI |
| P2 | `src/app/(auth)/sign-up/page.tsx` | 2 form mező, auth UI |

---

## 4) Heading/Eyebrow hotspotok

Mérési jel: exact eyebrow recipe `font-mono text-xs uppercase tracking-widest text-bronze`.

| Priority | Fájl | Jel |
|---|---|---|
| P0 | `src/app/org/[id]/settings/page.tsx` | 5 ismétlődés |
| P0 | `src/app/org/[id]/campaigns/[campaignId]/page.tsx` | 5 ismétlődés |
| P0 | `src/app/join/[token]/JoinClient.tsx` | 5 ismétlődés |
| P0 | `src/app/hiring/[orgId]/candidates/[inviteId]/page.tsx` | 5 ismétlődés |
| P1 | `src/app/onboarding/OrgOnboardingWizard.tsx` | 4 ismétlődés |
| P1 | `src/components/org/OrgSetupWizard.tsx` | 3 ismétlődés |
| P1 | `src/components/org/OrgMembersTab.tsx` | 3 ismétlődés |
| P1 | `src/components/org/OrgCampaignsTab.tsx` | 3 ismétlődés |
| P2 | `src/app/admin/page.tsx` | 2 ismétlődés |
| P2 | `src/components/team/TeamProfileTab.tsx` | 2 ismétlődés |

---

## 5) Avatar hotspotok

Mérési jel: `AVATAR_COLORS` / `getAvatarColor` / `AVATAR_OPTIONS` / doodle-avatar kapcsolódó usage.

### P0 (közvetlen egységesítési cél)

- `src/components/org/OrgSetupWizard.tsx` (avatar option flow)
- `src/app/onboarding/OnboardingClient.tsx` (avatar option flow)
- `src/components/UserMenu.tsx` (lokális avatar color helper)
- `src/components/layout/nav-header-ui.tsx` (lokális avatar color helper)
- `src/components/MobileDrawer.tsx` (lokális avatar color helper)
- `src/components/results/ProfileHero.tsx` (lokális avatar color helper)
- `src/app/profile/page.tsx` (lokális avatar color helper)
- `src/app/dashboard/AdminDashboard.tsx` (lokális avatar color helper)
- `src/app/org/[id]/page.tsx` (lokális avatar color helper)
- `src/app/team/[id]/page.tsx` (lokális avatar color helper)

### P1 (kivezetési hullám)

- `src/app/observe/[token]/ObserverClient.tsx` (doodle source usage)
- `src/lib/doodles.ts` (doodle source registry)

Megjegyzés:
- A jelenlegi irány szerint a doodle avatarokat kivezetjük, és központi avatar policy-re (standard monogram + tokenizált gradient) váltunk.

---

## 6) Nav/Shell hotspotok

Mérési jel: párhuzamos nav/shell implementáció + layout wiring központisága.

| Priority | Fájl | Jel |
|---|---|---|
| P0 | `src/app/layout.tsx` | mindkét nav implementáció itt találkozik |
| P0 | `src/components/NavBar.tsx` | párhuzamos header recipe |
| P0 | `src/components/layout/nav-header-ui.tsx` | párhuzamos header recipe |
| P0 | `src/components/MobileDrawer.tsx` | nav/avatar token keveredés |
| P1 | `src/components/layout/SidebarUI.tsx` | külön shell viselkedés |
| P1 | `src/components/layout/PlatformPageShell.tsx` | jó alap, de részleges standard |
| P2 | `src/app/org/[id]/page.tsx` | shell használat finomhangolás |
| P2 | `src/app/team/[id]/page.tsx` | shell használat finomhangolás |

---

## Javasolt kezdőfájl-csomag (első migrációs sprint)

1. `src/components/ui/Picker.tsx`
2. `src/components/campaign/CampaignWizard.tsx`
3. `src/components/org/OrgSetupWizard.tsx`
4. `src/components/org/OrgCampaignsTab.tsx`
5. `src/app/layout.tsx`
6. `src/components/NavBar.tsx`
7. `src/components/layout/nav-header-ui.tsx`
8. `src/components/UserMenu.tsx`
9. `src/app/onboarding/OnboardingClient.tsx`
10. `src/app/org/[id]/settings/page.tsx`

Indok:
- ezek együtt lefedik a button/panel/form/heading/avatar/nav fő duplikációit,
- egyszerre érintik a self/team/org és join/onboarding flow-kat,
- jól alkalmasak arra, hogy az új primitive-ek gyorsan valós megtakarítást hozzanak.

