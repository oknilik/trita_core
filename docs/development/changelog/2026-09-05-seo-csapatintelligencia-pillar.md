# SEO — csapatintelligencia-pozicionálás a pillar oldalon, nem a főoldalon

> A #90-es PR (`codex/seo-google-appearance-20260905`) irányváltása. A PR a
> márka csapat-pozicionálását a főoldal H1-ére és hero-szövegére terhelte,
> ami a funnel egyéni belépőjét gyengítette. Ez a változás a favicon- és
> entitás-részeket megtartja, a főoldal-átírást visszavonja, és a
> pozicionálást három másik rétegre helyezi.

## Az elv

A Google **oldalt** rangsorol, nem site-ot. A főoldalnak nem kell a
„csapatintelligencia" kifejezésre versenyeznie ahhoz, hogy a trita a
keresőben csapatintelligencia-platformként jelenjen meg. A főoldal marad a
„személyiségteszt magyarul" szándéké (H1, hero, lépések, CTA változatlan);
a márka-pozicionálást hordozza:

1. **a főoldal description második fele és az OG-pár** — márkakeresésnél
   („trita") a snippet mondja ki, mi a trita, miközben az oldal a tesztre
   rangsorol; megosztásnál a márka-, nem a funnel-üzenet látszik;
2. **az entitás-réteg** — Organization/WebSite JSON-LD leírás csapat-első
   (a #90-ből megtartva), `knowsAbout` csapat-első sorrendben,
   „csapatintelligencia" / „team intelligence" tétellel; `llms.txt` bevezető
   csapat-első;
3. **a `/team-dynamics` pillar** — a „csapatintelligencia" kategória gazdája.

## Mi változott

- **Főoldal** (`(marketing)/page.tsx`): title változatlan; description
  második fele: „A trita csapatintelligencia-platform egyéni belépője…";
  OG: „trita – csapatintelligencia-platform" + belépő/csapat leírás.
  A #90 H1-/hero-/HowItWorks-/Proof-/CTA-átírása **visszavonva**
  (`landing.ts`, `common.ts`, `LandingContent`, `TeamPathway`, `CtaSection`
  a main állapotán).
- **`seo-intents.ts`**: a „Csapatintelligencia" téma a `home`-ból a
  `teamDynamics`-be költözött; a pillar `primary`-je szándékosan a valós
  volumenű „csapatdiagnosztika" marad (a „csapatintelligencia" saját
  kategórianév, amit a lap tanít, nem meglévő keresletre céloz); új témák:
  „Csapatszerepek".
- **`/team-dynamics` pillar**:
  - title: „Csapatintelligencia és csapatdiagnosztika | trita"; description
    a mit mér / kinek való / ki mit lát hármasra;
  - új szekció a hero után: **`TeamIntelligenceDefinition`** (a #90-ből
    átemelve, i18n-kulcsok a `teamDynamics.*` névtérbe) + **fogalomtár**
    (6 fogalom: csapatintelligencia, csapatdiagnosztika, csapatdinamika,
    csapatszerep, bizalmi háló, pszichológiai biztonság — termékadatok a
    kódból: 9 szerep, ≥3 értékelő, 8 PS-állítás);
  - új szekció a StatsBar után: **`TeamFaq`** (6 kérdés; `faq.open`
    esemény `surface: "team-dynamics"`), link a `/how-we-work`-re;
  - JSON-LD: WebPage + **FAQPage** + **DefinedTermSet** — mind a lapon
    LÁTHATÓ i18n-szövegből, a `src/lib/team-dynamics-pillar.ts` keretmentes
    indexmodulon át (a `pricing/faq.ts` mintája).
- **Blog belső linkek (hub-and-spoke)**: eddig a 18 cikk közül **nulla**
  linkelt a `/team-dynamics` vagy `/how-we-work` oldalra. Most 5 HU + 5 EN
  csapat-témájú cikk záró szakasza leíró horgonyszöveggel linkel a pillarra
  és/vagy az együttműködés oldalra. Az adatvédelmi szerződésmondatokhoz
  (`team-report-privacy.test.ts`) nem nyúltunk.
- **3 új cikk-pár, PISZKOZATBAN** (`status: "draft"`, élesben 404, adminban
  látszik, sitemap/llms.txt kihagyja):
  - `csapatszerep-kerdoiv-mit-mer-es-mit-nem` /
    `team-role-questionnaire-what-it-measures` — referenciacikk a 27 itemes,
    9 szerepes, self+peer kérdőívről (Stewart–Fulmer–Barrick 2005, Mathieu
    et al. 2015, Mumford et al. 2008);
  - `csapatdinamika-merese-kis-csapatban` /
    `measuring-team-dynamics-in-a-small-team` — küszöbök (3 kitöltés / 3
    értékelő), bizalmi kör 5 kérdése, becslés vs. mérés (De Jong–Dirks–
    Gillespie 2016, Wheelan 2009, Mueller 2012);
  - `mit-mutat-a-csapatkep-a-vezetonek` /
    `what-the-team-picture-shows-a-leader` — narratív, anonimizált
    összerakott eset (Edmondson 1999, Kozlowski–Ilgen 2006, Hackman–Wageman
    2005).
  Publikálás előtt: hivatkozások és évszámok ellenőrzése, borító
  (generatív fallback él), `publishedAt` frissítése.
- **Sitemap** `CONTENT_REVIEWED_AT` → 2026-09-05.
- **#90-ből megtartva**: stabil `/favicon.ico` elsődleges ikon
  (`SITE_ICON_LINKS`, hash-elt route törölve), Organization/WebSite
  csapat-első leírás, `BRAND_LOGO_PATH`.
- **#90-ből kihagyva, külön döntés**: a `/how-we-work` ötlépéses workflow
  átírása — tartalmilag jó, de független az SEO-kérdéstől; külön PR-ban.

## Kulcsszó-realizmus

A „csapatintelligencia" magyarul saját kategórianév, közel nulla keresési
volumennel. A pillar és a blog a valós lekérdezésekre céloz (csapatdinamika,
csapatfejlesztés, csapatdiagnosztika, pszichológiai biztonság mérése,
csapatszerep teszt, 360 fokos visszajelzés); a „csapatintelligencia" a
márka-kategória, amit a definíciós szekció + DefinedTermSet tanít meg a
keresőnek és a válaszmotoroknak. Angolul a „team intelligence" létező
kifejezés — az EN pillar ott már célozhat rá.

## Következő lépések (kódon kívül)

- Search Console: mely lekérdezésekre kap impressziót a `/team-dynamics`,
  mely pozíciókban — a 8–15. hely közti kifejezések a legjobb célpontok.
- A három piszkozat átolvasása, hivatkozás-ellenőrzés, publikálás.

## Ellenőrzés

- `pnpm check` (tsc + eslint + check-colors) tiszta.
- `pnpm test:unit`: új `tests/unit/seo/team-dynamics-pillar.test.ts` (4
  teszt: a téma a pillaré, a cím kimondja a kategóriát, minden GYIK-/
  fogalom-sorszámhoz van HU+EN kulcs, nincs védjegy/modellnév); a blog
  MDX-guard és adatvédelmi tesztek zölden.
- `pnpm test:client`: `team-landing-content.test.tsx` bővítve (sorrend,
  6 fogalom, 6 GYIK, `/how-we-work` link) — 69 fájl / 338 teszt zöld.
