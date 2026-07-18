# TRITAN — a Trita hatfaktoros modellje (elnevezés és kódrendszer)

> Frissítve: 2026-07-16 · **A TRITAN a Trita kanonikus modellneve** — a kódban,
> az adatokban és a felületen egyaránt. A korábbi kétrétegű megoldás
> (mérési réteg régi kódokkal + TRITAN mint megjelenítési névtér) megszűnt:
> 2026-07-16-tól a codebase kizárólag TRITAN-elnevezéseket használ.

**T·R·I·T·A·N** = Tempo · Resonance · Integrity · Thoroughness · Adaptability ·
ope**N**ness (az N a szó belsejéből).

Kanonikus forrás a kódban: `src/lib/tritan.ts` (típus: `TritanDimCode`).
Kérdésbank: `src/lib/questions/tritan.ts` (TSFI).

## Miért 4 betűs dimenziókódok?

A TRITAN mozaikszóban **két T** szerepel (Tempo, Thoroughness), ezért egybetűs
kód nem lehet egyértelmű. A kódrendszer ezért 4 betűs:

| Kód | EN | HU | Radar-betű |
|---|---|---|---|
| `TEMP` | Tempo | Társas energia | T |
| `RESO` | Resonance | Rezonancia | R |
| `INTE` | Integrity | Integritás | I |
| `THOR` | Thoroughness | Tervezettség | T |
| `ADAP` | Adaptability | Alkalmazkodás | A |
| `OPEN` | Openness | Nyitottság | N |

A felületen a TRITAN megjelenítés él: a radar tengelyei a mozaikszó betűit
adják ki TRITAN-sorrendben (T·R·I·T·A·N), a pontos dimenziót a sorrend és a
kifejtés azonosítja. Kompakt chipekhez 3 betűs rövidítés: `TRITAN_DIM_ABBR`
(HU: TÁR/REZ/INT/TER/ALK/NYI · EN: TEM/RES/INT/THO/ADA/OPE).

## Történeti megfeleltetés (archívum)

A 2026-07-16-i átnevezés előtt a kód és az adatbázis egybetűs kódokat
használt. **2026-07-16-án a DB tiszta lappal újraindult** (döntés: teljes
törlés + egyetlen init migráció) — a DB natívan TRITAN-kódokat tárol,
legacy-normalizáló réteg NINCS. Az alábbi tábla kizárólag a régi
exportok/dumpok (pl. `neon_full_2026-04-10*.sql`) értelmezéséhez archívum:

| Régi kód | Új kód | Régi konstruktum-név |
|---|---|---|
| `H` | `INTE` | Honesty-Humility |
| `E` | `RESO` | Emotionality |
| `X` | `TEMP` | eXtraversion |
| `A` | `ADAP` | Agreeableness |
| `C` | `THOR` | Conscientiousness |
| `O` | `OPEN` | Openness to Experience |
| — | — | Altruism (intersticiális) → Segítőkészség / Helpfulness |

A régi dumpok visszatöltése a jelenlegi alkalmazásba NEM támogatott
(kulcs-transzformáció kellene hozzá a fenti tábla szerint).

## Facetek

| Kód | TRITAN EN | TRITAN HU |
|---|---|---|
| sincerity | Sincerity | Egyenesség |
| fairness | Fairness | Méltányosság |
| greed_avoidance | Moderation | Mértékletesség |
| modesty | Modesty | Szerénység |
| fearfulness | Caution | Óvatosság |
| anxiety | Stress Sensitivity | Stresszérzékenység |
| dependence | Support Seeking | Támaszkeresés |
| sentimentality | Emotional Bonding | Érzelmi kötődés |
| social_self_esteem | Social Confidence | Társas önbizalom |
| social_boldness | Presence | Fellépés |
| sociability | Sociability | Társaságkedvelés |
| liveliness | Vitality | Lendület |
| forgiveness | Forgiveness | Megbocsátás |
| gentleness | Acceptance | Elfogadás |
| flexibility | Flexibility | Rugalmasság |
| patience | Patience | Türelem |
| organization | Organization | Rendszerezettség |
| diligence | Persistence | Kitartás |
| perfectionism | Precision | Precizitás |
| prudence | Deliberation | Megfontoltság |
| aesthetic_appreciation | Aesthetic Sensitivity | Esztétikai fogékonyság |
| inquisitiveness | Curiosity | Kíváncsiság |
| creativity | Creativity | Alkotókedv |
| unconventionality | Unconventional Thinking | Rendhagyó gondolkodás |

## Szándékos kivételek

- **Visszajelző kérdőív** (`results.surveyQ2Hexaco` i18n kulcs) — a
  „töltöttél-e ki hasonló tesztet?" kérdés opciói KÜLSŐ tesztmárkákat
  sorolnak fel (MBTI, Big Five, HEXACO, DISC); itt a HEXACO egy harmadik
  fél instrumentumának neve, nem a Trita modellé.
- **Changelog és audit dokumentumok** — történeti rekordok, nem írjuk át őket.

## Kutatási riportolás

Szakdolgozatban / publikációban a hatfaktoros modellcsalád eredeti
konstruktum-neveit kell használni, a fenti történeti megfeleltetési táblára
hivatkozva. A blogon a modellösszehasonlító cikkek TRITAN néven, módszertani
lábjegyzettel jelölik, hogy a hivatkozott kutatások a hatfaktoros
modellcsaládra vonatkoznak.
