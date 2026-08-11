# IPIP–HEXACO referencia-statisztika (openpsychometrics.org) — 2026-08

> **Állapot: LEFUTTATVA (2026-08-11), valódi adaton.** N = 22 786 nyers
> kitöltés, minőség-szűrés után **n = 21 681** (TSFI-S forma) / **21 675**
> (teljes forma). Az openpsychometrics.org felé a futtatókörnyezet proxyja
> tiltott (403 CONNECT), az adat egy GitHub-tükörből jött — pontos URL és
> ellenőrző-összeg lent, a „Forrás és reprodukálás" szakaszban.
>
> Az alábbi táblák **aggregátumok**. A nyers adat a gitignore-olt
> `scripts/research/.data/` alatt marad, és SOHA nem kerül a repóba.

## Mi ez, és mire szabad használni

A TSFI kérdésbank 92 fő-itemje az IPIP–HEXACO poolból származik
(`docs/product/tsfi-item-provenance.md`). Az openpsychometrics.org
nyilvánosan közzétett nyers adata ugyanennek a poolnak az itemjeire
tartalmaz ~22 ezer kitöltést — ebből a TSFI-be átvett item-részhalmazon
a saját pontozó-motorunkkal (POMP, `src/lib/scoring.ts`) referencia-
statisztika számolható.

**A minta: nemzetközi, ANGOL nyelvű, önszelektált online kitöltők.**
Ebből következően ez KÖZELÍTŐ referencia, ami

- **CSAK BELSŐ KALIBRÁCIÓRA való** (termékdöntés, 2026-08-11):
  küszöb-ellenőrzés (40/70 és 35/65 sávhatárok kihasználtsága),
  Cronbach-α és SEM-priorok (`src/lib/psychometrics.ts`:
  `MEAN_ITEM_R=0.22`, `SCORE_SD=20`) összevetése mért adattal,
  eloszlás-alak (decilisek);
- **NEM kerülhet a `src/lib/norms.ts` `ACTIVE_NORM_TABLE`-jébe** — a
  felületi percentilis kizárólag a saját pilot normáiból élesíthető
  (`scripts/research/norms-from-results.ts`), mert az itteni minta se a
  magyar nyelvű kitöltést, se az ügyfél-populációt nem képviseli.

## Melyik bank-összeállításon futott ez a mérés

**FONTOS a számok olvasásához.** A futtatás pillanatában (2026-08-11,
`HEAD = afcf770`, `src/lib/questions/tritan.ts` már a párhuzamosan
átsúlyozott, még nem commitolt állapotában) a bank összetétele:

- 100 item összesen, ebből **60 a TSFI-S**;
- a rövid forma **mind a hat fő dimenzión pontosan 10-10 item**
  (`ITEMS_PER_DIM.short = 10`);
- az intersticiális altruizmus-skála (4 item) a rövid formában **már NEM
  szerepel** — a #77 (RESO/fearfulness) és #79 (OPEN/inquisitiveness)
  lépett a #98/#99 altruizmus-item helyére.

Emiatt az itteni **prior SEM a rövid formára 10.23**, nem a korábban
idézett ≈10.4: a 10.4 a régi, 9.5 item/dimenzió átlagú (58 fő-itemes)
összeállításhoz tartozik. Aki később olvassa: ha a bank azóta megint
változott, a prior-oszlop újraszámolandó, a MÉRT oszlop viszont
item-halmaz-specifikus és csak a fenti összeállításra érvényes.

| forma | k/dim (prior alapja) | α prior (r̄=0.22) | SEM prior (SD=20) | √2·SEM → `DIFF_MIN_GAP` |
|---|---|---|---|---|
| rövid, RÉGI (58 item) | 9.5 | 0.728 | 10.43 | 14.75 → **15** |
| rövid, MOSTANI (60 item) | 10 | 0.738 | 10.23 | 14.47 → **14** |
| teljes | 16 | 0.819 | 8.52 | 12.05 → **12** |

Vagyis a `DIFF_MIN_GAP` literál a saját képletétől az átsúlyozás miatt
elcsúszott — a párhuzamos munkaszál ezt már **15 → 14**-re javította
(`src/lib/personality-type.ts`, az invariáns-teszt
`tests/unit/scoring/psychometrics.test.ts` köti). **Ez a 14 még mindig
csak a PRIOR-okból jön** (r̄=0.22, SD=20); a jelen doksi ezen felül a MÉRT
adatból ad javaslatot (lent) — és a mért adat szerint a 14 is túl magas.

## Ismert lefedettségi rések

- A TSFI 8 kiegészítő itemje nem az IPIP–HEXACO poolból jön, az adatban
  nincs megfelelőjük. A leképezés így **92/100 item** (ez a várt maximum,
  más hiány nem lépett fel):
  - **social_self_esteem ×4 (X/Extraverzió)** — a facet **0/4 (rövid:
    0/2) itemmel, azaz teljesen lefedetlen**; az X dimenzió emiatt
    **12/16 (rövid: 8/10) itemmel közelített**;
  - **altruizmus ×4 (intersticiális `I` skála)** — teljesen kimarad. A
    mostani bank-összeállításban ez a rövid formát már nem is érinti
    (nincs benne altruizmus-item), a teljes formát igen.
- **Az X értékei emiatt lefelé torzítottak**: a kimaradó
  social_self_esteem a pozitívan kulcsolt, jellemzően magas átlagú facet
  — az X-re kapott 44.7-es átlag és a 40%-os „low" sáv-arány részben
  lefedettségi műtermék, nem tiszta minta-jellemző.
- 5 item a TSFI-ben adaptált szövegű (12, 36, 41, 50, 78) — a leképezés
  ezekre az eredeti IPIP-szöveggel történt (a script explicit felülíró
  térképpel kezeli), mind az 5 sikeresen egyeztetve.
- A pontozott „forma" a leképezett item-részhalmaz — a valódi TSFI-
  kitöltési szituációt (magyar szöveg, sorrend, kontextus) nem méri.

## Minőség-szűrés — mit alkalmaztunk

A csomagban nincs VCL-szókincsellenőrzés; a validitás-itemek a `V1`/`V2`
oszlopok, **7-fokú Likerten** (1 = egyáltalán nem ért egyet …
7 = teljesen egyetért), ezért kellett a `--screen`-hez az összehasonlító
operátor (a korábbi „pontos érték" forma itt használhatatlan volt).

- `V1` — „I understand the instructions for this test."
- `V2` — „I have answered all of these questions as accurately as possible."

**Alkalmazott szűrő: `V1 >= 5` ÉS `V2 >= 5`** (legalább „enyhén egyetért";
a codebook 5-ös címkéje elírás — a monoton skálán az 5 az „enyhén
egyetért"). Ez a legkonzervatívabb védhető vágás: csak azt zárja ki, aki
NEM erősítette meg, hogy értette az instrukciót / pontosan válaszolt.

| lépés | sorok |
|---|---|
| nyers sorok | 22 786 |
| kiesett a `V1>=5 & V2>=5` szűrőn | **1 091 (4.79%)** |
| ezen felül hiányos válaszú (0 = megválaszolatlan) — rövid forma | 14 |
| ezen felül hiányos válaszú — teljes forma | 20 |
| **elemzett n (rövid / teljes)** | **21 681 / 21 675** |

Válaszskála: az adat **1..7**-es, a POMP-formula változatlanul hagyásához
a script lineárisan 1..5-re képezi (`1 + 4(v−1)/6`) a pontozás előtt. A
fordított itemek kulcsirányba állítása (6−v) a `scoring.ts` tükre, az
α/korreláció ugyanazon a mátrixon számolódik, mint a pontszám.

## Aggregált eredmények

### TSFI-S forma (60 item, leképezett részhalmaz) — n = 21 681

Leíró statisztika (0–100 POMP):

| Dim | k (leképezett/bank) | átlag | szórás | P10 | P25→P30 | P50 | P70 | P90 |
|---|---|---|---|---|---|---|---|---|
| H Becsületesség-Alázat (INTE) | 10/10 | 58.6 | 16.5 | 37 | 50 | 60 | 68 | 80 |
| E Emocionalitás (RESO) | 10/10 | 62.5 | 16.8 | 40 | 55 | 63 | 72 | 83 |
| X Extraverzió (TEMP) | **8/10** | 44.7 | 19.6 | 21 | 33 | 44 | 54 | 71 |
| A Barátságosság (ADAP) | 10/10 | 54.6 | 16.5 | 33 | 47 | 55 | 63 | 75 |
| C Lelkiismeretesség (THOR) | 10/10 | 53.7 | 15.7 | 33 | 45 | 53 | 62 | 75 |
| O Nyitottság (OPEN) | 10/10 | 78.9 | 11.9 | 63 | 73 | 80 | 87 | 93 |

Teljes decilis-sor (P10…P90) a script kimenetében és a JSON-riportban.

Megbízhatóság — **MÉRT vs PRIOR**:

| Dim | k | α **mért** | α prior | r̄ **mért** | r̄ prior | SD **mért** | SD prior | SEM **mért** | SEM prior |
|---|---|---|---|---|---|---|---|---|---|
| H (INTE) | 10 | **0.750** | 0.738 | 0.234 | 0.220 | **16.5** | 20 | **8.27** | 10.23 |
| E (RESO) | 10 | **0.795** | 0.738 | 0.283 | 0.220 | **16.8** | 20 | **7.61** | 10.23 |
| X (TEMP) | 8 | **0.803** | 0.693 | 0.340 | 0.220 | **19.6** | 20 | **8.70** | 10.23 |
| A (ADAP) | 10 | **0.793** | 0.738 | 0.271 | 0.220 | **16.5** | 20 | **7.51** | 10.23 |
| C (THOR) | 10 | **0.779** | 0.738 | 0.262 | 0.220 | **15.7** | 20 | **7.39** | 10.23 |
| O (OPEN) | 10 | **0.694** | 0.738 | 0.192 | 0.220 | **11.9** | 20 | **6.59** | 10.23 |
| **átlag** | | **0.769** | 0.738 | **0.264** | 0.220 | **16.2** | 20 | **7.68** | 10.23 |

*(α prior = `alphaFromItems(k)` a leképezett itemszámmal; SEM mért =
SD_mért·√(1−α_mért); SEM prior = `dimStandardError("short")`.)*

### Teljes forma (100 item, leképezett részhalmaz) — n = 21 675

| Dim | k | átlag | szórás | α **mért** | α prior | r̄ **mért** | SEM **mért** | SEM prior |
|---|---|---|---|---|---|---|---|---|
| H (INTE) | 16/16 | 56.3 | 15.8 | **0.828** | 0.819 | 0.237 | **6.56** | 8.52 |
| E (RESO) | 16/16 | 58.4 | 15.7 | **0.845** | 0.819 | 0.257 | **6.18** | 8.52 |
| X (TEMP) | **12/16** | 45.0 | 18.5 | **0.849** | 0.772 | 0.321 | **7.20** | 8.52 |
| A (ADAP) | 16/16 | 55.0 | 16.5 | **0.870** | 0.819 | 0.290 | **5.93** | 8.52 |
| C (THOR) | 16/16 | 53.5 | 15.0 | **0.845** | 0.819 | 0.253 | **5.92** | 8.52 |
| O (OPEN) | 16/16 | 75.4 | 11.4 | **0.764** | 0.819 | 0.185 | **5.54** | 8.52 |
| **átlag** | | | **15.5** | **0.834** | 0.819 | **0.257** | **6.22** | 8.52 |

### Sáv-kihasználtság

Rövid forma (n = 21 681):

| Dim | 40/70 low | mid | high | 35/65 low | mid | high |
|---|---|---|---|---|---|---|
| H (INTE) | 13% | 60% | 27% | 8% | 57% | 35% |
| E (RESO) | 9% | 53% | 38% | 6% | 48% | 46% |
| X (TEMP) | 40% | 48% | 11% | 33% | 52% | 16% |
| A (ADAP) | 18% | 62% | 20% | 12% | 62% | 26% |
| C (THOR) | 17% | 66% | 17% | 10% | 68% | 22% |
| O (OPEN) | **0%** | 19% | **80%** | **0%** | 14% | **86%** |

Teljes forma (n = 21 675):

| Dim | 40/70 low | mid | high | 35/65 low | mid | high |
|---|---|---|---|---|---|---|
| H (INTE) | 14% | 65% | 21% | 10% | 60% | 30% |
| E (RESO) | 12% | 63% | 26% | 8% | 56% | 36% |
| X (TEMP) | 41% | 49% | 10% | 30% | 56% | 14% |
| A (ADAP) | 18% | 62% | 20% | 12% | 59% | 28% |
| C (THOR) | 17% | 69% | 15% | 10% | 68% | 21% |
| O (OPEN) | **0%** | 27% | **72%** | **0%** | 17% | **82%** |

### Facet-szintű lefedettség

Mind a 24 facet **teljes lefedettségű**, EGY kivétellel: **X /
social_self_esteem 0/4 (rövid: 0/2) — nincs adat**. A facet-átlagok a
script kimenetében / a JSON-riportban; a legszélsőségesebbek (rövid
forma): O/aesthetic_appreciation 86.7, O/creativity 79.8,
E/anxiety 71.2 · X/social_boldness 40.7, X/liveliness 41.8,
A/flexibility 46.8.

## Értelmezés — mit jelent ez az élő küszöbeinkre

Az összes jel EGY IRÁNYBA mutat: **a mérési hibára vonatkozó priorjaink
konzervatívak, a valódi SEM ennél kisebb** — vagyis a különbség-kapuk
jelenleg VALÓS különbségeket nyomnak el (nem túl-állítunk, hanem
alul-állítunk).

Két, egymástól független hajtóerő:

1. **α (megbízhatóság) magasabb a priornál.** Mért átlagos item-item
   korreláció r̄ ≈ **0.26** (rövid) / **0.26** (teljes) a 0.22-es priorral
   szemben; a mért α ≈ 0.77 (rövid) / 0.83 (teljes) — a rövid formán a
   priornál (0.738 / 0.819) magasabb. Kivétel az **O**, ahol a mért α
   0.694 / 0.764 a prior ALATT van (r̄ ≈ 0.19).
2. **SD (pontszórás) érdemben kisebb a 20-as priornál.** Mért ≈ **16.2**
   (rövid) / **15.5** (teljes), dimenziónként 11.9–19.6. Ez a nagyobb
   miss — kb. **20%-kal túlbecsüljük a szórást**.

Mivel `SEM = SD·√(1−α)`, a kettő szorzódik: a mért SEM a rövid formán
**7.68** a 10.23-as priorral szemben (**−25%**), a teljesen **6.22** a
8.52-vel szemben (**−27%**).

### Konkrét konstans-javaslatok (CSAK JAVASLAT — kód nem módosult)

| Konstans | hol | most | mért evidencia | irány |
|---|---|---|---|---|
| `DIFF_MIN_GAP` | `src/lib/personality-type.ts` | **14** (2026-08-11-én 15-ről javítva, prior-alapon) | mért α + SD=20 → **14**; mért α + **mért SD** → **11** | **még mindig konzervatív, lefelé (~11)** |
| `SCORE_SD` | `src/lib/psychometrics.ts` | **20** | mért **16.2** (rövid) / **15.5** (teljes) | lefelé, de **populáció-függő — pilotra várni** |
| `MEAN_ITEM_R` | `src/lib/psychometrics.ts` | **0.22** | mért **0.26** átlag (0.19 O … 0.34 X) | enyhén felfelé (0.25) vagy marad konzervatívnak |

**A `DIFF_MIN_GAP` a lényeg.** A jelenlegi 14 azt jelenti: két dimenzió
13 pontos különbségét „a mérési hibán belülinek" nyilvánítjuk, tehát a
személyiségtípus-címke főnév-only lesz, a ComparisonTab „egyezésnek"
mutatja az önkép–külső kép eltérést, a member-dossier nem jelöli
nagy deltának. A mért adat szerint a rövid formán a √2·SEM
dimenziónként:

| Dim | √2·SEM_mért (rövid) | √2·SEM_mért (teljes) |
|---|---|---|
| H | 11.7 | 9.3 |
| E | 10.8 | 8.7 |
| X | 12.3 | 10.2 |
| A | 10.6 | 8.4 |
| C | 10.5 | 8.4 |
| O | 9.3 | 7.8 |
| **átlag** | **10.9** | **8.8** |

Tehát a **11–13 pontos deltákat jelenleg feleslegesen elnyeljük** — a
bizonytalansági sávot **kb. 29%-kal túlméretezzük** (14 vs 10.9). A
korábbi 15-ös érték 38%-kal volt túl. Nagyságrend: a 14 → 11-es váltás a
hat dimenzióból képezhető 15 dimenzió-pár mindegyikén ~3 pontnyi „néma
zónát" nyitna meg; ez pont az a tartomány, ahol a legtöbb valós profil
top-2 rése esik (a persona-fixture-öket is emiatt kellett 86/68-ra
tolni, `scripts/personas.shared.ts`).

**Ajánlott lépés (nem most, hanem a pilot után):** a `DIFF_MIN_GAP`
maradjon a jelenlegi, prior-alapú **14**-en addig, amíg a saját pilot
SD-je meg nem van — a SD a leginkább populáció-függő szám, és
önszelektált online mintából átvenni éppolyan hiba lenne, mint normát
átvenni belőle. Ha viszont a pilot SD is 16 körül jön ki, a védhető
érték **11**. Az α-oldali korrekció önmagában (SD=20 mellett) épp a
mostani 14-et adja — vagyis a 15 → 14 lépés a mért adattal is
egybevág, csak épp véletlenül: a képlet-drift és az α-alulbecslés
ugyanoda mutat.

### Két további megfigyelés

- **Dimenzió-heterogenitás.** Az egyetlen globális SEM a hat dimenzióra
  rossz közelítés: az O valódi SEM-je 6.6, az X-é 8.7 — 32% eltérés.
  Egy `DIFF_MIN_GAP` mindkettőre egyszerre nem lehet helyes: az O-t
  túlbünteti, az X-et alulbünteti. Ha valaha per-dimenzió SEM-re
  váltunk, ez a tábla az input. (Az X-nél ráadásul a hiányzó
  social_self_esteem facet miatt a mért érték felfelé torzított —
  a valódi, teljes X-skála SEM-je ennél kisebb lehet.)
- **A 40/70 és 35/65 abszolút vágások az O-n degenerálódnak** (0% low,
  80–86% high). Ennek egy része minta-jellemző (az openpsychometrics
  látogatói kiugróan magas Nyitottságúak), de a szerkezeti tanulság
  attól még áll: **fix, abszolút POMP-vágás nem lehet egyformán helyes
  hat, eltérő átlagú és szórású skálán**. A strukturális megoldás a
  norma-referált (percentilis) sávozás — amihez viszont a SAJÁT pilot
  normái kellenek, nem ez a tábla.

## Forrás és reprodukálás

Az `openpsychometrics.org` a 2026-08-11-i futtatókörnyezetből **tiltott**
(a proxy `403 CONNECT`-et adott a `https://openpsychometrics.org/_rawdata/`
CONNECT-re), ezért a `--download` mód nem használható. Az adat egy
GitHub-tükörből jött, amely a `raw.githubusercontent.com`-on elérhető.

**Használt forrás** (haghish/openpsychometrics — az openpsychometrics.org
`_rawdata/` klónja, „solely for research purpose"; repo-HEAD a letöltéskor:
`5c97a7eebd2809cc526b1671d1fdeb82cedd5545`):

```
https://raw.githubusercontent.com/haghish/openpsychometrics/main/HEXACO/data.csv
https://raw.githubusercontent.com/haghish/openpsychometrics/main/HEXACO/codebook.txt
```

Ellenőrző-összegek (a fájlok NEM commitolhatók, csak az MD5-ük):

| fájl | méret | MD5 |
|---|---|---|
| `data.csv` | 11 202 266 B (22 786 adatsor + fejléc, 244 oszlop, TAB) | `8e8f13624a9c5048b679cda01699cb86` |
| `codebook.txt` | 10 609 B (244 oszlop-leírás) | `8e0644fe4ddd3b63cad36d740d4da37d` |

A tükör a `README.md`-jében az eredeti csomagot így azonosítja:
„6/21/2014 — Answers to the IPIP HEXACO equivalent scales — 240 scale
rated items, country — n = 22 786", ami pontosan egyezik a letöltött
fájl sorszámával.

### Reprodukálás

```bash
# 1) adat (a .data/ gitignore-olt — se CSV, se zip nem kerülhet a repóba)
mkdir -p scripts/research/.data
curl -sSL -o scripts/research/.data/data.csv \
  https://raw.githubusercontent.com/haghish/openpsychometrics/main/HEXACO/data.csv
curl -sSL -o scripts/research/.data/codebook.txt \
  https://raw.githubusercontent.com/haghish/openpsychometrics/main/HEXACO/codebook.txt

# 2) leképezés ellenőrzése (várt: 92/100 item, csak a 8 nem-IPIP hiányzik)
npx tsx scripts/research/norms-from-ipip-dataset.ts \
  --csv scripts/research/.data/data.csv \
  --codebook scripts/research/.data/codebook.txt --dump-codebook

# 3) a doksi számait előállító futtatás
npx tsx scripts/research/norms-from-ipip-dataset.ts \
  --csv scripts/research/.data/data.csv \
  --codebook scripts/research/.data/codebook.txt \
  --form=both --screen "V1>=5" --screen "V2>=5" \
  --json scripts/research/.data/ipip-reference-normtable.json
```

Ha valaki korlátozás nélküli hálózaton dolgozik, az eredeti forrás
közvetlenül is megy (`--download`, vagy kézzel:
`https://openpsychometrics.org/_rawdata/HEXACO.zip` → kicsomagolás a
`scripts/research/.data/` alá → a fenti 3. lépés a kicsomagolt
`data.csv`-vel).

### Kimeneti artefaktumok

- `scripts/research/.data/ipip-reference-normtable.json` — a teljes
  gépi riport (leképezés, szűrők, mindkét forma statisztikái, NormTable
  blokkok). **Gitignore-olt**, nem commitolható.
- A script a végén `NormTable`-kompatibilis blokkot ír ki
  (`version: "ipip-ref-2026-08-11"`, `n: 21681`) és hangos
  figyelmeztetést, hogy a blokk **nem élesíthető**. A blokk értékei
  (INTE 58.58/16.54 · RESO 62.51/16.82 · TEMP 44.70/19.60 ·
  ADAP 54.57/16.50 · THOR 53.74/15.72 · OPEN 78.87/11.91) itt kizárólag
  dokumentációként szerepelnek — az `ACTIVE_NORM_TABLE` érintetlen marad.

Részletek a scriptről: `scripts/research/README.md`.
