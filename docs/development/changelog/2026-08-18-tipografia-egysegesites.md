# 2026-08-18 — Tipográfiai egységesítés: a skála lezárása (F4)

> Az arbitrary `text-[Npx]` osztályok kivezetése a `src/`-ből. Kiinduló
> állapot (`main` @ `ca61bad`): **614 arbitrary érték 33 különböző méreten**.
> Végállapot: **3** — mind a három szándékos, `aria-hidden` dekoratív
> miniatűr az `AssessmentClient`-ben, sor-szintű lint-kikapcsolással.

## Miért akadt el eddig

A 2026-07-22-i terv (F1–F3) három migrációt befejezett (10px → `text-micro`,
13px → `text-caption`, 8–9px kivezetve), de a maradék 62%-a **381 hely** a
11–12px-es sávban ült, ahol a skálának **nem volt sima szöveg-szerepe**:
a lépcső `body` 15 → `caption` 13 → `label` 11 (csak uppercase) → `micro` 10.
Ez rendszer-hézag volt, nem hanyagság — a `text-label` (0.14em tracking +
600-as súly) rossz válasz egy sima kisbetűs 11px-es lábjegyzetre.

## Döntések (felhasználói, 2026-08-18)

1. **A Tailwind alap-fokok legitimek** a szerep-skála mellett. A szerep-skála
   a *szándékot* hordozza (eyebrow, folyószöveg, címsor), az alap-fokok a
   semleges méretezést. Így a 12px → `text-xs` és 14px → `text-sm` csere
   pontos, nulla vizuális változással.
2. **Új `text-note` szerep (11px)** — a `text-label` kisbetűs párja,
   tracking és súly nélkül. Ez zárja be a rendszer-hézagot.
3. **Címsor-fokok: marad a három + egy hero-fok** (`text-hero`, 42px). Minden
   szórt címsor-méret a legközelebbi fokra kerekedik.

## Skála-bővítés (`src/app/globals.css`)

| token | méret | line-height | megjegyzés |
|---|---|---|---|
| `--text-hero` | 42px | 1.08 (−0.015em) | ÚJ — landing/auth hero-címek |
| `--text-note` | 11px | 1.45 | ÚJ — sima kisbetűs kis szöveg |

A skála így: `hero` 42 · `display` 34 · `title` 26 · `heading` 20 · `body` 15
· `caption` 13 · `note` 11 · `label` 11 (uppercase) · `micro` 10.

## Migráció — mi hova ment

**Pontos cserék (nulla vizuális változás):**

| forrás | cél | hely |
|---|---|---:|
| `text-[12px]` | `text-xs` | 136 |
| `text-[14px]` | `text-sm` | 24 |
| `text-[16px]` | `text-base` | 11 |
| `text-[11px]` (nem uppercase) | `text-note` | 215 |
| `text-[15px]` | `text-body` | 5 |
| `text-[13px]` | `text-caption` | 2 |
| `text-[10px]` | `text-micro` | 1 |

**Eyebrow-egységesítés (30 hely).** A 30 uppercase `text-[11px]` →
`text-label`, és mellőlük **törölve a fölöslegessé vált kézi
`tracking-widest` / `tracking-wide` / `tracking-wider` és
`font-semibold` / `font-medium`** — ezeket a utility hozza (0.14em, 600).
Ez a terv „EGYETLEN tracking" célja: az eddigi 3 tracking-variáns helyett
egy recept. Szándékos `font-bold` maradt, ahol volt (2 hely, pricing).

**Címsor-kerekítés (~150 hely) — ITT VAN VIZUÁLIS VÁLTOZÁS.** A 20 különböző
címsor-méret a legközelebbi fokra ment:

| sáv | cél | hely | legnagyobb eltérés |
|---|---|---:|---|
| 17–22px | `text-heading` (20) | 96 | 22 → 20 (−2px, 46 hely) |
| 23–30px | `text-title` (26) | 65 | 30 → 26 (−4px, 7 hely) |
| 31–36px | `text-display` (34) | 14 | 36 → 34 (−2px) |
| 40–52px | `text-hero` (42) | 12 | 52 → 42 (−10px, 1 hely: `CareerFakeDoor` stat-szám) |

A kézi `leading-*` és `tracking-*` toldalékok a címsorokon MARADTAK — a
Tailwind v4-ben a `text-*` utility `var(--tw-leading, …)`-en keresztül olvassa
a line-height-ot, tehát az explicit `leading-*`/`font-*` továbbra is felülír,
a szándékolt sűrűség nem változik.

## A lint-kapu megszorítva

A `no-restricted-syntax` eddig **kizárólag** a 10px alatti méretet tiltotta
(a11y-padló) — minden `≥10px` arbitrary érték átment, tehát a lint zöld
maradt akkor is, ha valaki rontott a helyzeten. Mostantól a szabály **minden**
`text-[Npx]`-re szól, mert a skála + a Tailwind alap-fokok együtt már lefedik
a valós szerepeket. A három szándékos dekoratív kivétel a meglévő sor-szintű
kikapcsolással megy át változatlanul.

## Nem érintett

- `src/components/pdf/` — pt-alapú, saját méretskála; külön, render-verifikált
  kört igényel (a terv F5-je).
- `src/lib/emails.ts` — inline stílus, nem Tailwind.
- Az `AssessmentClient` 5/6/7px-es dekoratív miniatűrje.

## Ellenőrzés

`pnpm check` (type-check + lint + check:colors) tiszta, `pnpm test:unit`
1046/1046, `pnpm test:client` 211/211 zöld.
