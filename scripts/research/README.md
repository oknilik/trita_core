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

## stats.ts — közös segéd

Tiszta statisztikai függvények (mintavételi n−1 szórás, R type-7
percentilis, formázók) — csak a research-scriptek használják, a `src`
alatti motorokhoz nem tartozik.
