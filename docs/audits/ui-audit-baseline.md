# UI Audit Baseline

## Cél

Kiinduló metrika-rögzítés a UI & Design Unification munkához, hogy a refaktor után mérhető legyen a debt csökkenése.

## Scope és mérési idő

- Dátum: `2026-04-01`
- Scope: `src/app` + `src/components`
- Scope fájlszám: `330` (`src/app`: `161`, `src/components`: `169`)
- Eszköz: `rg` (ripgrep), reprodukálható regex-alapú keresések

## Baseline metrikák

| Metrika | Érték | Megjegyzés |
|---|---:|---|
| Hardcoded hex színt tartalmazó fájlok száma | 119 | Regex: `#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\\b` |
| Arbitrary Tailwind (szín-orientált) fájlok száma | 133 | Regex: `\\b(?:bg|text|border|from|to|via)-\\[[^\\]]+\\]` |
| `min-h-[44px]` előfordulások száma | 143 | Ugyanazon recipe szétszóródott használata |
| `min-h-[44px]`-t tartalmazó fájlok száma | 66 | CTA/button pattern duplikáció |
| Panel recipe ismétlődés (exact match) | 37 | String: `rounded-2xl border border-sand bg-white p-6 shadow-sm` |
| Panel recipe-t tartalmazó fájlok száma | 19 | Exact string match |
| Eyebrow recipe ismétlődés (exact match) | 56 | String: `font-mono text-xs uppercase tracking-widest text-bronze` |
| Eyebrow recipe-t tartalmazó fájlok száma | 25 | Exact string match |
| Avatar helper duplikációs pontok (fájl) | 10 | `AVATAR_COLORS` vagy `getAvatarColor` |
| Nav/header párhuzamos implementációk | 2 | `NavBar` + `NavHeaderUI`, jelenleg együtt használva layoutban |

## Avatar helper duplikációs pontok

Az alábbi fájlokban van lokális avatar logika (`AVATAR_COLORS`/`getAvatarColor`):

- `src/app/dashboard/AdminDashboard.tsx`
- `src/app/org/[id]/page.tsx`
- `src/app/profile/page.tsx`
- `src/app/team/[id]/page.tsx`
- `src/components/MobileDrawer.tsx`
- `src/components/UserMenu.tsx`
- `src/components/layout/nav-header-ui.tsx`
- `src/components/results/ProfileHero.tsx`
- `src/components/team/TeamOverviewTab.tsx`
- `src/components/team/TeamPageShell.tsx`

## Nav/header párhuzam

- Implementációk:
  - `src/components/NavBar.tsx`
  - `src/components/layout/nav-header-ui.tsx`
- Aktív együttélés helye:
  - `src/app/layout.tsx`

## Reprodukciós parancsok

```bash
rg --files src/app src/components | wc -l
rg -l -P "#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\\b" src/app src/components | wc -l
rg -l -P "\\b(?:bg|text|border|from|to|via)-\\[[^\\]]+\\]" src/app src/components | wc -l
rg -o "min-h-\\[44px\\]" src/app src/components | wc -l
rg -l "min-h-\\[44px\\]" src/app src/components | wc -l
rg -o "rounded-2xl border border-sand bg-white p-6 shadow-sm" src/app src/components | wc -l
rg -l "rounded-2xl border border-sand bg-white p-6 shadow-sm" src/app src/components | wc -l
rg -o "font-mono text-xs uppercase tracking-widest text-bronze" src/app src/components | wc -l
rg -l "font-mono text-xs uppercase tracking-widest text-bronze" src/app src/components | wc -l
rg -l "AVATAR_COLORS|getAvatarColor" src | wc -l
rg -n "NavBar|NavHeaderUI|nav-header-ui" src
```

## Megjegyzés

Ez a baseline szándékosan “konzervatív”: exact-string és célzott regex metrikákat használ. A következő iterációban érdemes scriptesíteni (`scripts/ui-audit.mjs`), hogy PR-onként automatikus trend-diffet is kapjunk.
