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

## Formanyelv — három szint (2026-08-09)

Az absztrakt ábrák **három szinten** élnek, és a szintek nem keverhetők.
Ez nem stílus-, hanem hitelességi szabály: a jelentés-hígulás
visszafordíthatatlan.

| Szint | Készlet | Modul | Mikor rajzolható |
|---|---|---|---|
| 1. jelentő | hat alapforma + hat motívum | `src/lib/type-glyph.ts` | **csak** valódi pontszám mellett |
| 2. szerkesztői | folt, holdsarló, ék, létra, ívsor, pontsor, lencse | `src/lib/editorial-art.ts` | bárhol, ahol illusztráció kell |
| 3. textúra | csillag, nap, ellensúly, talajvonal | `src/lib/miro-primitives.ts` | bárhol, dekorációként |

- **A hat alapforma dekorációként tilos.** Cikkfejlécre, üres állapotra,
  landing-szekcióra a 2. vagy 3. szint való. Ha jelentő formát tennél
  dekorációba, az azt üzeni az olvasónak, hogy a profil-ábra sem jelent
  semmit.
- **A `type-glyph.ts` szándékosan nem importál a közös modulból** — a
  level-1 geometria befagyasztva marad, hogy egy szerkesztői hangolás soha
  ne tudja elmozdítani a profil-ábrát. A közös elem a szabály, nem a kód.
- **Méret-mód kötelező**: `resolveArtScale(width, height)`. 140px alatt
  (a NAGYOBBIK oldalra nézve) elmarad a kíséret — 72 pixelen a csillag, a
  nap és a talajvonal masszává olvad.
- **Szövegre ülő kompozíciónál** `textSafeCorner` (kiemelt kártya, hero),
  **elválasztónál** `quiet`. Sötét panelen — ami MINDKÉT sémán sötét —
  `ART_COLORS_ON_INVERSE`, különben a tintavonal eltűnik.
- **Ha szöveg ül az ábrán, az ábra FELSŐ SÁV, a szöveg alatta kap tiszta
  mezőt** — és kell alá fátyol. Szabad szövegnél (pl. `heroQuote`) a hossz
  nem korlátozható: mobilon egy hosszabb mondat öt sorra nyúlva a panel
  kétharmadát elfoglalja, tehát nincs olyan sarok, amit geometriával
  szabadon lehetne hagyni. A fátyol mindig a panel SAJÁT alapszínéből
  dolgozzon, hogy a tónus ne változzon, csak mélyüljön.
- **`preserveAspectRatio="slice"` mellett számolj a vágással.** A 420×260-as
  hero-vászon mobilon egy ~358×270-es panelbe kerül: oldalanként ~9% eltűnik.
  A szélső horgonyok 0.86 fölé ne kerüljenek, különben telefonon
  félbevágódnak. Unit-teszt őrzi (`editorial-art.test.ts`).
- Új ábra előtt futtasd az előnézetet: `npx tsx scripts/preview-editorial-art.ts`
  (mindkét séma, minden méret-mód egy lapon).
- Az ábrák `aria-hidden` dekorációk. Ha egy ábra tartalmat hordoz (típus-ábra),
  ott `role="img"` + leíró `aria-label` kötelező — ld. `glyphDescription()`.

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


## Tipográfia és tokenek (2026-07-22 F1–F2, 2026-08-18 F4)

- **Típus-skála**: a 9 szerep-utility — `text-hero` (42) · `text-display`
  (34) · `text-title` (26) · `text-heading` (20) · `text-body` (15) ·
  `text-caption` (13) · `text-note` (11, sima kisbetűs) · `text-label` (11,
  uppercase eyebrow: 0.14em + 600) · `text-micro` (10, a padló).
  Mellettük a **Tailwind alap-fokok legitimek** (`text-xs` 12 · `text-sm` 14
  · `text-base` 16): a szerep-utility a SZÁNDÉKOT jelöli (eyebrow, folyószöveg,
  címsor), az alap-fok a semleges méretezést. Ha van rá szerep, azt használd.
- **Arbitrary `text-[Npx]` tilos** — lint-error (`no-restricted-syntax`),
  nem csak a 10px alattiakra. Egyetlen kivétel: dekoratív, `aria-hidden`
  miniatűr, indokolt sor-szintű lint-kikapcsolással.
- **A skála RECEPT, nem méret**: a `text-label` betűközt (0.14em) és súlyt
  (600) is hoz, a `text-body`/`caption`/`note` line-height-ot. Cserénél a
  mellette maradt kézi `tracking-*`/`font-*` törlendő — különben csak
  átneveztük a problémát. (Explicit `leading-*`/`font-*` felülír: a Tailwind
  v4 `var(--tw-leading, …)`-en át olvassa a recept-értéket.)
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

## Levél (2026-08-19)

A levél a **harmadik médium** a web és a PDF mellett: ugyanaz a rendszer,
saját fordítással (inline hex, mert a CSS-változó kliens-támogatása
megbízhatatlan). Teljes szabály-készlet: `docs/development/email-design.md`.

- **Levél-HTML csak `src/lib/emails.ts`-ben komponálódik** — route-ban, action-ben
  soha. A közös keret a `buildEmailLayout`; saját `<html>` váz tilos.
- **Az `EmailLayoutParams` kötelezővé teszi** az `eyebrow` · `heading` ·
  `preheader` · `kind` · `family` · `signOff` mezőt. Ez a szerződés a
  típusban él: a korábbi szórás (21 hívásból 8 címsor) abból állt elő, hogy
  ezek opcionálisak voltak.
- **Bronz felületre TINTA felirat kerül, sosem fehér** (3,28:1 vs. 5,20:1) —
  ugyanaz a szabály, mint a weben a `--palette-text-on-accent`-nél. Az
  elsődleges akció zsálya.
- **Fok-létra**: 34 · 26 · 16 · 14 · 13 · 12 · 11. A 16px törzs a skála
  egyetlen dokumentált levél-kivétele (mobil-inbox, zoom-kontextus nélkül).
- **Nyelv**: a küldők alapértelmezése a `DEFAULT_LOCALE` (magyar), a
  feloldás egyetlen helyen (`normalizeLocale`). A hívó adja át a címzett
  TÁROLT nyelvét (`UserProfile.locale`); fiók nélküli címzettnél a küldő
  felületi nyelvét (`getServerLocale()`). Angolra eső alapértelmezést ne írj
  — lint helyett guardrail-teszt fogja.
- **Kép a levélben csak `cid:` inline csatolmányként.** Hosztolt URL és
  `data:` URI egyaránt kiesik (deploy/env-függés, illetve Gmail-szűrés); a
  csatolást a közös `sendEmail()` kapu végzi, nem a hívó.
- Új sablon után: felvétel a `scripts/email-samples.ts` listájába, majd
  `pnpm preview:emails` (szemre) és `pnpm test:unit` (guardrail).
