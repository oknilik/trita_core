# ADR-0001 — Journey Engine mint központi döntési réteg

- Státusz: elfogadott
- Dátum: 2026-03-31
- Kapcsolódó fájlok: `src/lib/journey/context.ts`, `src/lib/journey/state.ts`, `src/lib/journey/home.ts`, `src/lib/journey/progress.ts`, `src/lib/journey/engine.ts`, `src/lib/journey/types.ts`

## Mi a cél?

A journey döntések (home route, stage, progress, CTA) egyetlen központi rétegből jöjjenek, ne route-onként és komponensenként külön `if/else` logikából.

Kötelező lánc:

`resolveJourneyContext() -> computeJourneyState() -> resolveHome() -> resolveNextAction()`

## Audit röviden (kiinduló állapot)

- Nem volt külön ADR/technikai doksi a journey engine-ről.
- A szabályok nagy része már kódban létezik a `src/lib/journey/*` modulokban.
- A cél ettől a ponttól: minden új fejlesztés ezt a központi contractot használja.

## Inputok (miből dolgozik az engine)

A `resolveJourneyContext(profileId, options)` aggregálja a journey döntéshez szükséges adatokat:

- entry intent (`JourneyEntryIntent`)
- assessment snapshot (started/completed/skipped/draft/result)
- aktív org membership és role
- team membership
- pending join invite + pending invite countok
- subscription state (`active | restricted | frozen | none`)
- team/org completion summary
- current context (`self-only | org-member | org-manager | org-admin`)

Ez az aggregált input a `JourneyContextSnapshot`.

## Output contract (mi jön ki belőle)

A publikus, UI-nak szánt stable handoff contract: `JourneyHandoffContract`
(`src/lib/journey/types.ts`), amelyet a `JourneyResolution` is implementál.

Kötelező handoff mezők:

- `activeSurface`
- `stage`
- `destination`
- `reason`
- `nextBestAction`
- `scopeProgress`
- `experienceHints`
- `restrictionFlags` (subscription/read-only/frozen guardrail flags)

A teljes `JourneyResolution` ezen felül tartalmazza a bővebb kontextust:

- `entryIntent`
- `currentContext`
- `stageDisplay` (`label`, `scopeProgress`, opcionális `substeps`)
- `home` (`destination`, `reason`, opcionális `primaryAction`) backward compatibility miatt
- `state`

Következmény: a UI ugyanabból az objektumból tud nav/home/CTA/progress döntéseket hozni.

## Védőkorlátok (mit NEM szabad)

1. Nincs duplikált home decision logika a UI-ban vagy route-ban.
2. Nem szabad lokálisan újraimplementálni a stage számítást.
3. Nem szabad route-specifikus, hardcoded post-join home redirectet tartani.
4. Nem szabad túl sok UI-specifikus boolean hintet az engine outputba tenni.

Első körben csak a valóban cross-cutting hint-ek maradnak:

- `showOrgExpansionPrompt`
- `showTeamCreationBanner`
- `showAssessmentContinuation`

## Kötelező felhasználási minta

- Belépési pontok (`/dashboard`, join utáni landing, signed-in home link) a `resolveJourney()` outputját használják.
- A komponensek a `home.destination`, `home.reason`, `stage`, `nextBestAction` alapján renderelnek.
- Ha új szabály kell home/stage/CTA témában, azt a journey engine moduljaiban kell implementálni, nem komponens-szinten.
