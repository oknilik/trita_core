# Sprint Impact Plan — 2026-04-08

> Cél: egy sprinten belül a legnagyobb üzleti és technikai kockázatcsökkentés.
> Forrás: elmúlt 5 nap commitjai + docs/changelog átnézés.

---

## 1) Mi van kész (stabil alapok)

### Billing platform rollout
- Stripe/Billingo integráció mélyen kiépítve (webhook modularizáció, metadata contract, retry/idempotency, correction policy).
- Org billing tab és profile invoice nézet bekerült.
- Custom Trita checkout form (Stripe Elements) él.
- Return/success fallback logikák bekerültek a webhook késés kezelésére.

Fő források:
- `docs/development/changelog/2026-04-03.md`
- `docs/development/changelog/2026-04-07.md`
- `docs/architecture/billing-*.md`

### Notification Hub V1.5
- Domain orchestrator + repository + policy réteg elkészült.
- Notification bell/panel UI, dedupe kulcs, source tracking és event trigger-ek nagy része kész.
- Architecture + type matrix dokumentáció elkészült.

Fő források:
- `docs/development/notification-hub-tasks.md`
- `docs/architecture/notification-architecture.md`
- `docs/architecture/notification-type-matrix.md`

### Team-role terminológia migráció
- A `src/` alatt a Belbin → csapatszerep átnevezés lefutott.
- Domain és UI elnevezések többsége konzisztens.

Fő forrás:
- `docs/development/changelog/2026-04-03.md`

---

## 2) Mi driftel / hol van töréskockázat

### D1 — Team intelligence truth drift (kritikus)
Jelenség:
- A changelog szerint volt profil-alapú pairwise dynamics irány (`2026-04-02`),
- a jelenlegi logika több helyen observer/campaign availability-re épít.

Kockázat:
- Nem egyértelmű a “truth model”: becslés vs observer-validated kapcsolat.
- UI copy és domain döntés elcsúszhat.

### D2 — Billing path komplexitás magas (magas)
Jelenség:
- Webhook + return + success mind végez szinkronizációs jellegű feladatokat.

Kockázat:
- Rejtett duplikáció, regresszió érzékenység.
- Nehéz reprodukálni edge case-t (webhook késik, return előbb fut).

### D3 — Notification hub test coverage hiány (magas)
Jelenség:
- `H3/H4` még nyitott a tasklist szerint (route integration, panel client tests).

Kockázat:
- UI/route regressziók csendben átcsúsznak.

### D4 — Docs konzisztencia gap (közepes)
Jelenség:
- Több terület gyorsan változott (billing, intelligence, notification), de nincs egyetlen “current truth snapshot” összefoglaló.

Kockázat:
- Onboarding és review lassul, félreértett implementációs irányok.

---

## 3) Következő 3 legnagyobb impact (1 sprint)

## I1 — Team Intelligence Contract Stabilization

### Cél
Egyetlen, explicit truth modell a csapatintelligenciához.

### Scope
1. Döntés és dokumentáció:
- observer-only,
- profile-estimate-only,
- vagy hybrid (ajánlott: hybrid, explicit evidence labellel).
2. Központi resolver:
- `resolveTeamDynamics()` (input: team members + observer data, output: typed view model + evidence).
3. UI state tightening:
- “no data” vs “observer exists but no internal links” vs “full map”.
4. Test pack:
- unit (resolver),
- integration (team page data),
- e2e smoke (`/team/[id]?tab=intelligence`).

### Acceptance
- Nincs párhuzamos dynamics döntés több helyen.
- A UI mindig ugyanabból a contractból dolgozik.
- 1 oldalon belül nem jelenik meg egymásnak ellentmondó állítás.

---

## I2 — Billing Reliability Hardening Sprint

### Cél
A fizetés utáni állapotkezelés determinisztikus és auditálható legyen.

### Scope
1. Központi post-payment sync service:
- return/success/webhook mind ezt használja.
2. Idempotency és replay flow egységesítése:
- event replay admin endpoint flow végigtesztelve.
3. Race-condition test matrix:
- webhook-before-return,
- return-before-webhook,
- duplicate webhook,
- partial failure + retry.
4. Monitoring baseline:
- standard trace mezők és minimális error dashboard query.

### Acceptance
- Ugyanarra a Stripe eseményre nincs duplikált domain side-effect.
- Return/success oldal nem tud eltérő truth state-et létrehozni.
- Race matrix automatizáltan fut integration szinten.

---

## I3 — Notification Hub Test Closure + UX Guardrail

### Cél
A V1.5 funkcionalitás regresszióállóvá tétele.

### Scope
1. H3/H4 lezárás:
- route integration tests,
- panel client tests.
2. Dedupe és read/dismiss flow edge case-ek:
- duplicate trigger,
- read-after-dismiss,
- multi-source same `sourceId`.
3. UX guardrail:
- üres állapot, loading, error fallback egységesítése.

### Acceptance
- A `docs/development/notification-hub-tasks.md` H3/H4 kipipálható.
- Notification regressziók legalább 80%-a unit+integration szinten fogható.
- Unread count és panel állapot konzisztens.

---

## 4) Sprint javasolt ütemezés

### Nap 1-2
- I1 decision + contract + resolver skeleton

### Nap 3-4
- I1 implementáció + tesztek + UI wiring

### Nap 5-6
- I2 central sync service + race matrix tesztek

### Nap 7
- I2 replay/idempotency hardening + trace ellenőrzés

### Nap 8-9
- I3 test closure + UX guardrail fixek

### Nap 10
- Stabilizáció, smoke pass, changelog és docs sync

---

## 5) Kimeneti artefaktok a sprint végén

- Team intelligence truth ADR frissítés (`docs/architecture/` alatt).
- Billing race matrix test report (`tests/integration/billing/*`).
- Notification hub test closure report.
- Rövid “current truth snapshot” doksi (billing + journey + intelligence + notifications).
