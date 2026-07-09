# Avatar Policy Audit

Dátum: 2026-04-01  
Scope: avatar logika + asset használat audit (`AVATAR_COLORS`, `getAvatarColor`, doodle/avatar assetek, monogram és gradient fallbackek, onboarding/org setup/observe/menu/profile variánsok).

## 1) Gyors baseline

| Mérőszám | Eredmény | Megjegyzés |
|---|---:|---|
| `AVATAR_COLORS` lokális definíció | 10 fájl | erős duplikáció |
| `getAvatarColor` lokális helper | 9 fájl | eltérő hash/palette logika |
| fix `memberAvatar()` helper | 2 fájl | mindenkinél ugyanaz az image (`avatar-1`) |
| `avatarUrl` usage összesen | 9 előfordulás | mentés van, megjelenítés gyakorlatilag nincs |
| `trita_avatar` localStorage key | 1 olvasás, 0 írás | legacy drift |
| doodle registry | 1 lib + 1 fő consumer | `observe` flow használja dekorációként |

## 2) Asset és forrás inventory

| Téma | Hely | Állapot |
|---|---|---|
| Avatar image assetek | `public/avatars/avatar-1..9.png` | léteznek, kiválaszthatók |
| Doodle assetek | `public/doodles/*.svg` (18 db) | aktív `observe` háttérben |
| Avatar option source | `src/lib/avatars.ts` | központi lista (`AVATAR_OPTIONS`) |
| Doodle source | `src/lib/doodles.ts` | központi lista (`DOODLE_SOURCES`) |
| Profile mező | `UserProfile.avatarUrl` (`prisma/schema.prisma`) | perzisztált, de UI nem erre épül |

## 3) Variánsok (flow szerint)

| Flow / felület | Fájl(ok) | Forrásadat | Render típus | Fallback | Megjegyzés |
|---|---|---|---|---|---|
| Onboarding avatar választás | `src/app/onboarding/OnboardingClient.tsx` | `AVATAR_OPTIONS` + `avatarUrl` state | image picker | default `avatar-1` | mentés történik `/api/profile/onboarding`-ra |
| Org setup avatar lépés | `src/components/org/OrgSetupWizard.tsx` | `AVATAR_OPTIONS` + `avatarUrl` state | image picker | default `avatar-1` | ugyanúgy profile onboarding API-t hív |
| Observe journey | `src/app/observe/[token]/ObserverClient.tsx`, `src/components/illustrations/BackgroundDoodles.tsx` | `DOODLE_SOURCES` | doodle maszkolt háttér | random doodle | nem profil-avatar, de ugyanabba az identitás-vizuál rétegbe csúszik |
| Menü: UserMenu | `src/components/UserMenu.tsx` | `displayName` / `user.id` | gradient + 1 karakter monogram | `·` | lokális palette + hash |
| Menü: MobileDrawer | `src/components/MobileDrawer.tsx` | `displayName` | gradient + 1 karakter monogram | `?` | ugyanaz a helper újradefiniálva |
| Menü: NavHeaderUI | `src/components/layout/nav-header-ui.tsx` | `displayName` | gradient + 1 karakter monogram | `"P"` | desktop + 2 mobil variánsban is |
| Menü: SidebarUI (legacy shell) | `src/components/layout/SidebarUI.tsx` | `localStorage.trita_avatar` | image | `avatar-1` | `trita_avatar` sehol nincs írva |
| Profile page | `src/app/profile/page.tsx` | username/email | gradient + 1 karakter monogram | `?` | nem használ `avatarUrl`-t |
| Profile results hero | `src/components/results/ProfileHero.tsx` | `userName` | gradient + 1 karakter monogram | `?` | lokális helper |
| Team page member lista | `src/app/team/[id]/page.tsx` | `member.displayName` | gradient + 1 karakter monogram | `?` | lokális helper |
| Org page team cardok | `src/app/org/[id]/page.tsx` | `team.name` | gradient + 1 karakter monogram | `?` | lokális helper |
| Dashboard team listák | `src/app/dashboard/AdminDashboard.tsx` | `team.name` | gradient + 1 karakter monogram | `?` | lokális helper |
| Team overview mini lista | `src/components/team/TeamOverviewTab.tsx` | `memberAvatar()` | image (`avatar-1`) | `avatar-1` | `avatarColor`/`initials` számolódik, de nem használódik |
| Campaign résztvevő stack | `src/components/org/CampaignCard.tsx` | `memberAvatar()` | image (`avatar-1`) | `avatar-1` | minden résztvevő ugyanazt az avatart kapja |

## 4) Duplikációs és inkonzisztencia pontok

### 4.1 `AVATAR_COLORS` / `getAvatarColor` szétcsúszás

- Ugyanaz a (vagy nagyon hasonló) gradient palette több fájlban újradefiniálva.
- Legalább két külön hash stratégia él:
- bitshiftes hash (`charCode + ((hash << 5) - hash)`)
- egyszerű összeadásos hash (`sum(charCode)`)
- Különböző fallback karakterek: `"?"`, `"·"`, `"P"` és különböző initials-logika.

### 4.2 Perzisztencia vs render mismatch

- Onboarding és Org Setup ment `avatarUrl`-t (`/api/profile/onboarding`), de a signed-in fő felületek jellemzően nem használják ezt megjelenítésre.
- `SidebarUI` `trita_avatar` kulcsot olvas, de írás/karbantartás nincs a kódban.
- Következmény: a user választott avatarja több belépési ponton nem konzisztensen látszik.

### 4.3 Keveredő vizuális policy

- Egyes felületek gradient monogramot használnak, mások fix image fallbacket (`avatar-1`), megint mások doodle hátteret.
- Team/Campaign listáknál fix avatar-image használat miatt identitás megkülönböztetés gyenge.

### 4.4 Dead / félkész logika jelek

- `TeamOverviewTab`: `avatarColor` és `initials` kiszámolva, de renderben nincs használat.
- `CampaignCard`: `getInitials()` definiálva, de renderben nincs használat.
- Ezek karbantartási zajt és félrevezető “policy látszatot” okoznak.

## 5) Kiemelt kockázatok

| Kockázat | Hatás |
|---|---|
| User választ avatar-t, de más UI-t lát menüben/profile-on | bizalomvesztés, inkonzisztens UX |
| Több hash + palette implementáció | regresszióveszély refaktoroknál |
| Legacy `trita_avatar` olvasás | rejtett állapotkezelési hiba |
| Doodle és avatar policy keverése | design rendszer szétcsúszás |

## 6) Kivezetési irány (audit ajánlás)

- Doodle avatarok kivezetése az avatar policy-ből (observe-ben maradhat külön “illustration” policy alatt, de ne avatar policy részeként).
- Egy központi avatar policy bevezetése:
- `src/lib/ui/avatar.ts` (szín/palette/hash/initials/fallback)
- opcionális `Avatar` primitive (`src/components/ui/primitives/Avatar.tsx`)
- Egységes fallback sorrend:
- 1) valid image (`avatarUrl`)  
- 2) monogram + standard gradient  
- 3) rendszer default
- Legacy pontok lezárása:
- `trita_avatar` key megszüntetése vagy explicit migráció
- `memberAvatar()` fix placeholder logika kiváltása

## 7) Cleanup prioritás (javaslat)

| Priority | Tétel |
|---|---|
| P0 | `UserMenu`, `MobileDrawer`, `nav-header-ui`, `profile/page`, `ProfileHero` egységes avatar helperre kötése |
| P0 | `avatarUrl` tényleges bekötése a signed-in avatar renderbe |
| P1 | `TeamOverviewTab`, `CampaignCard` fix `avatar-1` kivezetése |
| P1 | `SidebarUI` `trita_avatar` legacy kezelés megszüntetése |
| P1 | observe doodle policy explicit szétválasztása avatar policy-től |

## 8) Audit konklúzió

Az avatar-réteg jelenleg részben központosított asset szinten (`lib/avatars.ts`, `lib/doodles.ts`), de viselkedés-szinten erősen fragmentált. A duplikáció és a perzisztencia/render mismatch miatt magas a regressziós és UX-konzisztencia kockázat.  

A legnagyobb rövidtávú nyereség: központi avatar policy + `avatarUrl` tényleges felhasználása + doodle avatar irány egyértelmű kivezetése.
