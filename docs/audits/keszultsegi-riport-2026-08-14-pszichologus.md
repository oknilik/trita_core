# Készültségi riport — PSZICHOLÓGUS szemmel

> Alap: `main` @ `63da5ae` (2026-08-12). Vizsgálat dátuma: 2026-08-14.
> Nézőpont: mérésmódszertan, teszthasználati etika (ITC/EFPA-szemlélet),
> a kimenetek értelmezhetősége és a kitöltő védelme.

## 0. Egymondatos ítélet

**A mérési fegyelem kiemelkedő — a kimondott állítások mögött tényleg ott van
a fedezet.** Ami hiányzik, az három dolog, és egyik sem a pontozó-motorban van:
**(1) a saját kitöltés válaszminőség-ellenőrzése, (2) a tájékoztatás a gyűjtés
pillanatában, (3) a kiválasztási (hiring) felhasználás elhatárolása.**

---

## 1. Amit a szakma szemével dicsérni kell

Ezek nem udvariassági sorok — ritkán látni ilyet ebben a termékkategóriában.

**A mérési hiba tényleg kapuz, nem csak szerepel a lábjegyzetben.**
A `DIFF_MIN_GAP = 11` (`src/lib/personality-type.ts:139`) **√2·SEM**, azaz két
pont *különbségének* hibája — nem 1×SEM, ami a klasszikus alulbecslés. És
következetesen fut: az archetípus-címke főnév-only-ra fokozódik le, ha a top-pár
a hibán belül van (`resolvePersonalityTypeFromScores`), a prózát ugyanez a kapu
köti (`isSecondaryUncertain`), és a tag-dossié eltérés-küszöbe származtatott,
nem literál (`member-dossier.ts:36`). Ez az a hely, ahol a legtöbb hasonló
termék csúsztat.

**A reliabilitás-konstansok mértek, és a mérés korlátai kimondottak.**
`MEAN_ITEM_R = 0.264`, `SCORE_SD = 16.2` (n = 21 681, IPIP–HEXACO,
`psychometrics.ts:70-95`), a régi kézi priorok (0.22 / 20) auditálhatóság végett
bent hagyva, és a forrás-blokk maga mondja ki, hogy a minta *nemzetközi, angol
nyelvű, önszelektált online* — tehát belső kalibrációra jó, normának nem.
Az irány is helyesen értelmezett: a prior ~25%-kal pesszimista volt, azaz
**valós különbségeket fojtottunk el**, nem fordítva.

**`ACTIVE_NORM_TABLE = null`** (`norms.ts:32`). A rendszer inkább **nem mutat
percentilist**, mint hogy hamisat mutasson. A tábla-interfész készen áll
(`version`/`source`/`n` kötelező), a felület automatikusan élesedik. Ez a
legfegyelmezettebb döntés az egész kódbázisban.

**Anonimitás-padló egyetlen igazságforrásból.**
`MIN_RATERS_FOR_ANONYMOUS_AGGREGATE = 3` (`anonymity.ts:15`), és mind az öt
származtatott küszöb erre hivatkozik (observer reveal, trust, peer-szerep,
pulse, dossié). A küszöb alatt az aggregátorok **szándékosan `null`-t adnak** —
nem üres állapotot renderelnek, hanem nem számolnak.

**Valencia-kezelés a fordított skálán.** Az Emocionalitást érintő tension-párok
nem keretezhetők hiányosságként — a `score-valence.resolvePairTone` „note"-tá
szelídíti őket (`profile-engine.ts:74-83`), és a tábla-szerzőnek **tilos** kézzel
„note"-ot deklarálnia. Ez pontosan az a hiba, amit a legtöbb HEXACO-alapú
riport elkövet.

**A 2026-08-11-i „empata → ráhangolódó" revízió.** A kommentben
(`personality-type.ts:29-36`) ott a helyes indoklás: az E facetjei a Félelem /
Szorongás / Dependencia / Érzelmi kötődés — **az empátia nem ezen a skálán
mérődik**. Ezt kevés terméknél veszik észre, és még kevesebbnél javítják vissza.
Ugyanide tartozik a „Szorongás" facet nem-klinikai glosszája
(`i18n/results.ts:492`) és a 48/100 fordított item (jó akvieszcencia-egyensúly).

**Rater-minőség detektor.** `src/lib/observer/rater-quality.ts` — flat (SD < 0,55),
straightline (≥12 azonos), fordított-item inkonzisztencia; **nem kizárási
szabály, csak jelzés**, és a felszínen csak darabszámként jelenik meg
(anonimitás). Helyes felépítés.

---

## 2. P0 — a pilot előtt

### A1. A SAJÁT kitöltésnek nincs válaszminőség-ellenőrzése

Ez a legfontosabb lelet.

A `rater-quality.ts` **tiszta modul**: `(answers, itemMeta) → flags` — se
Prisma, se kérdésbank. Mégis **kizárólag az observer-válaszokra** fut
(`member-dossier.server.ts:180-196`), és ott is csak `observerSuspectCount`
darabszámként jelenik meg.

**Az önértékelésre semmi ilyesmi nincs.** Ha valaki végigkattintja a 60 itemet
egyetlen értéken, vagy ellentmondásosan válaszol a fordított itemekre, a rendszer
ugyanúgy legyárt egy teljes archetípust, karrier-illeszkedést, csapatszerep-
becslést és fejlődési tervet — **egyetlen jelzés nélkül**. Nincs válaszidő-
rögzítés sem: az `AssessmentDraft` (`schema.prisma:162-174`) csak
`createdAt`/`updatedAt`-et tárol, item-szintű vagy összesített kitöltési időt nem.

Miért pont most számít: a self-serve látogató önként jön, motivált. A **pilotban
szervezeti tagok** töltik ki, részben kötelezettségből, részben bizalmatlanul —
ez pontosan az a populáció, ahol a felületes kitöltés megjelenik. Ha ez
észrevétlen marad, a tanácsadó egy zajprofilt fog **komolyan értelmezni egy
workshopon**, élő ember előtt.

Javaslat, növekvő sorrendben:
1. A meglévő `assessRaterQuality` ráfuttatása a self-válaszokra beküldéskor,
   és eltárolása az eredmény mellé (nem felületi, csak belső jelzés).
2. A tanácsadói/dossié-nézeten egy diszkrét „a kitöltés mintázata felületes
   válaszolásra utalhat" jelölés — ugyanolyan forrás-badge logikával, ahogy
   minden más becslés meg van jelölve.
3. Opcionális: teljes kitöltési idő rögzítése (egy `completedAt − startedAt`
   elég; item-szintű timing nem kell, és adatvédelmileg is drágább).

Az 1. pont **fél nap**, mert a modul már megvan és tiszta.

### A2. Tájékoztatás a gyűjtés pillanatában — a legnagyobb etikai rés

A kérdőív-bevezető (`i18n/assessment.ts:3-24`) végig **személyes haszon**-
keretben beszél: „~10 perc, és megkapod az első karrierképedet", „Nincsenek jó
vagy rossz válaszok", „Bármikor félbeszakíthatod". **Egyetlen szó sincs arról,
hogy szervezeti kontextusban ki fogja látni az eredményt.**

Közben a tag-dossié (`member-dossier.ts`) az org adminnak és a tanácsadónak
megmutatja a tag **egyéni, dimenziószintű önértékelését** (`DossierDimComparison
{ code, self, observer, delta }`), a facet-bontást és az önkép–külső kép
összevetést.

Az adatvédelmi tájékoztató ezt **nem mondja ki elég pontosan**. A
„Csapatszintű visszajelzések és anonimitás" szakasz
(`legal/privacy-policy.ts:249-254`) aprólékos a *peer*-mérések anonimitásáról,
de a vezetői/admin/tanácsadói láthatóságot így fogalmazza:

> „Az **összesített csapatképet** a csapat vezetője, a szervezeti adminisztrátor
> és a szervezethez rendelt tanácsadó látja; te a rólad szóló, összesített
> visszajelzést látod."

Az egyéni dossié **több ennél**. A 318. sor („hozzáférhet az adatodhoz a
szervezeted arra jogosult munkatársa … a fenti anonimitási szabályok keretei
között") általánosságban lefedi, de a hivatkozott anonimitási szabályok a *peer*-
aggregátumokról szólnak — az illető **saját** önértékelésére nem vonatkoznak.

Ez nem jogi formaság: a kitöltési őszinteséget pontosan az dönti el, hogy a
kitöltő **helyesen tudja-e**, ki olvassa. Ha utólag derül ki, az egyszerre etikai
és mérési probléma — és a pilot legrosszabb kimenetele.

**A megoldás mintája már a kódban van.** A bizalmi kör konszent-szövege
(`i18n/assessment.ts:142-143`) pontosan azt csinálja, ami kell: konkrét, a
gyűjtés helyén, és megmondja a küszöböt is. Ugyanezt kell megírni a
személyiség-kitöltéshez, szervezeti kontextusban — plusz a privacy-bullet
pontosítása („a szervezeti adminisztrátor és a tanácsadó a te egyéni
dimenzió-eredményeidet is látja; a csapattársaid nem").

Fél nap szövegezés, és a pilot bizalmi alapját dönti el.

### A3. A kiválasztási (hiring) felhasználás — ezt el kell határolni

`CANDIDATE_GATING_ENABLED = false` (`operating-mode.ts:47`), a `/hiring/[orgId]`
felület él, a tanácsadói körnek nyitva, jelölt-flow-val és jelölt-eredménnyel.

A kód itt is gondos: SE-tudatos címkék, „nem alkalmasság-ítélet" disclaimer a
felületen is (nem csak PDF-ben), állíthatósági küszöb a mért SEM-ből. **A
kockázat nem a kódban van, hanem a felhasználásban.**

Egy olyan instrumentum, amelynek (a) **nincs hazai normája**, (b) nincs helyi
validitás-bizonyítéka (kritérium-validitás magyar munkavállalói mintán),
(c) nincs adverse-impact vizsgálata, **kiválasztási döntés támogatására nem
alkalmas** — függetlenül attól, milyen szépen van hedge-elve a felület. A
`motor-known-residuals.md` maga sorolja fel, hogy a karrier-súlyok N=0 priorok,
a HEXACO→RIASEC leképezésben gyengén támogatott linkekkel.

Javaslat: **a hiring felület maradjon ki a pilot scope-jából**, vagy legyen
kifejezetten „felvétel utáni beilleszkedési/fejlesztési beszélgetés"-ként
pozicionálva. Ez termék-döntés, nem kódmunka — de a pilotban részt vevő
ügyfélnek egyértelműen kell tudnia, mire nem való.

---

## 3. P1 — a pilot alatt rendezendő

### B1. „%" a mért csapatszerep-pontszámon

`src/components/results/TeamRoles.tsx:184` — `${rank} · ${score}%`. A pontszám
valójában `(összeg / MAX_PER_ROLE) × 100` (`team-role-scoring.ts:105`), azaz az
**elérhető maximum aránya** — nem percentilis, nem az értékelők aránya, nem
valószínűség. A `%` glifa mindhármat sugallja.

A becslés-ágon ezt **már helyesen kezelik**: ott nincs szám, mert „a súlyozott
összeg nem százalék, kiírva álprecizitás lenne" (a komment a 181-183. sorban).
Ugyanez az érv áll a mért ágra is — vagy essen ki a `%`, vagy kapjon
egyértelmű címkét.

### B2. Három párhuzamos küszöb-család

- **65/35** — narratíva-kapu (tension-párok, interakció, pressure), `profile-engine.ts:62-63`
- **70/40** — vizuális tier, `dimension-utils.getDimensionTier`
- **25/40/62/80** — glyph-intenzitás, `type-glyph.ts`

Az első kettő ellentmondása dokumentált és tudatos döntés (a 65/35 átállítása
elmozdítaná, mely párok tüzelnek). A **harmadik család viszont dokumentálatlan**
harmadik vágás — a ledger is így nevezi. Amíg nincs normált minta, legalább a
tier-konstansokból származtatandó, hogy egy vágás mozgatása ne hagyjon
inkonzisztenciát.

### B3. A csapat-szintű konstruktumok validációját a pilotnak *célzottan* kell mérnie

`cohesion = mean((ADAP+INTE)/2)` empirikus alap nélkül; a 16-mintás taxonómia
(`team-pattern.ts`) „kalibrálandó"; friction aligned/complementary 12/22;
stability 3,75. Mind hand-set, mind ledgerelt, mind őszintén badge-elve.

A veszély nem az, hogy priorok — hanem hogy **a pilot csak normagyűjtésként van
megtervezve**. Egy norma-minta megadja a dimenzió-eloszlásokat, de **nem
validálja a cohesion-konstruktumot**. Ahhoz külső kritérium kell: a csapat
vezetőjének / a tanácsadónak a mérésektől függetlenül rögzített ítélete,
amivel a modell utólag összevethető.

Konkrét javaslat: a pilot-protokollba kerüljön be **3-5 kérdéses, tanácsadói
kritérium-lap** csapatonként (workshop előtt kitöltve, a riport megnézése
**előtt** — különben körkörös). Ez a legolcsóbb dolog, amit a pilot alatt meg
lehet tenni, és később nem pótolható.

### B4. Nyelvhasználat: a „validált" szó

`i18n/landing.ts:54` „Tanácsadó által jóváhagyva", `landing.ts:200`
„**Validált** csapatkép — néhány napon belül". Itt a „validált" köznyelvi
értelemben szerepel (= átnézve), de egy pszichometriai terméknél ez a szó
technikai jelentést hordoz (validitás-bizonyíték). Egy szakmai olvasó ezen
azonnal fennakad, és a hitelesség pont ott sérül, ahol a legdrágább.

Javaslat: „tanácsadóval **átbeszélt** / **értelmezett** csapatkép". A
„Tudományos alap" / „Tudományos modell" állításokat viszont **nem** kifogásolom:
a hatfaktoros modell és az IPIP-itemek tényleg tudományosak, és a `/llms.txt`
módszertani sora korrekten hivatkozik (Ashton & Lee, 2007 + IPIP).

### B5. Nincs újrafelvételi (retest) iránymutatás

`i18n/results.ts:241-249`: a „Teszt újra kitöltése" gomb csak annyit mond, hogy
az új eredmény felülírja a régit. **Nincs semmilyen jelzés arról, hogy egy
vonás-instrumentum rövid távú ismétlése nagyrészt a mérési hibát méri újra.**

Ha valaki nem szereti az eredményét és azonnal újrakitölti, a rendszer ezt
készségesen kiszolgálja — és a „jobb" eredmény lesz a profilja. A kampány-
oldalon van `requireFreshResults`, tehát a szerkezet ismeri a frissesség
fogalmát; a felhasználói oldalon nincs hozzá szöveg.

Javaslat: a megerősítő párbeszédbe egy mondat — „A személyiségvonások lassan
változnak; néhány hónapon belüli ismétlés jellemzően nem új információt mutat,
hanem a mérés természetes ingadozását."

---

## 4. Amit NEM javaslok

1. **Az `ACTIVE_NORM_TABLE` feltöltését az IPIP-referenciából.** A 2026-08-11-i
   tulajdonosi döntés helyes: nemzetközi, angol nyelvű, önszelektált minta —
   belső kalibrációra igen, percentilisként nem. Kísértés lesz, mert n = 21 681
   nagynak *látszik*; a reprezentativitás viszont nem elemszám kérdése.
2. **Per-dimenzió SEM-küszöbök bevezetését.** A `psychometrics.ts:130-140`
   indoklása helytálló: a √2·SEM dimenziónként 9,2–11,6, a globális 10,7 —
   ±1-2 pont különbségért hat különböző, magyarázhatatlan küszöböt kapnánk.
3. **Újabb motor-audit kört.** A v9 konvergált. A maradék adat-kérdés.

---

## 5. Sorrend

| # | Tétel | Ráfordítás | Miért ez a sorrend |
|---|---|---|---|
| 1 | A2 — tájékoztatás a kitöltés előtt + privacy-bullet pontosítás | fél nap | ez dönti el a pilot **adatminőségét**, mert az őszinteséget dönti el |
| 2 | A1 — self válaszminőség-jelzés (meglévő modul rákötése) | fél nap | különben a tanácsadó zajt fog értelmezni élő workshopon |
| 3 | A3 — hiring elhatárolása a pilot scope-tól | döntés | jogi/etikai kitettség, nem kódmunka |
| 4 | B3 — tanácsadói kritérium-lap a pilot-protokollba | fél nap | **később nem pótolható** — a pilot után már körkörös |
| 5 | B4, B5, B1 — szövegek | fél nap | olcsó, és a szakmai hitelességet védi |
| 6 | B2 — glyph-küszöbök származtatása | 1 nap | pilot után, a normákkal együtt |

Az 1-4 együtt **kb. két nap**, és ezek után a pilot nemcsak normát gyűjt, hanem
**validálható is lesz** — ami a jelenlegi tervben még nincs benne.
