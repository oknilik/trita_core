# Blog — írásszabály

> Érvényes: 2026-09-01 óta. A `content/blog/*.mdx` cikkekre vonatkozik.
> Ütközés esetén a `CLAUDE.md` termékszabályai előbbre valók (ld. lentebb).

## Kinek írunk

Magyar kkv- és csapatvezetők, HR-esek, valamint önmegismerés iránt
érdeklődő laikusok.

## Megszólítás és hang

- Tegezd az olvasót, egyes szám második személyben.
- Narratív cikkben E/1-ben írj („azt látom, hogy"). Referenciacikkben
  intézményi többes szám („a mérésünk").
- Ne bújj passzív szerkezetek mögé. „Megállapítható, hogy" helyett mondd
  meg, ki állapította meg.
- Könnyed, de nem laza. A mérce: egy 45 éves ügyvezető is elolvassa, és
  egy pszichológus se fintorogjon rajta.
- Ne oktass felülről. Ne írd le, hogy „fontos megérteni" vagy „ne feledd".

## Mondat és bekezdés

- Átlagos mondathossz 15-20 szó. Minden bekezdésben legyen legalább egy
  rövid, 8 szó alatti mondat.
- Bekezdés maximum 4 mondat. Ha hosszabb lenne, vágd ketté.
- Kerüld a gondolatjeles közbevetést. Amit közbevetnél, tedd külön
  mondatba. Pontosvesszővel se fűzz össze két gondolatot.
- Kerüld a „nem X, hanem Y" szerkezetet és a kettőspont utáni csattanót
  („A válasz egyszerű: …").

## Alátámasztás

- Minden érdemi állítás mögé kerüljön adat, kutatási hivatkozás vagy
  konkrét eset. Ha nincs, fogalmazz óvatosabban. Ne találj ki számot.
- Kutatás megnevezésénél: szerző vagy intézmény + évszám + mit mért. Ne
  írj olyat, hogy „kutatások szerint" forrás nélkül.
- Ha egy évszámban vagy hivatkozásban bizonytalan vagy, jelezd a cikk
  után, ne írd bele találgatásként.
- Az effektusméreteket és korrelációkat magyarázd el köznyelven is,
  közvetlenül a szám után.
- Ha bizonytalan egy összefüggés, mondd ki. A módszertani őszinteség itt
  márkaelem.
- A `StatCard` értékei is állítások: forrás nélküli szám ne álljon a
  cikk elején.

## Szakkifejezések

- Első előforduláskor egy mondatban magyarázd el a szakszót.
- **A modell megnevezése — a `CLAUDE.md` szabálya az irányadó.** A
  user-facing szöveg NEM nevezi a modellt „HEXACO-nak". Helyette „hat
  személyiségdimenzió" / „hat dimenzió mentén", ahol modellnevet kell
  mondani, ott „hatfaktoros személyiségmodell". A HEXACO név csak a
  módszertani-irodalmi hivatkozásokban marad (forrásjegyzék, a modell
  eredetének említése). Ugyanez az IPIP-eredetre: a felületen „szabadon
  felhasználható, kutatásban használt kérdésbank".
- A DIMENZIÓ-CÍMKÉK viszont a HEXACO terminológiát követik, mert ezek a
  skálák nevei: Becsületesség-Alázat, Emocionalitás, Extraverzió,
  Barátságosság, Lelkiismeretesség, Nyitottság. Kanonikus térkép:
  `src/lib/hexaco.ts` — új címkét ne vezess be.
- Ne írj „típust" személyiségre vagy csapatra. A helyes szó: mintázat,
  működési mintázat, profil. (Kivétel: ahol maga a kategorizálás a téma,
  ott a „kategória" a pontos szó.)
- Ne írj „coaching"-ot. Helyette: tanácsadói konzultáció, kísérés.
- Ne írj „Belbin"-t. A mérés neve „csapatszerep-kérdőív", a modell
  „Trita csapatszerep-modell (9 szerep)".

## Szerkezet

### Narratív cikk (jelenség-elemző, vezetői gyakorlat)

- Egy cikk = egy állítás. Írd le magadnak egy mondatban, mielőtt kezded.
  Minden szakasz ugyanazt az állítást világítja meg más oldalról.
- Nyiss jelenettel: konkrét szervezet, konkrét helyzet, konkrét emberek.
  Ne általánosítással.
- Építs a cikk közepére egy ellentétpárt, ami rendezi az egészet.
- Ismételd a kulcsmondatot 2-3 alkalommal, szó szerint.
- A záró szakasznak vissza kell térnie a nyitó jelenethez. Nem
  megoldásként, hanem másik megvilágításban. Ha nem tudsz visszatérni
  hozzá, rossz jelenetet választottál.
- Két-három H2, hogy az ív ne szakadjon szét.

### Referenciacikk (fogalommagyarázó, módszertani)

- A cél a visszakereshetőség, nem az ív. Beszédes H2-k.
- Ne jelentsd be, mit fogsz csinálni. Kezdd a legerősebb állítással.
- Párhuzamos elemeknél a lista indokolt, a lenti hosszkorlát nem
  érvényes.
- Minden absztrakt leírás mellé egy fél mondat konkrétum arról, hol
  bukkan fel a gyakorlatban.
- Zárás: a korlátok őszinte megnevezése, majd egy továbbvezető link.

### Mindkét típusnál

- H2 alcímek beszédesek legyenek. Ne „Bevezetés", ne „Összefoglalás".
- Felsorolást csak párhuzamos elemekre. Narratív cikkben legfeljebb egy
  lista, 5 pontnál nem hosszabb.
- Nagy, ellenőrizhetetlen kijelentésből legfeljebb egy férjen el
  cikkenként, és az is legyen alátámasztva.

## Tiltólista

Soha ne használd: forradalmasítja, letisztult, kulcsfontosságú,
izgalmas, valóban, őszintén szólva, mélyre ásunk, a mai rohanó világban,
egyre inkább, nem véletlen, hogy; leegyszerűsítve; ahogy említettük;
fontos megjegyezni, hogy; „Nézzük meg közelebbről"; „Merüljünk el";
„Ebben a cikkben megvizsgáljuk / megmutatjuk"; emojik; felkiáltójel.

## Hossz

800-1400 szó.

## Formátum és technikai kötöttségek

- **A cikk mindig MDX**, a `content/blog/` alatt, a meglévő frontmatter
  sémával: `title`, `description`, `publishedAt`, `locale`,
  `translationSlug`, `coverImage`, `art*`, `tags`, opcionálisan
  `startHere`.
- **Minden cikknek van HU és EN párja**, a `translationSlug` mindkét
  irányban mutasson.
- Komponensek: `StatRow`/`StatCard`, `Callout`, `KeyInsight`,
  `DimBadge`, `CompareTable`, `TeamReportFigure`, `ResultAccessFigure`.
- Belső link relatív `/blog/<slug>` alakban.
- **Adatvédelmi szerződésmondatok.** A csapatriport-cikkekben rögzített
  mondatokat a `tests/unit/blog/team-report-privacy.test.ts` szó szerint
  megköveteli. Átfogalmazás előtt nézd meg a tesztet: az egyéni és az
  aggregált nézet határa nem stíluskérdés.
- Termékadatok (kitöltési idő, küszöbértékek) a kódból ellenőrizendők,
  ne emlékezetből írd őket.
