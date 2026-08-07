# Bevétel-becslés — első 3 év, soloprenőrként (2026-09 → 2029-08)

> Készült: 2026-08-07 · Kiindulás: a `main` kódállapota (df29acc) és a
> `src/lib/quote/rate-card.ts` díjtételei · Horizont: a pilot indulásától
> (2026-09-08) számított három üzleti év.
>
> **Ez becslés, nem terv és nem ígéret.** A rate card a kódban explicit
> PLACEHOLDER-nek van jelölve; az árazás első valós visszaigazolása a pilot
> S7 kritériuma lesz (`docs/pilot/pilot-playbook.md`). Amíg S7 nincs meg,
> minden alábbi szám egy modell kimenete, nem mérés.

---

## 1. Mi az, amit el lehet adni — a kód szerint

A platform **consulting-led** módban működik (`operating-mode.ts`): a fizetés
a platformon kívül, tanácsadói számlázással történik, az org-hozzáférést
kézzel adod (`/admin?tab=orgs`). Ebből következik, hogy a bevétel nem
előfizetés, hanem **projektbevétel** — és a becslés is így épül fel.

Az eladható egység három tagból áll (`src/lib/quote/calculate.ts`):

1. **Programdíj** — fix 450 000 Ft. Ami nem skálázódik a létszámmal.
2. **Fejenkénti mérési díj** — marginális sávokkal (12 000 → 5 500 Ft/fő).
3. **Mérés-lépések felára** — Observer 360°, csapatszerep (self és 360°),
   bizalmi kör, pszichológiai biztonság.
4. **Workshop-nap** (320 000 Ft/nap), **utánkövetési hullám** (a mérési díj
   60%-a + 90 000 Ft), **havi kísérés** (120 000 Ft/hó).

### Csomag-ökonómia (a DEFAULT_RATE_CARD-ból számolva)

| Csomag | Összetétel | Nettó ár | Becsült óra | Effektív óradíj | Ft/fő |
|---|---|---|---|---|---|
| **Kicsi** | 12 fő, 1 csapat, 4 lépés, 1 workshop, 1 hullám | **1 392 800** | 29 | 48 028 | 116 067 |
| Kicsi, utánkövetés nélkül | ugyanaz, 0 hullám | 1 148 000 | 23 | 49 913 | 95 667 |
| **Közepes** | 25 fő, 2 csapat, 5 lépés, 2 workshop, 1 hullám, 6 hó kísérés | **2 958 000** | 62 | 47 710 | 89 520 |
| **Nagy** | 60 fő, 5 csapat, 5 lépés, 4 workshop, 1 hullám, 12 hó kísérés | **5 386 000** | 115 | 46 835 | 65 767 |
| Kicsi, 30% pilot-kedvezménnyel | | 974 960 | 29 | **33 619** | 81 247 |

A cél-óradíj 25 000 Ft — a kalkulátor ez alatt figyelmeztet. Még 30%-os
pilot-kedvezménnyel is felette maradsz, tehát a rate card **nem alulárazott**;
a kérdés nem az, hogy megéri-e, hanem hogy a piac kifizeti-e.

### Melyik sor keres ténylegesen

| Tétel | Ft/óra |
|---|---|
| **Platform-mag** (programdíj + mérés + lépések, riporttal) | **63 692** |
| Utánkövetési hullám | 40 800 |
| Havi kísérés | 40 000 |
| Workshop-nap | **32 000** |

Ez a becslés legfontosabb egyetlen megállapítása: **a workshop a
legrosszabb óradíjú sorod**, a platform-vezérelt mérés+riport pedig a
legjobb — kétszeres különbség. A workshop üzletileg mégis kell (ez nyitja
az ajtót és ez teremti a bizalmat), de minden extra workshop-nap lefelé
húzza a program átlagos óradíját. A növekedés iránya tehát: **kevesebb
workshop-nap, több mérés és több utánkövetés ugyanazon az ügyfélen.**

---

## 2. Kiindulási helyzet (2026-08-07)

Amit a repó állapota igazol:

- A termék **megépült**: ~119 000 sor, 665 TS/TSX fájl, 30+ Prisma-modell,
  journey engine, policy engine, csapat-intelligencia, observer flow,
  értesítés-hub, saját analitika, admin-CRM ajánlat-kalkulátorral.
- A pilot-előtti zárólista mind a 14 tétele kész (`pre-pilot-plan-2026-09.md`).
- **Bevétel eddig: 0 Ft.** Nincs élő fizetési folyamat (a billing a
  `billing-v1-parked` tagben parkol), nincs referencia, nincs validált ár.
- A pilot kerete: 1–2 szervezet, 20–30 fő, 2026. szeptember–november, heti
  ~10 óra tanácsadói kapacitás.

A becslés innen indul: **T0 = 0 Ft bevétel, 0 referencia, kész termék.**

---

## 3. Feltevések

Amit a modell feltételez — ha ezek közül bármelyik nem áll, a szám elmozdul:

| # | Feltevés | Miért ez |
|---|---|---|
| F1 | Teljes munkaidőben (vagy közel) a Tritán dolgozol | heti ~10 óra mellett a bázis-eset kb. harmadolódik |
| F2 | Nincs alkalmazott, nincs társalapító | ez a soloprenőr-keret; a Y3-plafon ebből jön |
| F3 | Magyar piac, 20–200 fős cégek, HUF-számlázás | EUR-átváltás 400 Ft/EUR-val |
| F4 | Van kezdő szakmai hálózatod (volt kollégák, HR-ismerősök) | hidegindításból a Y1 kb. felére csökken |
| F5 | A pilot lefut és ad 1–2 használható referenciát | ha nem, a Y1 fizetős ága 6–9 hónapot csúszik |
| F6 | B2B sales-ciklus 2–4 hónap az első beszélgetéstől az aláírásig | 1,4 M Ft-os tételnél reális; nagyobbnál 4–6 hónap |
| F7 | Az egyéni (B2C) vonal nem lesz érdemi bevétel | ld. 6. szakasz |

---

## 4. A becslés

Üzleti évek a pilot indulásától. Nettó árbevétel, ezer forintban.

### Bázis-eset (ez a legvalószínűbb kimenet)

| | **1. év** (26.09–27.08) | **2. év** (27.09–28.08) | **3. év** (28.09–29.08) |
|---|---|---|---|
| Pilot (kedvezményes / referencia-ár) | 600 | — | — |
| Új programok | 3 db × ~1 200 = 3 600 | 7 db × ~1 400 = 9 800 | 10 db × ~1 600 = 16 000 |
| Utánkövetési hullámok | 1 × 250 | 3 × 300 = 900 | 5 × 350 = 1 750 |
| Havi kísérés | 4 hó = 480 | 18 hó = 2 160 | 30 hó = 3 600 |
| Egyéni / B2C | ~0 | ~150 | ~400 |
| **Összesen** | **≈ 4,9 M Ft** | **≈ 13,0 M Ft** | **≈ 21,8 M Ft** |
| kerekítve | **~4,5–5 M** | **~12–13 M** | **~20–22 M** |
| EUR (400 Ft) | ~12 e€ | ~32 e€ | ~54 e€ |

### Mindhárom forgatókönyv

| Forgatókönyv | 1. év | 2. év | 3. év | Σ 3 év |
|---|---|---|---|---|
| **Pesszimista** (F4/F5 nem teljesül, lassú lead-gen) | 1,2 M | 4,5 M | 8,0 M | **13,7 M Ft** (~34 e€) |
| **Bázis** | 4,9 M | 13,0 M | 21,8 M | **39,7 M Ft** (~99 e€) |
| **Optimista** (1 nagy horgony-ügyfél + partner-csatorna indul) | 8,5 M | 22 M | 34 M | **64,5 M Ft** (~161 e€) |

**Havi lebontásban** a bázis-eset ~410 e Ft/hó (1. év) → ~1,08 M Ft/hó
(2. év) → ~1,82 M Ft/hó (3. év) átlagos árbevételt jelent — de **erősen
lökésszerűen**, nem egyenletesen: egy 1,4 M-s program 2–3 hónap alatt
számlázódik ki, aztán jöhet két üres hónap.

### Miért pont ennyi az 1. év

Ez a legérzékenyebb szám, ezért kibontva. A pilot szeptember–novemberben fut,
referencia és testimonial legkorábban **2026 decemberében** áll rendelkezésre.
Ha az első értékesítési beszélgetések decemberben indulnak és a ciklus 2–4
hónap, az **első fizetős aláírás reálisan 2027 február–március**, a teljesítés
március–június. Ebbe az ablakba (2027 aug. végéig) **3 fizetős program fér
be** — nem azért, mert nincs kapacitásod, hanem mert a pipeline ennyi.

Ehhez a 3 dealhez a szokásos B2B-tölcsérrel **10–15 kvalifikált beszélgetés**
és **40–60 releváns első kontakt** kell. Ez az 1. év tényleges munkája — nem
a fejlesztés.

### Kapacitás-ellenőrzés a 3. évre

A bázis-eset 3. éve: 10 program + 5 hullám + 30 hónap kísérés ≈ **520
kalkulátor-óra**. Valós szorzóval (egyeztetés, e-mail, prep, halasztás,
adminisztráció ~1,7×) ≈ **880 teljesítési óra**. Plusz értékesítés (~300 h)
és termékfejlesztés/karbantartás (~400 h) → **~1 580 óra/év ≈ heti 32 óra
tiszta munka**. Reális, de feszes.

**A bázis-eset 3. éve nagyjából az egyszemélyes plafon.** 25 M Ft felett
soloprenőrként vagy a termékfejlesztés áll le, vagy a minőség romlik, vagy
alvállalkozó kell.

---

## 5. Mi mozdítja el a számot — fontossági sorrendben

1. **Utánkövetés-arány (hullám + kísérés).** A bázis 2–3. évében ez a
   bevétel 20–25%-a, majdnem sales-munka nélkül. A kalkulátor nem véletlenül
   dob `NO_FOLLOW_UP` figyelmeztetést, ha egy ajánlatban nincs benne. Ha
   minden ügyfélnél alapból az ajánlat része, a 3. év +3–4 M Ft.
2. **Land-and-expand a meglévő ügyfélben.** Egy második csapat ugyanannál a
   cégnél nulla akvizíciós költséggel ~700 e–1 M Ft. Olcsóbb, mint új logó.
3. **Workshop-napok aránya.** Minden workshop-nap 32 000 Ft/órára hígítja a
   programot. Vagy kevesebb nap, vagy magasabb napidíj (400–450 e Ft) — ez
   utóbbi a 3. évben +1,5–2 M Ft úgy, hogy egy órával sem dolgozol többet.
4. **Partner-csatorna — a kódban már megvan.** Az `ORG_CONSULTANT` szerep és
   az `assign_consultant` admin-művelet pontosan azt teszi lehetővé, hogy más
   tanácsadók a te platformodon dolgozzanak az ő ügyfeleikkel. Ez az egyetlen
   út a soloprenőr-plafon fölé emberfelvétel nélkül. Optimista ágon a 3. év
   +5–15 M Ft — de ez már nem tanácsadás, hanem platform-üzlet, saját
   értékesítési és support-terheléssel.
5. **Egy horgony-ügyfél.** Egy 60 fős, 5 csapatos, éves kíséréssel járó
   megbízás önmagában 5,4 M Ft. Ez fordítja optimistába a 2. évet — és ez a
   koncentrációs kockázat is egyben (ld. lent).

---

## 6. Amit tudatosan NEM számoltam bele

- **Egyéni (B2C) vonal.** A self-riport jelenleg ingyenes
  (`SELF_PAYWALL_ENABLED = false`), a €9-es Plus a parkolt billinggel együtt
  áll. A karrier-iránytű fake door 4 900 / 9 900 / 14 900 Ft-os sávokat mér —
  de érdemi B2C bevételhez havi több ezer látogató kellene, ami nincs. A
  modellben ezért a 2–3. évben szimbolikus 150–400 e Ft szerepel. Ha a
  fake door erős szándékot mér, ez külön döntés lesz, nem ennek a becslésnek
  a része.
- **Jelölt-értékelés (hiring).** A flow él (`CANDIDATE_GATING_ENABLED=false`),
  de nincs mögötte árazás a rate cardban. Potenciális negyedik terméksor,
  jelenleg nem bevételi tétel.
- **Támogatás, pályázat, befektetés.** Nem árbevétel.

## 7. Költségoldal (röviden, hogy a nettó kép ne csússzon el)

| Tétel | Éves nagyságrend |
|---|---|
| Infrastruktúra (Vercel, Neon, Clerk, Resend, domain) | 0,8–1,5 M Ft — a 3. évben a felső sáv |
| Könyvelés, jogi (adatkezelési mellékletek ügyfelenként) | 0,5–1,0 M Ft |
| Marketing, konferencia, utazás | 0,3–1,0 M Ft |

A fedezet magas (~85–90%), mert a bemenet az idő. **A vállalkozási forma
viszont döntést igényel:** céges ügyfeleknél a KATA nem járható út, tehát
átalányadó vagy Kft. — a 20 M Ft-os sávban a kettő között milliós különbség
lehet. Ezt könyvelővel kell lezárni, még az első számla előtt.

## 8. Kockázatok

| Kockázat | Hatás | Mit csökkenti |
|---|---|---|
| **Lead-generálás a szűk keresztmetszet, nem a termék** | ez dönti el az 1. évet | Ez a becslés legnagyobb bizonytalansága. A kész termék nem termel keresletet. |
| Az árazás validálatlan (a rate card kódban is PLACEHOLDER) | ±40% a teljes modellen | pilot S7 |
| Egyszemélyes teljesítés: betegség, szabadság = 0 bevétel | 1–2 havi kiesés | kísérési díj (visszatérő) arányának növelése |
| Ügyfél-koncentráció (1 ügyfél = a bevétel 25–50%-a) | egy elvesztett ügyfél féléves lyuk | min. 4–5 aktív ügyfél a 2. évtől |
| Beágyazott verseny (Hogan, Insights, Belbin-licencelt HU tanácsadók) | árnyomás | a differenciátor az observer 360° + a platform, de a vevő a tanácsadót veszi meg |
| GDPR / adatkezelés ügyfelenként | jogi és időköltség | sablonosított adatkezelési melléklet a pilot után |

---

## 9. Mi változik alkalmazottal vagy tanácsadóval?

A 4–8. szakasz egyszemélyes keretre szól. Ez a szakasz azt nézi meg, mi
történik, ha valakit bevonsz — és a válasz nem az, hogy „arányosan több
bevétel".

### 9.1 A kiindulópont: melyik korlátot oldja fel?

A becslés szerint az 1–2. évben a szűk keresztmetszet **a lead-generálás,
nem a teljesítési kapacitás**. Egy teljesítő ember (alkalmazott vagy
alvállalkozó) a *nem szűk* keresztmetszetet bővíti: attól, hogy több
programot tudsz leszállítani, még nem lesz több programod. Ez a szakasz
minden számának a mögöttes logikája.

Fordítva viszont igaz: ha valaki átveszi a teljesítés alacsony értékű
részét, **felszabadul a te időd értékesítésre** — a hatás tehát közvetett,
és csak akkor jelentkezik, ha a felszabadult órát tényleg sales-re fordítod.

### 9.2 Alapszámok

| Mérőszám | Érték | Honnan |
|---|---|---|
| Egy kis program valós teljesítési ideje | ~49 óra | 29 kalkulátor-óra × 1,7 valós szorzó |
| **A te valós óradíjad teljesítéskor** | **28 252 Ft/h** | 1 392 800 Ft / 49 óra |
| Cél-óradíj a rate cardban | 25 000 Ft/h | `targetHourlyRate` |

**Ez a becslés kulcsszáma.** A 48 000 Ft-os „effektív óradíj" a
kalkulátorban optimista könyvelés — a valós ráfordítással 28 000 Ft körül
vagy. Ez pedig **veszélyesen közel van a piaci alvállalkozói óradíjhoz**, és
ebből következik minden alábbi eredmény.

Munkáltatói teljes költség (13% szocho + ~10% eszköz/licenc/képzés — a
pontos kulcsokat könyvelővel ellenőrizd):

| Pozíció | Bruttó bér | Teljes éves költség |
|---|---|---|
| Junior koordinátor / ops | 450 000 Ft/hó | **6,7 M Ft/év** |
| Medior tanácsadó | 900 000 Ft/hó | **13,4 M Ft/év** |
| Senior tanácsadó | 1 300 000 Ft/hó | **19,4 M Ft/év** |

### 9.3 A négy modell a 3. évben, egymás mellett

| | Árbevétel | Munkaerő-költség | Egyéb | **Adózás előtti eredmény** | Fix kötelezettség |
|---|---|---|---|---|---|
| **Szóló (bázis)** | 21,8 M | 0 | 1,2 M | **20,6 M** | nincs |
| **+ ops-alvállalkozó** | 28,2 M | 2,4 M | 1,4 M | **24,4 M** | nincs |
| **+ senior alvállalkozó** | 31,0 M | 9,4 M | 1,6 M | **20,0 M** | nincs |
| **+ medior alkalmazott** | 30,0 M | 13,4 M | 1,5 M | **15,1 M** | 13,4 M/év |
| **Ajánlott hibrid** | 29,7 M | 3,4 M | 1,8 M | **24,5 M** | nincs |

Három ellentmondásos, de a számokból következő megállapítás:

1. **Az alkalmazott a 3. évben rontja az eredményt** (20,6 → 15,1 M), pedig
   az árbevételt 38%-kal növeli. A fix bér gyorsabban nő, mint a fedezet.
2. **A senior alvállalkozó szinte semmit nem hoz** (20,6 → 20,0 M). Ha a te
   valós óradíjad 28 000 Ft, és a szabadúszó tanácsadó 20 000 Ft-ot kér, a
   rés 8 000 Ft/óra — ebből a szervezési többletmunka is elmegy.
3. **Az olcsó ops-alvállalkozó viszont működik** (20,6 → 24,4 M): 10 000
   Ft/órás koordinációs munkára adod ki a kampány-ops, emlékeztető,
   riport-előkészítés részt, ami programonként ~17 óra. A rés itt 18 000
   Ft/óra, és a felszabadult idő sales-be megy.

### 9.4 Mikor éri meg alkalmazott?

**Medior tanácsadó.** A megtérülési küszöb 475 valós teljesítési óra ≈ **43%
kihasználtság**. Ez papíron elérhető — de a megtérülés nem elég: ahhoz, hogy
az alkalmazott ne rontsa a szóló eredményt, **~36 M Ft árbevétel kell**
(20,6 M szóló eredmény + 13,4 M bér + 1,5 M egyéb). Az 22 program/év. A
3. évben ez nem reális.

> **Az első teljesítő alkalmazott ~35–40 M Ft éves árbevételnél indokolt —
> ez a 4. év, nem a 3.**

**Junior ops alkalmazott.** A fordulópont a szabadúszóhoz képest **671
ops-óra/év ≈ 39 program/év**. Ez alatt a szabadúszó olcsóbb, mert nem
fizetsz üresjáratot. Ugyanaz a következtetés: 4. év.

**Általános szabály ebben a fázisban: változó költség a fix előtt.** Egy
±40%-os árazási bizonytalanságú vállalkozásban (a rate card kódban is
PLACEHOLDER) a fix bér a rossz eszköz — az alvállalkozó azonnal
visszafordítható, a munkaviszony nem.

### 9.5 Partner-tanácsadói csatorna (ORG_CONSULTANT)

Ez a modell más jellegű: a partner a **saját ügyfelét** hozza, te a
platformot, a módszertant, a riport-sablonokat és a minőségbiztosítást adod.
A kód ezt már támogatja (`assign_consultant`, admin-paritású hozzáférés,
„Tanácsadó" badge, kizárva a létszám/seat/átlagszámításokból).

Árazás-javaslat: **hibrid** — 400 000 Ft/év platform-licenc + 15%
bevétel-részesedés.

| | Bevétel | A te időd | Ft/óra |
|---|---|---|---|
| 2. év — 2 pilot partner | 2,1 M | ~400 h (onboarding + 250 h fejlesztés) | 5 200 |
| 3. év — 6 partner, 30 program | 9,2 M | ~470 h | 19 600 |
| 4–5. év — 15 partner, 90 program | ~27,6 M | ~700 h | 39 400 |

**A 3. évben ez nagyjából nullszaldós** a saját teljesítéshez képest: a 470
órát ha a teljesítésből veszed el, ~13,3 M Ft saját árbevételt adsz fel 9,2
M Ft partner-bevételért. A csatorna értéke **nem a 3. évi szám, hanem az,
hogy ez az egyetlen modell, aminek nincs személyes órakorlátja** — a 4–5.
évtől veri a saját teljesítést, és nem lineárisan nő tovább.

Ezért: **a 3. évben magvetés (2–3 partner), nem növekedési motor.** A
fejlesztési időt viszont már a 2. évtől ide kell allokálni, mert a
partner-onboarding, a módszertani képzés és a riport-QA folyamat nem
készül el magától.

### 9.6 A leggyorsabb megtérülés: ajánlói hálózat (nem alkalmazott)

Ha a valódi korlát a lead-generálás, a legjobb ár-érték arányú „bevont
ember" nem teljesít, hanem **ajánl**: HR-tanácsadók, coachok, könyvelők,
szervezetfejlesztők, akik a te célközönségedhez férnek hozzá.

- Ajánlói díj: a megkötött szerződés **10–15%-a**, csak sikerdíj.
- 4 extra program a 3. évben: +6,4 M Ft árbevétel, −0,9 M Ft díj →
  **+5,5 M Ft**, nulla fix költséggel és nulla kockázattal.

Ez az egyetlen tétel ebben a szakaszban, ami a tényleges szűk
keresztmetszetet támadja. **Ezzel kell kezdeni, nem a teljesítő emberrel.**

Fizetett értékesítő (part-time BD, bruttó 600 e Ft ≈ 8,9 M Ft/év) 6 extra
programnál térül meg — de konzultatív, még validálatlan módszertant
eladni képes embert jutalék-alapon felvenni nagyon nehéz. Ez is 4. év.

### 9.7 Két nem pénzügyi előfeltétel — ezek nélkül a fenti számok nem élnek

1. **A módszertan legyen átadható.** Amíg a riport-értelmezés és a vezetői
   debrief a fejedben van, nincs kit bevonni. A `docs/pilot/pilot-playbook.md`
   és a `riport-ertelmezesi-sablonok.md` ennek a magja — a pilot után ezt
   kell teljes, betanítható folyamattá zárni. **Ez a kemény kapu bármilyen
   bevonás előtt.**
2. **A hitelességi alapelv kockázatot is jelent.** A termék ígérete, hogy a
   becsült és a mért adat mindig meg van különböztetve; egy betanulatlan
   ember validált csapatriportot publikál vagy vezetői debriefet tart — ez
   márkakockázat, nem csak minőségi kérdés. A riport-QA (te írod alá) az
   első 1–2 évben nem delegálható.

### 9.8 Ajánlott sorrend

| Év | Lépés | Fix költség |
|---|---|---|
| **1.** | Szóló. Minden felszabaduló óra lead-generálásra. | 0 |
| **2.** | Ajánlói hálózat (sikerdíj) + olcsó ops-alvállalkozó ~150–250 órára. Módszertan dokumentálása. | 0 |
| **3.** | Ops-alvállalkozó felskálázva + 2–3 partner-tanácsadó magvetése. | 0 |
| **4.** | ~35–40 M Ft árbevételnél: első alkalmazott — **ops/koordinátor, nem tanácsadó**. | 6,7 M/év |
| **5.** | Partner-csatorna a fő növekedési motor; medior tanácsadó, ha a pipeline tartósan telített. | 13,4 M/év |

**Nettó hatás a 3 éves becslésre:** a bázis-eset 3. éve 20,6 M Ft adózás
előtti eredményről **~24,5 M Ft-ra** javul (+19%) a hibrid modellel — nulla
fix kötelezettség mellett. Alkalmazottal ugyanez **15,1 M Ft** lenne.
Az igazi nyereség nem a 3. évben látszik, hanem abban, hogy a 4. évet
tehermentesen és felépített partner-maggal kezded.

---

## 10. Egy mondatban

**A termék kész; a következő három év számát nem a kód, hanem az fogja
eldönteni, hány érdemi értékesítési beszélgetést tudsz elindítani.** Bázis-
esetben ez ~40 M Ft összes árbevétel három év alatt (1. év ~5, 2. év ~13,
3. év ~22 M Ft) — tisztes egyszemélyes tanácsadói vállalkozás, a 3. évben
nagyjából a szóló kapacitás plafonján. Az ennél nagyobb szám nem több
fejlesztésből, hanem az utánkövetés-arányból és a partner-tanácsadói
csatornából jön.
