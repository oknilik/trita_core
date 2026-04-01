# UI Token Map (globals.css audit)

## Cél

A jelenlegi `src/app/globals.css` `@theme` blokk auditja, és a hiányzó tokenkészlet megnevezése, hogy a token-architektúra normalizálása tervezhető legyen.

## Scope

- Dátum: `2026-04-01`
- Források:
  - `src/app/globals.css`
  - `src/lib/design-tokens.ts`
  - `src/app` + `src/components` használati minták (`rg` audit)

## Rövid állapotkép

| Kategória | Állapot | Megjegyzés |
|---|---|---|
| Semantic color tokenek | Részleges | Brand palette van, szemantikus alias réteg hiányos |
| State tokenek | Hiányzik | `success/warning/error/info` nincs tokenizálva a `@theme`-ben |
| Surface tokenek | Részleges | Alap surface színek vannak, de komponens/scope-szemantika hiányos |
| Motion tokenek | Hiányzik | Keyframe-ek vannak, de duration/easing token skála nincs |
| Radius tokenek | Hiányzik | Radius lépcső nincs központi tokenként megadva |
| Shadow tokenek | Hiányzik | Shadow lépcső nincs tokenizálva |
| Spacing tokenek | Hiányzik | Központi spacing token skála nincs, utility-szintű ad hoc használat dominál |

### Audit bizonyíték (gyors metrikák)

- Hardcoded hex-et tartalmazó fájlok (`src/app` + `src/components`): `119`
- Arbitrary color utility-t tartalmazó fájlok: `133`
- Arbitrary radius utility-t tartalmazó fájlok: `31`
- Arbitrary shadow utility-t tartalmazó fájlok: `27`
- Arbitrary spacing utility-t tartalmazó fájlok: `34`

---

## 1) Semantic color tokenek

## Jelenlegi (`globals.css`)

- Van stabil brand/palette szint:
  - `--color-sage-*`
  - `--color-bronze-*`
  - `--color-ink-*`
  - `--color-cream/sand/warm-*`
- Van page-specifikus rész (`--color-founding-*`).

## Hiány

- Nincs egyértelmű semantic alias-réteg:
  - text role-ok (`primary/secondary/muted/inverse`)
  - action role-ok (`primary/secondary/ghost/destructive`)
  - border role-ok (`default/strong/subtle`)
  - interactive role-ok (`hover/active/focus ring`)

## Javasolt minimál semantic készlet

- `--color-text-primary`
- `--color-text-secondary`
- `--color-text-muted`
- `--color-text-inverse`
- `--color-border-default`
- `--color-border-strong`
- `--color-border-subtle`
- `--color-action-primary-bg`
- `--color-action-primary-fg`
- `--color-action-primary-hover`
- `--color-action-secondary-bg`
- `--color-action-secondary-fg`
- `--color-focus-ring`

---

## 2) State tokenek

## Jelenlegi

- `@theme` szinten nincs state token (`success/warning/error/info`).
- Használat jelenleg ad hoc utility-kkel történik (`rose/amber/emerald/blue` classok), több komponensben szétszórva.

## Hiány

- Nincs központi state mapping:
  - banner
  - chip/badge
  - field error
  - subtle state background

## Javasolt minimál state készlet

- `--color-state-info-bg`, `--color-state-info-fg`, `--color-state-info-border`
- `--color-state-success-bg`, `--color-state-success-fg`, `--color-state-success-border`
- `--color-state-warning-bg`, `--color-state-warning-fg`, `--color-state-warning-border`
- `--color-state-error-bg`, `--color-state-error-fg`, `--color-state-error-border`

---

## 3) Surface tokenek

## Jelenlegi

- Vannak alap surface színek: `cream`, `sand`, `warm`, `warm-mid`, `warm-dark`.

## Hiány

- Nincs surface role-réteg:
  - app canvas
  - card/panel
  - muted panel
  - elevated/overlay
- Nincs tokenizált surface-karakter a scope-okhoz (`self/team/org`) közös nevezéktannal.

## Javasolt minimál surface készlet

- `--color-surface-canvas`
- `--color-surface-card`
- `--color-surface-muted`
- `--color-surface-overlay`
- `--color-surface-elevated`
- `--color-surface-self-accent`
- `--color-surface-team-accent`
- `--color-surface-org-accent`

---

## 4) Motion tokenek

## Jelenlegi

- Vannak globális keyframe-ek (`fade-in`, `float`, `gradient`), de a duration/easing értékek hardcodedok.
- Komponensekben inline és utility mix: `duration-150/200/300/500/700`, inline `animation`/`transition`.

## Hiány

- Nincs központi motion skála.
- Nincs standard easing token.

## Javasolt minimál motion készlet

- `--motion-duration-fast` (`~150ms`)
- `--motion-duration-base` (`~250ms`)
- `--motion-duration-slow` (`~400ms`)
- `--motion-ease-standard`
- `--motion-ease-emphasized`
- `--motion-ease-exit`

---

## 5) Radius tokenek

## Jelenlegi

- Radius utility használat bőséges (`rounded-lg/xl/2xl/full` + arbitrary), de nincs token-réteg.

## Hiány

- Nincs központi radius lépcső komponens API-hoz.

## Javasolt minimál radius készlet

- `--radius-sm`
- `--radius-md`
- `--radius-lg`
- `--radius-xl`
- `--radius-2xl`
- `--radius-pill`

---

## 6) Shadow tokenek

## Jelenlegi

- Shadow használat vegyes:
  - Tailwind default (`shadow-sm/md/lg/xl`)
  - arbitrary shadow-k (`shadow-[...]`) több fájlban.
- Nincs központi shadow skála tokenizálva.

## Hiány

- Nincs egységes elevation modell.

## Javasolt minimál shadow készlet

- `--shadow-sm`
- `--shadow-md`
- `--shadow-lg`
- `--shadow-xl`
- `--shadow-focus`

---

## 7) Spacing tokenek

## Jelenlegi

- Spacing utility-k széles körűek (`p-*`, `m-*`, `gap-*`), több helyen arbitrary spacing (`[...px]`) is van.
- Nincs komponensszintű, tokenizált spacing lépcső.

## Hiány

- Nincs standard “component spacing contract” (pl. field gap, card padding, section gap).

## Javasolt minimál spacing készlet

- `--space-1`, `--space-2`, `--space-3`, `--space-4`, `--space-5`, `--space-6`
- `--space-8`, `--space-10`, `--space-12`
- Semantikus aliasok:
  - `--space-field-gap`
  - `--space-card-padding`
  - `--space-section-gap`
  - `--space-stack-gap`

---

## Gap összegzés (Current vs Needed)

| Kategória | Current | Needed |
|---|---|---|
| Semantic color | Palette tokens | Semantic alias + role alapú mapping |
| State | Ad hoc utility class-ok | Központi state bg/fg/border tokenek |
| Surface | Base surface palette | Role- és scope-alapú surface tokenek |
| Motion | Hardcoded timing mix | Központi duration + easing skála |
| Radius | Utility-only | Tokenizált radius lépcső |
| Shadow | Utility + arbitrary mix | Tokenizált elevation lépcső |
| Spacing | Utility + arbitrary mix | Tokenizált spacing + semantic aliasok |

---

## Megjegyzés a source-of-truth-ról

Jelenleg a színértékek két helyen élnek:

- `src/app/globals.css` (`@theme`)
- `src/lib/design-tokens.ts`

Rövid távon ez működőképes, de drift-kockázatot jelent. A következő lépésben érdemes a JS token exportot a CSS tokenforrásból generálni vagy erős validációval szinkronban tartani.

---

## Következő lépés (3.2 előkészítés)

1. State + semantic color tokenek bevezetése `globals.css`-be.
2. `InlineBanner`, `StatusChip`, `TextField` state-ek átállítása semantic/state tokenekre.
3. Radius/shadow/spacing token skála bevezetése a primitive rétegben.
4. Hardcoded status színek fokozatos kiváltása (warning/error/success/info).
