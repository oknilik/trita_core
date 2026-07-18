# Feature Ideas

Validált ötletek, amik a backlogba kerültek. Minden bejegyzés tartalmazza a motivációt, a minimális scope-ot, és a szükséges előfeltételeket.

---

## 1. Csapaton belüli bizalmi háló — gyors 360° kör

**Státusz:** backlog
**Prioritás:** közepes-magas
**Előfeltétel:** működő campaign/feedback round infra (megvan)

### Motiváció

A jelenlegi csapatdinamika térkép a TRITAN személyiségprofil-eltérésekből **becsli** a potenciális súrlódási pontokat. Ez kutatásban megalapozott, de nem mért adat — nem veszi figyelembe a tényleges bizalmi szintet, együttműködési tapasztalatot, vagy kommunikációs mintákat.

Egy rövid, célzott 360°-os mikro-kérdőív valódi relációs adatot ad, ami:
- pontosítja a dynamics map edge típusait (becslés → mérés)
- lehetővé teszi a bizalmi háló időbeli változásának követését
- actionable insight-ot ad a csapatvezetőnek (ki kivel nem kommunikál elég?)

### Minimális scope

**Kérdőív:** 5-8 kérdés tagonként, minden csapattársról:
1. "Mennyire bízol X szakmai ítéletében?" (1-5)
2. "Milyen gyakran kérsz segítséget X-től?" (soha / ritkán / rendszeresen)
3. "Mennyire nyíltan tudsz kommunikálni X-szel?" (1-5)
4. "Ha fontos döntés előtt állsz, bevonnád-e X-et?" (igen / nem / attól függ)
5. "Hogyan jellemezéd a közös munkátokat?" (zökkenőmentes / működik / nehézkes)

**Kitöltési idő:** ~2-3 perc (N-1 csapattárs × 5 kérdés, ahol N a csapatméret)

**Output:**
- Páronkénti bizalmi score (0-100)
- Edge type: `strong_trust` / `moderate` / `weak_trust` / `disconnected`
- Hub felismerés: ki a csapat összekötője
- Izolált tag felismerés: ki nincs beágyazva

**Adatmodell (vázlat):**
```
TrustRound {
  id, teamId, createdAt, status (ACTIVE/CLOSED)
}

TrustResponse {
  id, roundId, fromUserId, toUserId,
  trustScore, helpFrequency, communicationOpenness,
  decisionInclusion, workQuality
}
```

### Kapcsolat a jelenlegi rendszerhez

- A campaign infra újrahasználható (ACTIVE/CLOSED lifecycle)
- A dynamics map vizualizáció megvan — csak az edge source-t kell cserélni `profile_estimate` → `trust_round`
- A profil-alapú becslés fallbackként megmarad ha nincs trust round adat

### Nem scope

- Nem helyettesíti a személyiségtesztet — kiegészíti
- Nem nyilvános (csapaton belüli, csak a vezető látja az aggregált képet)
- Nem egyéni visszajelzés — a dynamics map szintjén aggregált

---

## 2. Csapat szerep teszt (Csapatszerep) menedzselése és riportba foglalása

**Státusz:** backlog
**Prioritás:** magas
**Előfeltétel:** a Csapatszerep teszt kód megvan, a self-layer szinten kitölthető

### Jelenlegi állapot a kódban

A Csapatszerep teszt infrastruktúra implementált:
- **Kérdőív:** `src/lib/team-role-questions.ts` — 7 szekció × 8 állítás, pontelosztásos formátum
- **Scoring:** `src/lib/team-role-scoring.ts` — 9 Csapatszerep szerep (PL, RI, CO, SH, ME, TW, IM, CF, SP), top 3 kiválasztás
- **TRITAN becslés:** `src/lib/team-role-estimate.ts` — ha nincs kitöltött Csapatszerep teszt, TRITAN profilból becsül
- **Kitöltő felület:** `src/app/assessment/team-role/CsapatszerepClient.tsx` + `page.tsx`
- **Submit API:** `src/app/api/team-role/submit/route.ts`
- **Adatmodell:** `CsapatszerepAnswer` (válaszok) + `CsapatszerepScore` (eredmény, source: `questionnaire` | `estimate`)
- **Csapat nézet:** `src/components/team/TeamCsapatszerepSection.tsx` (492 sor) — szerep-eloszlás, heatmap, hiányzó/túlreprezentált szerepek, tag-szerep mátrix
- **Team intelligence-be bekötve:** a team page-en a Csapatszerep szekció renderelődik TRITAN becslésből

### Ami hiányzik

**1. Manager-vezérelt Csapatszerep kör indítás:**
A személyiségteszt kitöltés a self-layer-en történik (user saját maga tölti ki). A Csapatszerep tesztre viszont nincs campaign/round mechanizmus — a manager nem tud köröket indítani, emlékeztetőt küldeni, vagy nyomon követni a kitöltöttséget.

**2. Becslés vs. valódi kitöltés megkülönböztetése a riportban:**
Jelenleg a `TeamCsapatszerepSection` a TRITAN-ból becsült Csapatszerep szerepeket használja. A riportnak egyértelműen jeleznie kellene:
- ki töltötte ki ténylegesen a Csapatszerep tesztet (`source: "questionnaire"`)
- kinél fut becslésből (`source: "estimate"`)
- mekkora a lefedettség (X/Y tag valódi kitöltéssel)

**3. Egyéni Csapatszerep eredmény a személyes profilon:**
A self dashboard-on nincs Csapatszerep eredmény megjelenítés. A user kitölti a tesztet, de az eredményt csak a csapat nézetben látja (ha csapattag).

**4. PDF/export integrálás:**
A csapat riportba a Csapatszerep szerep-eloszlás nem kerül bele.

### Minimális scope

**Fázis A — Riport pontosítás (kis effort):**
- `TeamCsapatszerepSection` jelezze a source-t tagonként (becslés badge vs. kitöltött badge)
- Összesítő: "3/8 tag valódi kitöltéssel, 5 becslésből"
- A profil results oldalon jelenjen meg a saját Csapatszerep eredmény (top 3 szerep + leírás)

**Fázis B — Csapatszerep kör menedzselés (közepes effort):**
- Campaign-szerű lifecycle: manager indít Csapatszerep kitöltési kört
- Tagok kapnak értesítést / a dashboardon megjelenik a teendő
- Kitöltöttség tracking a team oldalon
- A journey engine felismeri a Csapatszerep köröt mint next-best-action

**Fázis C — Riport export (kis effort):**
- A csapat PDF-be bekerül a Csapatszerep szekció
- Szerep-eloszlás, hiányzó szerepek, erősségek

### Meglévő kód referencia

| Fájl | Méret | Funkció |
|------|-------|---------|
| `src/lib/team-role-scoring.ts` | 62 sor | 9 szerep scoring + `getTopRoles()` |
| `src/lib/team-role-estimate.ts` | 45 sor | TRITAN → Csapatszerep becslés mapping |
| `src/lib/team-role-questions.ts` | 137 sor | 7 szekció × 8 állítás kérdésbank |
| `src/app/assessment/team-role/` | 85 sor | Kitöltő UI + page |
| `src/app/api/team-role/submit/route.ts` | 54 sor | Submit + score mentés |
| `src/components/team/TeamCsapatszerepSection.tsx` | 492 sor | Csapat Csapatszerep vizualizáció |
| Prisma: `CsapatszerepAnswer`, `CsapatszerepScore` | — | Adatmodell kész |

### Nem scope

- Nem új kérdőív fejlesztés — a meglévő Csapatszerep teszt marad
- Nem módosítja a TRITAN becslés logikát — az fallback marad
- Nem ad egyéni coaching ajánlást — csak a szerep felismerés és csapat szintű eloszlás
