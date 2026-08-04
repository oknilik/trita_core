# Nyelvi és pszichológiai szöveg-lektorálás — 2026-08

> Állapot: VÉGREHAJTVA (2026-08-04) — a nyitott maradványok a napló végén.
> Kapcsolódik: `docs/product/ux-simplification-2026-08.md` (a „→ NYELVI KÖR"
> jelű tételek ide kerültek át), `docs/product/riport-javitasi-terv` 1.2/1.4.

## Cél és szemüveg

Két lencse egyszerre:

1. **Nyelvi**: a magyar szövegek gördülékenysége — tükörfordítások,
   töredezett mondatok, szórendi kalkok, tegezés/magázás-keveredés,
   terminológiai szórás kigyomlálása. A HU az elsődleges termék-nyelv;
   az EN-t ott javítjuk, ahol tartalmilag eltér vagy magyarról fordított.
2. **Pszichológiai-szakmai**: önértékelés-alapú mérés nem jogosít
   kategorikus kijelentésre — valószínűségi keretezés („jellemzően",
   „hajlamos"), nem-ítélkező skálapólusok (a magas/alacsony nem jó/rossz),
   Barnum-mondatok és klinikai hangütés kerülése, becsült vs mért adat
   forrás-transzparenciája. Ez a termék hitelességi alapelvének
   (CLAUDE.md: kötelező confidence-jelölés) szöveg-szintű kiterjesztése.

## Módszer

- Két párhuzamos, teljes körű sweep: (A) i18n szótárak + hardcode-olt
  UI-szövegek; (B) tartalom-generáló libek (archetípusok, csapatminták,
  interakciós atomok, journey-szövegek, emailek) pszichológiai lencsével.
- A kérdőív-itemek (`src/lib/questions/`) NEM részei a körnek — validált
  instrumentum-szövegek, azokhoz mérési okból nem nyúlunk.
- A HEXACO dimenzió-nevek (`src/lib/tritan.ts`) kanonikusak — a leíró
  szövegeik viszont lektorálandók.
- Prioritás: **P1** = pilot előtt javítandó (értelemzavaró / szakmai
  hitelességet sértő) · **P2** = érdemi gördülékenység · **P3** = polish.

## Előre ismert, áthozott tételek

| # | Honnan | Mi | Terv |
|---|---|---|---|
| L1 | UX-kör B12 | Két szomszédos riport-szekció neve „szerep" (RoleFit vs Csapatszerep) — az olvasó nem tudja, miben különböznek | címek megkülönböztetése + egy-egy alcím-mondat |
| L2 | UX-kör B18 | Nav-címkék hardcode magyarok a bilingvális felület közepén (`navigation/config.ts`) | i18n-kulcsosítás a teljes nav-ra |
| L3 | UX-kör A20 | Journey-szövegek belső zsargont szivárogtatnak a user felé (`next-best-action.ts`, `engine-core.ts`) | köznyelvi átírás i18n kulcsokon át |
| L4 | Riport-terv 1.2 | „a(z)" tákolás interpolált címkék előtt (results.ts facet-kulcsok) | `huArticle()` helper (magánhangzó → „az") + kulcs-átírás névelő nélküli sablonra |
| L5 | Riport-terv 1.4 | Kategorikus tagline-ok az archetípus verb/desc mapekben („Te vagy, aki…") | valószínűségi keretezés, egységes hangütéssel |

## Leltár — A. i18n szótárak + hardcode UI-szövegek

Kivitelezés-jelölés: **SZÓTÁR** = csak i18n-fájl változik · **KÓD** =
komponens/lib is változik.

### P1 — pilot előtt javítandó

| Hely | Jelenlegi (röv.) | Probléma | Javítás | Kiv. |
|---|---|---|---|---|
| `org.ts` `candidate.introBody` | „…{minutes} percet vesz igénybe. Kérjük, válaszolj…" | HU–EN tartalmi eltérés (EN hardcode „15–20 minutes"), magázó „Kérjük" + tegező ige | HU: „Ez a felmérés {count} kérdésből áll, kb. {minutes} percet vesz igénybe. Válaszolj őszintén, az első benyomásod alapján." EN: interpolált {minutes} | SZÓTÁR |
| `org.ts` `evidenceSourceSelf` / `evidenceSourceSelfObserver` | „Self assessment" / „Self + observer" HU-értékként | teljesen angol HU-érték | „Önértékelés" / „Önértékelés + külső visszajelzés" | SZÓTÁR |
| `org.ts` `roleFitConfidence`, `evidenceConfidence` | „Biztonság" | félrefordítás (confidence≠biztonság), ütközik a Pszichológiai biztonság fogalommal | „Megbízhatóság" | SZÓTÁR |
| `org.ts` `noAssessmentsProfile`, `noRoleFitDataDesc` | „…kitöltött assessment…" | angol szó magyar mondatban | „…kitöltött felmérés…" (+EN szinkron) | SZÓTÁR |
| `org.ts:189` pricing feature | „…(heatmap, mintázat, tension pair)" | angol szakszavak fizetős csomagleírásban | „Teljes platform-hozzáférés (hőtérkép, csapatmintázat, feszültségpárok)" | SZÓTÁR |
| `assessment.ts` `observer.introBody` | „…töltsd ki ezt a(z) {testName} tesztet róla." | „a(z)" tákolás az observer-belépő első mondatában | „{inviter} megkért, hogy töltsd ki róla ezt a felmérést: {testName}." | SZÓTÁR |
| `assessment.ts` `observer.introBodyShort`, `assessment.introBody`, `observer.selectBothFields` | „Kérjük, …" + tegező ige | magázó-hivatalos keveredés | „Kérjük" törlése, tiszta tegezés | SZÓTÁR |
| `assessment.ts` `assessmentLayers.*` | „célroute", „layer-alapú journey", „domain modell", „Render célpontok" | fejlesztői zsargon user-facing route-on | köznyelvi átírás („Felmérési rétegek", „Megjelenítési helyek"…) | SZÓTÁR |
| `results.ts` `ccLeaderTitle`, `cfWhyThisOrder`, `ccPlan30Title` | „a(z) {dim}" / „A(z) {industry}" | feloldatlan névelő, holott `withHuArticle()` létezik | hívó-oldali `withHuArticle` + sablonból „a(z)" ki | KÓD |
| `navigation/config.ts` (11 sor) | „Vezérlő", „Eredményeim"… | B18: teljes nav hardcode magyar | `nav.*` kulcsosítás (lista lentebb) | KÓD |
| `TeamIntelligence.tsx:346,252` | „Az intelligence nézet summary jellegű… chartok… deep-dive" / „assessment adat" | 4 angol szó egy mondatban, hardcode, tanácsadói felület | „Ez az áttekintő nézet. A részletes ábrák és a szerep-eloszlás a Csapatszerepek felületen érhető el." + kulcsosítás | KÓD |
| `sign-in/page.tsx:32`, `sign-up/page.tsx:33`, `auth.ts:67` | „Valami hiba történt. Kérjük, frissítsd az oldalt." | hardcode-duplikátum + magázó | „Hiba történt. Frissítsd az oldalt." egy kulcsból | KÓD |

### P2 — érdemi gördülékenység-javítás

| Hely | Jelenlegi (röv.) | Probléma | Javítás | Kiv. |
|---|---|---|---|---|
| `results.ts` `insightLower`, `observerSelfHigher` | „…mint ahogy mások látnak." | hiányzó tárgy, csonka mondat | „…mint ahogy mások látnak téged." | SZÓTÁR |
| `results.ts` `observerObsHigher` | „…mint te saját magad." | töredezett zárlat | „…mint ahogy te értékeled magad." | SZÓTÁR |
| `results.ts` `dimensionInterpretation` | „Az eredményed értelmezései:" | hibás többes | „Mit jelent az eredményed:" | SZÓTÁR |
| `results.ts` `feedbackSiteUsefulnessLabel` | „Hasznosnak találtad-e az oldalt?" | „-e" hivatalos hangnem | „Hasznosnak találtad az oldalt?" | SZÓTÁR |
| `results.ts` `confidenceLabel`/`avgConfidence`, `org.ts` `participantSelfDone` | „Átl. magabiztosság", „Önért. kész" | rövidítés-csonkok | „Átlagos magabiztosság", „Önértékelés kész" | SZÓTÁR |
| `assessment.ts` `missingAnswerToast` | „Egy kérdés még hiányzik — idehoztunk." | félkész mondat | „Egy kérdés kimaradt — visszahoztunk hozzá." | SZÓTÁR |
| `assessment.ts` `nonePendingBody` (2×) | „erre a lépésre érsz" | magyartalan vonzat | „eljutsz erre a lépésre" | SZÓTÁR |
| `results.ts` `stageSelf*`/`stageObserver*` | „Self kész", „Observer folyamatban"… | angol státusz-címkék | „Önértékelés kész", „Külső visszajelzés folyamatban"… | SZÓTÁR |
| `results.ts` `layerStatusEyebrow` | „4+2 modell állapota" | belső modellnév user előtt | „A profilod felépítése" | SZÓTÁR |
| `common.ts` `feature2Title`, `feature3Body` | „AI-generált debrief" / „observer mechanizmus segítségével…" | anglicizmus + tükörfordítás | „AI-generált kiértékelés" / „Az ügyfeleid a platformon keresztül kérhetnek visszajelzést az ismerőseiktől — az eredményt te is látod." | SZÓTÁR |
| `org.ts` `zoneAnalyzerLabel`, `zoneStrategistLabel` | „Analizátor", „Stratégista" | magyartalan képzés | „Elemző", „Stratéga" | SZÓTÁR |
| `org.ts` `roleFitScore` | „Illeszkedési pont" | félreérthető | „Illeszkedési pontszám" | SZÓTÁR |
| `org.ts:120` | „Csapat deep-dive session" | angol csomagleírás | „Csapat-mélymerülés (2–3 órás műhely)" | SZÓTÁR |
| `results.ts` `showAll`/`showLess` | ige vs főnévi pár | aszimmetria | szimmetrikus pár | SZÓTÁR |
| `results.ts` `roleFitMight` vs `content.roleFitMaybe` | web és PDF mást mond ugyanarra | inkonzisztencia | egy szöveg mindkét kulcsba: „Működhet, ha felkészülsz" | SZÓTÁR |
| `pilot-apply/route.ts:67`, `error.tsx:20`, `org.ts` `valPleaseChoose`/`valConsentError` | „Kérjük…" | magázó maradványok | tegező forma | KÓD |
| meta-title-ök | „Trita" 36× vs „trita" 35× | márkanév-írás szórása | egységesen „Trita" | SZÓTÁR |

### P3 — polish

| Hely | Probléma | Javítás |
|---|---|---|
| „Újrapróbálom"/„Újra próbálom"/„Újrapróbálás" (4 hely) | 3 írásmód egy gombra | „Újrapróbálom" |
| „Mégse" vs „Mégsem" | két alak | „Mégse" |
| EN „Next -&gt;"/„&lt;- Previous" | ASCII nyíl az EN-ben, tipográfiai a HU-ban | „Next →" / „← Previous" |
| „Feloldom — €9"/„Plus feloldás — €9"/„Plus feloldás → €9" | 3 CTA-variáns egy vásárlásra | „Plus feloldása — €9" |
| `results.ts` `ccFacetBadge` „facet-pontosított" + „Facetek"/„alskála" keveredés | terminus-szórás | „alskála" végig |
| „Vissza az irányítópultra"/„vezérlőre"/„vezérlőpulthoz" | 3 név ugyanarra | „Vissza a vezérlőre" |
| `landing.ts` `proofTestimonialAuthor` „Product Manager" | angol pozíciónév | „termékmenedzser" |
| org.ts observer-írásmódok („Observer kész", „observer kör"…) | kis/nagybetű keveredés | kisbetűs „observer" futószövegben |

## Terminológia-egységesítés — DÖNTÉSEK

| Fogalom | Döntés | Indoklás |
|---|---|---|
| külső értékelő | **„observer" marad** a termék-terminus: futószövegben kisbetűs, ragozva; a `megfigyelő`/`értékelő` szinonimák kigyomlálva (kivéve ahol az „értékelő" a peer-értékelőt jelenti a csapatszerep-360-ban) | bevett a teljes termékben (UI, doksik, flow-nevek); átnevezése pilot előtt kockázatos |
| kitöltendő eszköz | **„felmérés"** org/hivatalos felületen, **„teszt"** self/marketing felületen; `assessment` HU szövegben sehol | a két regiszter külön közönségé |
| vezérlőfelület | **„Vezérlő"** mindenhol | a nav már ezt használja |
| kimenet | egyénnél „eredmény"/„riport", csapatnál **„csapatkép"**; a „jelentés" kivezetve | riport≠jelentés keveredés megszűnik |
| pulse | **„pulzusmérés"** (kvalifikáltan: „pszichológiai biztonság pulzusmérése") | három írásmód helyett egy |
| confidence | mérési bizonytalanságra **„megbízhatóság"** (sáv: „megbízhatósági sáv"); az observer önbevallott biztossága marad „magabiztosság" | a „Biztonság" félrefordítás ütközött a psych. safety fogalommal |
| márkanév | **„Trita"** prózában és meta-title-ben | tulajdonnév; a kisbetűs alak logó-stílus, nem próza |
| facet | **„alskála"** user-facing szövegben (kulcsnevekben maradhat facet) | HEXACO-PI-R terminológia magyarul |

## B18 — nav-címke kulcsosítási lista

`src/lib/navigation/config.ts`: 83 „Vezérlő"→`nav.home` · 93
„Eredményeim"→`nav.results` · 106 „Összehasonlítás"→`nav.interaction` ·
124 „Karrier"→`nav.career` · 139 „Feladataim"→`nav.tasks` · 154
„Csapatok"→`nav.teams` · 169+188 „Csapatom"→`nav.myTeam` · 182
leírás→`nav.teamItemDescription` · 204 „Jelöltek"→`nav.hiring` · 217
„Szervezet"→`nav.org`. Fogyasztó-oldali hardcode-ok:
`nav-header-ui.tsx:293` („Vezérlő" fallback), `:393` („Vissza a
vezérlőre"), `:571`, `:986` („Admin vezérlő").

Megjegyzés: a nav-címkék kulcsosítása azt igényli, hogy a
`WorkspaceNavItem.label` i18n-kulcsot hordozzon és a renderelő
lokalizáljon — vagy a builder kapjon locale-t. A kisebb vérontás: a
builderek kulcsot tesznek a `label`-be, a `nav-header-ui` `t()`-vel oldja
fel; a nav-visibility tesztek id-alapúak, nem címke-alapúak.

## „a(z)" feloldási lista

**Szótár-oldalon átfogalmazható** (névelő-mentes szerkezetre — ige-előre
vagy kettőspontos forma): `observer.introBody` ({testName}),
`teamRole.selectHintPeer`/`highlightHintPeer` ({name} — személynév elé
nem kell névelő), `auth.verifySent`/`magicLinkSentBody` ({email} →
„erre a címre: {email}"), `notifications.ts` mind a 9 érintett body
({team}/{orgName}/{campaignName}/{teamName}/{targetLabel} → „Elindult a
kampány: „{campaignName}"." mintára), `org.ts:1865` `switchPrimary`,
`org.ts:1300`, `org.ts:1938`.

**Kód-oldalon `withHuArticle()`-lel oldandó** (ismert szókészletű
változó): `results.ts` `cfWhyThisOrder`/`ccPlan30Title` ({dim}),
`ccLeaderTitle` ({industry}), továbbá hardcode helyek:
`ObserverFlowStatusCard.tsx:73`, `manager/page.tsx:109,121,178`,
`emails.ts:166`, `team-intelligence.ts:411`, `team-report-member.ts:173`.

„Belbin"-ellenőrzés: `src/` alatt nulla találat — tiszta.

## Leltár — B. Tartalom-generáló libek (pszichológiai lencse)

### P1 — szakmai hitelességet sértő / értelemzavaró

| Hely | Probléma | Javítás |
|---|---|---|
| `team-insights.ts:79` + `66–73` | **Szemantikai inverzió**: a „legfőbb fejlesztési irány"-ként az alacsony pólus POZITÍV címkéjét nevezi meg („fejlesztési irány az érzelmi stabilitás" — épp fordítva); plusz eszközhatározós dim-nevek alanyi slotban (hibás mondat) és „a(z)" névelőhiba | sablon-újraírás: legmagasabb/legalacsonyabb átlag tényszerű megnevezése, alanyesetű nevek, `withHuArticle` |
| `team-intelligence.ts:411` | belső dimenziókód (THOR/RESO…) szivárog a user elé + „A(z)" műtermék | HU dimenzió-név a `tritan.ts`-ből + `withHuArticle` |
| `team-intelligence.ts:447` | „szignifikánsan eltér" statisztikai teszt nélkül + nyers H/A betűk és Δ-jelölés | köznyelvi megfogalmazás + becslés-jelölés |
| `interaction-atoms.ts:952–1015` `LEADER_SUPPLEMENTS` (12 blokk) | kategorikus jellemrajz NEM MÉRT vezetőről; a hedge-guardrail teszt nem fedi ezt a mapet | hipotézis-keret („Ha a vezetőd erősen…, jellemzően…") minden blokkra + guardrail-teszt kiterjesztése |
| `interaction-atoms.ts:972,982` | „Hűvös, tárgyilagos" / „Érdekvezérelt… nem rosszindulatból" — értékelő/erkölcsi minősítés skálapólusra | átkeretezés viselkedéses, nem-ítélkező nyelvre |
| `profile-content.ts:587–591` | magas Emocionalitás = „alacsony stressztűrés"-ként tálalva (konstruktum-csúsztatás + deficit-keret) | „Terhelés-kezelés" átkeretezés, erőforrás-nyelv |
| `profile-content.ts:68,177` | „szorongás/szoronganának" — klinikai szó visszajelzésben | „feszültség/feszélyez" |
| `team-pattern.ts:816–819` (RVFP), `:512` (EVSP), `:694` (RCFP), `:390` | „A csapat gyakorlatilag nem létezik", „Nulla tudásmegosztás", „Alacsony pszichológiai biztonság" (nem mért konstruktum), „Alacsony ambíció", „Innovációs deficit" — abszolút/stigmatizáló állítások önértékelés-aggregátumból | valószínűségi, viselkedéses átfogalmazás; psych. safety állítás → „a pulzusmérés tudja megerősíteni" keret |
| `profile-content.ts` 3 map (RESOLUTION_NARRATIVES 48–116, BLOCK3_SUMMARIES 125–193, SOLO_DIM_NARRATIVES 628–672) | az 1.4-es tétel valódi helye: 48 kategorikus „te ilyen vagy" állítás, alany nélküli töredékmondatok, 1 Barnum-hízelgés, 1 „mindig" | tételes átírás valószínűségi keretre („a válaszaid …-ra utalnak", „jellemzően") a leltár-ügynök soronkénti javaslatai szerint |

### P2 — érdemi (válogatás; teljes lista a sweep-jegyzőkönyvben)

| Hely | Probléma | Javítás |
|---|---|---|
| `next-best-action.ts:19–29,139–328` + `journey/engine-core.ts:20–61` | **A20**: journey/self/insight/observer kör/cockpit zsargon közvetlenül renderelve | köznyelvi átírás (CTA-k: „Kérj visszajelzést kollégáktól" stb.; stage-címkék: „Önértékelés folyamatban"…) |
| `team-intelligence.ts:281,301,374,468` | „assessment"/„observer" zsargon + kohézió-közelítő bare számként | magyarítás + becslés-jelölés |
| `team-report.ts:566,600,629` | nem-párhuzamos felsorolás; „túlpörgések" szleng; kategorikus teljesítmény-jóslat | párhuzamos szerkezet; regiszter-igazítás; valószínűségi keret |
| `team-insights.ts:89,90,96,111` | gyengeség-keretezés (`getWeaknessInsight`), kategorikus jóslat, konstruktum-csúsztatás, személyváltás | `getWatchAreaInsight` átnevezés + átfogalmazások |
| `team-pattern.ts:537,542,812` | „unconventional", „Szinte lehetetlen", „maintenance" | magyarítás + valószínűségi forma |
| `emails.ts:113,295` | EN `thanks` slot: „Thank you for participating in the research!" — elköszönés-slotban + kivezetett kutatás-narratíva | „Best regards," |
| `tritan.ts` RESO facet-megjelenítés | „Szorongás · Dependencia" glossza nélkül tünetlistának hat | nem-klinikai glossza a facet-megjelenítésnél; facet-NEVEK maradnak (HEXACO-PI-R kánon), kivéve „Mohóságkerülés"→„Kapzsiságkerülés" (szakirodalmi alak) |

### P3 — polish (válogatás)

`profile-content.ts:487–583` env-sorok egységes tegező-igés formára ·
`:564` „versengős" · `:906–927` ARCHETYPE_STORY_ADJ valószínűségi forma ·
`team-pattern.ts:847` „balanszált"→„kiegyensúlyozott" ·
`team-insights.ts:36` töredék · `emails.ts:282` néma {testName} param a HU-ban.

### Döntések a B-leltárhoz

- **„Zsoldosok" (RVFP) minta-név**: a szöveg-tartalom most enyhül; maga a
  név-készlet cseréje a meglévő 16-név brand-backlog tétel része marad.
- **Facet-nevek**: a HEXACO-PI-R kánon miatt NEM nevezzük át őket
  (a „Dependencia"-t sem) — a klinikai olvasatot a megjelenítési glossza
  kezeli. Egy kivétel: „Mohóságkerülés"→„Kapzsiságkerülés".
- **„observer" a journey-szövegekben**: ahol a mondat enélkül is működik,
  köznyelvi („kérj visszajelzést kollégáktól"); a terminus a
  meghívó-kezelő felületeken marad.
- **Csapatminta forrás-jelölés**: ha a renderelő kártya már visel
  becslés/módszertan-jegyzetet, a 16 leírásba NEM duplikálunk
  disclaimer-t — csak a blindSpot-ok nyelve válik valószínűségivé.

## Végrehajtási napló

1. **batch (`5328b0d`)** — B18 nav-i18n (`nav.*` szótár + builder-locale +
   nav-header fogyasztó), komponens-oldali „a(z)"-feloldások
   (manager-vezérlő ×3, kampánynév-kártya idézőjeles esete),
   TeamIntelligence-zsargon, magázó hibaüzenet-hardcode-ok (sign-in/up
   boundary, error.tsx, pilot-apply).
2. **batch (`d7ab500`)** — a teljes szótár-oldali kör: 125+ kulcs 7 i18n
   fájlban (P1/P2/P3 + terminológia-családok + 11 notification-body
   névelő-mentes átfogalmazása); cfWhyThisOrder hívó-oldali
   `withHuArticle`; a két hívó nélküli career-sablon névelő-mentesre;
   B12 cím-átnevezés az i18n oldalon; deepDive-időtartam kivéve.
3. **batch (ez a commit)** — tartalom-libek: team-insights szemantikai
   inverzió + sablon-újraírás; team-intelligence kód-szivárgás és
   „szignifikánsan" javítása becslés-jelöléssel; 12 LEADER_SUPPLEMENTS
   blokk hipotézis-keretben + guardrail-teszt kiterjesztés; team-pattern
   P1-ek + 24 blindSpot valószínűségi formára; profile-content 48+17+6
   bejegyzés átírva ([]„a válaszaid …-ra utalnak" keret, klinikai szavak
   ki, Terhelés-kezelés átkeretezés); journey-zsargon (A20) mind a
   CTA-kban, magyarázatokban és a 10 STAGE_LABELS-ben; emails
   thanks-slot + testName + withHuArticle; tritan „Kapzsiságkerülés";
   B12 átvezetés a PDF/web közös BLOCK5_TITLE-ben; IdealEnvironmentSection
   POLES-kulcs a új címkére.

Verifikáció (záró állapot): `pnpm check` 0 hiba / 44 warning (örökölt
baseline) · unit 455/455 · client 92/92 · production build zöld
(dummy env-ekkel).

## Nyitott maradványok (tudatosan)

- **„Szorongás" facet nem-klinikai glosszája**: a `TRITAN_FACETS`-nek
  nincs leíró mezője — a glossza a facet-megjelenítési pontokon
  (komponens/i18n) helyezhető el egy következő körben.
- **`src/lib/questions/tritan.ts`** 57/60/82: a régi „Mohóságkerülés"
  alak és H-leírás — validált instrumentum-fájl, mérési okból nem nyúlunk
  hozzá; a megjelenítési réteg már az új nevet mutatja.
- **EN journey-terminusok** (observer/insights): angolul természetesek,
  csak a HU volt zsargonos.
- **„Zsoldosok" (RVFP) minta-név + a 16-os névkészlet**: brand-döntés,
  backlogon.
- **org.ts heatmapDesc kulcs-név** és társai: kulcsNEVEK nem változtak
  (hívás-kompatibilitás), csak értékek.
