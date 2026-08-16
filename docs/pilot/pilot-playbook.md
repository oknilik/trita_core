# Trita Team Scan pilot — tanácsadói playbook

> Készült: 2026-07-20 · Frissítve: 2026-08-16 (Lumina-benchmark P1.3/P2.2/P2.3).
> Párja: `kampany-utemterv.md`, `riport-ertelmezesi-sablonok.md`,
> `ugyfel-kommunikacio.md`, `team-scan-esetnaplo-sablon.md`.
>
> Keret: 15–20 referenciázható Team Scan, 5–30 fős csapatokkal; várhatóan
> 200–500 egyéni kitöltő. Az első hullám indulhat 1–2 szervezettel. A program
> csak a mért kimenettel és az esetnaplóval együtt számít lezártnak.

## 1. Mit ígérünk a pilot-partnernek?

1. **Rögzített Team Scan v1** — self + mért bizalmi háló + névtelen,
   8 itemes pszichológiai biztonság pulse. Observer és peer csak külön,
   előre egyeztetett kiegészítő, nem rejtett alapteher.
2. **Személyes kickoff** — cél, adatkezelés, anonimitási küszöbök és menetrend.
3. **Tanácsadó által validált csapatriport** — külön jelölve, mi mért, becsült,
   elégtelen vagy csak értelmezési nyelv.
4. **Vezetői debrief és célmutatóhoz kötött akció** — 1–3 vállalás felelőssel,
   határidővel és a platformon tárolt `targetMetric` mezővel.
5. **Visszamérési kör** — ugyanazon változékony mutatók összevetése
   mérési-hiba- és kompozíciós kapuval. A stabil személyiségprofil kontroll,
   nem fejlődési címke.
6. **Visszajelzési és korai partner státusz** — a folytatás feltételeit és
   ársávját a záró beszélgetésben, nem a mérési eredményből vezetjük le.

## 2. Sikerkritériumok

Egy csapat esete akkor referenciaképes, ha a mérés mellett az akció és a
visszamérés is dokumentált. A „nincs védhető elmozdulás” is érvényes eredmény;
a hiányzó vagy összetétel miatt értelmezhetetlen visszamérés viszont
adatminőségi korlát, nem sikertörténet.

| # | Kritérium | Célérték | Forrás |
|---|---|---|---|
| S1 | Self-részvétel | ≥85% a meghívott tagokból | kampány-statok |
| S2 | Bizalmi kör részvétel | ≥80% a meghívott tagokból | kampány-statok + evidence |
| S3 | Pulse-részvétel | n≥3 és lehetőleg ≥70% csapatlefedettség | pulse aggregátum |
| S4 | Validált, publikált riport | minden pilotcsapatnak baseline és follow-up pillanatkép | `TeamReport.PUBLISHED` |
| S5 | Célzott vezetői akció | 1–3 tétel, legalább egy strukturált célmutatóval | riport akcióelemek |
| S6 | Visszamérés | a vállalt akció után lezárt 2. kör; a kompozíciós döntés rögzítve | riport-összehasonlító |
| S7 | Esetnapló | minden mérföldkő után 48 órán belül frissítve | belső esetindex |
| S8 | Fizetési hajlandóság | legalább egy kimondott folytatási ársáv szervezetenként | záró interjú |
| S9 | Referencia-hozzájárulás | named, anonim vagy dokumentált „nem” állapot | engedélyrekord |

Az S1–S3 célérték működési cél, nem validált pszichometriai küszöb. Ha a valós
pilotadat mást mutat, a célérték csak előre dokumentált review után változhat;
egy gyenge eset kedvéért utólag nem írjuk át.

## 3. Idővonal és szereposztás

### T–2 hét — szerződés és setup

- Pilot-megállapodás és adatkezelési melléklet elfogadva.
- A baseline `TEAM_SCAN_LICENSE`, a follow-up `REMEASUREMENT_CYCLE`; a
  `paid` / `discounted` / `pilot_free` / `barter` kezelés és a védett
  kereskedelmi rekord hivatkozása rögzítve.
- Org, csapat és névsor létrehozva; tanácsadó hozzárendelve.
- A csapat megkapja a stabil, pszeudonim `case_id` és alias értéket; a valódi
  név ↔ alias kapcsolat csak a védett ügyfélmappában él.
- Kapcsolattartó és döntéshozó szerepe tisztázva; kickoff és tervezett
  visszamérés bekerült a naptárba.
- Dry run a belső teszt-szervezettel: `SCAN_V1` létrehozás → aktiválás →
  self → trust → pulse → riport → akció → összehasonlítás.
- Az esetnapló 0. blokkját ekkor kell megnyitni.

### 1. hét — kickoff (60–75 perc)

1. **10' · Miért:** a vezető a saját szavaival mondja el; fejlesztés, nem
   teljesítményértékelés.
2. **12' · Mit mérünk:** self (~10 perc), bizalmi háló, névtelen pulse.
   A 16 minta értelmezési nyelv, nem validált csapattípus.
3. **15' · Bizalom és adatkezelés:** ki mit lát, melyik adat anonim, mikor
   nincs eredmény, és hogy a trust relációs kérdései miért szükségesek.
4. **10' · Élő demó:** a három lépés, a saját feladatlista és az adatforrás-
   jelölések.
5. **10' · Menetrend és kérdések:** határidők, emlékeztetők, debrief,
   akcióidőszak és visszamérés.
6. **Zárás:** a `SCAN_V1` kampány aktiválása; mindenki az első nyitott
   lépéséről kap értesítést.

### 1–2. hét — baseline mérés

- A platform sorrendben nyitja a self, trust és pulse lépést.
- A tanácsadó hétfőn státuszt néz, T+3 és T+10 napon platform-emlékeztetőt,
  T+7 napon vezetői üzenetet használ.
- A trust-körnél külön figyelni kell a négyzetes respondens-teherre; a vezető
  ne kérjen képernyőképet vagy egyéni válaszmegosztást.
- Pulse n<3 esetén nincs aggregátum. A kör emiatt sem hosszabbítható korlátlanul:
  a hiányt az adatminőségi blokkban kell rögzíteni.

### 3. hét — riportvalidálás és vezetői debrief (90 perc)

- Kampány zárása → riportvázlat → tanácsadói szerkesztés → publikálás.
- A debrief a `riport-ertelmezesi-sablonok.md` menetét követi, de az állítások
  elsődleges forrása a trust és a pulse. A személyiség és mintanév kontextus.
- A vezető 1–3 akciót vállal. Legalább egy akció kapjon strukturált
  `targetMetric` értéket: `psych_safety_index`, `psych_safety_item:PS1…PS8`,
  `trust_coverage` vagy `trust_isolated_count`.
- Az esetnapló 1–3. blokkja 48 órán belül elkészül, a riport- és action ID-k
  pontos átvételével.

### 4–8. hét — beavatkozás és kísérés

- Kéthetente 30 perc: végrehajtási intenzitás, blokk, mellékhatás, következő
  konkrét lépés. A státuszcímke önmagában kevés; azt is rögzíteni kell, miből
  tudjuk, hogy az akció ténylegesen megtörtént.
- Az akció scope-ja csak előre dokumentált indokkal változhat. Új cél esetén
  új action item készül, nem a régi történetét írjuk át.
- Fluktuációt, hosszabb hiányzást és csapatátszervezést azonnal fel kell
  jegyezni, mert a visszamérés kompozíciós kapuját érinti.

### 9–12. hét — visszamérés és zárás

- Alapesetben ugyanaz a `SCAN_V1` preset indul új kampányként. Ha egy réteg
  tudatosan kimarad, arra nem készülhet előtte–utána állítás.
- A follow-up riport publikálása után a platform összehasonlítója adja a
  `common/joined/left`, stabil-mag és mérési-hiba döntést. Kézi delta nem
  helyettesítheti.
- A napló 4–6. blokkja rögzíti a védhető mondatot, a korlátokat és azt, mit
  csinálnánk másként.
- Külön záró interjúban jön a price discovery és a referenciaengedély. Az
  engedély lehet named, anonim vagy nem; a „pending” nem publikálási jog.

## 4. Kockázatok és kezelésük

- **Alacsony részvétel:** kickoffon a vezető kéri a részvételt; kiszámítható
  remind-ritmus; 70% alatt közös döntés a határidőről és a korlátról.
- **Bizalmi deficit:** a relációs trust-adat különösen érzékeny. A consentet
  nem rövidítjük le, egyéni él/válasz nem kerül workshopra vagy naplóba.
- **Respondens-teher:** csak a rögzített háromrétegű preset az alap. Observer,
  role peer vagy más extra nem adható hozzá „ha már itt vagyunk” alapon.
- **Kompozícióváltozás:** a teljes csapat delta nem fejlődési állítás; stabil
  mag vagy explicit warning kell.
- **Akció végrehajtás nélkül:** a kimenet hiánya nem termékhiba, ha az akció
  nem történt meg. Az adherence-et külön rögzítjük.
- **Hiba élesben:** munkanapon 24 órán belüli reakció; az esetnapló kérdéses
  pont mezője hivatkozik az incidensre, de nem tartalmaz személyes adatot.

## 5. A tanácsadó heti rutinja

| Tevékenység | Óra/hét |
|---|---:|
| Kampánykövetés, emlékeztetők, státusz a kapcsolattartónak | 1–2 |
| Vezetői/csapatalkalmak és felkészülés | 2–4 |
| Riportvalidálás és narratíva | 0–4, hullámzó |
| Akciókísérés és visszamérés-előkészítés | 1–2 |
| Support / kritikus bugfix | 2–3 |
| Esetnapló frissítése | 0,5 / mérföldkő |

## 6. Hogyan lesz ebből playbook és adatkészlet?

- Egy eset = egy csapat teljes köre; minden eset kap egy sort a közös indexben.
- Öt esetenként rövid kalibrációs review: ismétlődő akciók, hiányzó mezők,
  teher, adatminőség és félrevezető megfogalmazások.
- A sablon változása verziózott; régi esetet nem írunk át új kategóriára
  dokumentált mapping nélkül.
- Húsz eset után a visszatérő, több független csapatban működő lépésekből áll
  össze a partner-playbook. Ez tapasztalati folyamatstandard, nem önmagában
  hatásvalidáció.
- Case study csak az esetnapló anonimizált kivonatából és a dokumentált
  referenciaengedély szintjén készülhet.
