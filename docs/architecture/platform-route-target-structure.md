# Platform Route Target Structure (Task 15)

## Célstruktúra

Ez a célhierarchia a self / team / org nézeteket egy közös platform namespace alá rendezi:

- `/platform/home`
- `/platform/self/...`
- `/platform/team/...`
- `/platform/org/...`
- `/journey/state`
- `/assessment-layers/...`

## Jelenlegi bevezetés (részleges, non-breaking)

Az alábbi célroute-ok már léteznek, de a legtöbb jelenleg a meglévő page-eket használja újra:

- `/platform` → redirect `/platform/home`
- `/platform/home` → dashboard route logika (re-export)
- `/platform/self` → redirect `/platform/self/results`
- `/platform/self/results` → self result page (re-export)
- `/platform/team` → team list page (re-export)
- `/platform/team/[id]` → team detail page (re-export)
- `/platform/org` → org redirect page (re-export)
- `/platform/org/[id]` → org detail page (re-export)
- `/journey/state` → ugyanaz a handler, mint `/api/journey/state`
- `/assessment-layers`
- `/assessment-layers/[slug]`

## Mapping terv (legacy → target)

- `/dashboard` → `/platform/home`
- `/profile/results` → `/platform/self/results`
- `/team` → `/platform/team`
- `/team/[id]` → `/platform/team/[id]`
- `/org` → `/platform/org`
- `/org/[id]` → `/platform/org/[id]`
- `/api/journey/state` → `/journey/state`

## Migrációs útvonal

### Phase 1 (elkészült)

- Célroute-ok létrehozása non-breaking módon.
- Közös journey state endpoint path alias (`/journey/state`) bevezetése.
- Assessment-layer route namespace előkészítése.

### Phase 2 (következő lépés)

- Belső linkek (CTA-k, nav, dashboard actionök) átállítása target route-okra.
- Legacy route-ok megtartása 302/307 redirect bridge-ként.
- Aktivitás mérés: legacy path hit-ek monitorozása.

### Phase 3 (stabilizáció)

- Canonical route-ok target path-re.
- Legacy route-ok fokozatos kivezetése.
- Route-level access policy és breadcrumbs harmonizálása.

## Megjegyzés

A mostani állapot tudatosan "bridge mode": nem tör semmit, de már kijelöli és működővé teszi a célstruktúrát.
