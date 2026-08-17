# 2026-08-17 — Pilot P1-kör lezárása (3. csomag: PDF, vendég-draft, teszt-háló)

> A P0- és P1-csomagok folytatása ugyanazon a branchen
> (`claude/pilot-p0-fixes`). Ezzel az audit P1-listája lezárult; ami tudatosan
> kimaradt, az a záró szakaszban.

## P1.1 — Csapatriport-PDF

A vezetői debrief eddig csak képernyőről ment — a publikált csapatriportnak
nem volt nyomtatható párja (a `components/pdf` réteg kizárólag az egyéni
eredményt fedte).

- Új: `src/components/pdf/TeamReportPdf.tsx` — a publikált `TeamReportView`
  kétoldalas PDF-párja a meglévő PDF-primitívekből (styles/PdfCard/PdfFooter).
  1. oldal: cím + KPI-sor (kitöltöttség, mintázat + stabilitás, pszich.
  biztonság index), dimenzió-átlagok heterogenitás-sávval, dinamika,
  bizalmi háló lefedettség, pulse-blokk. 2. oldal: tanácsadói narratíva
  (összegzés/erősségek/kockázatok/javaslatok/vezetői iránytű), akcióterv
  (30/60/90 + felelős + státusz + célmutató-címke), módszertani lábjegyzet.
- Elvek, amiket a PDF a nézettel azonosan tart: KIZÁRÓLAG a befagyasztott
  aggregátum + narratíva (élő számítás nincs); egyéni adat soha; forrás- és
  adatminőség-jelölés kötelező; a psych-safety szóródás számként nem jelenik
  meg; EN lekérésnél jóváhagyott fordítás híján HU narratíva + jelzés.
- **Tudatos eltérés a nézettől:** a trust hub/beágyazatlan NEVEK nem kerülnek
  a PDF-be, csak darabszám + utalás az élő nézetre — a nyomtatott artefakt
  tovább terjed, mint a képernyő. (Vétózható.)
- Gomb: `TeamReportPdfButton` (client, dinamikus import — a react-pdf nem
  kerül a fő bundle-be), a publikált riport fejlécében, a „Publikált" badge
  mellett; csak PUBLISHED állapotban. Analitika: `results.export` új opcionális
  `surface` proppal (`team_report`).
- Ellenőrzés: `scripts/smoke-team-report-pdf.tsx` (kézi füstteszt, a
  persona-script font-mintájával) — HU/EN/aggregátum-nélküli render + vizuális
  átnézés megtörtént.

## P1.6 — A vendég-flow nem ígér hamis mentést

Az intro azt mondta a vendégnek is: „mentjük a haladásodat" — miközben a
vendég-draft KIZÁRÓLAG localStorage (inkognitó/sütitörlés/eszközváltás =
elveszett 60 item; a lead magnet fő szivárgási pontja).

- Új `assessment.introInfoGuest` kulcs (HU/EN): a vendég-intro kimondja, hogy
  a haladás ebben a böngészőben él, és regisztráció után kerül a fiókba.
- A szerver-oldali vendég-draft (schema-igényes) tudatosan NEM része ennek a
  körnek — ha a pilot alatt a /try-elhagyás mérhetően fáj, külön tétel.

## P1.7 — Teszt-háló a lépés-léptető motorra

A pilot-mag legkevésbé fedett gépezete volt: a szerver-oldali léptetésre
(`advanceCampaignStepForUser`, `releaseDueCampaignSteps`) nem volt teszt.

- Új: `tests/integration/campaigns/step-release.integration.test.ts` — 6 eset:
  ütemezési kapu (advance zárva tart, nem értesít); nem-force release nem
  nyit idő előtt; force release kaput töröl + értesít + az email-hiba
  (üres RESEND_API_KEY, `release-env-setup.ts`) nem töri meg; ismételt
  release idempotens (értesítés-dedupe); 0 órás intervallum azonnal nyit;
  user-szintű release nem nyúl a többi résztvevőhöz.
- A sandboxban DB híján nem futtatható — a CI integration fázisa igazolja.
- **Tudatosan kimaradt:** a `/api/admin/org-access` route-teszt (requireAdmin
  auth-seam kellene hozzá — a repo többi integration tesztje is lib-szinten
  tesztel, route-szintű auth-mock minta nincs); és a SCAN_V1 e2e (élő app+DB
  nélkül vakon írni felelőtlen). Mindkettő következő kör.

## Tesztek

Client: 207/207; unit-őrök (i18n-szótár, analytics-katalógus +
instrumentation-coverage) zölden; PDF-füstteszt zöld (HU/EN/üres-aggregátum);
ESLint tiszta. Sandbox-korlát változatlan: Prisma-engine hiányában a teljes
type-check és az integration kör CI-ben fut.
