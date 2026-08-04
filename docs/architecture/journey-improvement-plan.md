# Trita — Journey Architecture Plan v2.2

> A user-journey-map.md állapotfelmérésre, a kódbázis auditjára, és két review iterációra épül.
> Cél: egységes, intent-aware journey engine, ami a teljes platformlogikát vezérli.

---

## Design principles

**1. Egy közös journey engine, ne több lazán összedrótozott resolver.**

A journey engine egyetlen lánc:

```
resolveJourneyContext()  →  computeJourneyState()  →  resolveHome()  →  resolveNextAction()
```

Minden UI felület (nav, hero, CTA, page title, progress bar) ebből a láncból dolgozik.

**2. Current obligation erősebb, mint a context.**

Egy org member aki nem töltötte ki a self assessmentet → `/assessment`, nem team home. A user jelenlegi kötelezettsége fontosabb, mint a szervezeti kontextusa.

**3. Join után a journey engine dönt, nem a join flow.**

Nincs hardcoded post-join redirect. A join flow sikeresen befejeződik, majd a journey engine újra lefut és eldönti a home-ot.

**4. Experience hints: csak ami több felületen újrahasznosul.**

A journey engine nem ad vissza 50 boolean hint-et. A legtöbb UI döntést a komponensek a `stage`, `home.reason` és `nextAction` alapján hozzák meg. Csak a cross-cutting experience hint-ek kerülnek az engine outputjába.

---

## I. Journey Engine

### 1. Egységes context → state → home → action lánc

**Jelenlegi állapot:**
- `getActiveOrgMembership()` — org context
- `getJourneyStateForProfileId()` — journey state (10 stage)
- `/dashboard` page.tsx `if/else` — home routing
- `computeActions()` — next action lista

Ezek 4 külön hívás, 4 külön fájl, részben átfedő logikával.

**Cél:**
Egyetlen engine, ami egy hívásból ad vissza mindent:

```typescript
// src/lib/journey/engine.ts

interface JourneyResolution {
  // Context
  activeSurface: "personal" | "team" | "org" | "continuation";
  entryIntent: JourneyEntryIntent;  // "explore" | "team" — bővíthető (pl. "hiring", "coach")
  currentContext: "self-only" | "org-member" | "org-manager" | "org-admin";

  // State
  stage: JourneyStage;
  stageDisplay: {
    label: { hu: string; en: string };
    scopeProgress: number;     // 0-100, CSAK az aktuális scope-ra
    substeps?: Array<{ label: string; done: boolean }>;
  };

  // Home
  home: {
    destination: string;
    reason: HomeReason;
    primaryAction?: JourneyAction;
  };

  // Experience hints — CSAK cross-cutting, több felületen is megjelenik
  experienceHints: {
    showOrgExpansionPrompt: boolean;      // explore intent + org meghívó érkezett
    showTeamCreationBanner: boolean;      // team intent + nincs org
    showAssessmentContinuation: boolean;  // félbehagyott teszt
  };
}

type HomeReason =
  | "pending_join"
  | "assessment_continuation"
  | "org_cockpit"
  | "team_home"
  | "personal_home"
  | "first_assessment";

// A resolver több domain-forrásból aggregál:
// profile, memberships, invites, assessment state, subscription, intent
async function resolveJourney(
  profileId: string,
  options?: { teamId?: string; orgId?: string }
): Promise<JourneyResolution>
```

**A `activeSurface` nem identitás, hanem az aktuálisan domináns felület.** Egy user egyszerre personal és org journey-n van — az `activeSurface` azt mondja meg, melyik felé irányítjuk most.

**Az `entryIntent` kezdetben kétértékű, de bővíthető.** A típus `JourneyEntryIntent` type alias legyen, ne literal union, hogy később ne törjön az engine.

**A `scopeProgress` nem globális "platform készültség"**, hanem az aktuális scope-on belüli haladás:
- Personal scope: self assessment + observer coverage
- Team scope: tag kitöltöttség + csapatkép készültség
- Org scope: csapatok lefedettség + kampány aktivitás

**Prioritás:** Magas — ez az egész platform alapja.

---

### 2. Home resolution szabályok

A home nem csak path, hanem **experience resolution**:

```typescript
function resolveHome(stage, intent, ctx): HomeResolution {
  // 1. Folytatás (legmagasabb prioritás)
  if (hasPendingJoinInvite) → { activeSurface: "continuation", destination: joinUrl }
  if (stage === SELF_IN_PROGRESS) → { activeSurface: "continuation", destination: "/assessment" }

  // 2. Org kontextus (ha van és manager+)
  if (ctx.isManager || ctx.isAdmin) → { activeSurface: "org", destination: "/dashboard" }

  // 3. Team kontextus — DE current obligation erősebb
  if (ctx.isMember && !hasCompletedSelfAssessment)
    → { activeSurface: "personal", destination: "/assessment" }
  if (ctx.isMember && stage >= TEAM_NOT_JOINED)
    → { activeSurface: "team", destination: `/team/${ctx.teamId}` }

  // 4. Self (explicit personal journey)
  if (stage >= SELF_COMPLETED) → { activeSurface: "personal", destination: "/profile/results" }

  // 5. Első indulás
  → { activeSurface: "personal", destination: "/assessment" }
}
```

**Prioritás:** Magas.

---

## II. Personal Journey vs Organization Journey

### 3. Két egyenrangú journey, nem két mode

Nem "Personal mode" vs "Organization mode" — hanem két journey, amik átjárhatók.

```
┌─────────────────────────────────┐    ┌─────────────────────────────────┐
│      PERSONAL JOURNEY           │    │     ORGANIZATION JOURNEY        │
│                                 │    │                                 │
│  Self Assessment                │    │  Team Assessment                │
│  Observer Feedback              │◄──►│  Team Pattern                   │
│  Career Fit                     │    │  360° Campaigns                 │
│  Plus Upgrade                   │    │  Org Insights                   │
│  PDF Export                     │    │  Hiring                         │
│                                 │    │                                 │
│  Home: /profile/results         │    │  Home: /dashboard (org cockpit) │
└─────────────────────────────────┘    └─────────────────────────────────┘
```

Egy user **egyszerre mindkét journey-n** van. A `activeSurface` azt dönti el, melyik felé irányítjuk most.

**Változások:**
- NavBar signed-in "home" link = journey engine `home.destination` (Fázis 1-be tartozik!)
- "Profilom" link mindig elérhető, nem home, hanem explicit nav link
- Personal journey CTA-k → "Profilom", nem "Dashboard"

**Iterációs döntés:**
> `/profile/results` marad a personal home. Nem építünk még külön personal cockpitot.
> Ha a self journey bővül (observer, compare, pdf, career fit, plus), akkor dedikált personal cockpit.

**Prioritás:** Közepes.

---

## III. Intent végigvezetése

### 4. Entry intent → current context → resolved journey

Az intent a journey engine inputja, és végig befolyásolja az experience-t:

| entry_intent | current_context | activeSurface | experience effect |
|---|---|---|---|
| explore | self-only | personal | Self-first CTAs, no org prompt |
| explore | org-member (meghívás) | personal | Org expansion prompt |
| team | org-admin | org | Team-first CTAs, org management |
| team | self-only (org nincs) | personal | "Hozd létre a csapatodat" banner |

Az intent **nem auto-redirect, hanem hint** — a nav, hero, CTA használja. A journey engine része, nem külön resolver.

**Prioritás:** Közepes.

---

## IV. Progress megjelenítés

### 5. Scope-aware progress

```typescript
interface ScopeProgress {
  label: { hu: string; en: string };
  scopeProgress: number;     // 0-100, az aktuális scope-ra
  substeps?: Array<{ label: string; done: boolean }>;
}
```

**A progress nem globális "platform készültség":**
- **Personal:** "2/3 observer visszajelzés beérkezett"
- **Team:** "3/5 tag kitöltötte a tesztet"
- **Org:** "2/3 csapatnál elérhető a csapatkép"

**Nem progress, hanem state:**
- Optional expansions (Plus, observer körök) — nem blokkoló lépések
- Locked next layer (Values, Conflict) — 4+2 modell zárt rétegei

**Prioritás:** Magas.

---

## V. Subscription finomítás

### 6. Háromszintű subscription állapot

```
ACTIVE     → teljes hozzáférés
RESTRICTED → read-only, meglévő adatok elérhetők, új akciók blokkolva
FROZEN     → erősen read-only, minimális szervezeti összegző metaadat látható,
              részletes insight nem böngészhető
```

| Funkció | Active | Restricted | Frozen |
|---|---|---|---|
| Eredmények olvasása | ✓ | ✓ | összegző* |
| Csapatkép megtekintése | ✓ | ✓ | ✗ |
| Új kampány / invite / hiring | ✓ | ✗ | ✗ |
| Export/PDF | ✓ | ✓ | ✗ |
| Billing kezelés | ✓ | ✓ | ✓ |

*Frozen-ben csak szervezeti szintű összegző metaadat látható (tagszám, csapatlista, utolsó aktivitás dátuma), részletes insight nem.

**Logika:**
- `restricted` = `past_due` VAGY (`canceled` ÉS `currentPeriodEnd > now - 30days`)
- `frozen` = `canceled` ÉS `currentPeriodEnd < now - 30days`
- `requireSubscriptionAccess(minLevel)` — nem redirect, hanem state-based rendering

Restricted UI: CTA-k disabled, banner: "Az előfizetés lejárt — [Reaktiválás]"

**Prioritás:** Közepes.

---

## VI. Join flow-k & Membership

### 7. Közös Membership Acceptance ernyő

A `resolveMembershipInviteResolution()` (ami már létezik!) legyen a közös alap. A 3 join flow (`/join/{token}`, `/join/org/{inviteId}`, `/apply/{token}`) közös lépéseket követ:

```
Token validáció → Auth ellenőrzés → Profil kiegészítés → Context switch → Elfogadás
    → Journey engine újrafut → Home resolution
```

**Kritikus:** join után nem a join flow dönti el a redirect-et, hanem a journey engine.

**Prioritás:** Alacsony.

---

## VII. Capability model előkészítés

### 8. Role → Capability

**Most:** `hasOrgRole(role, minRole)` hierarchikus.
**Később:** `hasCapability(user, "team.manage")` capability-based.

**Jelenleg szükséges:** nem implementáljuk, de a home és access resolver tervezésénél **kerüljük a túl szoros role-hardcode-olást**, hogy később capability-kre át lehessen állni.

**Prioritás:** Alacsony.

---

## VIII. Nyitott területek

### Core platform critical gaps

| Gap | Hatás | Következő lépés |
|---|---|---|
| **Candidate hiring journey** | Közepes | End-to-end flow dokumentálás + hiányzó UI |
| **Subscription downgrade** | Közepes | 6. pont implementálása |
| **Org switch** | Alacsony | Multi-org tervezés |

### Future layer expansions

| Layer | Állapot | Időzítés |
|---|---|---|
| **Csapatszerep flow** | Schema + scoring kész, UI részleges | Rövid távú |
| **Values layer** | Schema placeholder | Közép távú |
| **Conflict layer** | Schema placeholder | Közép távú |

---

## IX. Try flow helye

A try flow **acquisition hook**, nem core journey:

```
ACQUISITION LAYER:  /try → localStorage → /try/claim → sign-up
                                               │
                                   beolvad a core journey-be
                                               ▼
CORE JOURNEY:       /onboarding → /assessment → /profile/results
                    /org → /team → /campaign → /hiring
```

A try flow NEM befolyásolja az intent-et (az a sign-up-nál történik).

---

## X. Implementációs sorrend

### Fázis 1 — Journey Engine + Nav (1-2 nap)
1. `src/lib/journey/engine.ts` — `resolveJourney()` egységes function
2. `computeScopeProgress()` — label + scope-aware %
3. `/dashboard` page.tsx átírása `resolveJourney()` hívásra
4. **NavBar "home" link = journey engine output** (ide húzva a Fázis 2-ből)

### Fázis 2 — Personal Journey + Experience (1 nap)
5. Self path = explicit personal journey — routing és szöveg változások
6. Experience hints: org expansion prompt, team creation banner

### Fázis 3 — Subscription (1 nap)
7. `getSubscriptionState()` — 3 szintű állapot
8. Read-only org oldalak restricted mode-ban

### Fázis 4 — Dokumentáció (fél nap)
9. Try flow helye dokumentálás
10. Capability model terv
11. Nyitott journey-k priorizálása

---

## XI. Sikerességi mérőpontok

### Strukturális

| Szempont | Jelenlegi | Cél |
|---|---|---|
| Journey resolution | 4 külön hívás + if/else | 1 engine, 1 output objektum |
| Home routing | 3 if/else a page.tsx-ben | `resolveHome()` 6+ rule-lal |
| Home decision logika | Duplikálva 2+ helyen | Nincs duplikáció, 1 forrás |
| Self vs Org | Implicit (nincs org → self) | Explicit (2 named journey) |
| Intent hatása | Csak CTA ajánlás | Home + nav + CTA + banner + hero |
| Progress | Stage név (kódban) | Label + scope-% + substeps (UI-ban) |
| Subscription | Bináris (active/blocked) | 3 szint (active/restricted/frozen) |
| Primary CTA | Lokális heurisztikából | Engine output-ból |

### UX outcomes

| Szempont | Cél |
|---|---|
| Első belépés | 1 egyértelmű primary CTA |
| Signed-in home link | Konzisztens, a journey engine-ből jön |
| Self user | Nem kap automatikus team-first CTA-t |
| Org member assessment nélkül | Assessment-re irányít, nem team home-ra |
| Subscription restricted | Org adatok olvashatók, CTA-k disabled |
| Join flow után | Nincs dead-end redirect, journey engine dönt |
