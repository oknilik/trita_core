# Pilot-előtti zárási terv — 2026-08-04

> Horizont: 2026-09-08 pilot-indulás. Forrás: teljes terv-vs-kód audit
> (52 tétel, nyers adatok: `docs/product/data/gap-audit-2026-08-04.json`).
> A „KÉSZ (ellenőrizve)" tételeket az audit kóddal igazolta — itt csak a
> teendők szerepelnek.

## 1. Most megvalósítandó (pilot előtt, S/M méret) — ✅ MIND KÉSZ (2026-08-05)

Mind a 14 tétel megvalósult és a tritanium branchen van; a TEST-GAP 34 új
integration-tesztet hozott (87→121), a QR-mechanika közös
QrCodeBadge-komponensre épül, a B14 a szerver-oldalról ismert
`hasColleagueDirectory` propból dolgozik.

| # | Tétel | Méret | Megjegyzés |
|---|---|---|---|
| QR-OBSERVER | QR az observer-meghívókhoz (InvitationsTab) | S | a CompareInviteCard QR-mintája újrahasznosítva; workshop-helyzet: a kolléga a teremben szkennel |
| QR-JOIN | QR a csapat-join linkhez | S | onboarding/tag-meghívás gyorsítása |
| QR-SHARE | QR a ShareModalba | S | profil-megosztás személyesen |
| A8 | 3 kényszer-interstitial → 1 milestone, saját „Folytatom" gombbal | S | kitöltési flow dramaturgia-egyszerűsítés |
| A10 | Self-serve user ne pattanjon át a team-roles oldalon | S | felesleges redirect-ugrás ki |
| A11 | Onboarding 2 lépés → 1 képernyő (consent a submit felett) | S | a 2. lépés egyetlen checkbox volt |
| B14 | Invite-form stabil cím + kolléga-picker skeleton | S | menet közbeni átcímkézés ki |
| B16u | Notification-dismiss visszavonás (undo) | S | a B16 hátralévő fele |
| CJ-CREDITS | Halott kredit-admin-link az org settingsben | S | consulting-led modellben a /contact a cél |
| LR-FACET | „Szorongás" facet nem-klinikai glosszája | S | a nyelvi kör nyitott maradványa |
| NH-F4PLUS | Notification-panel fókusz-csapda + billentyű-navigáció | S | a11y |
| TR360-LEGAL | Peer/trust/pulse adatkezelés a privacy-oldalon | S | jogi higiénia a pilot előtt |
| LR-RVFP | „Zsoldosok" (RVFP) minta-név csere → „Szabadúszók" | S | stigmatizáló név ki; a szöveg-tartalom már enyhítve |
| TEST-GAP | Integration-tesztek az új flow-kra (CompareInvite, guest-teaser claim, reflexió-sweep) | M | a CI integration fázisa már zöld — az új felületek is kapjanak hálót |

## 2. Felhasználói döntést / kézi lépést igényel

- **OPS-P3009** — a Vercel deploy-blokk feloldása: a Neon konzolban kell a
  beragadt `20260203202304_init` sort törölni a `_prisma_migrations`-ből
  (runbook: changelog 2026-08-04). A konténerből nincs DB-hozzáférés.
- **DOC-DECISIONS** — a `tritanium.md` 7. szakasz nyitott döntései közül a
  brand-jellegűek (16-név készlet egésze, explorer-nevek) jóváhagyásra
  várnak; a „Zsoldosok"→„Szabadúszók" cserét a szabad kéz alapján
  megléptük, vétózható.

## 3. Tudatosan pilot utánra halasztva (indoklással)

| Tétel | Méret | Miért később |
|---|---|---|
| A3 claim-út újrarendezése | M | auth+claim flow-átrendezés — pilot előtt 5 héttel túl kockázatos |
| B1 riport-IA (szekció-ugró sáv) | M | pilot-riportokkal együtt érdemes |
| B11 archetípus-választó rétegzett feltárás | M | explorer-újratervezés |
| B19 tab-gépezet egyszerűsítés | S | vizuális regressziós háló nélkül kockázatos |
| INT-PDF / INT-F4 (interakció PDF-ízelítő + team páros mód) | S/M | új felület-réteg — a pilot-scope-ot nem bővítjük tovább |
| BL-CONF confidence-rendszer egységesítés | L | öt párhuzamos rendszer — refaktor, pilot után |
| RPT-P4x riport-mélyítések, normacsoport-percentilis | M/L | tartalmi kutatást igényel |
| FI1-VIZ trust-háló, INT-F5 marketing-változat | M | feature-ötlet státusz |
| NH-H3/H4 notification route/panel tesztek | S/M | TEST-GAP-en túli háló — következő kör |

## 4. Manuális tesztkatalógus

Az eszköz kész (`pnpm manual-tests` → `docs/qa/manual-test-plan.xlsx`,
+címkés teszt-email konvencióval). A katalógus feltöltése a teljes
kimenet-leltárból folyamatban — területenként külön `.mjs` modul a
`tests/manual/catalog/` alatt; az integritást unit-teszt őrzi.
