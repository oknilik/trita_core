# Link-előnézet (OG-kép) — a valódi főoldal mása

## Mi változott

- A site-szintű `src/app/opengraph-image.tsx` (amit Slack, iMessage,
  LinkedIn, Teams mutat a `trita.io` link mellé) újraépült. Eddig a
  2026-08-i **sötét, csapatos** hero-t mutatta (szilva akcent, „Értsétek meg
  jobban a csapatotok működését", `trita Team Scan` gomb, csapatkép-kártya),
  ami a 2026-09-03-i fókuszált főoldal óta nem hasonlított arra, ahová a
  kattintás vezet.
- Az új kép a **valódi hero tükre**: krém vászon, a landing i18n-kulcsaiból
  vett szöveg (`landing.focusedEyebrow` / `ctaSelfHeadlineBefore|Em` /
  `focusedHeroSub` / `focusedHeroCta` / `selfMeta*`), bronz CTA, a négy
  hero-pirula ikonnal, jobbra pedig a `SelfPanel` (Péter · Hídépítő ·
  dimenzió-rács · erősségek · valószínű csapatszerepek · lábléc)
  kicsinyített, teljes egészében látszó mása. A színek a `design-tokens.ts`
  és a `color-system.ts` (`dimColors`) forrásából jönnek, a szint-címkék a
  `getDimensionLabel`-ből, a szerepnevek a `TEAM_ROLES`-ból — nincs
  kézzel másolt szöveg, ami elszakadhatna a felülettől.
- **A szójel rendbe téve.** A satori nem tud variable fontot, és eddig
  csak egy 400-as Fraunces-példány volt az `assets/og/` alatt — a 900-as
  (`font-black`) szójelet ezzel vékony, idegen betűvel rajzolta, a bronz
  pont pedig messze az ı fölött lebegett. Most a webes `TritaWordmark`-kal
  azonos: Fraunces **900**, −0,03 em, a pont 0,22 em, közvetlenül az ı
  fölött.
- Új statikus fontpéldányok fonttools-szal (`assets/og/README.md` írja le
  a tengelyeket és az újragenerálást): Fraunces 500 · 500 Italic · 900,
  DM Sans 500 · 600. A hero-cím így `font-medium`, a kiemelés valódi
  dőlt, az eyebrow/CTA/címkék félkövérek — ahogy a weben.
- Címsor tördelése: a satori nem folyat szöveget span-ek között, ezért a
  cím **szavanként** kerül flex-wrap sorba; a sortörés így a természetes
  helyre esik („~10 perc, és jobban / megérted, *hogyan működsz.*"), nem
  szakad külön sorba a dőlt kiemelés.

## Ellenőrzés

- Helyi render (`next/og` ImageResponse tsx-ből, 1200×630 PNG) előtte/
  utána összevetve; a szójel nagyítva ellenőrizve.
- `pnpm check` (tsc + lint) tiszta.

## Megjegyzés

- A `/share/[token]` OG-képe és a blog-borító továbbra is a 400-as
  példányokat használja — érintetlen. Ha a szójel oda is felkerül, a
  900-as példány már rendelkezésre áll.
