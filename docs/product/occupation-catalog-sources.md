# Foglalkozás-katalógus v2 — források, levezetés, nyitott döntések

> Készült: 2026-07-30 · Státusz: első teljes generálás LEFUTOTT, review-ra vár
> · Kimenetek: `docs/product/occupation-catalog-v2.md` (emberi review, ~1 MB),
> `docs/product/data/occupations-v2.json` (gépi), `docs/product/data/occupation-catalog-review.xlsx` (Excel review)
> · Pipeline: `scripts/career-catalog/step1…step6` · Kapcsolódó: `career-engine-plan.md` (F2)

## 0. Döntések (user, 2026-07-30)

1. **Méret:** minél bővebb, de csak a valóban releváns tételekkel → magyar
   relevancia-tierek. **T1+T2 = 477 foglalkozás megy a termékbe**, a T3 (375
   niche) az adatban marad, a T4 (38) kimarad. A tierezés szakértői becslés
   (nincs publikus FEOR-4 létszámadat), a user Excelben validálja.
2. **Kanonikus magyar név: a köznapi, piaci elnevezés** (ESCO-alak), nem a
   hivatalos FEOR-név. A FEOR/ISCO név megjelenik mellette hivatkozásként.
3. **H-szabály: aszimmetrikus** — a becsületesség-alázat célérték alatti része
   soha nem növeli az illeszkedést (részletek a 4./3. pontban).
4. **Bér/kereslet badge: nem kerül be** (a KSH-adat elérhető, de nem használjuk).
5. **Validálás:** a user, Excelben →
   `docs/product/data/occupation-catalog-review.xlsx`.

## 1. Mi lett belőle — számok

| Mutató | Érték |
|---|---|
| Katalógus-tételek | **890 foglalkozás** (a mai 109 helyett) |
| Ebből termékbe javasolt (T1+T2) | **477** — T1 gyakori: 131 · T2 létező: 346 |
| Niche, adatban marad (T3) | 375 |
| Kihagyásra javasolt (T4) | 38 |
| HEXACO cél-profil + abszolút szint | 890 (mind) |
| Holland-kód (6 betű, mért érdeklődés-adatból) | 890 (mind) |
| Belépési szint (Job Zone + tipikus végzettség) | 890 (mind) |
| ISCO-08 négyjegyű kód | 890 |
| FEOR-08 kód | 861 |
| Magyar leírás (ESCO) | 744 |
| Magyar megnevezés — gépi választás megbízható | 374 |
| Magyar megnevezés — kézi review kell | **516** (Függelék A a katalógusban, és az Excelben jelölve) |

ISCO főcsoportonkénti megoszlás: 48 vezető · 291 felsőfokú · 192 technikus/középfok
· 45 adminisztratív · 62 kereskedelem-szolgáltatás · 7 mezőgazdaság ·
136 ipar-építőipar · 78 gépkezelő-járművezető · 31 egyszerű foglalkozás.

## 2. Források és licenc

| Forrás | Mit ad | Licenc / feltétel |
|---|---|---|
| **O\*NET 30.3 Database** (U.S. Department of Labor, Employment and Training Administration) | 21 Work Style előjeles hatás-értéke foglalkozásonként, 6 betűs Holland-profil (1–7), Job Zone (1–5), végzettség-megoszlás (12 kategória), angol leírás, 1016 foglalkozás | **CC BY 4.0** — kötelező forrásmegjelölés: „O\*NET 30.3 Database, U.S. Department of Labor/ETA”, verziószámmal. Az „O\*NET” védjegy: nem sugallhatunk támogatást/endorsementet, és nem hívhatjuk a mi adatunkat O\*NET-nek („O\*NET-adatokból származtatva” a helyes forma). |
| **ESCO v1.2** (Európai Bizottság) | magyar foglalkozás-megnevezések, magyar leírások, alternatív (piaci) nevek, ISCO-08 hozzárendelés; API kulcs nélkül elérhető | EU-újrahasznosítás forrásmegjelöléssel (2011/833/EU); az ISCO-08 alapja az ILO műve |
| **ESCO_to_ONET-SOC crosswalk** (O\*NET Resource Center) | 8627 ESCO-tétel ↔ 958 O\*NET-SOC megfeleltetés | O\*NET-tel azonos (CC BY 4.0) |
| **KSH ISCO-08 → FEOR-08 fordítókulcs** | magyar statisztikai foglalkozási kód (FEOR-08) és hivatalos magyar csoportnév; 410 ISCO-kódra | KSH közzétett osztályozás, forrásmegjelöléssel |

**Termékteendő ebből:** a karrier-fül módszertani lapjára és a PDF-be be kell
kerülnie egy forrás-blokknak (O\*NET verzió + DOL/ETA, ESCO, KSH). Ez licenc-
feltétel, nem választás.

Amit megnéztem és **nem** használunk: a BLS SOC↔ISCO fájlok (a bls.gov blokkolja
a gépi letöltést; az ESCO-crosswalk kiváltja), az ESCO teljes CSV-csomag
(regisztráció mögött; az API elég volt).

## 3. Levezetés

### 3.1 HEXACO cél-profil a Work Styles-ból

Az O\*NET 30-as sorozat átalakította a Work Styles készletet, és ma **21
leíró** van benne, köztük olyanok, amiknek pontos HEXACO-megfelelője van:
*Integrity, Sincerity, Humility* (H), *Empathy, Cooperation, Self-Control* (A),
*Stress Tolerance, Optimism, Self-Confidence* (E fordítva / X), *Social
Orientation, Leadership Orientation, Initiative* (X), *Attention to Detail,
Dependability, Achievement Orientation, Perseverance, Cautiousness* (C),
*Innovation, Intellectual Curiosity, Tolerance for Ambiguity* (O).

A `WI` skála (**Work Styles Impact, −3…+3**) előjeles: megmutatja, hogy az adott
vonás **segít vagy hátráltat** abban a foglalkozásban. Ez pontosan az, amire az
ideal-point modellhez kellett irány-információ — a mai kézi „high/low” súlyok
kiváltása innen jön.

Négy lépés:

1. **Foglalkozáson belüli centrálás** — kivonjuk a foglalkozás 21-stílus átlagát.
   Így kiesik az „itt minden fontos” hatás, és a profil **alakja** marad.
2. **Stílusonkénti standardizálás** a 891 foglalkozás felett (z-érték).
3. **Aggregálás** a dokumentált loading-mátrixszal (a mátrix a katalógus végén
   szerepel; az E fordított skálájú, ezért a stressztolerancia negatív loading).
4. **Cél, tolerancia, súly**: `cél = 50 + 12·z` (5–95 közé vágva),
   `tolerancia = 30 − 8·|z|` (12–30), `súly = |z| / Σ|z|`.

Emellett minden foglalkozásnál eltároltuk az **abszolút szintet** is (centrálás
nélküli levezetés) — ez a „mennyi kell belőle egyáltalán”. A motor a kettőt
külön használja: differenciál = rangsor (`differential`), abszolút = általános
szint (`general`). Ez a `career-engine-plan.md` F2 pontjának adathiánya volt.

Példák (differenciál cél ± tolerancia, súly):

- **Szoftverfejlesztő** — O 69±17 (w 0.52) · A 42±24 (0.23) · H 42±25 (0.21);
  abszolút: O 67, C 55, X 53
- **Műszaki értékesítő** — H 25±14 (0.41) · X 74±14 (0.40) · E 42±25 (0.14);
  abszolút: X 69, A 55, H 36
- **Szakápoló** — A 60 (0.30) · C 41 (0.28) · H 57 (0.21);
  abszolút: H 68, A 68, C 61, E 42

### 3.2 Holland-kód

O\*NET Occupational Interests: mind a hat betű 1–7 skálán, 0–100-ra vetítve. Ez
**mért** foglalkozás-oldali érdeklődés-profil — a mai 2 betűs, kézi
`ROLE_RIASEC_OVERRIDE` táblát váltja ki, és lehetővé teszi a teljes 6-vektoros
congruence-számítást.

### 3.3 Belépési szint

Job Zone (1–5) → a mi `entryLevel` skálánk (open / course / vocational / higher
/ specialized), plusz a birtokosok által leggyakrabban jelölt végzettségi szint
magyar megfelelőre fordítva, a jelölési aránnyal együtt. Megoszlás mind a 890-en:
324 course · 213 higher · 204 vocational · 149 specialized; a termékbe javasolt
477-en: 165 course · 141 higher · 116 vocational · 55 specialized.

**Fontos korlát:** a Job Zone és a végzettség-megoszlás **amerikai** munkaerő-
piacról származik. A magyar belépési útvonalat (szakma, OKJ-utód szakmajegyzék,
kamarai tagság) külön kell hozzátenni — ez ma nincs benne.

## 4. Ismert hiányosságok

1. **516 magyar megnevezés kézi döntést kér.** A crosswalk sok-a-sokhoz: egy
   O\*NET foglalkozáshoz több ESCO-tétel tartozik, és a gépi (szó-halmaz)
   egyezés nem szemantikus. Ahol nem volt meggyőző, a hivatalos ISCO/FEOR
   csoportnévre estünk vissza, és a tétel bekerült a katalógus Függelék A
   listájába a jelöltekkel. Javasolt megoldás: egy LLM-es átnevező kör az 516
   tételre (EN cím + ESCO-jelöltek + FEOR-név → javasolt magyar név), majd
   emberi jóváhagyás.
2. **Amerikai piac-torzítás — részben kezelve.** A tierezés (T1–T4) szűri, de
   szakértői becslés: a KSH nem közöl FEOR-négyjegyű létszámot, csak főcsoport
   szinten. Ezt a te Excel-döntéseid pontosítják. Magyar sajátosságok
   (pl. hazai szakma-specifikumok) hozzáadása külön kör.
3. **A H aszimmetrikus szabálya (ELDÖNTVE, beépítendő az F2-be).** Több
   értékesítési/tárgyalási foglalkozásnál a levezetés **alacsony**
   becsületesség-alázatot ad célértéknek (a Work Style „Humility” negatív
   hatás-értéke miatt; pl. műszaki értékesítő: H cél 25). A H alacsony pólusa a
   szakirodalomban a kontraproduktív munkahelyi viselkedés prediktora, ezért a
   termék soha ne állítsa, hogy az alacsony integritás „illeszkedés”.

   A szabály három része:
   - **Egyoldalú pontozás:** ha a szerep H-célértéke a semlegesnél alacsonyabb
     (`target < 50`), a H komponens illeszkedés-hozzájárulása felülről nyitott:
     a célnál magasabb H **nem** von le pontot (az illeszkedés ilyenkor a
     maximumon marad). Formálisan: `alignment_H = 100`, ha `user_H >= target_H`.
   - **Nincs jutalom lefelé:** a cél alatti H nem növeli az illeszkedést a
     semleges szint fölé, tehát alacsony H-val nem lehet „jobban illeszkedni”
     egy szerephez.
   - **Szöveg helyett környezet-jellemzés:** ahol a szerep alacsony H-t „kíván”,
     a felület nem a felhasználó vonásáról beszél, hanem a közegről — „ebben a
     szerepben a határozott önérdek-képviselet és az önmenedzselés tipikus;
     a magas becsületesség-alázat itt lassabb induláshoz vezethet, de
     hosszabb távon bizalmi előnyt ad”.

   Ugyanez a logika a többi dimenzióra NEM vonatkozik: ott a kétirányú
   ideal-point pontozás marad (a túl sok is jelzés).
4. **Egy HEXACO-facet nincs lefedve**: az *aesthetic appreciation* (O) nem
   feleltethető meg egyetlen Work Style-nak sem.
5. **A loading-mátrix szakértői** (evidence: expert), nem validált. Ez a v2
   legfontosabb validálandó eleme — a `career-engine-plan.md` F3 known-groups
   vizsgálata pontosan erre való.
6. **Az ESCO mélyebb szintjei** (6–7 jegyű kódok) nincsenek lekérve, csak az
   ISCO-csoportok közvetlen leszármazottai (1701 tétel). Emiatt néhány
   crosszwalk-sor csak prefix-egyezéssel talált magyar nevet.
7. **A FEOR-fordítókulcs PDF-ből jön**, tördelt kétoszlopos szöveggel: 409 ISCO-kódra
   sikerült FEOR-t kötni a 436-ból (a katalógusban 865/890 tétel kap FEOR-kódot),
   és néhány hivatalos csoportnév csonka. A maradék ~27 kódot kézzel kell pótolni
   (a KSH online FEOR-keresőjéből).
8. **Nincs bér- és kereslet-adat.** A KSH bérstatisztika FEOR-szinten publikus,
   tehát csatolható — de ez külön badge legyen, ne az illeszkedés része.

## 4.1 Review utáni javítás (2026-07-30)

A validált Excel visszaolvasásakor kiderült, hogy a **leírás** sok tételnél nem a
végleges magyar névhez tartozott (a gépi párosítás angol cím alapján ment: a
„Grafikus” például a szerencsejáték-tervező ESCO-leírását kapta). A `step7`
ezért a leírást a **végleges magyar névhez** párosítja újra, magyar szó-halmaz
egyezéssel: 477-ből **429 tétel** kapott név-illesztett leírást, a többinél
marad az eredeti (a `descSource` mező jelöli, melyik).

## 5. Review-folyamat

A validálás Excelben történik: `docs/product/data/occupation-catalog-review.xlsx`.

- Első három oszlop a tiéd: **DÖNTÉS** (marad/törlés, előre kitöltve a tier
  alapján), **VÉGLEGES HU NÉV** (csak ha a javasolt nem jó), **MEGJEGYZÉS**.
- A `tier` oszlop színezve: zöld T1, fehér T2, sárga T3, piros T4.
- Utána minden levezetett adat: FEOR/ISCO kód és név, magyar leírás, belépési
  szint, Holland-kód hat értéke, HEXACO cél-profil és abszolút szint, valamint a
  `név-review?` jelölés és az ESCO piaci név-jelöltek.
- Külön „Módszer” munkalap tartalmazza a tier-definíciókat, a forrásokat és a
  levezetés magyarázatát.

A kitöltött Excel visszaolvasása lesz a katalógus v2 véglegesítésének első
lépése (`scripts/career-catalog/step7_apply_review.py` — még nincs megírva).

### Ami továbbra is nyitott

- **A loading-mátrix szakmai validálása** (Work Style → HEXACO). Ez nem
  Excel-kérdés: a `career-engine-plan.md` F3 known-groups vizsgálata dönti el.
- **Magyar belépési útvonalak** (szakmajegyzék, kamarai tagság, képzési idő) —
  a Job Zone amerikai adat; a magyar megfelelőt később kell hozzátenni.
- **Név-egyesítés:** néhány O\*NET foglalkozás magyar szempontból ugyanaz a munka
  (pl. 35 tantárgy-specifikus egyetemi oktató) — az Excel „törlés”-döntései és a
  szerep-családok fogják összevonni.

## 6. Reprodukálás

```bash
# 1. O*NET 30.3 text ZIP letöltése az onetcenter.org-ról, kibontás
# 2. ESCO_to_ONET-SOC.xlsx letöltése (onetcenter.org/crosswalks/esco/)
# 3. KSH ISCO->FEOR fordítókulcs PDF -> pdftotext -layout
python scripts/career-catalog/step1_crosswalk.py   # crosswalk beolvasás
python scripts/career-catalog/step2_esco_hu.py     # ESCO magyar adatok (API, ~15 perc)
python scripts/career-catalog/step3_onet.py        # O*NET + HEXACO levezetés
python scripts/career-catalog/step5_feor.py        # FEOR fordítókulcs
python scripts/career-catalog/step6_hu_tiers.py    # magyar relevancia-tierek + Excel
python scripts/career-catalog/step4_join.py        # összefűzés + doksik (tierekkel)
```

A szkriptek ma a scratchpad-útvonalakra hivatkoznak (BASE), a repóba emelésnél
paraméterezni kell őket — ez az F2 első teendője.
