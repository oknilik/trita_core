# Trita — Team Intelligence Redesign Task List

## Cél

A csapatintelligencia nézet legyen:

- gyorsan érthető vezetői összefoglaló,
- akció-orientált,
- adatminőség szempontból őszinte,
- vizuálisan egységesebb és tisztább.

A részletes csapatszerep-elemzés maradjon külön deep-dive oldalon.

---

## Kötelező elvek

- `intelligence` oldal = executive summary + akció.
- `team-role` (csapatszerepek) oldal = részletes elemzés/deep-dive.
- Nincs duplikált szerepvizualizáció két külön oldalon ugyanazzal a tartalommal.
- Alacsony adatminőségnél nincs “erős” ajánlás.
- User-facing copyban a “Csapatszerepek” kifejezés maradjon; ne jelenjen meg “Csapatszerep” technikai címkeként.
- A 3×3 pszicho-mátrix nem marad az `intelligence` oldalon; ha szükséges, deep-dive szinten opcionális.

---

## WORKSTREAM A — IA és tartalmi scope

### A1. Csapatintelligencia oldal új blokkszerkezete

Feladat:

`/team/[id]?tab=intelligence` oldalon 3 fő blokk:

1. **Csapat-összefoglaló**
2. **Erőforrás-térkép** (ember + szerep + kulcsdimenziók)
3. **Fejlesztési prioritások** (akciókártyák)

Done when:

- A három blokk külön vizuális egység.
- A nézet első képernyőn értelmezhető.

### A2. Deep-dive határ meghúzása

Feladat:

- `intelligence` oldalról kivezetni a redundáns részletes szerep-eloszlás elemeket.
- `team-role` tab maradjon részletes elemzésre.
- Adjunk egyértelmű “Részletes csapatszerep-elemzés” átvezető CTA-t.

Done when:

- A két oldal szerepe tisztán különválik.

---

## WORKSTREAM B — Logika és adatminőség

### B1. Intelligence adatkontraktus véglegesítése

Feladat:

Egységes metadata minden intelligence blokkhoz:

- `source`
- `quality`
- `confidence`
- `note`

Központi resolverből jöjjön (ne komponensenként ad hoc).

Done when:

- A blokkok nem lokálisan számolják az evidence-t.

### B2. 3×3 mátrix kivezetése az intelligence nézetről

Feladat:

- A 3×3 mátrix kerüljön ki az `intelligence` nézetről.
- Ha még szükséges megtartani, csak deep-dive/profil oldalon legyen opcionális toggle-ként.
- Az `intelligence` oldalon ezt az információt az érthetőbb erőforrás-kártyák hordozzák.

Done when:

- Az `intelligence` oldalon nincs 3×3 mátrix.
- Nincs olyan vizualizáció, ami disclaimer nélkül félrevezethető.

### B3. Action-priority szabályok

Feladat:

Akciókártya motor (3-4 prioritás):

- “hiányzó kulcsszerep”
- “alacsony completion”
- “observer kör hiány”
- “alacsony kohézió / magas szórás” (ha minőség elégséges)
- “magas szórás egy dimenzión belül” (pl. Extraverzió szélsőséges tartományban)
- “vezető-csapat értékrend-eltérés” (manager H/A profil vs csapatátlag)

Alacsony confidence esetén:

- ajánlás “javasolt következő adatgyűjtés” típusú legyen.

Done when:

- Minden ajánlás mögött explicit trigger feltétel van.

### B4. Insufficient data state

Feladat:

- `?tab=intelligence` oldalon 0-2 completed assessment esetén dedikált “nincs elég adat” állapot jelenjen meg.
- Ne félig kitöltött metrika-dashboard jelenjen meg, hanem:
  - rövid helyzetkép,
  - miért nincs még elég adat,
  - konkrét CTA-k az adatgyűjtéshez.

Done when:

- Alacsony adatállapotban az oldal nem félkész analytics nézetnek hat.
- A user azonnal látja, mit kell tennie a stabil csapatképhez.

---

## WORKSTREAM C — UI redesign (visual polish)

### C1. Intelligence hero card finomhangolás

Feladat:

`intelligence` oldal tetején:

- rövid célmondat,
- 2-3 minichip (adatállapot, kitöltöttség, dinamika státusz),
- egy fő CTA deep-dive irányba.

Done when:

- A header nem csak dekoratív, hanem irányt ad.

### C2. Erőforrás-térkép komponens

Feladat:

Új layout (egyszerű, olvasható lista-alapú megközelítés):

- Egydimenziós tag-kártya lista (nem kétoszlopos kategória-rendszer).
- Kártyánként kötelező:
  - név,
  - 3 csapatszerep pill,
  - 1-2 kiemelkedő TRITAN dimenzió.
- No-data tagok külön “adat hiányzik” szekcióban, dedikált CTA-val.

Done when:

- A vezető sorban olvasva gyorsan értelmezi, “ki mit hoz a csapatba”.
- Nincs “random buborék” vagy túlbonyolított vizuális érzet.

### C3. Fejlesztési prioritás kártyák

Feladat:

Kártyánként:

- cím,
- miért kapta ezt a javaslatot,
- várható hatás,
- egy közvetlen CTA.

Done when:

- A nézetből közvetlenül indítható következő lépés.

### C4. Visual rendszer egységesítés

Feladat:

- egységes radius/shadow/spacing intelligence blokkokon,
- chip, banner, címhierarchia konszolidáció,
- kevésbé “dashboard-zajos” vizualitás.

Done when:

- Oldal tónusa egységes és könnyen olvasható.

---

## WORKSTREAM D — Navigáció és oldalkapcsolat

### D1. Overview visszaállítás “egy kártyás belépéssel”

Feladat:

`/team/[id]?tab=overview` oldalon:

- 1 kiemelt “Csapatintelligencia megnyitása” kártya maradjon,
- támogató kártyák (profil/tagok/csapatszerepek) másodlagosak legyenek.

Done when:

- A fő belépési pont egyértelmű.

### D2. Linkek és tab-kompatibilitás

Feladat:

- `?tab=intelligence` maradjon stabil.
- `?tab=roles` ne dobjon meglepő fallbacket: ha nem támogatott, menjen explicit `?tab=intelligence`-re.
- Legacy vagy hibás tab paramétereknél explicit, kiszámítható fallback legyen.
- Alacsony adatállapotnál a fallback a B4 szerinti dedikált insufficient-data nézetre fusson.

Done when:

- Nincs “visszadobott” vagy zavaró navigációs élmény.

---

## WORKSTREAM E — Másolás (copy) és terminológia

### E1. Terminológia tisztítás

Feladat:

- User-facing: “Csapatszerepek”.
- “Csapatszerep” csak módszertani háttérszövegben, ha muszáj.
- “Coaching” helyett: “tanácsadói konzultáció”.
- Az `intelligence` oldalon blokkcímként “Ki mit hoz a csapatba” használata a “Csapattérkép” helyett.

Done when:

- Nincs kevert terminológia UI-ban.

### E2. Action-copy egységesítés

Feladat:

- minden intelligence blokk végén 1 fő CTA copy minta,
- “Mit látok?” + “Mit tegyek?” rövid szövegpár.

Done when:

- A nézet irányít, nem csak informál.

---

## WORKSTREAM F — Teszt és regresszióvédelem

### F1. Unit tesztek (logika)

Minimum:

- evidence quality/confidence resolver,
- action-priority triggerek,
- fallback redirect (`roles` -> `intelligence`).

### F2. Integration/E2E smoke

Minimum:

- Team overview -> intelligence entry card -> intelligence page,
- intelligence page low-data állapot,
- intelligence page sufficient-data állapot,
- team-role deep-dive átvezetés.

Done when:

- A fő intelligence flow regresszióálló.

### F3. Visual regression snapshot

Feladat:

- Playwright screenshot comparison az `intelligence` és `team-role` nézet fő állapotaira.
- Legalább ezekre legyen baseline:
  - low-data,
  - sufficient-data,
  - deep-dive entry CTA blokk.

Done when:

- A spacing/szín/hierarchia regressziók gyorsan észlelhetők.

---

## WORKSTREAM G — Adatvizualizáció és chart policy

### G1. Intelligence chart-minimal policy

Feladat:

- Az `intelligence` oldalon ne legyen kötelező chart-alapú megjelenítés gyenge mintanagyságnál.
- Elsődleges forma: pill-ek, metrikák, rövid magyarázó szöveg, akciókártyák.
- Chart csak akkor jelenjen meg, ha az adatminőség és mintanagyság ezt indokolja.

Done when:

- Az `intelligence` nézet nem kelti “hamis pontosság” érzetét.

### G2. Deep-dive chart ownership

Feladat:

- A részletes chartok tulajdonosa a `team-role` (csapatszerep deep-dive) nézet.
- Az `intelligence` nézet teaser/átvezető szerepben marad.

Done when:

- A két oldal vizualizációs szerepe nem keveredik.

---

## Implementációs sorrend (javasolt)

1. B1, B2, B3, B4 (adat + action + insufficient-data alapok)
2. A1, C1, C3 (új page skeleton)
3. C2, C4, G1 (vizuális és vizualizációs policy polish)
4. D1, D2, E1, E2, G2 (navigáció + copy + deep-dive ownership)
5. F1, F2, F3 (teszt + vizuális regresszió)

---

## Érintett fő fájlok

- `src/app/team/[id]/page.tsx`
- `src/components/team/TeamIntelligence.tsx`
- `src/components/team/RoleFitMap.tsx`
- `src/components/team/TeamMap.tsx`
- `src/components/team/TeamCsapatszerepSection.tsx`
- `src/lib/team-pattern.ts`
- `src/lib/i18n/org.ts`

---

## Definition of done (összesítve)

- Az overview egyetlen, erős kártyával nyitja a csapatintelligenciát.
- Az intelligence oldal 3 blokkos, akció-orientált.
- A részletes szerepelemzés külön deep-dive oldalon él.
- Minden fő insighthoz látható evidence/confidence jelölés tartozik.
- A vizuális rendszer egységesebb, kevésbé zajos.
- A fő flow-k teszttel és vizuális snapshottal védettek.
- Az intelligence oldalon nincs félrevezető 3×3 mátrix.
