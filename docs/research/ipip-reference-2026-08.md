# IPIP–HEXACO referencia-statisztika (openpsychometrics.org) — 2026-08

> **Állapot: ELŐKÉSZÍTVE, adatra vár.** A tooling kész
> (`scripts/research/norms-from-ipip-dataset.ts`), de a 2026-08-11-i
> futtatókörnyezetben az openpsychometrics.org felé a hálózati proxy
> tiltott (403 CONNECT), így a nyers adat nem volt letölthető és az
> alábbi táblák még üresek. Feltöltésük: futtasd a scriptet olyan gépről,
> ahonnan a letöltés megy (vagy kézzel letöltött adattal), és másold be a
> kimenetét — a doksi végén a pontos parancsok.

## Mi ez, és mire szabad használni

A TSFI kérdésbank 92 fő-itemje az IPIP–HEXACO poolból származik
(`docs/product/tsfi-item-provenance.md`). Az openpsychometrics.org
nyilvánosan közzétett nyers adata ugyanennek a poolnak az itemjeire
tartalmaz ~22 ezer kitöltést — ebből a TSFI-be átvett item-részhalmazon
a saját pontozó-motorunkkal (POMP, `src/lib/scoring.ts`) referencia-
statisztika számolható.

**A minta: nemzetközi, ANGOL nyelvű, önszelektált online kitöltők.**
Ebből következően ez KÖZELÍTŐ referencia, ami

- **CSAK BELSŐ KALIBRÁCIÓRA való** (termékdöntés, 2026-08-11):
  küszöb-ellenőrzés (40/70 és 35/65 sávhatárok kihasználtsága),
  Cronbach-α és SEM-priorok (`src/lib/psychometrics.ts`:
  `MEAN_ITEM_R=0.22`, `SCORE_SD=20`) összevetése mért adattal,
  eloszlás-alak (decilisek);
- **NEM kerülhet a `src/lib/norms.ts` `ACTIVE_NORM_TABLE`-jébe** — a
  felületi percentilis kizárólag a saját pilot normáiból élesíthető
  (`scripts/research/norms-from-results.ts`), mert az itteni minta se a
  magyar nyelvű kitöltést, se az ügyfél-populációt nem képviseli.

## Ismert lefedettségi rések

- A TSFI 8 kiegészítő itemje (social_self_esteem ×4 — X/Extraverzió;
  altruizmus ×4 — intersticiális) nem az IPIP–HEXACO poolból jön, az
  adatban nincs megfelelőjük: az **X dimenzió 12/16 (short: 8/10)
  itemmel közelített**, az altruizmus-skála kimarad.
- 5 item a TSFI-ben könnyen adaptált szövegű (12, 36, 41, 50, 78) — a
  leképezés ezekre az eredeti IPIP-szöveggel történik (a script explicit
  felülíró térképpel kezeli).
- A pontozott „forma" a leképezett item-részhalmaz — a valódi TSFI-
  kitöltési szituációt (magyar szöveg, sorrend, kontextus) nem méri.

## Aggregált eredmények

*(A futtatás után töltendő — aggregátum commitolható, a nyers adat NEM:
a zip/CSV a gitignore-olt `scripts/research/.data/` alatt marad.)*

### TSFI-S forma (60 item, leképezett részhalmaz) — n = ⟨…⟩

| Dim | k (item) | átlag | szórás | α mért | α prior | r̄ mért | SEM mért | SEM prior |
|---|---|---|---|---|---|---|---|---|
| H (INTE) | 10/10 | | | | | | | ≈10.4 |
| E (RESO) | 9/9 | | | | | | | ≈10.4 |
| X (TEMP) | 8/10 | | | | | | | ≈10.4 |
| A (ADAP) | 10/10 | | | | | | | ≈10.4 |
| C (THOR) | 10/10 | | | | | | | ≈10.4 |
| O (OPEN) | 9/9 | | | | | | | ≈10.4 |

*(α prior = `alphaFromItems(k)` a 0.22-es item-korrelációs priorral; SEM
prior = `dimStandardError("short")`. A teljes formára ugyanez a tábla a
script kimenetéből.)*

### Sáv-kihasználtság (40/70 és 35/65) — ⟨futtatás után⟩

### Minőség-szűrés — ⟨a script kiírja, mit alkalmazott; ide másolandó⟩

## Reprodukálás

```bash
# hálózattal (letöltés + kicsomagolás + elemzés):
npx tsx scripts/research/norms-from-ipip-dataset.ts --download

# vagy kézzel letöltött adattal (zip: openpsychometrics.org/_rawdata/,
# a HEXACO / "IPIP HEXACO equivalence" csomag, kicsomagolva a
# scripts/research/.data/ alá):
npx tsx scripts/research/norms-from-ipip-dataset.ts \
  --csv scripts/research/.data/<mappa>/data.csv \
  --json scripts/research/.data/ipip-reference-normtable.json
```

A script a végén `NormTable`-kompatibilis JSON-blokkot ír ki
(`version: "ipip-ref-<dátum>"`, source-ban a minta-korlátok) és hangos
figyelmeztetést, hogy a blokk nem élesíthető. Részletek:
`scripts/research/README.md`.
