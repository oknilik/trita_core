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
  csapatos átvezetőben (egyéni személyiségprofilok, három mérési réteg,
  átfutás, tanácsadói értelmezés).
- A csapatos átvezető elsődleges útja a **`/team-dynamics`** mélyoldal,
  másodlagos linkje a `/pilot`, így előbb megismerhető a teljes ajánlat,
  miközben a jelentkezési út közvetlenül elérhető marad.
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
- A publikus navigációban a konkrét Pilotprogram helyét a tartós
  **Csapatoknak** ajánlat (`/team-dynamics`) vette át. A pilot a csapatos
  oldal elsődleges következő lépéseként továbbra is hangsúlyos marad.
- Az **Együttműködés** menüpont ikonja két átfedő kör lett: a közös tér
  egyszerű, kis méretben is olvasható jele váltja a korábbi folyamatnyilat.

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

## Kiegészítés (2026-09-03, este)

- **Főoldali hero:** visszakerült a korábbi „ÖNISMERET ÉS
  CSAPATMŰKÖDÉS” nyitócímke az egyszerűsített flow fölé.
- **Főoldali csillagos elválasztó:** a hero alól egy szekcióval lejjebb,
  közvetlenül a három lépés és a „Mitől több” bizonyítékblokk közé került.
- **Tesztindító:** a félrevezetően konkrét mintaeredmény helyét egy halk,
  szöveg nélküli Trita-konstelláció vette át; az oldal eyebrow-ja a közös
  pöttyös rendszerkomponenst használja, a vendégmentés szövege pontosabb.
- **`/team-dynamics` – Features-kártyák:** a három mérési réteg kártyája
  egyforma hátteret kap. Az első („Mért bizalmi háló") korábbi kiemelése
  színben rangsort sugallt három egyenrangú réteg közt.
- **Blogcikkek dátuma:** a 9 cikkpár (HU+EN) megjelenési dátuma
  egyenletesen szétosztva 2026 februárjától, ~25 naponként, a meglévő
  sorrend megtartásával; a legfrissebb pár (08-26) helyben maradt. A blog
  forrása a `content/blog/*.mdx` frontmatter (nincs blog-tábla a DB-ben —
  az admin Blog-fül is ide commitol), így a git-commit a mentés. A hírlevél-
  digest 14 napos ablaka és a `NewsletterDelivery` napló miatt a régebbre
  datált cikkek NEM mennek ki újra.
- **`/pilot` – szabad helyek:** a hero CTA alatti pöttysor helyett
  kapacitás-kártya: nagy szám (`7 / 10`), tízrészes sáv, sürgető sor, és a
  kártya maga a jelentkezésre (`#jelentkezes`) visz. Új `cta_id`:
  `hero_spots` (`surface: "pilot"`). A `spotsLeftShort` kulcs kivezetve.
- **`/pilot` – a következő szabad hely lüktet:** a kapacitás-kártya sávjában
  az első szabad szelet lélegzik (`pilot-spot-next`, `globals.css`): halvány
  gyűrű nő ki belőle és elhal, közben kicsit felfénylik. Csak ez az egy
  szelet mozog. Reduced motion mellett a mozgás kikapcsol, a következő hely
  statikus gyűrűt kap — az információ megmarad.
- **`/pilot` – editorial kapacitáskártya:** a világos kártyát felváltotta a
  sötét csapatgradiens, rajta a nagy szabadhely-számmal és a foglalt helyek
  tényszerű sorával. A pulzáló gyűrű helyett a brand-csillag finoman
  megérkezik az első szabad szelethez; reduced motion mellett statikus.

## Kiegészítés (2026-09-04, reggel)

- **`/pilot` – a csillag egyszer száll le:** a kapacitás-kártya mozgása
  egyszeri „érkezés"-koreográfia lett (`data-pilot-spots-phase`,
  `PilotContent.tsx` + `globals.css`): a szeletek balról jobbra nőnek ki,
  a nagy szám 10-ről 7-re számol le, a brand-csillag egyszer leszáll az
  első szabad helyre, és az a szelet egyet felfénylik. Utána a kártya
  nyugodt, a csillag statikusan a helyén marad; 9 mp-enként egyetlen halk
  fény fut át a szabad helyeken. A korábbi végtelen hurok (lüktetés, majd
  ismétlődő csillag-leszállás) kivezetve. SSR és csökkentett mozgás: a kész
  állapot, mozgás nélkül.
- **Minőségi kapu:** az `AssessmentIntroArt` a `components/ui/` alá került
  (az EditorialArt mellé). Tisztán dekoráció, nincs benne felmérési logika;
  a `components/assessment/` védett modulban a kapu integrációs tesztet
  követelt volna rá.
- **`/contact` – önálló vizuális karakter:** az oldal egyetlen hero + űrlap
  kompozícióvá egyszerűsült. A demó, árazás, partnerség, terméktámogatás és
  egyéb témák látható választógombok; a korábbi ismétlődő információs
  kártyákat egy válaszidő-sor és egy halk email-sáv váltja. A „jel és
  válasz” Trita-rajz az oldal saját, tartalomhoz kötött motívuma.
- **`/how-we-work` – összehangolódás:** a hero külön, sötét csapatpanelt és
  oldal-specifikus, felirat nélküli motívumot kapott: három eltérő ritmus egy
  közös ponton találkozik, majd összehangoltan halad tovább. A hero alatti,
  ismétlődő három eredményblokk kikerült; a folyamat három követhető lépésben
  jelenik meg, a GYIK kétoszlopos, a pilotajánlat kompakt. A második kapcsolati
  mini-űrlap helyett a lap egyetlen záró CTA-val vezet a teljes `/contact`
  űrlapra.
