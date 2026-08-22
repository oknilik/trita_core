# 2026-08-22 — Blog-vizuál: három párhuzamos kézírás

A blogképek korábban négy technikai motívumból (`radar`, `network`, `bars`,
`waves`) választottak. A variáció seedet cserélt, de a kompozíciós nyelv alig
változott; az admin pedig egyszerre csak egy véletlen következő képet mutatott.

## Két független tengely

Az új modell elválasztja a **kézírást** a **jelentéstől**:

| tengely | értékek | szerep |
|---|---|---|
| `artFamily` | `constellation`, `modular`, `flow` | hogyan rajzolunk |
| `artConcept` | `connection`, `balance`, `tension`, `threshold`, `signal`, `growth` | milyen viszonyt mutat a jelenet |
| `artSeed` | 1–9999 | családon és fogalmon belüli stabil variáció |

Így ugyanaz a „feszültség” lehet széttartó konstelláció, egymásnak feszülő
lágy-geometrikus mező vagy hurkolódó élő vonal. A paletta, a tinta, a nap,
az ellensúly és a talajgesztus közös marad, ezért a három út nem három külön
arculat.

## Automatikus és szerkesztői választás

- Család nélkül a slug determinisztikusan választ a három irányból.
- Fogalom nélkül a cím, a tagek és a slug ad stabil becslést.
- Az admin hat előnézetet mutat egyszerre, családonként kettőt; a szerkesztő
  fogalmat is választhat, vagy mindent automatikán hagyhat.
- A választás frontmatterbe kerül, ezért buildtől és renderelési időponttól
  függetlenül ugyanaz marad.

A korábbi explicit `artMotif` értékek a régi rajzolót használják. Az új mezők
elsőbbséget élveznek, az admin új választásnál már nem ír legacy motívumot.

## Egy jelenet, négy felület

Ugyanaz a `BlogArtVisual` rajzolja a bloglistát, a cikkoldalt, az OG-képet és
a hírlevél stabil borító-route-ját. Az OG-hívó csak a CSS-tokenek feloldott
színértékeit adja át; a geometria és a seed változatlan.

Satori-kompatibilitási szabály: az SVG-be csak natív SVG-elemek kerülhetnek.
A képcsaládok tiszta renderer-függvényei ezért a fő komponensben futnak le;
ellenkező esetben a szerveroldali képmotor a komponens forrását tenné a data
URL-be, és a böngészős kép eltérne a hírlevél/OG kimenettől.

## Formanyelvi korlát

A hat jelentő HEXACO-alakzat továbbra sem dekoráció. A blogképek a meglévő
szerkesztői (2. szintű) formakészletből, illetve absztrakt mezőkből és
vonalakból dolgoznak; nem sugallnak mérési eredményt.

## Guardrail

- egységteszt védi a szemantikai becslést, determinisztikát, explicit
  felülbírálást, legacy kompatibilitást és a 2×3 admin jelöltet;
- komponens-teszt védi a három eltérő SVG-családot és az akadálymentes
  dekorációs viselkedést;
- valódi 1200×630-as raszterrel ellenőrzött az OG/hírlevél közös vászna.
