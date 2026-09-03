# Landing egyszerűsítés — egy ígéret, egy oldal

## Mi változott

- A főoldal (`/`) egyetlen, egyéni ígérettel nyit: „~10 perc, és jobban
  megérted, hogyan működsz." Egy H1, egy elsődleges CTA (`/try`).
- A self/team **módváltó és az automatikus tab-bemutató kivezetve**
  (`ModeSwitcher.tsx`, `site-mode.ts`, a `?mode=team` query, a NavBar
  `useSiteMode`-ága, a `landing.mode_switch` analitikai esemény).
- Az oldal öt blokkja: hero + profil-előnézet → három lépés → „mitől több
  egy átlagos tesztnél" (+ idézet) → csapatos átvezető → záró CTA.
- **Információvesztés nélkül** sűrítve: a korábbi self-módú Features-kártyák
  tartalmát a profil-előnézet hordozza; a StatsBar számai a hero piruláiban
  élnek; a csapat-módú Features/StatsBar/HowItWorks lényege a szilvaszínű
  csapatos átvezetőben (három mérési réteg, átfutás, tanácsadói értelmezés).
- A csapatos átvezető elsődleges útja a **`/pilot`**, másodlagos linkje a
  `/team-dynamics` mélyoldal (a PR első változata a mélyoldalra küldött
  elsődlegesen — ez egy fölösleges ugrás volt).
- A csapatos átvezetőben **nincs csapatkép-előnézet**: az a `/team-dynamics`
  hero-jában dolgozik, a főoldalon csak elvitte a figyelmet a döntéstől.
  Helyén egy kézzel komponált szerkesztői „kapcsolódás" rajz
  (`TeamPathwayArt.tsx`): három forma (folt · mag · sarló) egy tintavonalra
  fűzve, pályaívvel, pontsorral, csillaggal és nappal — a meglévő
  formakészletből és az inverz palettából, ezért rokona a hero alatti
  csillagos motívumnak. Az `EditorialShapeGlyph` ehhez lett exportálva.
- **`/team-dynamics`** statikus csapatdiagnosztika-mélyoldal lett
  (`TeamLandingContent`): a korábbi csapat-módú szekciók, módváltó nélkül.
- **`/self-awareness`** megszűnt: állandó átirányítás a főoldalra
  (`next.config.ts`); kikerült a sitemapből, a robots allow-listából, az
  `llms.txt`-ből és a `seo-intents`-ből (témái a home-ba olvadtak).
- A két riport-előnézet (SelfPanel, TeamPanel) közös modulba került
  (`components/landing/panels.tsx`) — a PR első változata lemásolta őket.
  Az elsődleges csapatszerep zsálya, a másodlagos bronz színt kap
  (`data-role-rank`). A „5 tag" felirat i18n-kulcsra került.
- A záró CTA saját címet kapott (`ctaSelfClosing*`), mert a korábbi címe a
  hero H1-e lett.
- A NavBar CTA-ja útvonal-alapú: `/team-dynamics` → Pilotprogram, máshol →
  Kipróbálom.

## Kompatibilitás

- Nincs adatmodell- vagy API-változás.
- A `/self-awareness` régi hivatkozásai (hírlevél, külső linkek) 308-cal a
  főoldalra érkeznek.
- A `cta.click` esemény `mode` mezője megmaradt; új `cta_id`-k:
  `team_pathway`, `team_pathway_details`.

## Ellenőrzés

- `pnpm type-check`, `pnpm lint`: tiszta.
- Kliens-tesztek: `landing-content`, `team-landing-content`, `cta-hierarchy`,
  `public-contextual-cta` frissítve; a `mode-switcher` és a
  `hero-layout-stability` teszt törölve (a módváltó geometriáját őrizték).
- E2E: a `/self-awareness` → `/` átirányítás és a `/team-dynamics`
  publikussága a journey-entrypoints smoke-tesztben.
- A `check:colors` nyers-hex keret (38 > 22) a `main`-en is bukik — az
  `opengraph-image.tsx` 19 hexe a #85-tel jött be; nem ennek a változásnak a
  hibája.
