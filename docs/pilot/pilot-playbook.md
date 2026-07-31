# Trita pilot — tanácsadói playbook

> Készült: 2026-07-20 · E1 tétel (pilot onboarding csomag) · Párja:
> `kampany-utemterv.md`, `riport-ertelmezesi-sablonok.md`, `ugyfel-kommunikacio.md`
>
> Keret: 1–2 szervezet, 20–30 fő összesen · 2026. szeptember–november (3 hónap)
> · heti ~10 óra tanácsadói kapacitás · go/no-go: aug. 20. · indulás: szept. 1.

## 1. Mit ígértünk a pilot-partnernek (a /pilot oldal alapján)

Ezek a platformon publikált vállalások — a playbook minden alkalma ezekhez
rendel konkrét teljesítést:

1. **Teljes platform-hozzáférés** a pilot idejére (org-aktiválás adminból).
2. **Személyes bevezető alkalom** → Kickoff workshop (3. szakasz).
3. **Observer-kör vezetői értelmezéssel** → Riport-debrief alkalom.
4. **Beleszólás a fejlesztési irányokba** → visszajelzés-csatorna + záró interjú.
5. **Korai hozzáférés az új mérésekhez** → csapatszerep-kör + pszichológiai
   biztonság pulse (mindkettő élesben része a kampánynak).
6. **Korai partner státusz** → kiemelt feltételek a pilot után (ár a záró
   szakaszban derül ki — price discovery).

## 2. Sikerkritériumok (mit mérünk a pilot végén)

A pilot akkor sikeres, ha november végén ezekre igen a válasz:

| # | Kritérium | Célérték | Forrás |
|---|---|---|---|
| S1 | Önértékelés-kitöltési arány | ≥ 85% a meghívott tagokból | kampány-statok |
| S2 | Observer-visszajelzés lefedettség | ≥ 60% a kitöltőknél van ≥1 observer | kampány-statok |
| S3 | Csapatszerep valódi kitöltés | ≥ 70% (becslés helyett kérdőív) | forrás-badge arány |
| S4 | Pulse-részvétel | minden csapatnál n ≥ 3 (küszöb felett) | pulse-index blokk |
| S5 | Publikált csapatriport | minden pilot-csapatnak 1 validált riport | TeamReport PUBLISHED |
| S6 | Vezetői debrief megtartva | csapatonként 1 alkalom + 30 napos akciólista | jegyzőkönyv |
| S7 | Fizetési hajlandóság | legalább 1 org kimondott ársávval menne tovább | záró interjú |
| S8 | Ajánlás | testimonial vagy referencia-hozzájárulás | záró interjú |
| S9 | Karrier-háttér megadva | ≥ 60% a kitöltőkből megadta a jelenlegi munkáját | `careerBackground.currentOccupationId` |

S7–S8 az üzleti cél: a pilot elsődleges outputja a **validált ár és a
referencia**, nem a feature-lista.

S9 a **kutatási** cél: a karrier-motor known-groups validációja (F3) jelenleg
n=0-n áll, mert a „jelenlegi munkád" mező az eredmény-oldal alján, passzívan
ül — aki megnézi az eredményét, jellemzően nem görget odáig. Ez az egyetlen
adatforrás, amiből kijön, hogy a motor mér-e valamit; ha a pilot alatt sem
gyűlik, a validációs fejezet a pilot UTÁN is üres marad. Ezért lett explicit
lépés, nem remény. (Csak a bekapcsolt karrier-modulú szervezeteknél
értelmezett.)

## 3. Idővonal — szereposztással

A platform a lépéseket **felhasználónként, sorban** nyitja (személyiség →
csapatszerep → pulse), tehát a naptár a *kampány-szintű* ritmust adja; az
egyéni haladást a platform kezeli értesítésekkel. Részletes ops-teendők:
`kampany-utemterv.md`.

### T–2 hét (aug. 17–30.) — szerződés + setup

- Pilot-megállapodás aláírva (adatkezelési melléklet az ügyvédi kör után).
- Org létrehozva + aktiválva, csapatok felvéve, tanácsadó hozzárendelve.
- **Kapcsolattartói adatlap** bekérve: csapatnévsor (név + email), csapatokra
  bontás, a vezető(k) megjelölve. Cégadatok az admin billing-blokkba.
- Dry run a belső teszt-szervezettel (E2) — ezen a playbook is próbát fut.

### 1. hét (szept. 1–5.) — Kickoff workshop (60–75 perc, online vagy helyszíni)

Forgatókönyv:

1. (10') Miért csináljuk — a vezető mondja el a saját szavaival (előtte
   egyeztetve). Kulcsüzenet: fejlesztés, nem értékelés.
2. (15') Mit mér a Trita — TRITAN hat dimenziója köznyelven, a három
   mérés-lépés bemutatása (önértékelés ~10 perc · csapatszerep-kérdőív ·
   névtelen biztonság-pulse ~2 perc).
3. (10') Adatkezelés és bizalom — ki mit lát: a tag a saját riportját, a
   vezető/tanácsadó validált csapatképet, a pulse teljesen névtelen (3 fő
   alatt eredmény sincs). Ez a rész nem kihagyható — a részvételi arány
   ezen múlik.
4. (10') Élő demó — belépés, kitöltő felület, saját riport.
5. (10') Menetrend + kérdések — mikor mi nyílik, meddig tart.
6. Zárás: a kampány még aznap aktiválva → mindenki megkapja az első lépést.

### 2–3. hét — önértékelés + observer-kör

- Cél: S1 (85%) a 2. hét végére. Emlékeztető-politika az ütemtervben.
- Observer-meghívók bátorítása: tagonként max 5 aktív meghívó, a link 30
  napig él, a kitöltéshez nem kell regisztráció.
- **Karrier-háttér (S9)** — ahol a karrier-modul be van kapcsolva: az
  eredmény-visszajelzésnél a tanácsadó kérje meg a tagokat, hogy az
  eredmény-oldal karrier-blokkjában adják meg a **jelenlegi munkájukat**
  (kereső mező, egy kattintás). Mondható indoklás: „ettől tudjuk megmondani,
  hogy a javaslat mennyire találó — és a te listád is pontosabb lesz." Az
  adat kutatási célra a known-groups elemzésbe megy, a tag felé nem jelenik
  meg értékelésként.
- Tanácsadói teendő: heti kitöltöttség-riport a kapcsolattartónak (2 mondat).

### 4–5. hét — csapatszerep-kör

- Akinél lement az önértékelés, annak magától megnyílt — a kampány-oldalon
  látszik, ki hol tart; lemaradóknak célzott emlékeztető.
- Cél: S3 (70% valódi kitöltés), hogy a riport szerep-fejezete mért adatra
  épüljön, ne TRITAN-becslésre.

### 5–6. hét — pszichológiai biztonság pulse

- 8 állítás, ~2 perc, névtelen. Vezetői üzenetben hangsúlyozni: pont attól
  értékes, hogy őszinte — senki válasza nem visszakereshető.
- Cél: S4 — minden csapatnál n ≥ 3.

### 6–7. hét — riport-validálás + vezetői debrief (90 perc)

- Tanácsadó: kampány zárása → riport-vázlat áttekintése (a platform
  prefillel segít: kockázat-pontok, gyenge pulse-területek, 30 napos
  akciójavaslatok) → szerkesztés → **publikálás** (az aggregátum befagy).
- Debrief a vezetővel a `riport-ertelmezesi-sablonok.md` forgatókönyve
  szerint; kimenet: **3 tételes, 30 napos akciólista** felelőssel.
- Opció: csapat-szintű eredményismertető (30') a tagoknak — a publikált
  riport tartalmával, egyéni adatok nélkül.

### 8–11. hét — kísérés + akciókövetés

- Kéthetente 30 perc a vezetővel: hol tart a 3 akció, mi változott.
- Heti 10 órás keretből ez ~2-3 óra/org; a maradék support + bugfix.
- Új belépőknél: utólagos résztvevő-hozzáadás a kampányhoz (a platform
  fast-forwardol, ha van már self-eredmény).

### 12. hét (nov. vége) — záró alkalom + price discovery

1. (20') Eredmény-összefoglaló: mit mértünk, mi változott (ha volt második
   pulse-kör: index-delta).
2. (20') **Price discovery interjú** — külön beszélgetés a döntéshozóval:
   - „Mi volt a legértékesebb elem?" (rangsoroltatva: egyéni riport /
     csapatkép / pulse / tanácsadói kísérés)
   - „Ha ez a program jövőre folytatódik, milyen keretben tudnád elképzelni?"
     (nyitottan — NEM mi mondunk számot előbb)
   - Sávos ellenőrzés csak utána: „X Ft/fő/hó nagyságrend reális lenne?"
   - Mi hiányzott, mi volt felesleges (roadmap-input, 4. ígéret).
3. (10') Testimonial/referencia-kérés + folytatási ajánlat kerete (korai
   partner státusz: kiemelt feltételek).

## 4. Kockázatok és kezelésük

- **Alacsony részvétel** — leggyakoribb pilot-gyilkos. Ellenszer: a kickoffon
  a vezető (nem mi) kéri a részvételt; az emlékeztetőket a platform +
  célzott vezetői üzenet kombinálja; 2. hét végén 70% alatt eszkaláció a
  kapcsolattartóhoz.
- **Bizalmi deficit** („megfigyelnek minket") — a kickoff 3. pontja + a
  pulse anonimitás-garanciájának ismétlése minden kommunikációban. Soha nem
  mutatunk egyéni adatot vezetőnek.
- **Vezető nem ér rá** — a debrief a program kötelező eleme (a szerződésben
  is): nélküle nincs akciólista, és a pilot értéke nem demonstrálható.
- **Nyári csúszás az ügyfélnél** — az org-setup és a kickoff-időpont már
  augusztus elején legyen naptárban (a költségbecslés 4. kockázata).
- **Hiba élesben** — support-vállalás: munkanapon 24 órán belül reakció;
  hibabejelentés a kapcsolattartón keresztül egy csatornán (email).

## 5. A tanácsadó heti rutinja a pilot alatt (10 óra kerete)

| Tevékenység | Óra/hét |
|---|---|
| Kampány-követés, emlékeztetők, kitöltöttség-riport | 1–2 |
| Vezetői/csapat-alkalmak + felkészülés | 2–4 (hullámzó) |
| Riport-validálás, narratíva-írás (6–7. héten csúcsos) | 0–4 |
| Support + bugfix | 2–3 |
| Jegyzetek: mi akadt, mit kértek (roadmap-input) | 0,5 |
