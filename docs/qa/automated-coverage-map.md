# Automata lefedettség-térkép

> Frissítve: 2026-08-05 · A manuális tesztkatalógus (`tests/manual/catalog/`)
> kísérő-doksija: rétegenként mutatja, mit fed ma az automata háló, hol
> nincs háló, és mi a legnagyobb hozamú következő automata teszt. Terület-
> térkép, nem fájl-leltár — a pontos fájl-hivatkozások a katalógus-esetek
> `coveredBy` mezőjében élnek. A katalógusban `full` = a manuális eset
> automata megfelelője létezik; `partial` = a mögöttes logika egy részét
> fedi teszt, a felület/integráció nem; `none` = semmilyen réteg nem fedi.

## Rétegenként: mit fed ma a háló

### Unit (node:test + tsx — `pnpm test:unit`)

| Terület | Mit fed |
|---|---|
| Journey engine | `resolveHome` összes fő ága (pending-join elsőbbség, szerep→home, member↛org loop-guard), stage-számítás, kontextus-levezetés (szerep→currentContext), guardrail- és progress-logika. Erős. |
| Policy / capabilities | Szerep × subscription-állapot capability-mátrix adat-vezérelten (E1), consultant admin-paritás, org-member PATCH authz + a cél-szerep enum consultant-kizárása, dossier-allowlist. Erős. A **LAST_ADMIN darabszám-ág nincs fedve**. |
| Navigáció | Szerepenkénti nav-modell (admin/manager/tag menük, analytics-kivezetés, tasks-badge, karrier-kapcsoló) — modell-szinten erős, renderelt fejléc nélkül. |
| Kampány-lépések | Tiszta lépés-logika: kanonikus sorrend, done-számítás, fresh-kör szabály, ütem-kapu (`isStepGateOpen`). Az API-életciklus (aktiválás/zárás mellékhatásai) unit-szinten nincs. |
| Csapat-intelligencia | Pattern-küszöb (<3 → null) és stabilitás, placement-kompozitok + confidence, evidencia-minőség, prioritás-motor, consultant-only raw-szabály. Jó. |
| Csapatszerep | Itembank (27 item), kijelölés-validálás, pontozás, peer min-3 anonimitás-küszöb, self-vs-peer top-3, mért>becsült precedencia. Erős. |
| Értesítések | Típus-meta teljesség, policy (minimum-szerep címzés), dedupe-kulcs viselkedés. A kibocsátási pontok (orchestrator-handlerek hívása) nem. |
| Subscription | Állapotgép (active/trialing/past_due → derived state), trialing aktív-szerű viselkedés. Jó. |
| Trust / pulze / riport | Bizalmi háló élek+küszöbök, pszich. biztonság aggregátum-küszöb és pontozás, riport-szerializálás (belső jegyzet-szűrés). Jó. |

### Client (vitest + testing-library — `pnpm test:client`)

| Terület | Mit fed |
|---|---|
| Kitöltő-flow-k | Assessment- és observer-kliens integrációs viselkedése, guest-teaser. |
| Akció-kapuk | Page-action gating (meghívó-, kampány-, jelölt-, export-gombok capability szerinti tiltása). |
| Eredmény-felület | Results-komponensek (interaction, share, karrier-belépő). |
| **Nincs fedve** | Join-kliensek (JoinClient/JoinOrgClient), org-váltó, manager cockpit, admin felület, kampány-wizard. |

### Integration (test-DB — `pnpm test:integration`)

| Terület | Mit fed |
|---|---|
| Acceptance / join | Team+org join happy path (szerep-átvétel, meghívó-fogyás), email-mismatch, already-member, org-mismatch, journey-handoff célok, restricted-ágak. Szerviz-szinten erős. |
| Jelölt (apply) | Létrehozás-jogosultság (role gate, idegen csapat), token-állapotok (invalid/expired/completed), draft-progress, idempotens submit, handoff. Jó — a csapatszerep-2.-lépés és a kitöltés-értesítés nincs. |
| Journey | Contract-tesztek (join-elsőbbség, obligation-precedencia, subscription-mátrix) + guardrail-integráció. |
| Observer | Link-szerviz, token-elfogadás, beküldés, eredmény-kapcsolás. |
| **Nincs fedve** | Kampány API-életciklus, admin org-access endpoint, LAST_ADMIN ág, org-context váltás, manager-cockpit adatréteg. |

### E2E (Playwright — `pnpm test:e2e`)

| Terület | Mit fed |
|---|---|
| Kitöltés | Self-assessment happy path + draft-megszakítás/folytatás az eredmény-kapuig. |
| Observer | Token-link → beküldés → perzisztencia, lejárt token, duplikált beadás. |
| Journey-belépők | Guest-handoff smoke (sign-in/up redirect-intent, védett route-ok, érvénytelen meghívó-token 404). |
| IA / nav | Kritikus admin- és manager-navigáció smoke. |
| Csapat-intelligencia | Vizuális regresszió: low-data (küszöb alatti) vs sufficient-data állapot. |
| **Nincs fedve** | Teljes org/team join böngésző-út, kampány-indítás→kitöltés-lánc, jelölt-út, admin org-access felület. |

## Fehér foltok (semmilyen réteg nem fedi)

Katalógus-esetre hivatkozva, kockázat szerint:

- **LAST_ADMIN-védelem** (ORG-10, ORG-11): a demote/remove darabszám-ág és
  a „consultant nem számít" szabály — jogosultsági invariáns, teszt nélkül.
- **Multi-org kontextus** (ORG-12, ORG-13): `org-context.ts` váltás,
  perzisztencia és öngyógyítás (elavult activeOrgId-fallback).
- **Manager cockpit** (TEAM-08…10): 0/1/2+ csapat redirect-szabályok
  (loop-guarddal) és a next-step prioritás-lánc (tag-hiány → kitöltés-hiány
  → futó kör → minden rendben).
- **Kampány API-életciklus** (CAMP-02, -03, -04, -07): DRAFT-szerkesztés
  ágai (TEAM_REQUIRED/INVALID_TEAM), DRAFT_CANNOT_CLOSE, aktiválás
  mellékhatásai (participant-init fast-forward, `teamRoleRoundActive`,
  notif-lánc), zárás. A tiszta lépés-logika fedett, a route-réteg nem.
- **Admin org-access** (ADMIN-01…07): `requireAdmin` kapu + mind a
  provisioning-akciók (activate/trial/extend/deactivate/set_credits,
  consultant assign/remove az ALREADY_MEMBER/USER_NOT_FOUND ágakkal) —
  a konzultációs modell egyetlen hozzáférés-adási útja.
- **Jelölt-mellékágak** (CAND-04, CAND-05): az opcionális csapatszerep-lépés
  state-gépe (NOT_ENABLED / MAIN_ASSESSMENT_MISSING / ALREADY_USED) és a
  `notifyCandidateCompleted` címzett-köre (consultant+admin igen, manager nem).
- **Ismert kód-rés**: a `CAMPAIGN_MILESTONE` értesítés-típus definiált
  (types/policy/panel), de **nincs kibocsátója** — vagy halott kód, vagy
  hiányzó feature; termék-döntést igényel (CAMP-06 megjegyzése).

## Legnagyobb hozamú következő automata tesztek

1. **Integration: LAST_ADMIN-mátrix** a `PATCH/DELETE
   /api/org/[id]/members/[userId]` route-on — utolsó admin demote/remove
   tiltás, consultant-jelenlét nem ment fel, második admin felold. Kicsi
   teszt, P1 jogosultsági invariánst zár (ORG-10/11).
2. **Integration: kampány-életciklus** a campaigns route-on — DRAFT edit →
   aktiválás (CAMPAIGN_NOT_DRAFT, fast-forward init, teamRoleRoundActive)
   → DRAFT_CANNOT_CLOSE → zárás mellékhatásai. A legösszetettebb üzleti
   gép, ma csak tiszta-logika unit fedi (CAMP-02…07).
3. **Integration: admin org-access endpoint** — requireAdmin 401 + a hét
   akció happy+hiba ágai. Az ügyfél-hozzáférés egyetlen írás-útja, hibája
   közvetlen ügyfél-kizárás (ADMIN-02…07).
4. **Unit/integration: manager-cockpit** — `getManagerCockpitData` +
   `/manager` redirect-szabályok (0/1/2+ csapat) és a next-step
   prioritás-sorrend négy ága (TEAM-08…10).
5. **Integration: jelölt-értesítés + szerep-lépés** — a
   `notifyCandidateCompleted` címzett-kör (consultant+admin, manager
   kizárva) és a candidate team-role route state-gépe (CAND-04/05).
