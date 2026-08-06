# UI Hardcoded Hex Replacement Policy

> **2026-08-05 óta a kanonikus szín-rendszer és a jelentés-alapú szabályok:
> `docs/development/color-system-2026-08.md`.** Ez a doksi a 2026-04-es
> érték-alapú (hex→token) csere történeti leírása; a szabályt ma a
> `scripts/check-colors.mjs` guardrail (kivezetett hexek tiltólistája +
> nyers-hex keret, `pnpm check:colors` a `pnpm check` részeként) és a
> `design-tokens-sync` teszt kényszeríti ki. TS-oldali szemantikus térképek:
> `src/lib/color-system.ts` (DIMENSION_COLORS · TEAM_ROLE_FAMILIES ·
> LAYER_THEMES · EVAL_RAMP).

## Cél

Megszüntetni a komponensszintű hardcoded hex színezést, és a színhasználatot központi tokenekre terelni.

## Szabály

1. Új komponenskódban hardcoded hex (`#...`) tiltott.
2. Színhez mindig tokenes hivatkozás használható:
 - Tailwind token class (pl. `text-text-primary`, `bg-surface-card`)
 - `var(--color-...)` referencia inline style / arbitrary class esetén
3. Kivétel:
 - `src/app/globals.css` (token definíciós forrás)
 - ha ideiglenes technikai okból még szükséges, TODO indoklással.

## Első migráció (3.6)

A top 30 leggyakoribb hex érték tokenre lett cserélve a UI scope-ban:

- scope: `src/components` + `src/app` (UI réteg, `globals.css` és `app/api` kivételével)
- eredmény: a top 30 hexre `0` találat maradt ebben a scope-ban

## Top 30 mapping (canonical)

| Hex | Token |
|---|---|
| `#8a8a9a` | `--color-text-muted` |
| `#3d6b5e` | `--color-action-primary-bg` |
| `#e8e0d3` | `--color-border-default` |
| `#c17f4a` | `--color-accent-primary` |
| `#1a1a2e` | `--color-text-primary` |
| `#4a4a5e` | `--color-text-secondary` |
| `#f2ede6` | `--color-surface-subtle` |
| `#ddd5c8` | `--color-border-soft` |
| `#1e3d34` | `--color-accent-self-deep` |
| `#e8f2f0` | `--color-surface-self-accent-soft` |
| `#e8a96a` | `--color-accent-primary-soft` |
| `#8a5530` | `--color-accent-primary-strong` |
| `#f7f4ef` | `--color-surface-canvas` |
| `#6366f1` | `--color-visual-gradient-indigo` |
| `#fdf5ee` | `--color-surface-highlight-warm` |
| `#10b981` | `--color-state-success-strong` |
| `#5a8f7f` | `--color-accent-self` |
| `#ffffff` | `--color-neutral-white` |
| `#8b5cf6` | `--color-visual-gradient-violet` |
| `#2a5244` | `--color-accent-self-strong` |
| `#f59e0b` | `--color-state-warning-strong` |
| `#f8f1e8` | `--color-surface-soft-warm` |
| `#eee` | `--color-border-neutral` |
| `#9333ea` | `--color-visual-gradient-purple` |
| `#7c22cb` | `--color-visual-gradient-purple-deep` |
| `#6b3f22` | `--color-accent-earth-strong` |
| `#4f46e5` | `--color-visual-gradient-indigo-deep` |
| `#33334a` | `--color-text-strong-alt` |
| `#0e7490` | `--color-visual-cyan` |
| `#0c5e75` | `--color-visual-cyan-deep` |

## Gyors ellenőrzés parancsok

```bash
# Top 30 ellenőrzés UI scope-ban
rg -o --no-filename -P "#(?:8a8a9a|3d6b5e|e8e0d3|c17f4a|1a1a2e|4a4a5e|f2ede6|ddd5c8|1e3d34|e8f2f0|e8a96a|8a5530|f7f4ef|6366f1|fdf5ee|10b981|5a8f7f|ffffff|8b5cf6|2a5244|f59e0b|f8f1e8|eee|9333ea|7c22cb|6b3f22|4f46e5|33334a|0e7490|0c5e75)\\b" \
  src/components src/app --glob '*.{tsx,ts,css}' --glob '!src/app/globals.css' --glob '!src/app/api/**'

# Általános hex audit
rg -n -P "#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\\b" src/components src/app --glob '*.{tsx,ts,css}'
```
