# Feature Ideas

Validált ötletek, amik a backlogba kerültek. Minden bejegyzés tartalmazza a motivációt, a minimális scope-ot, és a szükséges előfeltételeket.

---

## 1. Csapaton belüli bizalmi háló — gyors 360° kör

**Státusz:** backlog
**Prioritás:** közepes-magas
**Előfeltétel:** működő campaign/feedback round infra (megvan)

### Motiváció

A jelenlegi csapatdinamika térkép a HEXACO személyiségprofil-eltérésekből **becsli** a potenciális súrlódási pontokat. Ez kutatásban megalapozott, de nem mért adat — nem veszi figyelembe a tényleges bizalmi szintet, együttműködési tapasztalatot, vagy kommunikációs mintákat.

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
