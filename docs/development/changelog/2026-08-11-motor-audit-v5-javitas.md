# 2026-08-11 — motor-audit v5 javítási kör

A `docs/audits/motor-audit-v4-2026-08-11.md` leleteinek javítása — **osztály-
szinten**: minden javítást végigvezetve az összes testvér-felületen (a v4 fő
tanulsága: a v3-fixek lokálisak voltak). Négy köteg (fő ügynök + 3 párhuzamos
ügynök, diszjunkt fájl-területek). Ellenőrzés a teljes, integrált fán:
`pnpm check` PASS · unit 788/788 · client 132/132.

## Biztonság / GDPR (a v4 privacy-réteg + a W6 saját réseim)

- **W6 egy közös forrásból** (`src/lib/account-scrub.ts`): a `scrubProfileData`-t
  MINDKÉT törlési út hívja — az in-app `/api/profile/delete` ÉS a Clerk
  `user.deleted` webhook (a webhook korábban csak részlegesen takarított). A
  rater-oldali email-illesztés **case-insensitive**, a PII minden státuszon
  (CANCELED/EXPIRED is) nullázódik.
- **Külső rater draft-guard**: a bejelentkezett meghívó (értékelt) nem
  olvashatja/írhatja a rater szerver-oldali draftját — sem az observe-oldalon,
  sem a draft POST/DELETE-en. + rate-limit és méret-korlát a draft-endpointon.
- **`GET /api/team/role-round`**: tagság + `canManageTeam` guard (korábban bármely
  belépett user bármely csapat rosszterét lekérhette — cross-org szivárgás).
- **Dossier**: a peer-aggregátum az org csapataira szűrve + a self-sor kizárva.
- **Karrier observer-csatorna**: a keverés a `MIN_RATERS` anonimitás-padló mögé
  zárva; a padló alatt a kimenet bitre azonos a self-only-val (nem visszafejthető).

## Mérési hiba — TERMÉK-DÖNTÉS: a ± nem kerül a felületre

- Minden numerikus ± / SEM-sáv / „becsült mérési hibája" jegyzet eltávolítva a
  UI-ról (dimenzió-szint is). A magyarázat külön, központi leírásban él majd.
- A mérési-hiba fegyelem a LOGIKÁBAN marad: a különbség-kapuk a KÉT pont
  KÜLÖNBSÉGÉNEK hibáját használják (`DIFF_MIN_GAP = round(√2·SEM) = 15`,
  `diffStandardError`), nem az 1×SEM-et — így ott nem állítunk sorrendet/címkét,
  ahol a delta a hibán belül van (a próza is főnév-only / hedge-elt). Szám nélkül.

## Interpretáció / megjelenítés

- **RESO fordított orientáció** (rendszerszintű): a growth-focus, az observer-gap
  szöveg, a PDF profil-karakter és a blanket „figyelendő" mind pólus-tudatos —
  a stabil user nem kap „fejlődési területként" Félelmet.
- **HowYouWork** strukturált slotok (main/watch/context) — nincs pozíció-alapú
  félrecímkézés. **Nulla-mint-nem-mért** kivezetve (nincs kitalált 0-facet).
- **S3-próza**: az `isTopPairUncertain` jelre a glyph-plate/interakció/archetype-
  story nem nevezi meg a második dimenziót — a lefokozott címkével egyezik.
- **F3 forrás-chip** a 66-69 / 35-39 sávban „inkább magas/alacsony".
- **W1**: a serializált `completedAt` nap-pontos, a `relationship` mező elhagyva.

## Csapatszerep / csapat-dinamika

- **Member-report** becsült szerepe forrás-badge-dzsel (a v3 S1 csak a
  konzultáns-tabot érte el). Az **exact tie-break minden felületen** (a fő szerep
  felületenként egyezik); a peer-aggregáció nyers súly-összeget átlagol.
- A **RENDERELT report** nem tálalja a MÉRT trust-élt „hasonló munkastílus"-ként
  (minden hasonlóság-szöveg `source`-ra kapuzva). **Ex-tag** trust-obszervációi
  kiszűrve (él/hub/isolated/coverage), a coverage ≤1. A **flat-50** kitalált
  profil nem kap „MÉRT" dimenzió-bontást.

## Karrier (parkolt; hiring-ág + API él)

- **Known-groups** `strategy:composite` (körkörösség megszűnt). **Scoped** rangsor
  forrás-kapuzva (becsült érdeklődés nem vezérel 100%-ot), rankSe normalizálva.
  **H-floor** a nyers INTE-n. userValue raw párral. Gating 404 + szerver-oldali
  fitScore. Halott mezők törölve.

## Konvergencia-ledger (a végtelen-kör lezárása)

- `docs/audits/motor-known-residuals.md`: a vak-audit ciklus **megállási
  feltétele**. Az auditok vakok maradnak; a szintézis a ledgerhez méri a
  leleteket (pilot-gated validitás + termék-döntés + elfogadott tradeoff). A
  kód-körök akkor állnak le, ha egy kör 0 ÚJ kód-szintű bugot ad — onnantól a
  következő lépés a PILOT, nem újabb audit.

## Nyitva (tudatosan — ld. a ledgert)

- W2 (kijelentkezett self-submission), approval-kapu org-váltás, törölt profil
  demográfia-retenció, ANONYMOUS observer-típus — termék-döntést igényelnek.
- A teljes validitási alap (normálás, SEM-konstansok, küszöbök, súlyok) —
  pilot-adatot igényel.
- Kis maradék: partial-dim 50-backfill az intelligence-data-ban (a fő eset zárva),
  getInsight-duplikáció (share vs results).
