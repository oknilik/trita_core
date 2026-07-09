# Trita — User Journey Map (2026-03-31 állapot)

## Összefoglaló

A Trita platformon **két párhuzamos user journey** létezik, amelyek a **dashboard döntési ponton** válnak szét:

```
                                    ┌─────────────────┐
                                    │   LANDING (/)    │
                                    └────────┬────────┘
                                             │
                               ┌─────────────┼─────────────┐
                               ▼             ▼             ▼
                          /try          /sign-up      /join/{token}
                       (vendég)       (regisztráció)  (meghívó link)
                               │             │             │
                               └──────┬──────┘             │
                                      ▼                    ▼
                               ┌─────────────┐    ┌──────────────┐
                               │  ONBOARDING │    │ JOIN FLOW    │
                               │  intent?    │    │ (team/org)   │
                               └──────┬──────┘    └──────┬───────┘
                                      │                  │
                          ┌───────────┼──────────┐       │
                          ▼                      ▼       ▼
                    intent=explore          intent=team
                          │                      │
                          ▼                      ▼
                  OnboardingClient      OrgOnboardingWizard
                  (demográfia)          (org + csapat + meghívás)
                          │                      │
                          └──────────┬───────────┘
                                     ▼
                              ┌─────────────┐
                              │  /dashboard  │
                              │ DÖNTÉSI PONT │
                              └──────┬──────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                                 ▼
             getActiveOrgMembership()          nincs org membership
             ORG_MANAGER / ORG_ADMIN                  │
                    │                                 ▼
                    ▼                          ┌─────────────┐
             ┌─────────────┐                   │  SELF PATH  │
             │  B2B PATH   │                   │ /assessment  │
             │ AdminDash   │                   │ /profile/    │
             └──────┬──────┘                   │  results     │
                    │                          └─────────────┘
       ┌────────────┼────────────┐
       ▼            ▼            ▼
   /org/{id}    /team/{id}   /hiring/{orgId}
```

---

## Szerepkörök és jogosultságok

### Szerepkör hierarchia

```
ORG_ADMIN (3)  ─── minden org funkció + beállítások
    │
ORG_MANAGER (2) ── csapatok kezelése + meghívás + hiring + kampány
    │
ORG_MEMBER (1) ── saját teszt + csapat nézet (olvasás)
    │
SELF_ONLY (0)  ── nincs org membership, csak személyes profil
```

### Funkció-hozzáférés mátrix

```
┌──────────────────────────────┬──────────┬───────────┬───────────┬───────────┐
│ Funkció                      │SELF_ONLY │ORG_MEMBER │ORG_MANAGER│ ORG_ADMIN │
├──────────────────────────────┼──────────┼───────────┼───────────┼───────────┤
│ Személyiségteszt kitöltés    │    ✓     │     ✓     │     ✓     │     ✓     │
│ Saját eredmény megtekintés   │    ✓     │     ✓     │     ✓     │     ✓     │
│ Observer meghívás             │  ✓ *1   │   ✓ *2    │     ✓     │     ✓     │
│ Összehasonlítás (self↔obs)   │  Plus *3 │     ✓     │     ✓     │     ✓     │
│ PDF export                   │  Plus    │     ✓     │     ✓     │     ✓     │
├──────────────────────────────┼──────────┼───────────┼───────────┼───────────┤
│ Csapat nézet (olvasás)       │    ✗     │     ✓     │     ✓     │     ✓     │
│ Csapat tagok kezelése        │    ✗     │     ✗     │     ✓     │     ✓     │
│ Csapat létrehozás            │    ✗     │     ✗     │     ✓     │     ✓     │
│ Meghívó küldés               │    ✗     │     ✗     │     ✓     │     ✓     │
│ Kampány indítás/kezelés      │    ✗     │     ✗     │     ✓     │     ✓     │
│ Hiring (jelölt értékelés)    │    ✗     │     ✗     │     ✓     │     ✓     │
├──────────────────────────────┼──────────┼───────────┼───────────┼───────────┤
│ Org beállítások              │    ✗     │     ✗     │     ✗     │     ✓     │
│ Szerepkörök kezelés          │    ✗     │     ✗     │     ✗     │     ✓     │
│ Számlázás / előfizetés       │    ✗     │     ✗     │     ✗     │     ✓     │
│ Org deaktiválás              │    ✗     │     ✗     │     ✗     │     ✓     │
│ Admin dashboard              │    ✗     │     ✗     │     ✓     │     ✓     │
└──────────────────────────────┴──────────┴───────────┴───────────┴───────────┘

*1 = self_start: max 2 observer; self_plus: korlátlan
*2 = org tagként automatikusan self_plus szintű hozzáférés
*3 = Plus vásárlás szükséges VAGY org tagság megadja automatikusan
```

---

## Belépési pontok és utak

### 1. Vendég kipróbálás (Try flow)

```
VENDÉG ──→ /try ──→ Teszt kitöltés (localStorage) ──→ /try/claim
                                                          │
                                                    ┌─────┴─────┐
                                                    ▼           ▼
                                               /sign-up    /sign-in
                                                    │           │
                                                    └─────┬─────┘
                                                          ▼
                                                   /onboarding
                                                    (explore)
                                                          │
                                                          ▼
                                                  /profile/results
                                                   (self_start)
```

### 2. Egyéni regisztráció

```
/sign-up ──→ /onboarding (demográfia) ──→ /assessment ──→ /profile/results
                                                               │
                                          ┌────────────────────┤
                                          ▼                    ▼
                                    Observer invite      Plus upgrade
                                    /observe/{token}     (€9 egyszeri)
                                          │                    │
                                          ▼                    ▼
                                    Összehasonlítás      Alskálák, PDF,
                                    (min 2 obs)          karrierillesztés
```

### 3. Szervezet létrehozása

```
/sign-up?intent=team ──→ OrgOnboardingWizard
                              │
                    ┌─────────┼──────────┐──────────┐
                    ▼         ▼          ▼          ▼
              Org létrehozás  Csapat     Tag        Előfizetés
              (név, terület)  létrehozás meghívás   (trial indul)
                              │
                              ▼
                         /dashboard
                      (AdminDashboard)
                              │
                 ┌────────────┼────────────┐
                 ▼            ▼            ▼
            /org/{id}    /team/{id}    /hiring/{orgId}
```

### 4. Meghívott csatlakozás (Team invite)

```
Email: meghívó link
    │
    ▼
/join/{token}
    │
    ├── Nincs fiók ──→ /sign-up?redirect=/join/{token} ──→ /join/{token}
    │
    ├── Van fiók, hiányos profil ──→ Profil kiegészítés ──→ Elfogadás
    │
    ├── Van fiók, org váltás szükséges ──→ Megerősítés ──→ Elfogadás
    │
    └── Kész ──→ Elfogadás ──→ /dashboard
                                    │
                                    ▼
                              /assessment (ha még nincs)
                              VAGY
                              /profile/results (ha van)
```

### 5. Szervezeti meghívó (Org invite)

```
Email: org meghívó
    │
    ▼
/join/org/{inviteId}
    │
    ├── Nincs fiók ──→ /sign-up?redirect=/join/org/{inviteId}
    │
    ├── Hiányos profil ──→ Profil kiegészítés
    │
    └── Kész ──→ Elfogadás (role = meghívóban megadott)
                     │
                     ▼
                /dashboard
```

---

## Access gate rendszer

```
┌─────────────────────────────────────────────────────────────┐
│                     ROUTE PROTECTION                         │
├─────────────┬──────┬─────┬──────┬──────┬───────────────────┤
│ Route       │ Auth │ Org │ Role │ Sub  │ Megjegyzés        │
├─────────────┼──────┼─────┼──────┼──────┼───────────────────┤
│ /           │  ✗   │  ✗  │  ✗   │  ✗   │ Publikus          │
│ /try        │  ✗   │  ✗  │  ✗   │  ✗   │ Vendég teszt      │
│ /observe/*  │  ✗   │  ✗  │  ✗   │  ✗   │ Observer (publikus)│
│ /sign-*     │  ✗   │  ✗  │  ✗   │  ✗   │ Auth oldalak      │
│ /join/*     │  ✗*  │  ✗  │  ✗   │  ✗   │ *unauthból redirect│
├─────────────┼──────┼─────┼──────┼──────┼───────────────────┤
│ /onboarding │  ✓   │  ✗  │  ✗   │  ✗   │ Post-signup       │
│ /assessment │  ✓   │  ✗  │  ✗   │  ✗   │ Retake guard      │
│ /profile/*  │  ✓   │  ✗  │  ✗   │  ✗   │ AccessLevel gate  │
│ /dashboard  │  ✓   │  ?  │  ?   │  ✗   │ Routing hub       │
├─────────────┼──────┼─────┼──────┼──────┼───────────────────┤
│ /org/{id}   │  ✓   │  ✓  │ ADM  │  ✓   │ Admin only        │
│ /org/*/sett │  ✓   │  ✓  │ ADM  │  ✓   │ Admin only        │
│ /team/{id}  │  ✓   │  ✓  │ *1   │  ✓   │ *1=canAccessTeam  │
│ /hiring/*   │  ✓   │  ✓  │ MGR  │  ✓   │ Manager+          │
│ /billing/*  │  ✓   │  ✓  │  ✗   │  ✗   │ Stripe portal     │
└─────────────┴──────┴─────┴──────┴──────┴───────────────────┘
```

---

## Szerepkör átjárás

```
SELF_ONLY ────────────────────────────────────────┐
    │                                              │
    │ Org meghívó elfogadás                        │
    │ VAGY org létrehozás                          │
    ▼                                              │
ORG_MEMBER ──── Meghívó role alapján ──→ ORG_MANAGER
    │                                        │
    │ Admin előléptetés (Settings oldalon)    │
    │                                        │
    ▼                                        ▼
    └──────────────────────────────→ ORG_ADMIN

Visszafelé:
  ORG_ADMIN ──→ lefokozás (Settings) ──→ ORG_MANAGER / ORG_MEMBER
  ORG_* ──→ org elhagyás (leftAt = now) ──→ SELF_ONLY

Org váltás:
  User → /api/org/switch → activeOrgId frissül → layout refresh
  Egy user egyszerre EGY org kontextusban van
  (de a DB-ben több org membership lehet, leftAt IS NULL)
```

---

## Azonosított hiányosságok / kockázatok

### 1. Try flow → Results átjárás
**Probléma:** A `/try/claim` után a user a `/profile/results`-ra kerül, de ha közben org meghívót kap, nem egyértelmű az átjárás.
**Hatás:** Alacsony — a legtöbb user vagy self, vagy org path-on van.

### 2. Régi role rendszer (UserProfile.role)
**Probléma:** A `UserProfile.role` (INDIVIDUAL/ORG_ADMIN/ORG_MEMBER) párhuzamosan létezik az `OrganizationMember.role` rendszerrel. A régi mező nem használt aktívan, de a schema-ban megvan.
**Hatás:** Közepes — zavaró a kódban, de funkcionálisan nincs hatása.

### 3. Observer hozzáférés org nélkül
**Probléma:** Self-only user observer meghívó küldésekor a `/require-observer-access.ts` ellenőrzi az org subscription-t. Self-only user-nek nincs org → nem tud observer-t hívni ha ez a guard fut.
**Megoldás:** A `getSelfAccessLevel()` funkció org tagság esetén automatikusan `self_plus`-t ad, ami feloldja az observer korlátot. Self-only user-nél a `self_start` szint max 2 observer-t engedélyez.

### 4. Több org membership kezelése
**Probléma:** A `UserProfile.activeOrgId` + `OrganizationMember` (leftAt IS NULL) rendszer lehetővé teszi több org tagságot, de az `activeOrgId` mindig EGY org-ra mutat. Az org switch flow (`/api/org/switch`) frissíti ezt, de a NavHeaderUI a layout rendereléskor kap adatot — ha a switch nem triggerel `router.refresh()`-t, a nav elavult maradhat.
**Hatás:** Alacsony — a legtöbb user egy org-ban van.

### 5. Candidate hiring journey
**Probléma:** A jelölt felmérés (hiring) teljes user journey-je (email meghívó → jelölt kitöltés → eredmény → összehasonlítás csapattal) nem teljesen dokumentált. A `CandidateInvite` modell létezik, de a `/apply/[token]` flow és a credit rendszer közötti összekötés nem egyértelmű.
**Hatás:** Közepes — ez egy aktívan fejlesztett feature.

### 6. Subscription lejárat kezelése
**Probléma:** Ha a subscription lejár (`past_due` / `canceled`), a `requireActiveSubscription()` redirect-el a `/billing/upgrade` oldalra. De a meglévő adatok (csapatmintázat, eredmények) elérhetősége nem egyértelmű — read-only mód nincs implementálva.
**Hatás:** Közepes — a trial lejárata után az összes org funkció blokkolt.
