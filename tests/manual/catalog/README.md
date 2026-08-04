# Manuális tesztkatalógus

A katalógus adat-modulok gyűjteménye: minden terület egy `.mjs` fájl,
amely `cases` tömböt exportál. A `scripts/generate-manual-tests.mjs`
ezekből állítja elő a tesztelőknek átadható Excel-t
(`docs/qa/manual-test-plan.xlsx`).

## Eset-séma

```js
{
  id: "TRY-01",            // stabil, területi prefixű azonosító
  area: "Vendég-tölcsér",  // emberi terület-név (Excel-csoportosítás)
  name: "…",               // 1 mondatos eset-név
  persona: "vendég",       // ki végzi (vendég / self-user / org admin / …)
  emails: { fő: "AUTO" },  // szerep→email; "AUTO" = generált cím a
                           // teszt-postafiókból (+címkés), vagy konkrét cím
  preconditions: "…",      // előfeltételek (állapot, korábbi esetek)
  steps: "1. … 2. …",      // számozott lépések
  expected: "…",           // ellenőrizhető várt kimenet
  automated: "none",       // none | partial | full — automata lefedettség
  coveredBy: "",           // mely tesztfájl fedi (ha automated != none)
  priority: "P1",          // P1 = pilot-kritikus · P2 = fontos · P3 = polish
}
```

## Teszt-email konvenció

A generátor a `--mailbox` kapcsolóból (alap: `trita.qa@gmail.com`)
+címkés címeket képez: `trita.qa+try-01@gmail.com` — így minden eset
külön „felhasználó", de egyetlen valós postafiókba érkezik minden levél.
Több szereplős eseteknél az `emails` map minden szerephez külön címkét
kap (`trita.qa+obs-03-observer@gmail.com`). Konkrét címet (pl. admin
fiók) az `emails` értékébe írva az AUTO-generálás kihagyható.

## Frissítés

1. Bővítsd/módosítsd a terület-fájlt.
2. `pnpm manual-tests` — validál + újragenerálja az Excelt.
3. A katalógus-integritást a `tests/unit/manual/catalog.test.ts` őrzi
   (unique ID-k, kötelező mezők, enum-értékek) — a unit-körben fut.
