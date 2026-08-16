# Pilot 1. kör — dátumozott ütemterv (2026 ősz)

> Készült: 2026-07-24 · Frissítve: 2026-08-16. A
> `kampany-utemterv.md` (generikus ops-checklist)
> konkrét, naptárra fordított példánya az első éles körre.
> **Döntés (2026-07-24): kickoff a szeptember 7-i héten** — javasolt nap:
> **szeptember 8. (kedd)**.
>
> **Státusz 2026-08-16:** a célszervezet kijelölésének augusztus 7-i és az
> ajánlat elfogadásának augusztus 14-i határideje a checklist szerint nyitva
> maradt. Ezt nem tekintjük késznek: a T–2 setup csak dokumentált elfogadás és
> névsor mellett indulhat. Ha ez nem rendeződik azonnal, a szeptember 8-i
> kickoffot újra kell tervezni; a mérési vagy consent-lépések nem rövidíthetők.

## 0. Cél-szervezet

- [ ] **Cél-szervezet(ek) neve: _________________** — kijelölés határideje:
  **augusztus 7. (péntek)**. Jelöltek forrása: pilot-jelentkezések
  (/admin?tab=inquiries + pilot-apply leadek), meleg kapcsolatok.
- Ajánlott első hullám: 1 szervezet, 1–2 csapat, csapatonként 5–12 fő; a
  termékhatár 5–30 fő. A baseline anonimitási padlóit a trust és a pulse
  saját küszöbei adják; peer csak külön kiegészítőnél releváns.
- [ ] Kapcsolattartó + döntéshozó azonosítva; ajánlat/feltételek kiküldve:
  **augusztus 10–14. hete**.

## 1. Visszafelé számolt naptár

| Dátum | Mérföldkő | Forrás-checklist |
|---|---|---|
| júl 24 – aug 5 | Kézi QA lezárása + email-csatorna pilot-kész (Resend verify) | mai napi riport |
| aug 7 (P) | Cél-szervezet(ek) kijelölve, kapcsolatfelvétel kint | fent, 0. pont |
| aug 10–14 | Ajánlat elfogadva, névsor-igény (csapatok + emailek) elküldve a kapcsolattartónak | playbook |
| **aug 24–28** | **T–2 org-setup hét** — lásd 2. pont | kampany-utemterv 0. |
| aug 26–28 | Dry run belső teszt-szervezettel (`SCAN_V1` → két publikált riport → összehasonlítás) | kampany-utemterv 0/6. |
| szept 7 (H) | Kickoff-anyagok végső átnézése; vezetői beharangozó email már kint (ld. 2.5) | ugyfel-kommunikacio 2. sablon |
| **szept 8 (K)** | **Kickoff alkalom** + kampány aktiválása a zárásaként | kampany-utemterv 1. |
| szept 11 (P) | T+3 platform-remind a lemaradóknak | remind-politika |
| szept 15 (K) | T+7 vezetői üzenet a belső csatornán | remind-politika |
| szept 18 (P) | T+10 második remind · **cél: ≥85% self-kitöltés** | remind-politika |
| szept 21–25 | Bizalmi kör kifutása · **cél: ≥80% beadás** | kampany-utemterv 2.2 |
| szept 28–okt 2 | Pulse kifutása · **cél: n≥3 és lehetőleg ≥70% lefedettség** | kampany-utemterv 2.3 |
| okt 5 hete | Kampány zárása → kör-szűrt riport → tanácsadói szerkesztés → publikálás | kampany-utemterv 4. |
| okt 12 hete | Vezetői debrief + célmutatóhoz kötött 30–60 napos akció | playbook |
| nov 16 hete | `SCAN_V1` follow-up kampány, fresh self + trust + pulse | kampany-utemterv 6. |
| nov vége | Follow-up riport, összehasonlítás, esetnapló-zárás és price discovery | playbook |

## 2. T–2 setup checklist (aug 24–28) — sorban

1. [ ] Szervezet létrehozása — `/org/new` (cégadatokkal).
2. [ ] Org-aktiválás — `/admin?tab=orgs` → activate.
3. [ ] Tanácsadó hozzárendelése — Admin → Tanácsadók fül + org-kiosztás.
4. [ ] Csapatok felvétele a kapcsolattartói névsor alapján.
5. [ ] Tagok meghívása — **ugyanaznap** menjen ki a vezetői beharangozó
   (ugyfel-kommunikacio.md 2. sablon), hogy a platform-email ne hidegen
   érkezzen.
6. [ ] Dry run a belső teszt-szervezettel (seed-org-team / seed-psych-safety).
7. [ ] `case_id`, aliasok és baseline/follow-up dátum megnyitva a
   `team-scan-esetnaplo-sablon.md` alapján, védett belső helyen.

## 3. Heti operatív ritmus a kampány alatt (tanácsadó)

- Hétfő: kampány-oldal átnézés → 2 mondatos státusz a kapcsolattartónak.
- Szerda: remindok a politika szerint.
- Péntek: esetnapló-frissítés (elakadások, teher, akció-végrehajtás,
  kompozíció) → kalibrációs index + záró beszámoló.

## 4. Előfeltétel-kapuk (mielőtt a T–2 hét indulhat)

- [x] Riport-tartalom P1–P5 kör lezárva (2026-07-23).
- [ ] Kézi QA jegyzőkönyv végigvive, kritikus hibák javítva.
- [ ] Email-csatorna: Resend domain verify + RESEND_FROM_EMAIL prod env
  (ld. `docs/development/resend-domain-ops.md`).
- [x] `SCAN_V1` rögzített preset: self + trust + pulse, kötelező fresh
  kör-címkével.
- [x] Mérési-hiba- és kompozíciós kapu a riport-összehasonlítóban.
- [x] Akció → célmutató → kimenet kapcsolat és esetnapló-sablon.
