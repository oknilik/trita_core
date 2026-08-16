# Lumina-benchmark és a visszamérési védőárok — döntési dokumentum

> Készült: 2026-08-16. Kiváltó kérdés: „mi különbözteti meg a Tritát, és van-e
> benne Lumina Learning-szintű potenciál?"
> Előzmény: `docs/product/tritanium.md` (2026-08-04, Lumina × Trita kód-audit).
> Ez a dokumentum NEM ismétli meg a tritanium.md tételes riport-összevetését —
> arra épül, és a **stratégiai következtetést + a nyitott kód-tételeket** rögzíti.

---

## 0. Vezetői összefoglaló

**A tézis.** A Tritában van Lumina-mérhető vállalatépítési potenciál, de nem
azon a tengelyen. A Lumina közös nyelvet ad az emberek megértéséhez, és 17 év
alatt felépített practitioner-hálózaton szállítja. A Trita akkor lesz
különleges, ha **bizonyítékokra épülő vezetői rendszerré** válik: megmutatja,
hol akad el a csapat, miből tudjuk, mit érdemes tenni — majd **visszaméri,
változott-e valami**.

**A pozicionálás egy mondatban.**

> Nem azt mondjuk meg, kik vagytok. Megmutatjuk, hol akad el a csapat, miből
> tudjuk, és mi legyen a következő vezetői lépés.

**Ami ebből következik, és a projekt szempontjából ez a dokumentum lényege:**
a védőárok nem a modell (a HEXACO nem saját IP, az IPIP itemek public domain),
és nem is a platform gazdagsága. A védőárok **az az adatkészlet, ami a
diagnózis → beavatkozás → visszamérés körökből halmozódik fel** — és ami
minden eladott körrel erősödik. Ezt egy versenytárs nem másolhatja, csak újra
megkeresheti.

**A kellemetlen következtetés.** A visszamérési lánc infrastruktúrája jórészt
kész (ld. 1. fejezet), de a lánc **utolsó méterén** — ott, ahol a „működött-e?"
kérdésre válaszolunk — a rendszer ma megsérti a saját hitelességi alapelvét, és
részben rossz konstruktumot hasonlít össze. Ez a P0.

---

## 1. Mit mond a kód MA (állapot-ellenőrzés, 2026-08-16)

A 2026-07-24-i `ujrafuttatas-korok-terv.md` több tétele időközben lezárult.
Az alábbi tábla a tényleges állapot — erre épül a prioritás.

| Képesség | Állapot | Hol |
|---|---|---|
| Csapatszerep append-only (kör-történet megmarad) | ✅ **KÉSZ** — nincs `@unique(userProfileId)`, van `campaignId?`, `@@index([userProfileId, createdAt])`, a beadás `create` | `prisma/schema.prisma:648`, `api/team-roles/submit` |
| 2. kör fast-forward csapda (mindenki átugorja) | ✅ **LEZÁRVA** — `Campaign.requireFreshResults` + `activatedAt`; a fast-forward csak aktiválás utáni self-eredményt fogad el | `schema.prisma:557`, `campaign-steps.ts:268` |
| Befagyasztott, tanácsadó által validált riport | ✅ **KÉSZ** — `publishedAt`, aggregátum-pillanatkép | `team-report.ts` |
| Riport ↔ riport összehasonlítás | ⚠️ **RÉSZBEN** — létezik, de szűk és kapu nélküli (→ P0.1, P1.1) | `team-report-comparison.ts` |
| „16-ból 15 mintázat = Ismeretlen minta" P0 | ✅ **LEZÁRVA** (2026-08-11 név-forrás egységesítés) | `team-pattern.ts:885` |
| Self-eredmény kör-címkézése | ❌ **NYITVA** — `AssessmentResult`-nak nincs `campaignId`-ja | `schema.prisma:177` |
| Mérési-hiba kapu a visszamérésen | ❌ **NYITVA** | `team-report-comparison.ts` |
| Kompozíció-változás kezelése két kör között | ❌ **NYITVA** | `team-report.ts` aggregates |
| Akció → kimenet kapcsolat | ❌ **NYITVA** — státusz igen, hatás nem | `team-action-tracking.ts` |

**Olvasat:** az adatmodell nagyrészt felkészült a körökre. Ami hiányzik, az nem
tárolás, hanem **értelmezés**: mit jelent a két kör közti különbség, és mikor
nem jelent semmit.

---

## 2. Prioritált találatok

Jelölés: **P0** = a pilot ELSŐ mérése előtt · **P1** = a pilot alatt ·
**P2** = a pilot után, a partner-lépcső előtt.

---

### P0.1 — A visszamérésnek nincs mérési-hiba kapuja

**Mi a baj.** A `compareTeamReports()` nyers különbségeket ad vissza
(`completionDelta`, `psychSafetyDelta`, `dimensionChanges`), és a
dimenzió-változásokat `|delta|` szerint **rangsorolja**. Nincs semmilyen
küszöb: egy 2–3 pontos csapatátlag-eltérés ugyanúgy a lista tetejére kerül,
mint egy valódi elmozdulás.

**Miért ez a legsúlyosabb.** A projekt kimondott hitelességi alapelve, hogy a
mérési hibán belüli különbségre nem állítunk sorrendet vagy címkét — ezt a
`psychometrics.ts` (SEM), a `member-dossier.ts` (`DOSSIER_GAP_MIN_DELTA =
√2·SEM`) és a `norms.ts` (percentilis tiltva norma nélkül) fegyelmezetten
betartja. A visszamérés az **egyetlen felület, ahol ez az elv nem érvényesül** —
és pont ez az a pillanat, ahol a tanácsadói díj indoklása történik. Ha egy
zajból származó „+4 pont Lelkiismeretesség" kerül a „mi változott" fejezetbe, az
a legdrágább helyen aláásható állítás.

**Megoldás magja (Claude Code-nak).**

- Új tiszta függvény a `psychometrics.ts` mellé (vagy abban), a
  `diffStandardError` mintájára: **két csapatátlag különbségének hibája**.
  Egy átlag standard hibája `SEM/√n`, két független átlagé:
  `√(SEM²/n₁ + SEM²/n₂)`. Ugyanaz a `dimStandardError(form, code)` a bemenet,
  ami ma is — a konstansok a mért IPIP-kalibrációból jönnek.
- A `compareTeamReports()` kapjon `n₁`/`n₂`-t (ez az aggregátumban már ott van:
  `completedCount`), és minden `dimensionChanges` elem kapjon egy
  `significant: boolean` mezőt. A rendezés maradhat `|delta|` szerint, de a
  **nem szignifikáns tételek nem kerülhetnek a narratívába** — a
  `TeamReportComparison.tsx` külön, halkabb blokkban vagy sehol jelenítse meg.
- A pszichológiai biztonság indexére ugyanez kell, más konstanssal: a
  `psych-safety.ts` 8 itemes skálája saját reliabilitást igényel — amíg nincs
  mért α, a küszöb legyen konzervatív prior, **kommentben megjelölve, hogy
  prior és nem mért** (a `rater-quality.ts` küszöb-blokkjának mintája szerint).
- Teszt: `tests/unit/` — invariáns, hogy `n` növelésével a küszöb csökken, és
  hogy azonos riport önmagával összehasonlítva nulla szignifikáns változást ad.

**Mit nyer vele a projekt.** A „mi változott" fejezet állításai megvédhetők egy
kritikus ügyfél előtt. Ez egyben az egyetlen olyan tulajdonság, amit egy
engagement-platform (Culture Amp, Officevibe, Peakon) nem fog utánad csinálni:
ők nagyobb elmozdulást mutatnak, nem kevesebbet. A visszafogottság itt
termékjellemző, nem óvatoskodás.

**Effort:** S–M.

---

### P0.2 — A két kör nem feltétlenül ugyanarra a csapatra vonatkozik

**Mi a baj.** A `TeamReportAggregates` `memberCount` és `completedCount` számot
tárol, de **nem tárolja, kik** járultak hozzá. Ha a két kör között valaki
kilépett, belépett, vagy egyszerűen csak az egyik körben nem töltötte ki, akkor
a dimenzió-átlag különbsége **összetétel-változás, nem fejlődés**. Egy 8 fős
csapatnál egyetlen tag cseréje a csapatátlagot több ponttal elmozdíthatja —
tipikusan többel, mint bármilyen valós beavatkozás.

**Miért fontos.** Ez a klasszikus mód, ahogy egy előtte–utána mérés hazudik. Ha
15–20 referencia-eset erre épül, a case study-k tartalma nem az, amit állítunk
róluk. És ez az a hiba, amit egy szakértő ügyfél (HR-vezető, pszichológus)
azonnal megtalál.

**Megoldás magja (Claude Code-nak).**

- Az aggregátum-pillanatkép tároljon egy **hozzájáruló-halmazt**: a legkisebb
  megoldás egy rendezett `contributorIds: string[]` (a riport amúgy is
  tanácsadói/admin felületen él, de az anonimitási vörös vonalak miatt
  biztonságosabb **stabil hash** vagy csak a metszet-számosság kiszámításához
  elég adat). Opcionális mező (`?`), mint a `stability` — a régi pillanatképek
  ne törjenek el.
- A `compareTeamReports()` számoljon: `common` (mindkét körben kitöltő),
  `joined`, `left`. Ha a `common` aránya egy küszöb alatt van (javaslat: a
  kisebbik kör 70%-a), a összehasonlítás **kapjon explicit figyelmeztetést**, és
  a dimenzió-deltákat ne állítsa változásként.
- Ahol a `common` halmaz elég nagy, számolható a **„stabil mag" delta** — csak a
  mindkét körben jelen lévő tagokra. Ez a becsületes szám; a teljes csapat
  deltája mellette kontextus.

**Mit nyer vele a projekt.** A visszamérés állítása ok-okozati irányba mutat, és
nem dől össze az első fluktuációnál. Ez az a részlet, amitől a „Team Scan
utánkövetés" mérésnek látszik, nem marketingnek.

**Effort:** M.

---

### P0.3 — A self-eredmény nincs körhöz kötve

**Mi a baj.** `AssessmentResult`-nak nincs `campaignId`-ja (`schema.prisma:177`);
a kör-hozzárendelés ma a `createdAt >= campaign.activatedAt` heurisztikán
múlik. Ez működik, amíg egy csapatnál egyszerre egy kampány fut, és eltörik,
amint két kampány átfed (több csapat, elcsúsztatott indítás, ismétlő kör egy
másik kampány alatt). A `ujrafuttatas-korok-terv.md` 1.1/2. pontja ezt már
javasolta.

**Megoldás magja (Claude Code-nak).** Opcionális `campaignId String?` +
`@@index([campaignId])` az `AssessmentResult`-ra, a beadási úton kitöltve, ha a
beadás kampány-lépésből érkezik. Az olvasók **ne** váltsanak kötelező szűrésre:
a default maradjon „legfrissebb", a kör-szűrés a riport/összehasonlító
opciója legyen. A `TeamRoleAnswer` mintája már pontosan ez — ugyanazt kell
megismételni.

**Mit nyer vele a projekt.** A kör-riport pontosan szűrhető, és a pilotból
kinyerhető adat kör-címkézetten áll rendelkezésre — vagyis kalibrálható. Enélkül
a pilot adata utólag nehezen rendezhető körökbe.

**Effort:** S.

---

### P1.1 — A visszamérés a legstabilabb konstruktumot hasonlítja össze

**Mi a baj — és ez tartalmi, nem technikai hiba.** A `compareTeamReports()` ma
három dolgot néz: kitöltöttség, pszichológiai biztonság index, és
**dimenzió-átlagok**. A személyiségvonás viszont *definíció szerint* stabil
konstruktum: fél év alatt a csapat HEXACO-átlagának **nem is kellene**
számottevően változnia — ha változik, az sokkal valószínűbben összetétel (P0.2)
vagy zaj (P0.1), mint fejlődés.

Eközben azok a rétegek, amik **valóban változnak** — és amik a Trita
megkülönböztetői —, hiányoznak az összehasonlításból:

| Réteg | Változékony? | Ma az összehasonlításban |
|---|---|---|
| Dimenzió-átlag (HEXACO) | ❌ stabil vonás | ✅ benne van |
| Pszichológiai biztonság | ✅ nagyon | ✅ benne van |
| Bizalmi háló (sűrűség, hub/beágyazatlan, mért él-szám) | ✅ igen | ❌ hiányzik |
| Csapatszerep-lefedettség / `roleGaps` | ✅ igen | ❌ hiányzik |
| Önkép ↔ observer eltérés | ✅ igen | ❌ hiányzik |
| Akció-teljesülés | ✅ | ❌ hiányzik |

**Megoldás magja (Claude Code-nak).** A `TeamReportComparisonResult` bővítése a
fenti sorokkal — az adat nagyrészt már benne van az aggregátumban
(`evidence.measuredEdgeCount`, `roleDistribution`, `roleGaps`,
`psychSafety.itemMeans`/`weakItemIds`). A pszich. biztonságnál az
**item-szintű** változás (`weakItemIds` mozgása) sokkal beszédesebb, mint az
index — „a hibáról beszélni" item javult, a „kényes téma" nem. A
dimenzió-delta maradjon, de **kontrollként** legyen keretezve („a vonások
stabilitása azt jelzi, hogy ugyanazt a csapatot mérjük"), ne fejlődésként.

**Mit nyer vele a projekt.** A visszamérés arról szól, amit a beavatkozás
tényleg megmozgat — és ezzel a Team Scan utánkövetése eladható termékké válik,
nem udvariassági körré. Ez egyben az a fejezet, ami a Lumináéból hiányzik: náluk
a portré-kredit nem termel visszamérési adatot.

**Effort:** M.

---

### P1.2 — Nincs akció → kimenet kapcsolat

**Mi a baj.** A `team-action-tracking.ts` státuszt és határidőt követ
(`done`/`in_progress`/`blocked`/`overdue`), de semmi nem köti az akciót a
következő kör eredményéhez. Így soha nem áll elő az az állítás, ami az egész
stratégia célja: *„ez a beavatkozás ezen a mutatón hozott elmozdulást."*

**Megoldás magja (Claude Code-nak).** A `TeamReportActionItem` kapjon egy
opcionális **cél-mutató** mezőt: melyik mért mutatóra irányul (pszich. biztonság
item vagy terület, trust-mutató, szerep-hézag). Nincs szükség új motorra — a
következő kör összehasonlítója ki tudja írni az akció mellé az adott mutató
deltáját (a P0.1 kapuval együtt). A kimenet így egy egyszerű, de erős tábla:
vállalt akció → célzott mutató → mért elmozdulás → szignifikáns-e.

**Mit nyer vele a projekt.** Ez a **moat maga**. Húsz eset után nem húsz
sztorid lesz, hanem egy kalibrálható beavatkozás-katalógusod: mely akciók
mozgatják mely mutatókat, milyen csapat-kontextusban. Ez az az eszköz, ami
minden eladott körrel erősödik, és amit egy versenytárs nem tud megvenni.
**Ez az a tétel, ami miatt a P0-kat a pilot ELŐTT kell lezárni** — enélkül a
referencia-esetek bevételt termelnek, vagyont nem.

**Effort:** M (adatmodell S, a riport-oldali megjelenítés M).

---

### P1.3 — Respondens-teher: a Scan v1 mérési készlete nincs rögzítve

**Mi a baj.** A kampány `steps[]` szabadon állítható, és a teljes készlet ma hat
mérés: self (60 item), observer, csapatszerep self, csapatszerep peer,
bizalmi háló, pszich. biztonság pulse. A peer és a trust **négyzetesen**
skálázódik: egy 12 fős csapatban fejenként 11×5 trust-kérdés és 11
szerep-értékelés.

**Miért kockázat.** Ha a válaszarány beesik, a saját anonimitási padlóid alá
kerülsz (`MIN_RATERS_FOR_ANONYMOUS_AGGREGATE = 3`, `TRUST_MIN_RATERS`,
`PSYCH_SAFETY_MIN_RESPONSES`, `TEAM_ROLE_PEER_MIN_RATERS`), és a riport fele
„nincs elég adat"-ként renderel — pont a fizetős, referenciának szánt
eseteknél, ahol ez a legdrágább. A hitelesség-elv, ami békeidőben erősség, itt
ellened fordul.

**Megoldás magja.** Ez elsősorban **termékdöntés**, másodsorban kód:

- **Scan v1 = self + bizalmi háló + pszich. biztonság pulse.** Ez a három adja a
  legjobb jel/teher arányt, és pont ez a három az, amiben a Lumina és az
  engagement-eszközök egyaránt gyengék.
- Az observer és a csapatszerep-peer kerüljön a **2. körbe vagy felárba** — így
  van mit másodszor eladni, és a teher elosztódik.
- Kódban: a kampány-létrehozó felület kínáljon **nevesített csomagot**
  (`SCAN_V1` lépés-preset) a szabad `steps[]` kipipálgatás helyett; a preset
  konstansként éljen a `campaign-steps-core.ts` mellett.
- A négyzetes teher mérsékelhető mintavétellel is (nem mindenki értékel
  mindenkit, csak annyian, hogy a `TRUST_MIN_RATERS` teljesüljön) — ez később
  jöhet, a preset most fontosabb.

**Mit nyer vele a projekt.** A pilot legvalószínűbb bukási módja elhárul, és a
Scan reprodukálható egységgé válik — ami a partner-lépcső előfeltétele.

**Effort:** S (preset) + termékdöntés.

---

### P2.1 — A mintázat-ígéret kalibrálása

**Mi a helyzet.** 15–20 csapat × 5–30 fő ≈ 200–500 egyén. Ebből a **hat dimenzió
magyar provizórikus normája** (átlag/szórás) kijön — ez reális pilot-cél, és a
`norms.ts` + `scripts/research/norms-from-results.ts` fel van rá készítve.

**De:** a `PATTERN_THRESHOLDS`, a 16 mintázat, a `TENSION_THRESHOLD`, a
`PRESSURE_SHARE_THRESHOLD` **csapat-szintű** konstruktumok — az n-jük a
*csapatok* száma, azaz 15–20. Tizenhat mintázatra ez cellánként átlag egy
csapat. Ezt nem pilot zárja le, hanem évek.

**Következmény (nem kód, hanem ígéret-kalibráció).** A 16 mintázatot ne
validált tipológiaként pozicionáld, hanem **értelmezési nyelvként** — pontosan
ahogy a kód már ma kezeli (`confidence`, `stabilityNote`, `alternativeCode`,
diverzitás-suffix, küszöb-közelség). A Team Scan értékesítési ígérete a **mért**
rétegekre épüljön (bizalmi háló, pulse, peer-szerep, önkép–observer eltérés).

**Mit nyer vele a projekt.** Az ígéret és a bizonyítottság egy szinten marad —
ami az egész termék alapelve. Ha a Scan ígérete a mintázatra épülne, sebezhető
lennél; a mért rétegekre építve nem.

---

### P2.2 — Portfólió-szélesedés: aktív parkolás, nem prioritás

**Mi a helyzet.** A `src/lib` ~150 modul, ~22 ezer sor: karrier-motor
foglalkozás-katalógussal, jelölt/hiring flow (2026-07-23 óta újra aktív), CRM,
blog, fakedoor, `/patterns` felfedező, share/OG. Heti ~25 óra szóló működés
mellett ez nem prioritási, hanem **parkolási** kérdés.

**Megoldás magja.** A `billing-v1-parked` precedens a helyes minta: git tag +
visszaállítási checklist + a felület kivezetése. Nem törlés — parkolás. Minden
élő modul kétszer fizettet: karbantartással, és azzal, hogy minden becsült szám,
amit az ügyfél lát, támadási felület a tanácsadói beszélgetésben.

**Mit nyer vele a projekt.** A heti 25 óra a zászlóshajóra megy, és a felület
akkora, amekkorát egy ember mögött hitelesen ki lehet állítani.

---

### P2.3 — A playbook nem az utolsó lépés, hanem az elsőtől gyűjtött melléktermék

**Mi a helyzet.** A partner-rendszer terméke nem a szoftver, hanem az
**ismételhető folyamat**. Egy retrospektíven, emlékezetből írt playbook rosszabb,
mint az esetenként akkumulált.

**Megoldás magja (nem kód).** Minden Scan után ugyanaz a strukturált feljegyzés:
mit mutatott a mérés · mit mondtál a workshopon · mit vállalt a csapat · mi
történt a visszamérésre · mit csinálnál másképp. Az elején egy tábla is elég,
fejleszteni nem kell. Húsz eset után ez *egyszerre* a playbook, a kalibrációs
adatkészlet és a case study-anyag.

---

### P2.4 — Az üzleti egység: scan-licenc + kör-előfizetés

**Mi a helyzet.** A Lumina skálázási egysége nem a workshop, hanem a
**portré-kredit**: kicsi, ismételhető, per-darab árazott. A „Team Scan" jó
*tanácsadói* egység, de rossz *partner*-egység, mert projekt — partneronként
újratárgyalt, nem elszámolható tétel.

**A javasolt egység:** scan-licenc csapatonként + **újramérési kör
előfizetésként**.

**Miért ez a legszebb rész.** Nálad a védőárok és a bevételi modell **ugyanaz a
mechanizmus**: a diagnózis egyszeri bevétel, a visszamérés visszatérő bevétel
*és* kalibrációs adatpont. Minden eladott kör egyszerre pénz és bizonyíték.
A Luminánál a portré-kredit nem termel visszamérési adatot — az ő 17 évük
bizalmat halmozott, nem adatkészletet. Ez a Trita esélye arra, hogy ne 17 év
alatt érjen oda.

**Kód-vonatkozás — 2026-08-16-i auditkorrekció.** A fenti korábbi feltevéssel
ellentétben csak a `Subscription` maradt a jelenlegi sémában; a `Purchase`
táblát a 2026-07-31-i migráció törölte, `BillingEventLog` sincs, és a
`billing-v1-parked` tag is hiányzott. A taget most a teljes billingréteg
eltávolítása előtti `ba9dc5be` állapotra rögzítettük, de az csak visszaállítási
referencia. Az `ORG_CONSULTANT` szerep és a capability-motor továbbra is a
partner-hálózat szubsztrátuma; a későbbi elszámoláshoz viszont új,
providerfüggetlen usage ledger kell. A pontos egység- és aktiválási szerződés:
`docs/product/team-scan-commercial-units.md`.

---

## 3. Versenymezőny — amit a pozicionálás megváltoztat

Ha a Trita nem személyiségteszt, hanem evidencia-alapú csapatdiagnosztika +
beavatkozás + visszamérés, akkor a releváns versenytárs **nem a Lumina**, hanem
a Culture Amp / Peakon / Officevibe vonal, a Saberr és a Deeper Signals.

Ez a mezőny rosszabb abban, hogy olcsóbbak és beépültek; és jobb abban, hogy
**ők kérdőívet mérnek, nem relációt**. Az engagement-pulse-nak nincs bizalmi
hálója, nincs H-dimenziós együttműködési kockázata, nincs peer-alapú szerepképe,
és nincs önkép–külső kép eltérése.

A bizalmi háló a legkevésbé másolható rétegünk — nem azért, mert nehéz megírni,
hanem mert **relációs adatot kérni bizalmi tőkébe kerül**, és ezt egy
self-serve eszköz nem tudja megvenni. Egy tanácsadó viszont igen. Ezért a Scan
üzenetében a bizalmi háló és a pszichológiai biztonság legyen elöl — nem a
mintázat.

---

## 4. Sorrend

| # | Mit | Mikor | Típus |
|---|---|---|---|
| 0 | **P0.1 · P0.2 · P0.3** — szignifikancia-kapu, kompozíció-kontroll, kör-címke | **az első pilot-mérés ELŐTT** | kód |
| 0 | **P1.3** — Scan v1 mérési készlet rögzítése (preset) | ugyanakkor | kód + döntés |
| 0 | **P2.3** — eset-feljegyzés sablonja | ugyanakkor | nem kód |
| 1 | Egyetlen zászlóshajó: **Trita Team Scan**, 5–30 fős csapatokra | pilot | pozicionálás |
| 2 | 15–20 referenciázható, lehetőleg fizetett Scan, egységes előtte–utána méréssel | pilot | üzlet |
| 3 | **P1.1 · P1.2** — a visszamérés a változékony rétegekre; akció → kimenet | a 2. körök előtt | kód |
| 4 | **P2.1** — magyar norma a pilot adatából; mintázat-ígéret kalibrálása | pilot után | kutatás |
| 5 | **P2.2** — portfólió parkolás | folyamatos | higiénia |
| 6 | Ismételhető tanácsadói playbook (a P2.3 feljegyzésekből összeáll) | 20 eset után | nem kód |
| 7 | **P2.4** — certified partner rendszer: partnerfiók, riport-draft, minőségbiztosítás, használatalapú díj | csak ezután | üzlet + kód |

A 0. sor a dokumentum lényege: **ez a három-négy döntés dönti el, hogy a
referencia-esetek bevételt vagy vagyont termelnek-e.** Minden más maradhat a
tervezett sorrendben.

---

## 5. Amit szándékosan NEM csinálunk

- **Nem építünk „magyar Luminát."** A Spark utánzása vesztes játszma: norma,
  validáció, brand és 10 000 practitioner ellen versenyeznénk a saját
  gyengeségünkkel.
- **Nem vezetünk be percentilist norma nélkül.** A `norms.ts`
  (`ACTIVE_NORM_TABLE = null`) ezt jó okkal tiltja; a pilot magyar mintája
  élesíti majd.
- **Nem másoljuk a paradoxon-modellt** (mindkét pólus független mérése). Érdekes,
  de hígítaná a hibaőszinte pozíciót, és új validációs terhet hozna.
- **Nem ígérünk validált 16-mintázatos tipológiát.** Értelmezési nyelv, nem
  taxonómia (P2.1).
- **Nem építünk új modult a pilot előtt.** A következő áttörést nem egy funkció
  adja, hanem a valós ügyféleredmény.

---

## 6. Kapcsolódó dokumentumok

- `docs/product/tritanium.md` — Lumina × Trita tételes kód-audit (2026-08-04)
- `docs/product/ujrafuttatas-korok-terv.md` — mérési körök adatmodellje
  (2026-07-24; több tétele azóta lezárult, ld. 1. fejezet)
- `docs/product/pre-pilot-plan-2026-09.md` — pilot előkészítés
- `docs/product/team-role-360-plan.md` — csapatszerep peer-kör
- `docs/development/changelog/` — napi változásnapló
