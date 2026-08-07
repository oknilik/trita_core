# 2026-08-07 — a /holland-kod lap kivezetése

A karrier-réteg fagyasztva van (fake door mögött), a publikus Holland-kód
(RIASEC) értelmező lap viszont kint maradt: a láblécből linkelve, a
sitemapben, az llms.txt-ben. Egy fagyasztott funkcióra mutató, indexelt
tartalom félrevezető — kivezetve.

## Mi került ki

| Hol | Mi |
|---|---|
| `src/app/(marketing)/holland-kod/` | a teljes útvonal (page + HollandContent) |
| `Footer.tsx` | „Holland-kód (RIASEC)" link a Termék oszlopból |
| `sitemap.ts` | a `/holland-kod` bejegyzés |
| `robots.ts` | a `PUBLIC_PATHS` bejegyzés |
| `llms.txt/route.ts` | a lap sora |
| `structured-data.ts` | `knowsAbout` téma-címke (HU + EN) — nem hirdetünk olyan témát, amire nincs lapunk |
| `CareerResults.tsx`, `CareerCompass.tsx` | a két `ExplainerLink` a lapra |
| `ExplainerLink.tsx` | a komponens (kizárólag ehhez készült, más fogyasztója nincs) |
| i18n | `footer.hollandCode`, `results.hollandExplainerLabel/Hint` |

## Ami MARAD, szándékosan

- **`src/lib/riasec-content.ts`** — az értelmező tartalom. A modul
  élesítésekor ez a forrás; törölni kár lenne érte. Amíg nincs fogyasztója,
  importálatlan (a fájl fejléce ezt kimondja).
- **`buildDefinedTermSetJsonLd`** — általános JSON-LD segéd, teszttel. A
  doc-kommentje kimondja, hogy jelenleg nincs fogyasztója.
- **A karrier-modul saját Holland-szókincse** (`lib/career/*`,
  `questions/riasec.ts`, a `results.cfHolland*` kulcsok) — ez a fagyasztott
  funkció belső nyelve, nem hivatkozás a kivezetett lapra.

## Ellenőrzés

```
/holland-kod        → 307 a főoldalra (a gyökér not-found)
/, /sitemap.xml, /llms.txt, /robots.txt → 0 találat a „holland" szóra
```

## Egy SEO-megjegyzés

A lap benne volt a sitemapben, tehát valószínűleg indexelt. A gyökér
`not-found` MINDEN ismeretlen útvonalat a főoldalra irányít (307), ami a
kereső szemével „soft 404" — lassabban esik ki az indexből, mint egy valódi
404/410. Ez a meglévő, minden útvonalra érvényes viselkedés; ha fontos, hogy
gyorsan kiessen, külön 410-es kezelő kell a `/holland-kod`-ra. Most nem
tettük be: az útvonalat épp azért vezettük ki, hogy ne legyen benne a kódban.
