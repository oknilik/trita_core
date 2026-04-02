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
- `belbin` (csapatszerepek) oldal = részletes elemzés/deep-dive.
- Nincs duplikált szerepvizualizáció két külön oldalon ugyanazzal a tartalommal.
- Alacsony adatminőségnél nincs “erős” ajánlás.
- User-facing copyban a “Csapatszerepek” kifejezés maradjon; ne jelenjen meg “Belbin” technikai címkeként.

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
- `belbin` tab maradjon részletes elemzésre.
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

### B2. 3×3 mátrix átmeneti policy

Feladat:

- A 3×3 mátrix maradjon ideiglenesen, de “támogató jel” státuszban.
- Erősítsük a disclaimer copyt:
  - becslés alapja,
  - mit jelent és mit nem jelent,
  - mikor tekinthető stabilnak.

Done when:

- A felhasználó nem érti félre teljesítményértékelésként.

### B3. Action-priority szabályok

Feladat:

Akciókártya motor (3-4 prioritás):

- “hiányzó kulcsszerep”
- “alacsony completion”
- “observer kör hiány”
- “alacsony kohézió / magas szórás” (ha minőség elégséges)

Alacsony confidence esetén:

- ajánlás “javasolt következő adatgyűjtés” típusú legyen.

Done when:

- Minden ajánlás mögött explicit trigger feltétel van.

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

Új layout:

- bal: szerepkategória oszlopok/csoportok,
- jobb: tagkártyák (név, elsődleges szerep, 1-2 kulcsdimenzió),
- no-data tagok külön “adat hiányzik” listában.

Done when:

- Nincs “random buborék” érzet; a vezető gyorsan olvassa.

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

Done when:

- Nincs “visszadobott” vagy zavaró navigációs élmény.

---

## WORKSTREAM E — Másolás (copy) és terminológia

### E1. Terminológia tisztítás

Feladat:

- User-facing: “Csapatszerepek”.
- “Belbin” csak módszertani háttérszövegben, ha muszáj.

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
- belbin deep-dive átvezetés.

Done when:

- A fő intelligence flow regresszióálló.

---

## Implementációs sorrend (javasolt)

1. B1, B3 (adat + action logika)
2. A1, C1, C3 (új page skeleton)
3. C2, C4 (vizuális és layout polish)
4. D1, D2, E1, E2 (navigáció + copy)
5. F1, F2 (teszt)

---

## Érintett fő fájlok

- `src/app/team/[id]/page.tsx`
- `src/components/team/TeamIntelligence.tsx`
- `src/components/team/RoleFitMap.tsx`
- `src/components/team/TeamMap.tsx`
- `src/components/team/TeamBelbinSection.tsx`
- `src/lib/team-pattern.ts`
- `src/lib/i18n/org.ts`

---

## Definition of done (összesítve)

- Az overview egyetlen, erős kártyával nyitja a csapatintelligenciát.
- Az intelligence oldal 3 blokkos, akció-orientált.
- A részletes szerepelemzés külön deep-dive oldalon él.
- Minden fő insighthoz látható evidence/confidence jelölés tartozik.
- A vizuális rendszer egységesebb, kevésbé zajos.
- A fő flow-k teszttel védettek.
