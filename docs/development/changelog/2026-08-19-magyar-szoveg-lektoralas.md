# 2026-08-19 — Magyar szöveg-lektorálás az eredmény-szövegeken

> Stílus-kör, viselkedés-változás nélkül: a tükörfordítás-ízű és nem magyaros
> megfogalmazások finomítása a felhasználónak kimenő eredmény-szövegekben.
> Egyetlen küszöb, kulcs vagy motor-logika sem változott — kizárólag magyar
> szövegértékek.

## Miért

A user-facing magyar korpusz nagy része már több valencia- és nyelvi körön
átment, de néhány rétegben — főleg a HEXACO-szakirodalomból fordított
dimenzió-leírásokban és sáv-verdiktekben (`questions/tritan.ts`) — megmaradt a
szó szerinti fordítás lenyomata („Kevéssé ragadnak meg a műalkotások…",
„Nem tántorítanak el a fizikai veszélyek…"), és akadt tényleges nyelvtani hiba
is („…és a lelkesedés és az optimizmus **pedig** ritkábban jellemez").

## Mit érintett

- **`src/lib/questions/tritan.ts`** — a hat dimenzió + altruizmus leírása és a
  low/mid/high verdikt-szövegek magyar példányai (a duplikált `insights` és
  `insightsByLocale.hu` szinkronban). A ` Négy facetje ` marker (a publikus
  nézet vágópontja) és az A-dimenzió „Cserébe" kétoldalúsága változatlan.
  A kérdőív-ITEMEK szövegéhez szándékosan nem nyúltunk (mérési stabilitás).
- **`profile-content.ts`** — „legdominánsabb" → „legmeghatározóbb", „Jól
  kattansz" → „Könnyen megtalálod a közös hangot", „checklist" →
  „ellenőrzőlista", apróbb vonzat-javítások.
- **`dimension-insights.ts`** — hero-tagline X („energikusan és inspirálóan
  vagy jelen" → „energiát és lendületet viszel…") és H-gyenge fél.
- **`interaction-atoms.ts`** — „ritkán élnek meg hazugságok" → „ritkán marad
  meg egy hazugság"; a H-low vezető-kiegészítő magyarosítása (hedge és
  „Ha a vezetőd" keret megtartva).
- **`i18n/results.ts`** — „Ez nem probléma — hanem…" vesszőhasználat,
  „debrief" → „közös átbeszélés", meghívó-szöveg vonzata, karrier-intró.
- **Csapat-felület** — `team-insights.ts` („fairness-érzékenység" →
  „méltányosság-érzékenység", mediátor-mondat), `TeamInsights.tsx`
  („assertivitás" → „önérvényesítés", C-low sáv), `TeamHeatmap.tsx`
  (X-leírás a Társaságkedvelés facet-szókincsével), `team-pattern.ts`
  kohézió-tooltip (a tengely a becsületesség-alázat + barátságosság átlaga —
  a korábbi szöveg tévesen a Méltányosság facetet nevezte meg).
- **`ComparisonTab.tsx`** — „mint ahogyan magad érzed" → „mint amilyennek te
  érzed magad" család; H-nál „alázatosabbnak" → „szerényebbnek".
- **`GrowthFocus.tsx`**, **`emails.ts`** — „iránt való" → „iránti",
  egybeírások (Fejlődéskövetés, Személyiségtípus-meghatározás), observer-
  meghívó gördülékenyebb szövege.

## Amihez nem nyúltunk

- Kérdőív-itemek (`textByLocale`) — a megfogalmazás a mérőeszköz része.
- Guardrail-őrzött fordulatok: hedge-jelölők, „Cserébe" kétoldalúság,
  E/A empátia-tiltás, pár-sáv valencia-mentes szókincse.
- `mode-copy.ts` — nincs élő fogyasztója (halott kód), és a „TRITAN
  Karrierprofil" eyebrow a kivezetett TRITAN-brandinget hordozza; élesítés
  előtt tartalmilag is felül kell vizsgálni, nem csak nyelvileg.

## Ellenőrzés

`pnpm type-check` 0 hiba · unit 1086/1086 · client 229/229 · az érintett
fájlokon az eslint új hibát nem jelez.
