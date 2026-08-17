# Team Scan pilot — norma- és ígéretkalibráció

> Döntési protokoll · 2026-08-16 · Forrás: P2.1 a
> `docs/product/lumina-benchmark-strategia-2026-08.md` dokumentumból.

## 1. Két külön mintanagyság, két külön állítás

| Réteg | Elemzési egység | Várható pilot-n | Amit a pilot lezárhat | Amit nem állíthatunk |
|---|---:|---:|---|---|
| Hat személyiségdimenzió eloszlása | egyén | kb. 200–500 | magyar pilotkohorsz provizórikus átlag/szórás; forrásjelölt percentilis | reprezentatív magyar lakossági norma |
| Bizalmi háló / pulse / szerep / observer | válasz, pár vagy csapat | rétegenként eltér | leíró eloszlás, teher, lefedettség, mérési kapuk felülvizsgálata | beavatkozás okozati hatása kontrollcsoport nélkül |
| Négy csapattengely és 16 minta | csapat | kb. 15–20 | működési megfigyelések és érthetőségi visszajelzés | validált 16-os tipológia vagy küszöbrendszer |

A legfontosabb tiltás: az egyéni `n` nem használható a csapat-szintű
konstrukció mintanagyságaként. Ötszáz személy tizenöt csapatban továbbra is
tizenöt független csapatmegfigyelés a mintázat-kalibrációhoz.

## 2. A provizórikus magyar pilot-norma kohorsza

Egy sor akkor kerülhet a jelölt normába, ha mind teljesül:

1. regisztrált, nem törölt profilhoz tartozó self-eredmény;
2. `testType=TRITAN`, rövid TSFI-S forma, teljes hatdimenziós pontkészlet;
3. a jóváhagyott pilotkampányok egyikére pontosan címkézett
   `AssessmentResult.campaignId`;
4. személyenként csak a legutolsó, scope-on belüli eredmény számít;
5. a kohorsz magyar nyelvű/kontextusú voltát a kampánylista tulajdonosa
   ellenőrizte és a `source` mezőben leírta;
6. ugyanaz a személy több csapat vagy kör miatt sem duplikálódik.

Az aktiválási technikai minimum `n=200`. Ez nem teszi a mintát országosan
reprezentatívvá: a forrás minden megjelenítésben „Trita magyar pilotkohorsz”
marad, az időszak és az `n` feltüntetésével.

Példa reprodukálható futtatásra:

```bash
npx tsx scripts/research/norms-from-results.ts \
  --form=short \
  --campaign <pilot-kampany-1> \
  --campaign <pilot-kampany-2> \
  --source "Trita Team Scan magyar pilotkohorsz, 2026, kampánylista review-olva" \
  --json scripts/research/.data/pilot-norm-review.json
```

A JSON bizalmas és gitignore-olt helyen marad. A script fail-closed: scope,
forrásleírás, rövid forma, pozitív szórások vagy minimum-n hiányában nem ír ki
`ACTIVE_NORM_TABLE`-be emelhető blokkot.

## 3. Aktiválási review

Az automatikus kapu után emberi review szükséges:

- kampánylista és kohorszleírás ellenőrzése;
- bank-/formaverziók eloszlása, hiányzó és kizárt sorok darabszáma;
- dimenziónként átlag, szórás, kvartilis, decilis és szélső értékek;
- 40/70 és 35/65 sávkihasználtság: nincs-e üres vagy túlzsúfolt sáv;
- ugyanazon csapatba ágyazottság dokumentálása mint korlát;
- a `NormTable` diffje külön kódreview-ban, percentilis-megjelenítési
  képernyőképpel és regressziós teszttel;
- a forrásszöveg, verzió és `n` minden fogyasztónál látható.

Az `ACTIVE_NORM_TABLE = null` addig nem változik, amíg ez a review nincs
jóváhagyva. A pilotadatból számolt átlag/szórás előzetes leíró eredményként
használható anélkül, hogy percentilist élesítenénk.

## 4. A 16 minta kezelése

A pilot alatt a `PATTERN_THRESHOLDS`, `TENSION_THRESHOLD` és
`PRESSURE_SHARE_THRESHOLD` értékei dokumentált priorok maradnak. A
15–20 csapatos mintára tilos úgy újravágni a küszöböket, hogy a 16 cella
„szebben” teljen: ez ugyanazon adatra illesztés és igazolás lenne.

Amit gyűjtünk csapatonként:

- négy nyers tengelyérték és távolságuk a küszöbtől;
- elsődleges/alternatív minta, stabilitás és confidence;
- csapatlétszám, összetétel-változás és adatminőség;
- tanácsadói jelzés: segített-e a név a debriefben, félrevezetett-e, milyen
  megfogalmazás működött helyette;
- mért bizalmi háló, pulse és célzott akció kimenete külön mezőkben.

Ez a minta érthetőségét és hipotézis-generáló értékét vizsgálja, nem a
tipológia validitását. Későbbi validáció előtt külön elemzési terv kell,
független csapatmintával és előre rögzített külső kritériumokkal.

## 5. Engedélyezett termékígéret

**Mondható:** a 16 minta közös értelmezési nyelv az önértékelés-alapú
csapattengelyekhez; a rendszer jelzi a confidence-et, küszöb-közelséget és
alternatív olvasatot.

**Nem mondható:** validált csapattípus, objektív „valódi minta”, diagnózis,
vagy hogy a pilot igazolta a 16 kategóriát.

A Team Scan elsődleges ígérete a közvetlenül mért, változékony réteg:
bizalmi háló és pszichológiai biztonság, forrásjelölt csapatkép, célmutatóhoz
kötött vezetői akció, majd mérési-hiba- és kompozíció-kapuzott visszamérés.
A személyiségdimenzió a csapatösszetétel és stabilitás kontrollja; a mintanév
ennek tanácsadói fordítása, nem a termék bizonyítéka.

