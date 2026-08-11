# Trita UX- és journey-átszabás — döntési dokumentum és megvalósítási terv

**Dátum:** 2026-08-12

**Ág:** `codex/ux-journey-simplification`

**Kiindulópont:** `origin/main` (`84867e5`)
**Státusz:** első megvalósítási szelet elkészült

## 1. Vezetői döntés

A Trita vizuális megújítás helyett journey-egyszerűsítést kap. A jelenlegi
designrendszer, tipográfia, színvilág, tokenek és felületi karakter megmarad.
A változtatások célja, hogy a felhasználó minden helyzetben értse:

1. hol tart;
2. miért fontos a következő lépés;
3. pontosan egy elsődleges teendőként mit kell most megtennie.

A termék következő fejlődési szakasza nem újabb insightblokkok hozzáadása,
hanem az insightig vezető út rövidítése és az insight utáni végrehajtás
megerősítése.

## 2. Nem változó alapelvek

- A meglévő Trita design tokeneket és UI-primitíveket használjuk.
- Nem vezetünk be új vizuális stílust vagy párhuzamos komponenskönyvtárat.
- A Fraunces + DM Sans tipográfiai hierarchia, a cream/ink/bronze/sage
  karakter és a jelenlegi felületi tónusok megmaradnak.
- A mérési validitást és a kérdések sorrendjét UX-okból nem módosítjuk.
- A szerepköri és adatvédelmi jogosultságokat nem lazítjuk.
- Minden új viselkedést magyar és angol szöveggel, billentyűzetes és mobil
  használatra is tervezünk.

## 3. Célállapot

### 3.1 Egyéni journey

```text
landing → vendégmérés → eredmény-előnézet → regisztráció
        → minimális aktiválás → azonnali eredmény
        → egy ajánlott következő lépés
        → opcionális profilgazdagítás / külső nézőpont / karrier
```

**Kulcsdöntés:** a már elkészült eredmény elé nem kerülhet kötelező
demográfiai adatfal. A vendégmérésből érkező felhasználó csak a megszólításhoz
szükséges nevet és az adatkezelési hozzájárulást adja meg. A születési év, nem,
ország és karrierháttér később, a profilban tölthető ki.

### 3.2 Csapat- és B2B journey

```text
csapat landing → rövid kapcsolatfelvétel → tanácsadói egyeztetés
              → program-setup → meghívás → egy közös teendőlista
              → részvétel követése → tanácsadói jóváhagyás
              → vezetői összefoglaló → workshop → akciókövetés
```

**Kulcsdöntés:** a publikus fejléc elsődleges CTA-ja követi a landing aktuális
módját. Egyéni módban a mérésre, csapatmódban a kapcsolatfelvételre visz.

### 3.3 Szerepköri cél-IA

| Szerep | Elsődleges navigáció |
|---|---|
| Egyéni felhasználó | Kezdőlap, Eredményeim, Teendők |
| Csapattag | Kezdőlap, Eredményeim, Teendők, Csapatom |
| Vezető | Teendők, Csapatok, Riportok |
| Tanácsadó | Ügyfelek, Ellenőrzésre vár, Workshopok, CRM |
| Platformadmin | Platform, Analitika, Beállítások |

Ez célállapot, nem egyetlen release-ben végrehajtandó navigációcsere.

## 4. Megvalósítási szakaszok

### Szelet 1 — konverziós töréspontok

- [x] külön ág az aktuális `origin/main` állapotából;
- [x] gyors aktiválás a vendégmérésből érkezőknek;
- [x] az onboarding API-ban opcionális demográfiai adatok;
- [x] sikeres claim után egyértelmű, eredményorientált aktiválási nézet;
- [x] csapatmódot követő publikus fejléc-CTA;
- [x] célzott unit- és client tesztek;
- [x] desktop és mobil vizuális ellenőrzés.

### Szelet 2 — egy következő lépés

- journey `recommendedNextAction` minden fő cockpit tetején;
- duplikált teendők eltávolítása a csapat-áttekintésből;
- „Feladataim” és helyi feladatkártyák felelősségi határának rögzítése;
- kampány-időzítési vezérlők áthelyezése beállítási kontextusba.

### Szelet 3 — csapatoldal és riport

- tanácsadói csapatfülek összevonása: Áttekintés / Emberek / Elemzések / Riport;
- mobil fülsor görgethetőségének látható jelzése;
- vezetői riport első képernyő: 3 erősség, 3 kockázat, 3 akció;
- belső dimenziókódok elrejtése az alapnézetből;
- „validált” helyett „tanácsadó által jóváhagyott”.

### Szelet 4 — végrehajtás és megtartás

- akciók felelőssel, határidővel és státusszal;
- workshop- és facilitátori nézet;
- 30/60/90 napos utánkövetés;
- mérési körök közötti változásnézet;
- vezetői heti összefoglaló és elakadásjelzés.

## 5. Szelet 1 elfogadási feltételei

### Vendégből regisztrált felhasználó

1. A teljes vendégmérés claimje változatlanul idempotens és veszteségmentes.
2. Sikeres claim után a felhasználó a gyors aktiválási nézetre érkezik.
3. A gyors nézeten csak a megszólítás és a hozzájárulás kötelező.
4. Születési év, nem, ország és karrierháttér nem blokkolja az eredményt.
5. Mentés után a journey közvetlenül a személyes eredményre visz.
6. Normál, mérés nélküli regisztrációnál a jelenlegi teljes onboarding marad.
7. Org-meghívás és tanácsadói flow viselkedése nem változik.

### Marketing CTA

1. Egyéni landingmódban a sticky CTA `/try` célú.
2. Csapat landingmódban a sticky CTA `/contact` célú.
3. A desktop és mobil fejléc azonos kontextust követ.
4. A landing statikus prerenderje és LCP-optimalizálása nem sérül.

## 6. Mérési terv

Az átszabás hatását az alábbi funnel eseményekkel kell mérni:

| Lépés | Fő mérőszám |
|---|---|
| Vendégmérés indítása | landing → try CTR |
| Vendégmérés befejezése | completion rate |
| Regisztráció | teaser → signup rate |
| Claim | sikeres claim arány |
| Gyors aktiválás | megnyitás → mentés arány és idő |
| Első eredmény | claim → result eljutási arány |
| Következő lépés | observer/team/career CTA aktiválás |
| B2B | team landing → contact conversion |

Az elsődleges eredménymutató a `claim siker → első eredmény megnyitása` arány.

## 7. Tesztstratégia

- unit: aktiválási mód és validáció;
- client: gyors és teljes onboarding render/submit;
- integration: onboarding API minimális és teljes payload;
- journey: guard és eredményhez irányítás;
- e2e smoke: vendégmérés → regisztráció → gyors aktiválás → eredmény;
- vizuális: 390 px mobil és 1280 px desktop, világos és sötét téma;
- quality gate: typecheck, lint, színtoken-ellenőrzés és új UI-hex guard.

## 8. Rollout és visszaállítás

A gyors aktiválás forrásparaméterhez kötött (`source=claim`), így csak a
vendégmérésből érkező út változik. Ha regresszió jelentkezik, a claim redirect
visszaállítható a normál `/onboarding` célra adatmodell-változás nélkül.

Az első szelet nem igényel Prisma-migrációt: a demográfiai mezők már most is
nullable mezők. Ez csökkenti a rollout és a rollback kockázatát.

## 9. Első szelet verifikációs eredménye

**Sikeres ellenőrzések:**

- TypeScript typecheck;
- sikeres optimalizált production build (102 statikus oldal generálva);
- a módosított fájlok célzott ESLint-ellenőrzése;
- színtoken- és új-hex guard;
- 967/967 unit teszt;
- 156/157 client teszt az első teljes futásban; az egyetlen, módosítástól
  független assessment-időzítési teszt önálló újrafuttatása 10/10 zöld;
- az új onboarding- és navigációtesztek 3/3 zöld;
- böngészős ellenőrzés világos/sötét rendszerkörnyezetben, desktopon és
  390×844-es mobil viewporton;
- a claim aktiválási submit eljut a `/profile/results` célra a korábbi
  Next Router hook-sorrend hiba nélkül.

**Környezeti korlátok:**

- a helyi fejlesztői adatbázis sémája lemaradt a friss `origin/main`
  Prisma-sémájától (`AnalyticsEvent`, `Deal`, `lifecycleEmailsOptOut` hiányzik),
  ezért az eredményoldal teljes adatfüggő renderje ezen a DB-n nem tekinthető
  release-verifikációnak;
- a teljes `pnpm check` a már jelen lévő, untracked `playwright-report/`
  generált JavaScript-fájljait is linteli. A saját változások célzott lintje
  tiszta; a felhasználói riportkönyvtárat nem módosítottuk és nem töröltük.
