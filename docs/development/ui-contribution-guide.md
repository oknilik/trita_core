# UI Contribution Guide

## Cél

Ez a guide azt rögzíti, hogyan fejlesszünk konzisztens UI-t a Trita-ban úgy, hogy ne épüljön vissza a design debt.

Fő elv: **ugyanarra a mintára ugyanazt a primitive-et használjuk**.

## Rövid döntési fa

1. Ha létezik megfelelő primitive, azt használd.
2. Ha majdnem jó a primitive, inkább bővítsd (új `variant` / `size` / slot).
3. Csak akkor írj lokális receptet, ha egyszeri, erősen domain-specifikus UI-ról van szó.
4. Új színértékhez token kell, nem hardcoded hex.

## Mikor használj primitive-et

Használd kötelezően:

- Gombok: `src/components/ui/primitives/Button.tsx`
- Panel/kártya: `src/components/ui/primitives/Card.tsx`
- Szekció heading/eyebrow: `SectionHeading`, `SectionEyebrow`
- Státuszjelzés: `StatusChip` / `Badge`
- Form mezők: `TextField`, `SelectField`, `TextareaField`
- Inline üzenetek és üres állapotok: `InlineBanner`, `EmptyState`
- Layout header/chrome: `PlatformPageShell` `chrome` API

Ha egy új képernyőn ugyanaz a mintázat legalább 2 helyen megjelenik, az már primitive-jelölt.

## Mikor bővíts primitive-et

Bővíts primitive-et (és ne lokális class stringet), ha:

- a minta legalább két feature-ben használható,
- a különbség csak vizuális variáns (`variant`, `size`, `tone`),
- az interakciós állapotok (`hover`, `focus`, `disabled`, `loading`) azonosak,
- a komponens API-ja típusosan bővíthető regresszió nélkül.

Ne bővíts primitive-et, ha:

- a viselkedés teljesen domain-specifikus és egyszeri,
- a bővítés több kivételt hozna, mint egységesítést.

## Token szabályok

- Új komponensben **tilos** új hardcoded hex (`#...`) használat.
- Színezéshez semantic tokeneket használj (`var(--color-...)` / token utility class).
- Új színigény esetén előbb token javaslatot adj, utána primitive update.
- State UI (`success/warning/error/info`) token-alapú legyen, ne ad hoc Tailwind színmix.

Kapcsolódó dokumentum:

- `docs/ui-token-map.md`
- `docs/ui-hex-replacement-policy.md`

## Tiltott minták

- Hardcoded hex komponensfájlban.
- Ismétlődő `min-h-[44px]`/button recipe kézi másolása.
- Új lokális `joinClasses`/`mergeClasses` helper (használd a `src/lib/ui/cn.ts`-t).
- Ugyanazon panel recipe többszöri inline class stringgel.
- Page-level párhuzamos header/topbar rendszer a `PlatformPageShell` helyett.
- Doodle avatar használata user-avatar reprezentációként.

## Self / Team / Org variánsok

- Surface karakter különbség megengedett, de csak tokenizált variánsként.
- `self`, `team`, `org` eltérésekhez `surface` prop + surface tokenek használata kötelező.
- Ne használj ad hoc hexet vagy feature-specifikus “titkos” színreceptet surface megkülönböztetésre.

## Avatar szabály

- User avatar megjelenítéshez központi policy helper-t használj: `src/lib/ui/avatar.ts`.
- Doodle asset maradhat illusztrációként, de nem lehet user-avatar fallback.

## Guardrail és tooling

Lokális ellenőrzés:

- `pnpm audit:ui` – aktuális debt metrikák
- `pnpm audit:ui:write` – snapshot mentés
- `pnpm audit:ui:guardrail` – guardrail logika (warn/strict)
- `pnpm lint:ui:hex:new` – staged új hexek ellenőrzése

CI:

- PR-ben a UI audit summary artifact kötelezően jelenjen meg.
- Fokozatos rollout: `warn` mód után `strict` mód (hex fail + threshold fail).

## PR checklist (UI változásnál)

- Primitive használva, ahol elérhető.
- Nincs új hardcoded hex.
- Token-alapú színezés.
- Nincs indokolatlan új arbitrary class szaporulat.
- Self/team/org variáns tokenizált.
- UI audit output ellenőrizve (`audit:ui`).

## Source of truth

- Primitive truth: `src/components/ui/primitives/*`
- Shell/header truth: `src/components/layout/PlatformPageShell.tsx`
- Token truth: `src/app/globals.css` + token policy dokumentáció
- Avatar truth: `src/lib/ui/avatar.ts`


## Tipográfia és tokenek (2026-07-22, UI-egységesítés F1–F2)

- **Típus-skála**: új kódban a 7 szerep-utility használandó — `text-display`,
  `text-title`, `text-heading`, `text-body`, `text-caption`, `text-label`,
  `text-micro`. Arbitrary `text-[Npx]` új kódban kerülendő; 10px alatti méret
  lint-errort dob (kivétel: dekoratív, `aria-hidden` miniatűr, indokolt
  eslint-disable-lel).
- **Eyebrow (2026-08-05, modernizálás)**: `SectionEyebrow` primitív — az
  egységes alak mindenhol: tónus-színű pötty + `text-label` uppercase felirat.
  A korábbi mono „// szekció" stílus KIVEZETVE: új kódban se `font-mono`
  eyebrow, se „// " prefix (i18n értékben sem). Tónusok: `bronze` (default) ·
  `muted` · `self`/`team`/`org`/`candidate` (felület-akcent) · `onDark`
  (sötét hero-háttér, pl. `SurfaceHero` eyebrow-slot). Sűrű felsorolásban a
  pötty elhagyható (`dot={false}`); egyedi szemantikus színnél (pl. danger
  zóna rose) plain `text-label uppercase` + színosztály a minta. A régi
  `variant="mono"`/`"clean"` prop alias — mindkettő ugyanezt rendereli.
- **Breadcrumb**: a `PlatformPageShell` `chrome.breadcrumb` API-ja renderel —
  `nav[aria-label="Breadcrumb"]` + `ol` lista, `text-caption`/muted linkek
  chevron-szeparátorral, az utolsó (aktuális) elem `text-primary` + medium és
  `aria-current="page"`; a linkek 44px-es érintő-célúak, a hosszú címkék
  truncate-elnek. Oldal-oldalon csak `{ label, href? }` adatot adj át, saját
  morzsasávot ne építs.
- **Gomb/input**: `Button` és `TextField` primitív az inline `<button>`/
  `<input>` helyett — boy scout rule: amihez nyúlsz, azt átállítod.
- **Szín TS-oldalon**: `src/lib/design-tokens.ts` (COLORS / EMAIL_COLORS /
  PDF_COLORS) — a globals.css-sel a szinkront unit-teszt őrzi
  (tests/unit/design/design-tokens-sync.test.ts). PDF és email SOHA nem kap
  kézzel szórt hexet.
