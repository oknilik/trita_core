# Csapatkép-kapuzás és tanácsadói validálás — terv

> Dátum: 2026-07-10 · Státusz: F1 implementálás alatt, F2-F3 tervezett
> Jóváhagyott döntések a termékgazdától (lásd lent).

## Alapelv

A csapat-szintű eredmények a gyűjtés alatt SENKINEK nem láthatók a
tanácsadón kívül. A managerek/org adminok/tagok csak a haladást látják.
A teljes csapatképet a tanácsadó validálja (személyes interjúk tanulságaival
kiegészítve), és publikálás után is csak AGGREGÁLT szinten látható.

Indoklás: (1) a kitöltői őszinteség — a tag tudja, hogy egyéni profilját a
vezetője soha nem látja; (2) félreértelmezés-védelem — részleges adatból ne
vonjon le következtetést a manager; (3) a tanácsadói érték termékesítése —
a validált kép a deliverable.

## Jóváhagyott döntések

1. Mindenki látja a SAJÁT egyéni eredményét (self + observer-összevetés) — változatlan.
2. A tanácsadó (ORG_CONSULTANT) lát minden egyéni és páros szintű csapatadatot.
3. Org tagok / managerek / adminok: csak aggregált kép, és csak tanácsadói
   véglegesítés (publikálás) UTÁN.
4. Manager cockpit gyűjtés közben: progress + teendők.
5. Kampány-menedzsment (indítás, emlékeztetők) marad manager-jog; csak az
   eredmény kapuzott.
6. A kapu a MEGLÉVŐ szervezetekre is azonnal érvényes.
7. Belső (nem publikálódó) tanácsadói jegyzet kell (F2).
8. A trita admin minden meglévő orghoz tanácsadóként hozzárendelendő
   (script: `scripts/assign-consultants.ts`).

## Láthatósági mátrix

| Nézet | Tag | Manager / Org admin | Tanácsadó |
|---|---|---|---|
| Saját eredmény + observer-összevetés | ✅ | ✅ (sajátja) | ✅ |
| Csapat-progress (ki végzett, kitöltöttség%, emlékeztető) | ✅ | ✅ | ✅ |
| Élő egyéni/páros csapatadat (heatmap-sorok, TeamMap, szerep-mátrix, dinamika, pattern) | ❌ | ❌ soha | ✅ |
| Publikált csapatkép (aggregált + narratíva) | ✅ | ✅ | ✅ |

Aggregátum-minimum: 3 kitöltés alatt aggregált adat sem jelenik meg
(MIN_INTELLIGENCE_ASSESSMENTS) — kis csapatnál az átlag visszafejthető.

## F1 — Láthatósági kapu (séma-módosítás nélkül) ← MOST

- `canViewRawTeamResults(orgRole)` helper (`src/lib/team-auth.ts`):
  csak `ORG_CONSULTANT`. A trita admin a consultant-hozzárendelésen
  keresztül lát (8. döntés) — nincs külön platform-admin kiskapu.
- `/team/[id]`: intelligence/profile/teamRole tabok nem-tanácsadónak
  szerver-oldali redirect → overview; az overview eredmény-blokkjai
  (TeamPatternCard, profil-link) helyett „validálás alatt" státuszkártya.
  A members tab marad (csak kitöltöttség-státuszt mutat, score-t nem).
- Org oldal: tritanAvg (élő aggregátum) nem-tanácsadónak rejtve.
- Manager cockpit: súrlódás/hasonlóság chipek és attention-elem ki
  (eredmény-derivált); marad a progress + események.
- Nav: manager „Riportok" linkek ?tab=profile → ?tab=overview (F2-ben a
  publikált riportra mutatnak majd).

## F2 — TeamReport modell + publikálás (séma-módosítás!)

- `TeamReport`: teamId, status DRAFT|PUBLISHED, publishedAt/ById,
  `aggregates` JSON (publikáláskor BEFAGYASZTOTT aggregátumok — a validált
  kép nem csúszhat el utólagos adatváltozástól), narratíva-szekciók
  (összefoglaló, erősségek, kockázatok, ajánlások, interjú-tanulságok),
  `internalNotes` (csak tanácsadó látja, nem publikálódik).
- Tanácsadói szerkesztő a team oldalon: aggregát-előnézet + narratíva +
  publish; több riport = idősor.
- Manager/admin/tag riport-nézet; „riport publikálva" notification.

## F3 — Finomítás

- PDF-export a publikált riportból (workshop-artefakt).
- Riport-verziók összehasonlítása (trend).
- Org-szintű kapcsoló a kapura (self-serve opció jövőre).

## Ismert következmények

- A tagok egymás adatait sem látják többé a team oldalon (eddig látták!).
- A manager „Riportok" nav F1-ben progress-re mutat; érdemi riport F2-től.
- e2e team-intelligence tesztek tanácsadói szerepet igényelnek majd.
