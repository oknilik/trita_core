# UI & Design Unification Plan

## Cél

A projekt UI rétegének egységesítése úgy, hogy:

- ugyanazokra a mintákra ugyanazokat a komponenseket használjuk,
- a design tokenek ténylegesen központi forrásból jöjjenek,
- csökkenjen a hardcoded stílusok és lokális variációk száma,
- egyszerűbb és gyorsabb legyen új képernyők építése.

---

## Audit összefoglaló (jelenlegi állapot)

Gyors kódbázis-audit alapján (`src/app` + `src/components`):

- `330` fájl érintett a UI-ban.
- `119` fájl tartalmaz közvetlen hex színhasználatot (`#...`).
- `133` fájl használ arbitrary Tailwind értékeket (`bg-[...]`, `text-[...]`, stb.).
- `143` darab `min-h-[44px]` használat van `66` fájlban (gomb/CTA minta széttagolt).
- `37` alkalommal ismétlődik a panel recept: `rounded-2xl border border-sand bg-white p-6 shadow-sm` (`19` fájlban).
- az avatar színlogika többszörösen duplikált (`AVATAR_COLORS` + `getAvatarColor`) legalább `11` helyen.
- doodle/avatar asset használat keveredik a felületek között (onboarding, org setup, observe), ezért az avatar UX irány nem egységes.
- párhuzamos nav implementáció él egyszerre: `NavBar` és `NavHeaderUI`.

### Fő duplikációs hotspotok

1. Gombminták
- Primary, secondary, ghost, disabled variánsok sok helyen kézzel összerakva.
- Eltérő hover/disabled viselkedés és spacing.

2. Panel/kártya minták
- Azonos border/radius/shadow recept több tucat helyen inline stringként.

3. Eyebrow/section heading minták
- `font-mono text-xs uppercase tracking-widest text-bronze` széleskörűen ismétlődik.

4. Színpaletta fragmentáció
- Sok helyen token osztályok (`bg-sage`) és hardcoded hex (`bg-[#3d6b5e]`) keveredik.
- Surface-specifikus árnyalatok (self/team/org) ad-hoc jelennek meg.

5. UI utility hiány
- Nincs központi `cn`/class merge helper.
- Több fájlban lokális `joinClasses`/`mergeClasses`.

---

## Cél-architektúra

## 1) Token réteg (single source of truth)

Meglévő alap: [`globals.css`](../src/app/globals.css) `@theme` blokk.

Bővítendő:

- **Semantic tokenek**: `--color-surface-card`, `--color-text-secondary`, `--color-action-primary-bg`, stb.
- **State tokenek**: success/warning/error/info és disabled/hover/focus.
- **Surface tokenek**: self/team/org kontextusra dedikált accent tokenek.
- **Motion tokenek**: közös transition duration/easing skála.
- **Radius/shadow/spacing skála**: komponensszintű konzisztens lépcsők.

Szabály:

- új UI kódba ne kerüljön új hardcoded hex (kivéve token definíció fájl).

## 2) Alap UI primitive réteg

Javasolt célmappa: `src/components/ui/primitives/`

Kötelező alapok:

- `Button` (primary/secondary/ghost/destructive + size + loading/disabled)
- `Card` / `Panel`
- `SectionEyebrow` + `SectionHeading`
- `StatusChip` / `Badge`
- `TextField`, `SelectField`, `TextareaField`
- `EmptyState`
- `InlineBanner` (info/warn/error/success)

Kiegészítő:

- központi `cn` helper (`src/lib/ui/cn.ts`)
- központi avatar megjelenítési policy (`src/lib/ui/avatar.ts`) a doodle avatarok kivezetésével

## 3) Shell és layout konszolidáció

- `NavBar` és `NavHeaderUI` konvergálása egy közös shell API felé.
- `PlatformPageShell` + dashboard panel primitívek egységesítése.
- Hero variánsok tokenizálása (`self/team/org`) külön “hero recipe” komponenssel.

---

## Végrehajtási terv (prioritással)

## Fázis 1 — Foundation (magas)

Feladatok:

- `ui/primitives/Button` + `Card` + `SectionEyebrow` bevezetése.
- `cn` helper bevezetése.
- doodle avatarok kivezetése és egységes avatar fallback (monogram + standard gradient) bevezetése.
- token policy dokumentálás: “nincs új hex a komponensekben”.

Done:

- legalább 3 nagy felület (org/team/profile) már ezeket használja.

## Fázis 2 — Token normalizáció (magas)

Feladatok:

- hardcoded színek mapelése semantic tokenekre.
- `globals.css` tokenstruktúra tisztítás (aliasok, nevezéktan).
- surface accent tokenek formalizálása (self/team/org).

Done:

- top 30 ismétlődő hex érték kiváltva tokennel.

## Fázis 3 — Pattern migration (magas)

Feladatok:

- panel és CTA receptek cseréje primitive-ekre:
  - org oldalak
  - team oldalak
  - profile/results
  - join/apply/observe
- form input stílusok egységesítése.

Done:

- `min-h-[44px]` és panel duplikációk legalább 50%-kal csökkennek.

## Fázis 4 — Navigation és shell (közepes)

Feladatok:

- `NavBar` + `NavHeaderUI` közös komponensmodellre húzása.
- Topbar/breadcrumb vizuális standardizáció.

Done:

- nincs párhuzamos nav design recipe.

## Fázis 5 — Guardrail & tooling (magas)

Feladatok:

- UI audit script (`scripts/ui-audit.mjs`) metrikákkal:
  - új hex használat
  - arbitrary class trend
  - duplikált recipe count
- CI warning/fail szabály új hardcoded style-okra (fokozatos bevezetéssel).
- rövid UI contribution guideline.

Done:

- PR-ben látható UI debt delta.

---

## Konkrét első backlog (quick wins)

1. Gombok egységesítése
- cserélendő hotspotok: org formok, campaign wizard, profile/results CTA-k, hiring CTA-k.

2. Panel recipe kiváltása `Card`-ra
- kezdés: org tabs + org settings + join oldalak.

3. Doodle avatar kivezetés + avatar helper konszolidáció
- érintett: `onboarding`, `org setup`, `observe`, `UserMenu`, `NavHeaderUI`, `ProfileHero`, `profile page`, `team/org/dashboard page`.

4. Eyebrow helper kivonás
- ismétlődő `font-mono ... text-bronze` pattern kiváltása.

5. Nav konvergencia RFC
- rövid döntésdokumentum: mi marad, mi deprecated.

---

## Kockázatok és mitigáció

Kockázat:

- vizuális regresszió nagy felületeken.

Mitigáció:

- blokkonkénti migráció (`test:blocks` + client snapshot jellegű céltesztek),
- kritikus entrypontokra Playwright smoke,
- fokozatos rollout guard.

Kockázat:

- túl agresszív “egységesítés” elveszi a surface-ek karakterét.

Mitigáció:

- tokenizált variánsok (self/team/org), nem teljesen uniform kinézet.

---

## Definition of Done (UI unification track)

- nincs új hardcoded hex komponensekben (token definíciót kivéve),
- központi Button/Card/Section primitives használata a fő flow-kban,
- doodle avatarok kivezetve a user-avatar flow-kból,
- nav/shell párhuzamok megszűnnek,
- CI quality gate mellett UI audit guardrail is aktív,
- onboardinghoz és fejlesztéshez rövid guideline elérhető.
