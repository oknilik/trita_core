# Pilot 1. kör — dátumozott ütemterv (2026 ősz)

> Készült: 2026-07-24 · A `kampany-utemterv.md` (generikus ops-checklist)
> konkrét, naptárra fordított példánya az első éles körre.
> **Döntés (2026-07-24): kickoff a szeptember 7-i héten** — javasolt nap:
> **szeptember 8. (kedd)**.

## 0. Cél-szervezet

- [ ] **Cél-szervezet(ek) neve: _________________** — kijelölés határideje:
  **augusztus 7. (péntek)**. Jelöltek forrása: pilot-jelentkezések
  (/admin?tab=inquiries + pilot-apply leadek), meleg kapcsolatok.
- Ajánlott méret: 1 szervezet, 1–2 csapat, csapatonként 5–12 fő (a
  küszöbök miatt: peer-kép ≥3 értékelő, pulse n≥3).
- [ ] Kapcsolattartó + döntéshozó azonosítva; ajánlat/feltételek kiküldve:
  **augusztus 10–14. hete**.

## 1. Visszafelé számolt naptár

| Dátum | Mérföldkő | Forrás-checklist |
|---|---|---|
| júl 24 – aug 5 | Kézi QA lezárása + email-csatorna pilot-kész (Resend verify) | mai napi riport |
| aug 7 (P) | Cél-szervezet(ek) kijelölve, kapcsolatfelvétel kint | fent, 0. pont |
| aug 10–14 | Ajánlat elfogadva, névsor-igény (csapatok + emailek) elküldve a kapcsolattartónak | playbook |
| **aug 24–28** | **T–2 org-setup hét** — lásd 2. pont | kampany-utemterv 0. |
| aug 26–28 | Dry run belső teszt-szervezettel (wizard → aktiválás → kitöltés → lépés-váltás → riport) | kampany-utemterv 0/6. |
| szept 7 (H) | Kickoff-anyagok végső átnézése; vezetői beharangozó email már kint (ld. 2.5) | ugyfel-kommunikacio 3. sablon |
| **szept 8 (K)** | **Kickoff alkalom** + kampány aktiválása a zárásaként | kampany-utemterv 1. |
| szept 11 (P) | T+3 platform-remind a lemaradóknak | remind-politika |
| szept 15 (K) | T+7 vezetői üzenet a belső csatornán | remind-politika |
| szept 18 (P) | T+10 második remind + név szerinti lista a kapcsolattartónak · **cél: ≥85% self-kitöltés** | remind-politika |
| szept 28 hete | Observer-meghívók 30 napos lejáratának előjelzése | kampany-utemterv 3. |
| okt 5–16 | Hátralévő lépések (szereppeer / trust / pulse) kifutása napi-1 pacing mellett | lépés-sorrend |
| okt 19 hete | Kampány zárása → riport-vázlat → tanácsadói szerkesztés → publikálás | kampany-utemterv 4. |
| okt vége | Vezetői debrief + 30 napos akciólista | playbook |
| november | 2. pulse-kör külön kampányként — index-delta a záró alkalomra | kampany-utemterv 4.5 |

## 2. T–2 setup checklist (aug 24–28) — sorban

1. [ ] Szervezet létrehozása — `/org/new` (cégadatokkal).
2. [ ] Org-aktiválás — `/admin?tab=orgs` → activate.
3. [ ] Tanácsadó hozzárendelése — Admin → Tanácsadók fül + org-kiosztás.
4. [ ] Csapatok felvétele a kapcsolattartói névsor alapján.
5. [ ] Tagok meghívása — **ugyanaznap** menjen ki a vezetői beharangozó
   (ugyfel-kommunikacio.md 3. sablon), hogy a platform-email ne hidegen
   érkezzen.
6. [ ] Dry run a belső teszt-szervezettel (seed-org-team / seed-psych-safety).

## 3. Heti operatív ritmus a kampány alatt (tanácsadó)

- Hétfő: kampány-oldal átnézés → 2 mondatos státusz a kapcsolattartónak.
- Szerda: remindok a politika szerint.
- Péntek: heti jegyzet (elakadások, kérdések) → roadmap-input + záró beszámoló.

## 4. Előfeltétel-kapuk (mielőtt a T–2 hét indulhat)

- [x] Riport-tartalom P1–P5 kör lezárva (2026-07-23).
- [ ] Kézi QA jegyzőkönyv végigvive, kritikus hibák javítva.
- [ ] Email-csatorna: Resend domain verify + RESEND_FROM_EMAIL prod env
  (ld. `docs/development/resend-domain-ops.md`).
- [ ] P5.7 v1 (atomok+motor+web UI) kész aug 7-ig, team view aug 13-ig —
  a debrief-élményhez, nem blokkoló a kickoffra.
