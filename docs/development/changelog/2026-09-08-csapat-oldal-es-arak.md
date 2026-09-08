# Egyesített csapat-oldal és önálló Árak oldal

## Mi változott

- **A /how-we-work („Együttműködés") a /team-dynamics csapat-oldalba olvadt.**
  A két oldal ugyanazt az ígéretet mondta el kétszer (saját hero, saját három
  lépés, saját záró CTA, számsáv mindkettőn). Az egyesített oldal sorrendje:
  hero (ár-pirulával) · három lépés (a két oldal lépései összefésülve:
  cél és keret → kitöltés és tanácsadói ellenőrzés → közös értelmezés és
  visszamérés) · mit mérünk · **ár-horgony** (a főoldali krém kártya,
  kalkulátor nélkül) · miért hiteles + számsáv · pilot-helyek · program-GYIK ·
  egy záró CTA. A `/how-we-work` és a korábbi `/pricing`-átirányítás helyett
  `/how-we-work` → `/team-dynamics` 308 (`next.config.ts`).
- **Új, önálló `/pricing` („Árak") oldal** — kereshető, egyértelmű ár-belépő
  (`PricingPageContent`): hero a két szint csempéivel · kalkulátor
  (`#kalkulator`) · „A két szint egymás mellett" összehasonlító tábla ·
  ezen felül (további workshop-nap, több csapat, ingyenes egyéni felmérés) ·
  pilot-ár sáv (áthúzott listaár, partneri ár, szabad helyek) · GYIK csak az
  árról (új tételek: mitől drágább/olcsóbb, fizetés, több csapat,
  kedvezmény — `faqQ9–12`) · záró CTA. Service + FAQ + WebPage JSON-LD ide
  került; SEO-szándék: `SEO_INTENTS.pricing`.
- **Ár-horgony egy komponensben** (`PriceAnchorCard`): a főoldal csapat-
  blokkja és a csapat-oldal ár-szekciója ugyanazt a krém kártyát mutatja,
  linkje az /pricing-re. GYIK-lista is közös (`FaqList`), a tételek két
  listában (`PRICING_PAGE_FAQ_INDEXES`, `TEAM_PAGE_FAQ_INDEXES`) — egy kérdés
  csak egy oldalon.
- **Fejléc/lábléc:** „Csapatoknak" (/team-dynamics) + „Árak" (/pricing); az
  „Együttműködés" menüpont megszűnt. Sitemap, robots, llms.txt, HelpWidget
  (a /team-dynamics is kap kontextust), súgó-téma („Mennyibe kerül?" a
  fejenkénti modellel), /about másodlagos CTA és a főoldali záró CTA
  („Csapatoknak: így dolgozunk együtt") átirányítva.
- **Csapat-oldal CTA-k:** hero elsődleges „Egyeztessünk" → /contact,
  másodlagos „Árak és kalkulátor" → /pricing; a záró CTA „Egyeztessünk a
  csapatotokról" → /contact, alatta „Vagy nézd meg a pilotprogramot".
  A hero pirulája a díjkártya belépő árát viszi („35 000 Ft / fő-től").
- **Revalidálás:** a díjkártya mentése mostantól a `/`, `/team-dynamics`,
  `/pricing`, `/pilot` oldalakat frissíti (`PRICE_LADDER_PUBLIC_PATHS`).
- Törölve: `how-we-work/page.tsx`, `PricingContent.tsx`. A
  `CollaborationRhythmArt` és a `PricingQuickAsk` komponens megmaradt,
  felület nélkül.

## Ellenőrzés

- `pnpm check` tiszta.
- Client: az átírt `team-landing-content` (egyesített oldal: CTA-utak,
  ár-horgony kalkulátor nélkül, lépések, pilot, program-GYIK) és
  `public-page-art-direction` (Árak oldal: csempék, kalkulátor, tábla,
  pilot-ár, ár-GYIK, záró CTA) tesztek zöldek.
- Unit (`crawler-surface`: /pricing az llms.txt-ben) zöld.
- E2E útvonal-listák (`global-setup`, `footer-clearance`, `route-coherence`)
  a /team-dynamics + /pricing párosra írva át — CI futtatja.
- Dummy-env `next build` zöld; képernyőképek a két oldalról.
