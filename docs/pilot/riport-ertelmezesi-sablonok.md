# Riport-értelmezési sablonok — tanácsadói útmutató

> Készült: 2026-07-20 · Frissítve: 2026-08-16 (Team Scan v1). A csapatriport (TeamReport) validálásához és a
> vezetői debriefhez. A riport szekciói a TeamReportView-t követik; a
> narratíva-prefill jó kiindulás, de a tanácsadói hozzáadott érték a
> KONTEXTUS: mit jelent ez ennél a csapatnál, ebben a helyzetben.

## 1. Alapelvek (minden riportnál)

- **Fejlesztő, nem minősítő nyelv.** A TRITAN-megjelenítés szándékosan
  deficit-mentes (pl. Stresszérzékenység, nem Szorongás) — a narratíva is
  maradjon ilyen. Nincs „gyenge tag", „problémás profil".
- **Forrás-transzparencia.** Ahol becslés fut (csapatszerep forrás-badge:
  becslés vs. kitöltött), a szövegben is jelezzük. Mért adat ≠ becsült adat.
- **Egyéni adat sosem kerül vezetői üzenetbe.** A riport csapatszintű;
  egyéni eredményről csak az érintett saját riportja beszél.
- **Minden megállapítás mellé akció.** Megfigyelés akció nélkül = zaj.
  A riport végén max 3 akció éljen — a több nem hajtódik végre.
- **A változékony réteg az első.** A baseline vezetői állítás elsődleges
  forrása a mért bizalmi háló és a pulse. A személyiség csapatkontextus és a
  későbbi összehasonlítás kontrollja, nem fejlesztési kimenet.
- **A vállalás célmutatót kap.** Legalább egy akció strukturált célja egyezzen
  a következő körben valóban újramért mutatóval.

## 2. TRITAN-dimenziók tanácsadói olvasata (csapat-szinten)

A hat dimenzió (T·R·I·T·A·N). Csapat-szinten két dolgot nézünk:
az **átlag elhelyezkedését** és a **szórást** (a heterogenitás gyakran
informatívabb, mint a szint).

| Dimenzió | Magas átlag jellemzően | Alacsony átlag jellemzően | Nagy szórásnál kérdezd |
|---|---|---|---|
| **Tempo / Társas energia** | pörgős meetingek, gyors kapcsolatépítés | csendesebb, írásos-aszinkron preferencia | „A hangosabbak viszik a szót a döntéseknél?" |
| **Rezonancia** (magasabb = érzelmileg hangoltabb) | erős empátia, feszültség-érzékenység | tárgyilagos, stressztűrő működés | „A feszültséget mindenki ugyanakkor veszi észre?" |
| **Integritás** | egyenes kommunikáció, alacsony politizálás | taktikusabb érdekérvényesítés | „A visszajelzés mindenkitől ugyanolyan őszinte?" |
| **Tervezettség** | struktúra, határidő-fegyelem, precizitás | rugalmasság, improvizáció | „A tervezők és improvizálók súrlódnak-e átadásoknál?" |
| **Alkalmazkodás** | konfliktuskerülés, türelem, harmónia | konfrontatívabb, kritikusabb él | „A harmónia nem nyom-e el jogos vitákat?" (kapcsold a pulse eredményhez!) |
| **Nyitottság** | ötletelés, újdonság-keresés | bevált módszerek, stabilitás | „Az újítók kapnak-e teret a stabilizálóktól?" |

Debrief-technika: dimenziónként max 1-2 mondat, és csak azt emeld ki, ami
a csapatmintázathoz vagy a vezető által hozott helyzethez kapcsolódik.
Hat dimenzió végigdarálása = elveszett hallgatóság.

## 3. Bizalmi háló, csapatmintázat és dinamika-térkép

- A rendszer a 16 értelmezési mintanév egyikét javasolja — ez
  **beszélgetésindító**, nem validált csapattípus vagy diagnózis. Kérdezd meg
  a vezetőt: „ráismersz?" Ha nem, az is adat.
- A Scan v1-ben a bizalmi háló **közvetlenül mért relációs evidencia**. Először
  a lefedettséget és a mért él-számot mondd ki; hubot vagy beágyazatlanságot
  csak a saját rater-küszöbe felett értelmezz.
- Az egyéni, irányított trust-válasz soha nem kerül a vezetői beszélgetésbe.
  A térkép nem személyértékelés: kapcsolódási mintát és elérési kockázatot
  mutat.
- A profil-alapú súrlódás/support továbbra is **becslés** és csak kiegészítő
  kontextus. Ne mosd össze a mért trust-éllel; a forrásbadge-et szóban is
  fordítsd le.
- Kérdezd: „hol nehéz segítséget kérni vagy kényes témát behozni?” — ne
  állítsd, hogy a háló önmagában konfliktust vagy bizalomhiányt bizonyít.

## 4. Csapatszerep-fejezet — csak külön kiegészítő körnél

Értelmezési sorrend a debriefen:

1. **Lefedettség**: X/Y tag valódi kitöltéssel — a maradék becslés.
2. **Hiányzó szerepek**: melyik szerepre nincs erős jelölt → tipikus
   következmény-kérdés (pl. nincs Serkentő → „ki tartja a tempót nyomás
   alatt?"; nincs Elnök/Koordinátor → „ki integrálja a szálakat?").
3. **Túlreprezentált szerepek**: 3+ azonos erős szerep → rivalizálás vagy
   vakfolt (mindenki ugyanazt csinálná).
4. **Szerep vs. betöltött pozíció** feszültségei: akinek a mért szerepe és
   a napi feladata elcsúszik, ott gyakran motivációs téma van — ezt
   óvatosan, egyéni adat kiteregetése nélkül, mintázat-szinten hozd szóba.

## 4/b. Önkép vs. csapatkép — csak külön peer-kiegészítőnél

A csapatszerep-fejezet peer-rétege (csapattársi szerep-visszajelzés,
n ≥ 3 értékelő) a debrief legerősebb beszélgetésindítója: MÉRT eltérés az
önkép és a csapatkép között. Így vezesd:

1. **Először az egyezés.** Ahol a top 3 self és peer oldalon közös, azt
   mondd ki elsőnek — „a csapat ugyanazt látja, amit te" a legerősebb
   megerősítés, és megágyaz az eltérések fogadásának.
2. **Az eltérés nem hiba, hanem információ.** A „csak önkép" szerep
   (self-only) tipikus olvasata: a szándék megvan, de a viselkedés nem
   látszik ki — mi takarja el? A „csak csapatkép" szerep (peer-only):
   olyan hozzájárulás, amit az érintett magától értetődőnek vesz, a
   csapat viszont értékként lát — nevezd meg, ez azonnali megbecsülés.
3. **Kérdés-nyelv, nem ítélet-nyelv.** „A csapat mástól várja a
   koordinációt, mint amit te magadról gondolsz — mit gondolsz, miben
   látnak mást?" A választ az érintett adja, nem a riport.
4. **Egyéni delta csak a debrief-beszélgetésben** — a validált riport
   csapatszintű marad (terv-döntés: `team-role-360-plan.md` 6. pont).
   Vezetői üzenetbe egyéni önkép–csapatkép eltérés nem kerül.
5. **Vezetői önkép-eltérésnél** (a vezető saját deltája) használd a
   4 csapda keretét (ld. 5/b): a self-only szerep gyakran szó–tett rés
   jelzés — a vezető hirdeti a szerepet, a csapat nem tapasztalja;
   a defenzív első reakció pedig maga az érzelmi reaktivitás csapdája,
   érdemes előre keretezni („az eltérés a mérés értéke, nem kritika").

Halo/szépítés-gyanú: ha egy tagnál minden rater közel azonos, széles
profilt jelölt (a kiválasztás-kényszer ellenére), az aggregátum lapos
lesz — ilyenkor a top 3 kevésbé éles, ezt mondd ki, ne told túl az
értelmezést.

## 5. Pszichológiai biztonság index — sávok és akciók

Az index 0–100, csak n ≥ 3 válasznál létezik. Sávok: **alacsony < 55 ≤
közepes < 75 ≤ magas**. A riport itemenkénti területi bontást és gyenge
területeket (itemátlag < 3,4 ≈ 60/100, max 3) is ad, területenkénti
akciójavaslattal.

Így add elő:

- **Magas (≥75)**: erősség — nevezd meg és kösd a csapat működéséhez.
  Akció: tartsák meg a gyakorlatokat, amik ezt adják (kérdezd meg, mik azok).
- **Közepes (55–74)**: normál működési sáv — a gyenge TERÜLETEKRE menj rá,
  ne az összpontszámra.
- **Alacsony (<55)**: óvatosan és négyszemközt a vezetővel először. Itt a
  debrief hangsúlya: ez nem ítélet, hanem kiindulópont; a területet a
  következő pulse-körben újramérjük.
- **Szórás ≥ 20**: megosztottság — a csapat egyik fele másképp éli meg.
  Ilyenkor az átlag félrevezet; mondd ki, hogy a kép nem egységes.
- A platform akciójavaslatai területenként (pl. tanulság-fókuszú
  hibamegbeszélés, „elakadás"-kör, disagree-and-commit) — a debriefen
  ezekből VÁLASSZATOK, a vezető mondja ki, melyiket vállalja.

A sávok és az itemküszöbök értelmezési keretek, nem normacsoport-percentilisek.
A visszaméréskor csak a platform mérési-hiba kapuján túli index- vagy
itemmozgást nevezz változásnak; a kapun belüli eltérés nem javulás és nem
romlás. Kontrollcsoport nélkül még a kapun túli mozgás sem bizonyítja, hogy az
akció okozta.

Anonimitás-szabály a beszélgetésben: soha ne találgassátok, „ki húzhatta
le" — ha a vezető elkezdi, állítsd le; ez maga a pszichológiai biztonság
teszthelyzete.

## 5/b. Vezetői akciókártyák — a 4 csapda kerete

A riport a gyenge pulse-területek mellé vezetői akciókártyákat is ad
(`psych-safety.ts` → `PSYCH_SAFETY_LEADER_TRAPS`). Keret-forrás: Brady–
Kliman–Smith: *4 Hidden Traps of Team Dynamics* (HBR, 2026. július) —
négy vezetői csapda, hat ellenszer, a Trita saját adaptációjában:

| Csapda | Tipikus tünet (pulse-terület) | Ellenszer |
|---|---|---|
| **Érzelmi reaktivitás** | kényes témák (PS1), nyílt egyet-nem-értés (PS8) | szünet a reakció előtt + visszatérés a tisztelethez |
| **Bizonyosság-csapda** | eltérő gondolkodás (PS4), új ötletek kockázata (PS5) | teljes kép megismerése („mit nem látok?") + közös felelősség |
| **Szó–tett rés** | hibázás kezelése (PS2), aláásás (PS6) | konzisztencia: az ígért normát az első éles helyzetben tettel hitelesíteni |
| **Önigazolás** | segítségkérés (PS3), hibázás kezelése (PS2) | őszinte kommunikáció, a vezető saját bizonytalanságával kezdve |

Debrief-használat:

- A kártya a vezetőnek szól, ezért **négyszemközt** kerüljön elő, ne a
  csapat előtt — a csapatriportban tünet-szinten (gyenge terület +
  területi akció) marad a téma.
- A felvezetés kerete: „ez nem diagnózis rólad, hanem tipikus mintázat,
  amit ilyen pulse-képnél érdemes ellenőrizni — ráismersz-e?" A
  „ráismersz?" kérdés itt is beszélgetésindító, mint a csapatmintázatnál.
- A vezető VÁLASSZON egyet: melyik ellenszert vállalja megfigyelhető
  viselkedésként a következő 30 napra — ez bekerülhet a 3 akció közé.
- Az önkép vs. csapatkép vezetői deltájával összekapcsolható (4/b 5. pont):
  a két jelzés együtt sokkal meggyőzőbb, mint külön-külön.

## 6. Narratíva-sablon (a riport szerkesztett szövegéhez)

A prefill ad vázat; a végleges narratíva szerkezete:

```
1. Összkép (3-4 mondat)
   – Mit mértünk, mekkora részvétellel (self X/N, trust X/N és mért
     él-lefedettség, pulse n).
   – A csapat egy mondatban, elsődlegesen mért trust/pulse jellel; a
     mintázat csak értelmezési keret.

2. Erősségek (2-3 pont)
   – Mindig mért adatra hivatkozva („a trust-háló lefedettsége magas, és a
     segítségkérés pulse-itemje sem gyenge").

3. Figyelmi pontok (max 3)
   – Kockázat-nyelv helyett kérdés-nyelv („érdemes ránézni…").
   – Pulse gyenge területei ide, területi akcióval.
   – Becslés-alapú jelzésnél a forrás kimondva.

4. 30 napos akciók (pontosan 3)
   – Konkrét, megfigyelhető, felelőssel („kéthetente 15 perces tanulság-kör
     a sprint-záráson — felelős: csapatvezető").
   – Legalább egyhez strukturált targetMetric és kiinduló érték.

5. Következő mérés
   – Mikor ismételjük a Scan v1 változékony rétegeit, és milyen
     kompozícióváltozást kell addig figyelni.
```

## 7. Vezetői debrief forgatókönyv (90 perc)

1. (5') Keretezés: mire jó a riport, mire nem (nem teljesítményértékelés).
2. (10') A vezető hipotézisei ELŐBB: „mit vársz, mit fog mutatni?" —
   a későbbi aha-élmények horgonya.
3. (25') Riport végigjárása a 6. pont szerkezetében — összkép → erősségek
   → figyelmi pontok.
4. (15') Mért trust-háló: lefedettség, elérési minták, anonimitási korlát.
5. (15') Pulse-blokk (az 5. pont szabályaival).
6. (15') Akció-választás: a javaslatokból 1–3 vállalás, felelőssel,
   dátummal. Ez kerül a riport véglegesített akció-szekciójába.
   Legalább egy kapjon célmutatót.
7. (5') Publikálás-egyeztetés: mit lát a csapat, mikor, milyen
   felvezetéssel (sablon: `ugyfel-kommunikacio.md` 7. üzenet) + a
   csapat-ismertető alkalom időpontja.
8. (5') Következő lépés + visszajelzés a folyamatra (roadmap-input).

Debrief után 24 órán belül: írásos összefoglaló a vezetőnek (akciók +
határidők). 48 órán belül az esetnapló workshop- és akcióblokkja is lezárul;
ez lesz a kísérés és a későbbi playbook referenciája.
