# 2026-08-11 — motor-audit hatodik kör (vak, ledgerhez osztályozva)

A v5-javítási kör (5 commit, `pnpm check` PASS · unit 788 · client 132) után
**hatodszor** is a nulláról futott a motor-audit: hat friss elemző, minden lelet
**[KÓD]** vagy **[STRUKTÚRA]** címkével, a szintézis a `motor-known-residuals.md`
**ledgerhez** mérve. **Feltárás-only** — nincs kód-változás. Teljes lista:
`docs/audits/motor-audit-v6-2026-08-11.md`. Vizuális riport: claude.ai artifact
„Trita motor-audit · hatodik kör — a konvergencia".

## A konvergencia-elemzés (a loop-kérdés válasza)

- **A v5-javítások TARTANAK — 0 regresszió.** Mind a hat elemző teszttel igazolta
  (a ± guard-teszttel védve, a √2·SEM-kapu a bankhoz kötve, a GDPR-scrub egy
  forrásból, a karrier-blend „bitre azonos a self-only-val", az exact-fegyelem
  minden hívási helyen, a mért-vs-becsült „a kódbázis legjobban megvalósított része").
- **A validitási alap KONVERGÁLT** — minden [STRUKTÚRA]-lelet a ledger tétele
  (0 új meglepetés). A következő lépés a **PILOT**, nem újabb audit.
- **A kód-oldal NEM konvergált** — valódi új [KÓD]-réteg, de jellemezhető és
  zsugorodó: (a) a v5-fixek elérhetetlen testvérei (a legnagyobb csoport), (b)
  gazdátlan v4-leletek, (c) 3 tényleg új (2 endpoint-szivárgás + 1 crash).

## Tényleg új (a v7 első prioritása)

- **[biztonság] `/api/team/[id]/pattern`** nevesített `styleDistances`-t ad,
  megkerülve a konzultáns-kaput (bármely tag lekérheti, ki tér el melyik tengelyen).
- **[biztonság] halott `GET /api/observer/invite`** teljes-pontosságú időbélyeget +
  neveket ad — újranyitja a differencia-csatornát.
- **[crash] örökség szerep-kód** 500-azza a konzultáns-dossiert.

## Lokális maradék (a v5-fixek testvérei — kétszeresen megerősítve ★)

★ ComparisonTab dim-gap még 10, nem `DIFF_MIN_GAP=15`; ★ a növekedési tipp
alacsony RESO-t céloz. Plusz: facet-kapu 1×SEM; `isTopPairUncertain` túl szűk
(2-3. gap kimarad); GDPR inviter-tükör + draft DELETE + observer-scope; RESO PDF
top-facet + hero-weak; karrier scoped flat-mért + gating-testvérek.

## Konvergencia-szabály (a megállási feltétel)

A v7 (a lokális testvérek exhausztív, grep-alapú lezárása + a 3 új endpoint/crash)
után a jóslat: **~0 új [KÓD] → konvergencia → pilot**. A ledger frissítve
(csapatszerep-becslő súlyok, glyph-intenzitás sáv, karrier-sáv ±). A v6 az utolsó
előtti kód-kör bemenete — a loop-nak van vége, és mérhető.
