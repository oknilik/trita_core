# Motor — ismert / elfogadott maradék (ledger)

> Élő dokumentum. Ez a **kanonikus alapvonal** a motor-auditok konvergenciájához:
> ami itt szerepel, az NEM „új lelet" egy következő vak körben — vagy pilot-adatot
> igényel (kóddal nem javítható), vagy tudatos termék-döntés/tervezési kompromisszum.
> Utolsó frissítés: 2026-08-11 (a v9 vak kör + javításai után — a kód-körök
> tulajdonosi döntéssel LEZÁRVA, ld. változásnapló).

## Miért van erre szükség (a végtelen-kör probléma)

Négy vak audit-kör (v1–v4) után a megfigyelés: a vak elemzők **nem tévesen**
re-detektálnak — a javítások tartanak (a v4 mind a hat területen 0 regressziót
igazolt). Ami *visszatér*, az két, strukturálisan mindig jelen lévő dolog:

1. **A validitási alap** — nem-normált POMP, kézi SEM-konstansok, kalibrálatlan
   küszöbök. Egy emlékezet nélküli, kód-alapon ítélő elemző ezt **mindig** meg
   fogja találni, mert tényleg ott van. **Kóddal nem javítható** — pilot-minta kell.
2. **A dokumentált/elfogadott kompromisszumok** — pl. a W2-maradék, a kettős
   pólus/tier-küszöb. A vak szem újra felhozza, mert nem ismeri a korábbi döntést.

Ez a ledger ezt a kettőt rögzíti, hogy a következő kör **szintézise** ehhez
mérhessen, és a valóban ÚJ, kód-szintű bugokat elkülönítse.

## Konvergencia-szabály (a megállási feltétel)

Egy vak audit-kör **konvergáltnak** számít, ha — a leleteit ehhez a ledgerhez
mérve — **nulla új, kód-szintű bugot** ad (minden lelet vagy itt szerepel, vagy
pilot-gated, vagy már-elfogadott tradeoff). Ekkor:

- A **kód-körök leállnak**. A következő lépés **NEM újabb audit**, hanem a **pilot**
  (a validitási alap kalibrációja) — mert ami maradt, azt csak adat oldja fel.
- Az auditok **teljesen vakok maradnak** (kód-alapú, a korábbi körök doksija tiltva)
  — az elfogulatlanság megőrzése miatt. A ledgerhez mérés a **szintézis** lépésben
  történik (a fő ügynök osztályozza: ÚJ-kód-bug / ledgerelt / pilot-gated), nem az
  elemzőknél.
- Új kód-bug esetén egy fókuszált javító-kör indul, **osztály-szinten** (minden
  testvér-felületet végigvezetve, nem csak az elsőn — ez volt a v4 fő tanulsága).

A ledger minden javító-kör után frissül: az újonnan elfogadott tradeoffok bekerülnek,
a megoldott pilot-tételek kikerülnek.

---

## 1. Pilot-gated validitási alap (kóddal NEM javítható — adat kell)

Az eszközök készen állnak (`scripts/research/`: norms-from-results, friction-calibration);
a referencia-minta hiányzik. Amíg nincs pilot:

- **Nem-normált POMP.** A dimenzió-pont `round(((átlag−1)/4)·100)` — 0–100-ra vetített
  nyers átlag, nem percentilis. A norma bedrótozva, kikapcsolva (`ACTIVE_NORM_TABLE = null`).
- **SEM-konstansok — a kézi priorok LECSERÉLVE mért értékekre (2026-08-11).**
  A `MEAN_ITEM_R` és a `SCORE_SD` (`psychometrics.ts`) 2026-08-11-ig kézzel
  beállított prior volt (**0.22 / 20**). Az IPIP-referencia-futtatás
  (n = 21 681, a saját pontozó-motorunkkal újrapontozva) megmérte őket, és a
  tulajdonosi döntés szerint **a mért értékek élesedtek: `MEAN_ITEM_R = 0.264`,
  `SCORE_SD = 16.2`**. Következmény (rövid forma): α .738 → **.782**,
  SEM 10,23 → **7,56**, √2·SEM 14,47 → **10,70**, tehát
  `DIFF_MIN_GAP` **14 → 11** (és vele automatikusan a dossié-kapu, a
  ComparisonTab/PDF eltérés-kapu, a facet-kapu 22 → **17**, a jelölt-oldali
  állíthatósági küszöb 28,4 → **21,0**). Iránya: a prior **25–27%-kal
  pesszimista** volt, azaz eddig **valós, 11–13 pontos különbségeket fojtottunk
  el**. A számok forrás-jelölve élnek a kódban (a régi priorok is ott maradtak
  auditálhatóság végett).
  **Ami ettől NEM oldódott meg — a tétel PILOT-GATED marad:**
  a minta **nemzetközi, angol nyelvű, önszelektált online** kitöltőké, és a
  MOSTANI bank-összeállításra (60 rövid item, 10/dimenzió) érvényes; a
  szórás a leginkább populáció-függő szám. A magyar pilot adata ezeket a
  konstansokat **le fogja váltani** (és akkor a `DIFF_MIN_GAP` újraszámolandó
  — az invariáns-teszt `tests/unit/scoring/psychometrics.test.ts` köti).
  A felületi percentilis **továbbra is kikapcsolva** (`ACTIVE_NORM_TABLE = null`)
  — ez a minta normának nem használható.
  **Dimenzió-heterogenitás — TUDATOSAN elhalasztva.** A mért SD 11,9 (O) …
  19,6 (X), az α .694 (O) … .803 (X), tehát egy globális konstans elvben az
  O-t túlbünteti, az X-et alulbünteti. A két hatás azonban nagyrészt kioltja
  egymást (a nagyobb szórású skálák α-ja is magasabb): a per-dimenzió √2·SEM
  a rövid formán **9,2 (O) … 11,6 (H)**, a globális 10,70 körül — a
  megjelenítést kapuzó küszöb dimenziónként legfeljebb ±1–2 ponttal térne el.
  Ezért a **felületi kapuk globálisak maradnak** (egy magyarázható küszöb
  helyett hat, dimenziónként eltérő „ennyi már eltérés" nem védhető), de a
  mért per-dimenzió táblák a kódban élnek
  (`MEASURED_SCORE_SD_BY_DIM`, `MEASURED_MEAN_ITEM_R_BY_DIM`), és a
  `dimStandardError` / `diffStandardError` opcionális dimenzió-argumentummal
  tud velük számolni (ismeretlen kódnál globális fallback, NaN nem keletkezik).
  Újraértékelés a pilot után. Részletek + teljes tábla:
  `docs/research/ipip-reference-2026-08.md`.
- **Kettős pólus/tier-küszöb.** 65/35 (`profile-engine`, narratíva-logika) vs 70/40
  (`dimension-utils`, vizuális tier). TUDATOSAN külön mechanizmusok; a közös vágás és
  annak ÉRTÉKE pilot-kérdés. A v5 összehangolta a felületi megjelenést (a forrás-chip
  és a strip nem mond ellent), de a küszöb-értékek priorok maradnak.
- **Csapat-küszöbök.** 16-minta taxonómia (`team-pattern.ts` „kalibrálandó"), friction
  aligned/complementary 12/22, cohesion-diverzitás sávok, stability 3.75 — mind hand-set.
- **Cohesion konstrukció.** `mean((ADAP+INTE)/2)` empirikus alap nélkül; a tag-átlag
  varianciája ~1/√2-szeres — a v5 a sávokat igazíthatja, de a konstrukció validációja
  pilot-kérdés.
- **Karrier súlyok (N=0).** A rang-súlyok, a HEXACO→RIASEC leképezés (gyengén támogatott
  linkek: Realistic←THOR, Social←ADAP), az observer-cap és zaj-faktor mind priorok.
  A known-groups harness a v5-ben körkörösség-mentessé vált, de tényleges validációhoz
  mért-kérdőív párok kellenek.
  **Mérve (2026-08-11):** a hatás nagysága immár szám, nem sejtés. A becsült
  (személyiség-alapú) érdeklődés-ágon a C három RIASEC-betűt hajt (R +0,4 · I +0,3 ·
  C +0,6), a H egyet sem — ezért wizard nélkül a legerősebb egydimenziós függés
  **r(C) = 0,43**, és a becsült vektor **61%-ban „low differentiation"** lesz (a motor
  ilyenkor felezi az érdeklődés-súlyt, tehát a rangsor a demandFit-re esik vissza).
  Preferencia-válaszokkal ugyanez r = 0,30-ra esik. Átsúlyozás = kalibráció, nem
  hibajavítás → marad pilot-gated. Mérés: `scripts/career-validation/simulate.ts`,
  jegyzőkönyv: `docs/audits/career-engine-benchmark-2026-08-11.md`.
- **Csapatszerep-becslő súlyok (v6).** A `team-role-estimate.ts` HEXACO→szerep súlyai
  nem-normáltak (per-szerep pozitív-összeg 0.45–0.90), ezért a szociálisan kívánatos,
  egyenletesen emelt profil strukturálisan a magas-nyereségű szerepek felé húz. Interim
  [kód]: a súlyvektorok elérhető-tartomány szerinti normálása; teljes: pilot-kalibráció.
- **Glyph-intenzitás sáv (v6).** A `type-glyph.ts` intenzitás-vágásai (25/40/62/80) egy
  HARMADIK, dokumentálatlan küszöb-család a 40/70 és 35/65 mellett — ugyanaz a
  pilot-normálás rendezi, de amíg nincs, legalább a tier-konstansokból származtatandó.
- **Rövid forma facet-súlyozása (v9).** A dimenzió-pont item-átlag, a rövid formán a
  facetekre 2–3 item jut egyenlőtlenül (pl. THOR: 3/3/2/2), a teljes formán 4/4/4/4 —
  a két forma dimenzió-kompozitja ezért nem azonos konstrukció-definíció (szélső
  esetben ~10 pont eltérés csupán az item-allokációból). Amíg egyetlen forma él
  (short), ez látens; forma-keveredésnél (org-átlag, hiring, normák) forma-szűrés
  vagy facet-kiegyensúlyozott pontozás kell — pilot + verziózási döntés.
  **Részben rendezve (2026-08-11):** a DIMENZIÓ-szintű egyenetlenség megszűnt —
  az altruizmus-itemek kikerültek a rövid formából, helyükre egy RESO- és egy
  OPEN-item lépett, így a rövid forma 60 item, dimenziónként pontosan 10.
  A FACET-szintű 2/3-as egyenetlenség megmarad (60 item / 24 facet nem osztható
  egyenlően) — ez marad pilot-kérdés.
- **IPIP-referencia tábla (v9 — tulajdonosi döntés).** Az OpenPsychometrics
  IPIP–HEXACO item-szintű mintájából (~20e fő, angol nyelvű, önszelektált online)
  képzett referencia-tábla és valódi Cronbach-α **kizárólag BELSŐ kalibrációra**
  használható (küszöbök, SEM-priorok visszamérése) — percentilisként NEM jelenik
  meg a felületen, és nem kerül az `ACTIVE_NORM_TABLE`-be. A forrás-jelölés
  kötelezően: „nemzetközi, angol nyelvű online minta, közelítő referencia".
  Eszköz: `scripts/research/norms-from-ipip-dataset.ts`. A hazai pilot-norma marad
  az arany standard.

## 2. Termék-döntést igénylő maradék (nem bug — döntés kell)

- **W2 — kijelentkezett self-submission.** A külső/link-tokenre KIJELENTKEZVE beküldött
  observer-értékelést auth-mentesen nem lehet a beküldő ≠ értékelt alapon kiszűrni
  (külső tokennél nincs a beküldőhöz kötött profil). BELÉPVE zárva (403, self-guard a
  submiten ÉS a v5 óta a draft olvasásán/írásán is). Teljes zárás vagy (a) auth-kötelező
  külső-submit — a dokumentált „auth nélküli observer-flow" (CLAUDE.md) megváltoztatása —,
  vagy (b) strukturális (zajos/karantén aggregátum, pilot). **Nyitva, tudatosan.**
- **Approval-kapu org-váltással.** Egy több-org tag az aktív-org váltásával
  approval nélkül gyárthat külső meghívót; a teljes zárás kampány-scope-hoz kötött
  aggregációt igényel (modell-döntés).
- ~~**Törölt profil demográfia-retenció.**~~ **LEZÁRVA (v8, 2026-08-11):** a döntés
  megszületett — TÖRLÉS. A tombstone a `username`/`birthYear`/`gender`/`country`/
  `careerBackground` mezőket is nullázza, a publikus `shareToken` visszavonódik, és
  az `Inquiry` (kapcsolat-űrlap szabad szöveg) + `CandidateInvite` (jelölt-azonosító)
  PII is redaktálódik. A completed observer/self SCORE pszeudonimizálva marad az
  anonim aggregátumhoz. Integrációs teszt fedi.
- **Org-roster email-láthatóság (v8).** A `GET /api/org/[id]` és a kampány-résztvevő
  lista bármely tagnak (ORG_MEMBER is) kiadja a tagok — és a még függő meghívottak —
  email-címét. Ez ROSTER-LÁTHATÓSÁGI termék-döntés: ha a teljes névjegyzék nem
  szánt alap-tagoknak, az email csak manage-képességgel menjen ki. Nem kód-bug
  (a hatókör-ellenőrzés megvan), hanem a szándékolt nyilvánosság kérdése.
- **ANONYMOUS observer-típus.** Definiált, de sosem gyártott enum-ág. Bekötni (nyílt
  link) vagy törölni — elnevezési/termék-döntés.
- ~~**RESO magas pólus a self-felületen (v9).**~~ **LEZÁRVA (2026-08-11):** a
  döntés megszületett — az Emocionalitás MINDKÉT pólusa, MINDKÉT felület-típuson
  **valencia-mentes**. Nem erősség és nem hiányosság: jellemző. A dimenzió nem
  tűnik el (mindkét pólus kétoldalú prózát kap: hozadék ÉS ára), csak a
  valenciás slotokból marad ki. Az „empata"/„Empath" címke — ami a
  Félelem/Szorongás/Dependencia/Érzelmi kötődés facetekre empátiát ígért —
  „ráhangolódó"/„Signal Reader"-re cserélve, és az empátia-tulajdonítás minden
  testvér-felületről eltűnt. A tension-pár tábla aszimmetriája (egyedül a
  RESO-magas párok voltak `risk: true`) is rendezve: a tartalom megmarad, de
  nem kerül valenciás „Figyelendő" kártyára. Kanonikus hely:
  `src/lib/score-valence.ts`.
  **Maradék [termékdöntés]:** a `profile-engine.ts` `TENSION_PAIRS` táblájában
  a `risk` flag ÉRTÉKEI változatlanok (RESO-magas: true) — a megjelenítés
  kapuzza őket. Ha a flag szemantikáját is valencia-mentesre visszük, az a
  RISK_TEXTS mitigációs tartalom átstrukturálását igényli (egy „megjegyzés"
  állapot bevezetése a „kockázat" mellé) — külön munka, nem sürgős.
- **Empátia-szókincs az ADAP-nál (v9).** A `TeamInsights.tsx` magas
  Barátságosság-szövege „empátiát" tulajdonít — ez a Barátságosság, nem az
  Emocionalitás, tehát a RESO-döntés hatókörén kívül esik. Kérdés, hogy a
  „ne ígérjünk olyan konstruktumot, amit nem mérünk" elv kiterjed-e rá.
- **Személyes observer-visszajelzés org-kontextusban (v9).** A member-dossier
  observer-aggregátuma és a manager-cockpit tevékenység-feedje a tag MINDEN valaha
  gyűjtött külső visszajelzését látja (a belépés előtti, magánkörös meghívókat is)
  — a testvér-aggregátumok (peer-szerep, trust) tudatosan org/team-scope-oltak.
  Kérdés: a privát önismereti kör beleszámítson-e az org-nézetbe. (A időbélyeg-
  pontosítás kód-szinten megtörtént a v9-ben; a scope termék-döntés.)
- **Küszöb-alatti részvétel-szám kijelzés (v9).** Az aggregátum a 3-as padló alatt
  null, de a pontos értékelő-DARABSZÁM („1 értékelő") kimegy — kis csapatban ez a
  részvétel TÉNYÉT azonosítja (ki adott már le, mikor). Döntés: „< 3" jelzés a
  pontos szám helyett a padló alatt, vagy elfogadott maradék.
- ~~**Altruizmus-skála kijelzési paritása (v9).**~~ **LEZÁRVA (2026-08-11):** a
  2 itemes skála (α≈0,36, SEM≈16, 12,5 pont/kattintás) **kikerült a rövid
  formából**. Helyette egy RESO- és egy OPEN-item lépett be, így a rövid forma
  továbbra is 60 item, de dimenziónként pontosan 10 (korábban 9–10 + 2
  altruizmus) — ez psychometriailag jobb, mint a kiindulás. A skála és mind a
  4 itemje megmarad a TELJES formára (későbbi tanácsadói opció). Új kitöltésnél
  a kártya magától eltűnik (a hiányzó dimenzió-kulcs kezelése rendezve);
  örökség-sorok továbbra is mutatják a valós, mért értéket.
  **Következmény:** `DIFF_MIN_GAP` 15 → 14 — a küszöb a bankból származik,
  több item = kisebb mérési hiba = kisebb állítható különbség. (Még aznap
  14 → **11**, amikor a kézi SEM-priorok helyére mért értékek kerültek — §1.)
- **„Kollektív minta" minimum-n (v9).** `PRESSURE_MIN_COUNT = 2` + ≥50% arány:
  3 fős csapatban 2 ember már „csapat-szintű nyomás-mintázatot" publikál a
  riportba. Döntés: minimum-n emelése (pl. 3) vagy elfogadott maradék.
- **Saját magát tartalmazó bázis (v9).** A tag „csapatátlag feletti" összevetése és
  a mintázat-deviancia a SAJÁT értékét is tartalmazó átlaghoz mér (3 fős csapatban
  ~1,5× nyers különbség kell a jelzéshez); a vezető-bázis már leave-one-out.
  Döntés: leave-one-out egységesítés (számítás-változás minden tag-nézetben).
- **W2-részlet: meghívó self-check csak email-egyezésre (v9).** A saját-email
  elleni ellenőrzés alias-változatokkal (pl. `+címke`) megkerülhető — a W2
  gyökér-maradék része; normalizálás (plus-címke levágás) részleges mitigáció,
  a teljes zárás a W2 fő döntésével együtt kezelendő.
- **Karrier: az átkattintható preferencia-lépés (2026-08-11, MÉRT).** A jobfit
  rangsorát a wizard preferencia-tengelyei tartják. Mérés (n = 800):
  preferencia nélkül a listavezető klasztere **78,9 szerep** és két mérés
  top-10-e **0,22** átfedésű; preferenciákkal **11,1 szerep** és **0,59**.
  A lépés ma átkattintható (minden tengely alapértelmezése semleges, a
  `preferenceFit` a be nem állítottakat kihagyja), és aki átkattintja, a gyenge
  ágra kerül — jelzés nélkül. Nem kód-hiba: a döntés az, hogy (a) válaszkényszer
  legyen-e a lépésen, vagy (b) a felület mondja ki a felbontatlanságot („ez a
  ~20 irány egyformán illik"). A (b) illeszkedik jobban a becsült-vs-mért
  jelölési elvhez. **A karrier-modul széles élesítésének 1. számú feltétele.**
  Jegyzőkönyv: `docs/audits/career-engine-benchmark-2026-08-11.md`.
- **Karrier: H-padló hatóköre H-cél ≥ 50 szerepeken (2026-08-11).** A padló
  dokumentált garanciája („magas H nem büntethető") az alacsony H-t kívánó
  szerepekre szól, és a 2026-08-11-i centrálás-javítás óta ott hiánytalanul áll
  (0 sértés). A H-cél ≥ 50 szerepeken viszont a nagyon magas becsületesség-alázat
  továbbra is kaphat ideal-point büntetést („a cél fölött vagy"). A garancia
  kiterjesztése minden szerepre termékdöntés — etikailag védhető, de a
  kétirányú ideal-point modell alóli kivétel lenne a H-ra.

## 3. Elfogadott tervezési kompromisszumok (a vak szem újra felhozhatja)

- **Anonimitás-padló = 3** (`MIN_RATERS_FOR_ANONYMOUS_AGGREGATE`). Az observer-reveal,
  a peer-szerep, a trust-node-aggregátum, a psych-safety és a dossier alatta null-t ad.
  A szemantikailag KÜLÖN 3-asok (statisztikai elégségesség, graf-fokszám) tudatosan
  külön konstansok.
- **Becslés vs mérés.** Becsült (HEXACO-származtatott) érték csak forrás-badge-dzsel,
  a PDF-ben szám nélkül. A v5 kiterjesztette az összes testvér-felületre; ha egy jövő
  kör mégis talál egy jelöletlen becslést, az ÚJ bug (nem ledgerelt).
- **A differencia-támadás maradéka (W1).** Az observer-átlag betöltésenként újraszámol;
  a completion-értesítés anonim, a completed-lista a v5 óta nap-pontos, a `relationship`
  mező nem szivárog. A teljes zárás zajos/kvantált aggregátum → pilot.
  **v8-kiegészítés (ÚJ részlet, ugyanaz a gyökér):** a dimenzió-átlag mellett a
  FACET-átlag (`computeObserverFacetAverages`, ~24 egyenlet betöltésenként) is
  újraszámol — ez a csatorna élesíti az egy-nevesített-rater visszafejtését a
  dimenzió-only becsléshez képest. A mitigációs jegyzetek eddig csak a dimenzió-
  átlagot említették. A javítási irány ugyanaz (fix rater-szám „snapshot" +
  kvantálás/zaj), és a facet-rétegre is ki kell terjednie — pilot-kalibrált
  termék-döntés, nem kód-bug. A per-ÉRTÉK anonimitás-padló viszont már kód-szinten
  zárva (v8: `computeObserverAverage` is a facet-sibling listwise szabályát követi).
- **A közös rangsor holtverseny-tie-breakje** (`rankDimensionScores` TRITAN_ORDER;
  a csapatszerep FNV-hash) determinisztikus és szándékos.
- **Kétszintű evidencia-politika (v9 — dokumentált).** Az önkép–külső összevetés
  „beszédtéma"-kapuja 1×SE(diff) (`DIFF_MIN_GAP` = `round(√2·SEM)`, ~68%-os szint — célja
  beszélgetés-indítás a tanácsadásban), a hiring-döntéstámogatás kapuja
  1,96×SE(diff) (~95% — célja állítás-erősség egy munkáltatói döntésben). A két
  szint KÜLÖNBÖZŐ céljú felületekhez tartozik, és szándékos; ha egy felület
  céltípust vált, a kapuját is váltani kell.
- **Jelölt-vs-csapatátlag SE konzervatív (v9).** A √2·SEM a két EGYÉNI pontszám
  különbségére igaz; a csapat-ÁTLAG elleni különbség valódi hibája SEM·√(1+1/n)
  (n=3-nál ~23%-kal kisebb). A jelenlegi kapu tehát a „nincs eltérés" irányba
  téved — biztonságos irány, elfogadva; pilot után finomítható.
- **W1 új részlet (v9):** az attribúciót nem az időbélyeg, hanem a meghívottankénti
  „completed" státusz-sor + a frissítést jelző polling adja — a nap-pontosítás ezt
  nem zárja. A javítási irány változatlan (fix rater-számú snapshot + kvantálás),
  és a per-meghívott státusz-lista redukciója is ide tartozik.
- **Hiring pár-panelek RESO-kezelése (v9).** A ④-es interakciós blokk három
  „figyelendő" párja RESO-magas, három „erősség" párja RESO-alacsony mintázatra
  épül — a lap tetején lévő (valencia-mentes) erősség/figyelendő listákkal
  ellentétes politika. Védhető tartalmi ítélet (magas reaktivitás + magas
  láthatóság valós kockázat-minta), de a kettősség dokumentált; egységesítése a
  RESO fő termék-döntésével együtt esedékes (§2).

## 4. Mérési hiba a felületen — TERMÉK-DÖNTÉS (2026-08-11)

**A mérési hiba (±) SZÁMKÉNT nem jelenik meg a felületen.** Indok: a facet-/altruizmus-
szintű ± (~15–16 pont) elsőre riasztóan nagy, és nem szolgálja a felhasználó első
benyomását. A v5 minden numerikus ±-t / SEM-sávot / „becsült mérési hibája" jegyzetet
eltávolított a UI-ról (dimenzió-szint is).

- A **mérési-hiba fegyelem a LOGIKÁBAN él**, nem a kijelzőn: a különbség-kapuk a KÉT pont
  KÜLÖNBSÉGÉNEK hibáját használják (`DIFF_MIN_GAP = round(√2·SEM)` — a bankból
  és a MÉRT reliabilitás-konstansokból származtatva, 2026-08-11 óta **11**
  (a forma-kiegyensúlyozás 15 → 14, a mért SEM 14 → 11; §1),
  `diffStandardError`), nem az 1×SEM-et — így ott NEM állítunk sorrendet/címkét, ahol a
  delta a hibán belül van (a próza is főnév-only / hedge-elt). Ez szám nélkül történik.
- A felhasználónak szóló **magyarázatot** (mit jelent a mérési hiba, miért nem
  pont-pontos a kép) egy **külön, központi leírás** adja majd — TBD (a termék-tulaj írja).
  Amíg nincs, a UI nem kommunikál ±-t.
- **Következmény a jövő auditokra:** ha egy vak kör azt jelzi, hogy „a facet ± nélkül
  jelenik meg" vagy „a mérési hiba nincs kivezetve", az **NEM új bug** — ez a döntés.
  Ha viszont egy ±-szám valahol MÉGIS megjelenik a UI-n, az regresszió (ÚJ bug).
- **Nyitott al-döntés (v6):** a karrier-modul (parkolt) még kiír egy numerikus
  konfidencia-sávot (`bandLow–bandHigh%`). Vagy a fő ±-döntés kiterjed rá (le a
  felületről), vagy a karrier tudatosan kivétel — ez egy tisztázandó termék-al-döntés,
  nem új bug.

---

## Változásnapló (a ledger frissítései)

- **2026-08-11 (jobfit-visszakötés) — A KARRIER-MOTOR MEGMÉRVE, EGY ÚJ KÓD-BUG
  JAVÍTVA.** A parkolt karrier-modul felülvizsgálata a v1 alapvonalhoz mérve
  (`scripts/career-validation/simulate.ts`, n = 800; jegyzőkönyv:
  `docs/audits/career-engine-benchmark-2026-08-11.md`).
  - **A v1 fődiagnózisa („nem differenciál") megszűnt:** rangsor-szórás
    5,3 → 10,0–11,9 · jel/zaj ~0,66 → 1,24–2,63 · elevation-r 0,70 → 0,01–0,09 ·
    legerősebb dimenzió-r 0,82 → 0,26–0,43. A katalógus súlymasszája hat
    dimenzión oszlik (9,8%–22,7%) a v1 THOR-dominanciája (31%) helyett.
  - **Új kód-bug, javítva:** a H-padló dokumentált invariánsa nem állt — a padló
    által VÉDETT szerepek 16,5%-án az alacsony H-jú iker kapott magasabb pontot
    (legrosszabb 25 pont), a H-t nem is kérő szerepek 49,3%-a pedig egyáltalán
    mozdult a H-tól. Ok: kereszt-csatolás a NYERS-skálás padló és a CENTRÁLT
    komponensek között (a centrálás nulla-összegű). Javítás: a centráló átlag a
    H nélkül számol (`CENTERING_DIMS`) → 0 sértés, 2 új kötő teszt.
    Ez a hiba-osztály komponens-szinten láthatatlan volt — ezért kerülte el a
    v1–v9 köröket.
  - **Két új nyitott termékdöntés a §2-ben:** az átkattintható preferencia-lépés
    (a széles élesítés 1. feltétele) és a H-padló hatóköre.
  - **A §1 karrier-tétele számot kapott:** a becsült érdeklődés C-dominanciája
    r = 0,43 (wizard nélkül), 61% low-differentiation.
  - `CAREER_MODULE_READY = true` — a modul visszakötve.

- **2026-08-11 (v9 utókör) — KÉT TERMÉKDÖNTÉS LEZÁRVA + AZ ELSŐ MÉRT SZÁMOK.**
  - **Emocionalitás-valencia:** lezárva — mindkét pólus, mindkét felület-típus
    valencia-mentes; az „empata" címke és az empátia-tulajdonítás minden
    testvér-felületről eltűnt; mindkét pólus kétoldalú prózát kapott. Maradék:
    a `TENSION_PAIRS` `risk`-flag szemantikája (megjelenítés-szinten kapuzva).
  - **Altruizmus-skála:** lezárva — ki a rövid formából; a forma 60 item maradt,
    de dimenziónként pontosan 10. Következmény: `DIFF_MIN_GAP` 15 → 14
    (majd a mért SEM-konstansokkal → 11).
    Mellékesen javítva egy valós törés: a régi item-készlettel érkező kitöltés
    (vendég-draft, futó observer-link) 400-at kapott volna — örökség-készlet
    elfogadás került be.
  - **IPIP-referencia lefuttatva valódi adaton** (n = 21 681, GitHub-tükör):
    először van mért α/szórás/SEM a kézi priorok helyett. Beírva a §1-be —
    és 2026-08-11-i tulajdonosi döntéssel ÉLESÍTVE is (`MEAN_ITEM_R` 0.22 →
    0.264, `SCORE_SD` 20 → 16.2, `DIFF_MIN_GAP` 14 → 11).
    A tábla BELSŐ kalibrációra való, `ACTIVE_NORM_TABLE`-be nem kerül.
  - **Új nyitott tétel:** empátia-szókincs a Barátságosságnál (§2).

- **2026-08-11 (v9 után) — A KÓD-KÖRÖK LEZÁRVA (tulajdonosi döntés): a következő
  lépés a SZERKEZET és a PILOT, nem újabb audit.** A kilencedik vak kör (6 elemző,
  teljes jelentés: `motor-audit-v9-2026-08-11.md`) NEM konvergált: ~40 új
  kód-szintű lelet, köztük nem csak testvér-felületek, hanem valóban új
  logikai hibák is (trust-hub/izolált irány-szemantika, psych-safety több-csapatos
  kampány-scope, jelölt-meghívó org-útvonal, karrier-blend invertálhatóság,
  kijelentkezett draft-olvasás). MINDEN megerősített kód-lelet javítva ebben a
  körben (6 párhuzamos batch). A tulajdonosi döntés értelmében a vak kód-körök
  itt LEZÁRULNAK — az ismétlődő testvér-felületi osztályra a válasz szerkezeti:
  (1) kanonikus valencia-kapu (`src/lib/score-valence.ts`) — minden RESO-/valencia-
  besorolás egy modulon át; (2) display-gate réteg terve (minden „pontszám →
  címke/szín/szöveg" transzformáció egy modulban) — a v9 doksi rögzíti; (3)
  IPIP-referencia kalibráció + hazai pilot (§1). Ledger-mozgás: §1 +2 tétel
  (rövid forma facet-súlyozás; IPIP-referencia döntés), §2 +6 termék-döntés
  (RESO magas pólus self-en; személyes observer-visszajelzés org-nézetben;
  küszöb-alatti darabszám; altruizmus-paritás; PRESSURE_MIN_COUNT; leave-one-out
  bázis; W2 alias-részlet), §3 +4 dokumentált kompromisszum (kétszintű evidencia-
  politika; jelölt-vs-átlag SE; W1 attribúciós részlet; hiring pár-panelek).
- **2026-08-11 (v8 után) — A KONVERGENCIA MÉG NEM ÁLLT BE, de a struktúra stabil.**
  A hetedik javítási kör (HEXACO-címkék, hero-CTA-k, ± leszedése) után indított
  nyolcadik vak kör (6 elemző) eredménye:
  - **A v7 deliverable-jei ÁLLNAK.** Független megerősítés: a nyers dimenzió-kódok
    (INTE/RESO/…) SEHOL nem szivárognak user-facing szövegbe; mind a négy hero
    (self/team/org/hiring) CTA-ja látható és kontraszt-helyes; a „Belbin"/„TRITAN"
    márkanevek nincsenek a felületen; a scoring/type-mag (reverse-scoring,
    `DIFF_MIN_GAP`, hedge-kapuk, NaN-védelem) tiszta.
  - **ÚJ kód-réteg (13 tétel) — javítva ebben a körben.** Két osztály-szintű téma:
    (1) **RESO-valencia inverzió** három felületen (team-report prefill,
    `generateTeamSummary`, jelölt-összegző) — az érzelmi STABILITÁST jelezték
    kockázatként/„figyelendőként"; (2) **± szám a UI-n** két helyen (publikus
    landing team-hero „± szórás", intelligence-tab spread/delta „(N pont)") — a
    2026-08-11 döntés testvér-felületei. Plusz: GDPR-scrub kiterjesztés
    (`Inquiry` + `CandidateInvite` PII), observer-kvóta kizárás, per-érték
    anonimitás-padló, pattern-route crash, H-floor ellentmondás, kredit-race,
    fake-door emailRate, két félrevezető megjegyzés.
  - **A tanulság ismét a TESTVÉR-FELÜLET.** Egyetlen v8-lelet sem mondott ellent a
    korábbi javításoknak — mindegyik egy MÁSIK felület volt, amit az adott
    osztály-szintű döntés (RESO-irány, ±-tilalom, PII-scrub) még nem érte el.
    Ez erősíti a v4 óta érvényes szabályt: a javítást osztály-szinten kell
    végigvinni, és a vak kör pontosan a kimaradt testvért találja meg.
  - **Ledger-mozgás:** a „törölt profil demográfia-retenció" LEZÁRVA (törlés
    mellett döntöttünk, kóddal + teszttel), a W1 kapott egy új, valós
    részletet (facet-csatorna amplifikátor), és bekerült egy új termék-döntés
    (org-roster email-láthatóság). A validitási alap (§1) VÁLTOZATLAN — nyolc
    kör alatt nem jött új strukturális meglepetés.
  - **Következő lépés:** mivel ez a kör még adott új kód-leletet, a szabály szerint
    egy újabb vak kör indokolt a mostani javítások után. Ha az nulla új kód-bugot
    ad, a kód-körök lezárulnak és a pilot jön.
- **2026-08-11 (v6 után):** a hatodik vak kör (6 elemző) MINDEN struktúrális leletét
  ehhez a ledgerhez rendeltük — 0 új struktúrális meglepetés (a validitási alap
  konvergált). Hozzáadva: csapatszerep-becslő súlyok (§1), glyph-intenzitás sáv (§1),
  karrier konfidencia-sáv ±-al-döntés (§4). A v6 új KÓD-rétege külön dokumentumban:
  `motor-audit-v6-2026-08-11.md` (egy v7 kód-kör bemenete). A konvergencia-szabály
  szerint: a struktúra kész, a kód-oldal még egy fókuszált kört igényel.
- **2026-08-11 (v5 után):** ledger létrehozva. A v5 lezárta: a v3-fixek testvér-
  felületeit (W6 case-insensitive + CANCELED + Clerk-webhook közös scrub; W1 nap-pontos
  + `relationship` drop; csapatszerep badge/exact/scope; S3-próza), a privacy-réteget
  (karrier observer-blend gate, külső draft self-guard, role-round GET guard, dossier
  org-scope), a RESO fordított orientációt, a HowYouWork slot-hibát, a nulla-sentinelt,
  a SE(diff) kaput, a karrier struktúrát (known-groups composite, scoped bázis), és a
  ± eltávolítását a felületről. A fenti 1–4. pont a MARADÉK, ami nem kód-kérdés.
