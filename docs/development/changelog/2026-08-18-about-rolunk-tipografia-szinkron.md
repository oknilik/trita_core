# 2026-08-18 — `/about` és `/rolunk`: tipográfiai szinkron a többi laphoz

> Felhasználói jelzés: „a betűméretek túl nagyok a többi oldalhoz képest".
> A két lap a régi, kézzel írt `clamp()`-eknél maradt, miközben a tipográfiai
> audit #7 közös fluid léptéket vezetett be — a landing/blog/pricing átment,
> ez a kettő kimaradt.

## Mit mértünk

A marketing-felület két tipográfiai családra hasadt. Számított értékek
(`font-size/line-height`, px) **1280px-es viewportnál, csere ELŐTT**:

| szerep | landing / pricing / blog | `/about` | `/rolunk` |
|---|---|---|---|
| hero H1 | `text-fluid-display` → **60** | `clamp(2.6rem,7vw,4.6rem)` → **73,6** | `clamp(2.4rem,6vw,4.2rem)` → **67,2** |
| szekció H2 | `text-fluid-title` → **42** | `clamp(2.1rem,4.5vw,3.4rem)` → **54,4** | `…,3.2rem)` → **51,2** |
| záró CTA H2 | 42 | 48 | 48 |
| kártya H3 | `text-lg` → 16–18 | `text-title` → **26** | `text-title` → **26** |
| lead bekezdés | `text-base` → 16 | `text-lg` + `md:text-heading` → **20** | ugyanaz → **20** |
| törzsszöveg | `text-body`/`text-base` → 15–16 / 1.65 | `text-base leading-8` → 16 / **32** | `md:text-lg` → 18 / **33** |

A `leading-8` (2.0-ás arány) az egész `src/`-ben csak három fájlban élt:
about (13×), rólunk (5×), pilot (5×). A **függőleges ritmus** adta a
„túl nagy" érzet nagyobb részét, nem a glyph-méret.

## Mi változott

**Címsorok → a meglévő `@utility` fluid lépték** (nincs új token):
`text-fluid-display` (44→60) a hero H1-re, `text-fluid-title` (28→42) a
szekció- és CTA-H2-kre. A kézi `leading-[…]` mindenhol törölve — a utility
hozza (1.06 / 1.1).

**Kártya-címsorok**: `text-title` (26) → `text-heading` (20), a melléjük
ragadt `leading-tight` törölve (a recept 1.25-öt hoz, ez pontosan az).

**Folyószöveg (editorial szint)**: a törzsszöveg `text-base` (16) marad — ez
a landing hero-leadjének mérete —, de a `leading-8`/`leading-7` helyére
`leading-relaxed` kerül. A lead bekezdésről lejön a `text-lg` és a
`md:text-heading`; utóbbi külön hiba is volt: a `text-heading` recept saját
`line-height`-ot hoz, ami `md:`-nél ütközött a `leading-[1.8]`-cal.
A `/rolunk` story-bekezdéseiről lejön a `md:text-lg md:leading-[1.85]`
felskálázás — sehol máshol nem skálázódik felfelé folyószöveg `md:`-nél.

**Chipek**: az about hero `MetaChip`-je `text-sm` → `text-caption`, hogy az
oldalon belül is egyezzen a többi chippel.

## Számított értékek csere UTÁN (böngészőben mérve)

| viewport | oldal | H1 | szekció H2 | törzs p |
|---|---|---|---|---|
| 390px | landing | 44/47 | 28/31 | 16/26 |
| 390px | about | **44/47** | **28/31** | **16/26** |
| 390px | rólunk | **44/47** | **28/31** | **16/26** |
| 1280px | landing | 60/64 | 42/46 | 16/26 |
| 1280px | about | **60/64** | **42/46** | **16/26** |
| 1280px | rólunk | **60/64** | **42/46** | **16/26** |

Vízszintes görgetés egyik szélességen sincs. A `max-w-[Nch]` korlátok
szándékosan érintetlenek: a `ch` a betűmérettel skálázódik, tehát a
sortörések karakterszáma változatlan.

## A lint-kapu bővítve

A `no-restricted-syntax` eddig csak a `text-[Npx]` mintát fogta, a
`text-[clamp(...)]` átcsúszott rajta — ezért maradhatott bent 12 kézi
clamp 4 fájlban. Az új szelektor a `text-[clamp(`-ra is szól.

Két fájl kivétel (`ignores`): a `/pilot` és a `/contact` hero-léptéke az
audit #7 lezáró döntése szerint **szándékosan** egyedi maradt. A px-tiltás
rájuk is érvényes marad.

> Figyelem: a flat config nem fűzi össze a rule-opciókat — a második
> `no-restricted-syntax` blokk teljesen felülírja az elsőt, ezért a
> px-szelektorokat is viszi.

## Nem érintett

- `/pilot`, `/contact` — szándékos hero-outlierek (audit #7).
- i18n kulcsok és tartalom: nulla változás.

## Ellenőrzés

`pnpm check` (type-check + lint + check:colors) tiszta; `pnpm test:unit`
1046/1046, `pnpm test:client` 211/211 zöld. Vizuális ellenőrzés: dev-szerver
statikus pillanatképe böngészőben, 390 és 1280px, `/`, `/about`, `/rolunk`,
`/how-we-work`.
