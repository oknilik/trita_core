# scripts/research — pilot-kalibrációs offline scriptek

A motor-audit P1 („módszertani") rétegének adatigényes tételeihez:
`docs/audits/motor-audit-2026-08-10.md` — az egyéni sávhatárok (40/70 és
35/65), a súrlódás-vágások (12/22) és a minta-küszöbök jelenleg
**kalibrálatlan priorok**; az audit „Javasolt sorrend" 3. pontja szerint a
pilot MÉRT adataival kell kalibrálni őket. Ezek a scriptek ahhoz adják az
eszközt — csak olvasnak, DB-t nem módosítanak.

## Futtatás

Repo-gyökérből, `DATABASE_URL`-lel (a scriptek maguk betöltik a
`.env.local` → `.env` fájlokat; a shell-env erősebb). Éles adatbázisra
mutató URL-lel is futtathatók (read-only), de az eredmény bizalmas —
a `--json` exportot ne commitold.

```bash
npx tsx scripts/research/norms-from-results.ts [--form=short|full] [--json <fájl>]
npx tsx scripts/research/friction-calibration.ts [--mutual-only] [--json <fájl>]
npx tsx scripts/research/norms-from-ipip-dataset.ts --download   # DB nem kell
```

Üres vagy kevés adatnál mindkét script értelmes üzenettel fut le (nem
hibázik); a mintaméretet mindig kiírják, `n < 30`-nál figyelmeztetnek —
ilyenkor a számok jelzésértékűek, élesíteni még nem szabad belőlük.

## norms-from-results.ts — pilot-normák

**Mikor:** a pilot önkitöltéseinek beérkezése után (normatáblához n ≥ 30 a
minimum-jelzés, megbízhatóhoz inkább 100+).

**Mit számol:** userenként a LEGUTOLSÓ self-eredményből (isSelfAssessment,
testType=TRITAN, törölt profil és vendégsor kizárva), csak teljes
6-dimenziós profilokra:

- dimenziónként n, átlag, mintavételi szórás (n−1), kvartilisek, decilisek;
- sáv-kihasználtság a két élő vágásrendszerre: 40/70
  (`dimension-utils.getDimensionTier`) és 35/65 (`profile-engine`
  pólus-küszöbök) — hány % esik low/mid/high sávba;
- `--form=short|full`: a score-JSON `form` pecsétje szerint szűr; pecsét
  nélküli örökség-soroknál a questionCount-heurisztika dönt (≥100 item =
  full, minden más short — a `career/person.ts` mintája).

**Kimenet:** ember-olvasható táblák stdout-ra + a `src/lib/norms.ts`
`ACTIVE_NORM_TABLE`-jébe illeszthető JSON-blokk (`version` =
`pilot-<futtatás dátuma>`, `source`, `n`, `dims{mean,sd}`). A blokk a
`NormTable` típussal annotált — ha a kontraktus bővül, a type-check jelez.

**Hová kerül az eredmény:** a JSON-blokkot KÉZZEL kell a
`src/lib/norms.ts` `ACTIVE_NORM_TABLE`-jébe emelni (review-val, nem
automatikusan); a tábla feltöltésével a percentilis-sorok maguktól
élesednek a felületen (`percentileForScore`). A sáv-kihasználtság tábla a
40/70-es és 35/65-ös határok felülvizsgálatának inputja (torz eloszlásnál
a sávok üresek/túlzsúfoltak — ez dönt az átvágásról).

## friction-calibration.ts — súrlódás-vágások mért trust-adattal

**Mikor:** az első TRUST_360 kör(ök) lezárása után, ha a mért pároknak
önkitöltésük is van.

**Mit számol:** minden mért trust-élre (TrustObservation →
`computeTrustNetwork`, körönként a legfrissebb megfigyelés nyer — a
`buildTeamTrustNetwork` dedupe-mintája; több csapatban mért párnál a
csapat-élek átlaga), ahol mindkét tagnak teljes self-profilja van,
kiszámolja a `calculatePairFriction`-t, majd:

1. trust-sávonként (erős/közepes/gyenge/szétkapcsolt) a friction-eloszlást
   (n, átlag, medián, kvartilisek);
2. konkordanciát a jelenlegi vágással (a határokat a
   `frictionToEdgeType`-ból deriválja, nem literálból) — elvárt megfelelés:
   erős↔aligned · közepes↔complementary · gyenge+szétkapcsolt↔friction —
   konfúziós mátrixszal;
3. javasolt új vágáspontokat: a szomszédos sáv-mediánok felezőpontjai
   (+ a javasolt vágás konkordanciája összevetésül). Ha a mediánok nem
   monotonok, vagy n < 30 pár, a script explicit figyelmeztet.

`--mutual-only`: csak a mindkét irányból mért (mutual) élek — zajosabb
egyoldalú élek nélküli, konzervatívabb kalibráció.

**Hová kerül az eredmény:** a vágáspont-módosítás EGYETLEN döntési pontja a
`src/lib/friction-model.ts` `frictionToEdgeType` — vele együtt frissítendő
a `tests/unit/team/friction-model.test.ts` sávhatár-tesztjei; a fogyasztók
(dinamika-térkép, dossier, interakció-motor) a modulból követik a változást.

## norms-from-ipip-dataset.ts — közelítő referencia az OpenPsychometrics IPIP–HEXACO-mintából

**Mi ez:** a TSFI itemjeinek forrás-pooljából (IPIP–HEXACO, ld.
`docs/product/tsfi-item-provenance.md`) az openpsychometrics.org nyilvános
nyers adatán (240 item, N≈22 ezer) számolt referencia-statisztika: a TSFI-be
átvett itemeket a csomag codebookja alapján (szövegegyeztetéssel) leképezi,
a kitöltőket a `src/lib/scoring.ts` motorjával (azonos POMP-formula,
importálva) pontozza a rövid (TSFI-S) és a teljes formára, majd
dimenziónként n/átlag/szórás/decilisek + VALÓDI Cronbach-α, átlagos
item-item korreláció és implikált SEM — a `psychometrics.ts` priorjai
(MEAN_ITEM_R=0.22, SCORE_SD=20 → SEM≈10.4 short) mellé állítva, továbbá
sáv-kihasználtság a két élő vágásrendszerre (40/70 és 35/65).

**FONTOS — termékdöntés (2026-08-11): a kimenet CSAK BELSŐ KALIBRÁCIÓS
REFERENCIA.** A kiírt NormTable-blokk (`version: "ipip-ref-<dátum>"`) NEM
kerülhet a `src/lib/norms.ts` `ACTIVE_NORM_TABLE`-jébe — oda kizárólag a
saját pilot normái valók (`norms-from-results.ts`). A minta korlátai:

- nemzetközi, ANGOL nyelvű kitöltés (a TSFI magyar fordításáról semmit nem
  mond), önszelektált online látogatók — se magyar, se ügyfél-populációs
  norma nem vezethető le belőle;
- a TSFI 8 kiegészítő itemje (social_self_esteem ×4, altruizmus ×4) nem az
  IPIP–HEXACO poolból jön, ezért nincs adata: az X (Extraverzió) dimenzió
  a 16-ból 12 itemmel (short: 10-ből 8-cal) közelített, az altruizmus-skála
  kimarad;
- a pontozott „TSFI-forma" itt a leképezett item-RÉSZHALMAZ — a valódi
  kitöltési szituáció (kérdéssorrend, magyar szöveg, kontextus) más.

Mire jó: α/SEM-priorok ellenőrzése mért adattal, a 40/70-es és 35/65-ös
sávhatárok kihasználtsági sanity-checkje, eloszlás-alak (decilisek) — a
pilot előtti nagyságrendi kalibrációhoz.

**Futtatás** (DB/DATABASE_URL nem kell; a nyers adat a gitignore-olt
`scripts/research/.data/` alá kerül, se zip, se CSV nem commitolható):

```bash
# 1) letöltés + kicsomagolás + teljes elemzés egyben (hálózat kell):
npx tsx scripts/research/norms-from-ipip-dataset.ts --download

# 2) vagy kézzel letöltött/kicsomagolt adatra:
npx tsx scripts/research/norms-from-ipip-dataset.ts \
  --csv scripts/research/.data/<mappa>/data.csv \
  [--codebook <fájl>] [--form=short|full|both] \
  [--json scripts/research/.data/ipip-reference-normtable.json]

# codebook-egyeztetés hibakeresése:
npx tsx scripts/research/norms-from-ipip-dataset.ts --csv ... --dump-codebook
```

Ha a letöltés nem megy (proxy/offline), a script kézi letöltési útmutatóval,
0-s kóddal lép ki. Minőség-szűrés: a csomag saját ellenőrzését alkalmazza,
ha van — a VCL-szókincs-ellenőrzést (VCL6/VCL9/VCL12 nem létező szavak = 1
→ kizárás) automatikusan; egyéb (validitás-, komolyság-) oszlopra a codebook
elolvasása után kézzel, **összehasonlító operátorral**:
`--screen <oszlop><op><érték>`, ahol `<op>` ∈ `>=` `<=` `!=` `>` `<` `=`
(a feltétel a MEGTARTOTT sorokra igaz; mindkét oldal szám → numerikus
összevetés, egyébként szöveges). Operátor azért kell, mert a validitás-item
nem feltétlenül 0/1: a HEXACO-csomagban a `V1`/`V2` („értem az instrukciót" /
„pontosan válaszoltam") **7-fokú Likert** — a ténylegesen alkalmazott szűrő
`--screen "V1>=5" --screen "V2>=5"` volt. A script a szűrő-jelölt oszlopokat
(`serious|attent|check|valid` nevűek + `V<szám>`) ki is listázza. Az
alkalmazott szűrőket a kimenet dokumentálja. Összefoglaló doksi (MÉRT
számokkal, 2026-08-11): `docs/research/ipip-reference-2026-08.md`.

## stats.ts — közös segéd

Tiszta statisztikai függvények (mintavételi n−1 szórás, R type-7
percentilis, formázók) — csak a research-scriptek használják, a `src`
alatti motorokhoz nem tartozik.
