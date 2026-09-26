# Blog — írásszabály

> Érvényes: 2026-09-01 óta. A `content/blog/*.mdx` cikkekre vonatkozik.
> A közös magyar nyelvi alapelveket a [magyar stíluskalauz](hungarian-style-guide.md) rögzíti.
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
- Írj közvetlenül, természetes beszédritmussal. Az olvasó szakmai
  háttér nélkül is követhesse a gondolatmenetet; a pontosságot a világos
  állítás és annak alátámasztása adja.
- Ne oktass felülről. Ne írd le, hogy „fontos megérteni" vagy „ne feledd".

## Mondat és bekezdés

- A mondat hossza a gondolathoz igazodjon. A több állítást vagy sok
  közbevetést tartalmazó mondatot bontsd fel, ha így könnyebb követni.
- Egy bekezdés egy gondolatot fejtsen ki. Új témánál vagy az érvelés új
  lépésénél kezdj új bekezdést. Ne írj elő kötelező szószámot vagy
  mondatszámot, és ne tördeld mesterségesen a szöveget.
- A közbevetések és az írásjelek a megértést segítsék. Ha az olvasónak
  vissza kell keresnie az alanyt vagy a mondat elejét, fogalmazz egyszerűbben.
- Az ellentétet akkor használd, ha pontosítja az állítást. Kerüld a
  visszatérő „nem X, hanem Y" fordulatot és a mesterséges csattanókat.
- A jelenetet követő magyarázat adjon új szempontot. Ne mondd el újra
  a tanulságot a bekezdés végén, kiemelésben és a cikk zárásában is.
- A szerkesztett [teljes blogminta és a hozzá tartozó példák](hungarian-style-samples.md)
  mutatják a közös hangot. Új történet részleteit ne találjuk ki pusztán
  azért, hogy élőbb legyen a szöveg.

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

- Legyen egy központi kérdés vagy gondolat. Írd le magadnak egy mondatban,
  mielőtt kezded. Minden szakasz ennek megértéséhez adjon hozzá.
- Nyiss jelenettel: konkrét szervezet, konkrét helyzet, konkrét emberek.
  Ne általánosítással.
- A jelenetből derüljön ki a kérdés vagy nehézség, amelyet a cikk körüljár.
  Ellentétpárt csak akkor építs be, ha a történetből következik.
- A fő állítást az eset és az érvelés tegye világossá. Ne ismételj
  szó szerint mondatokat pusztán a ritmus vagy a hangsúly kedvéért.
- A zárás mutassa meg, mire jutottak a szereplők, és mi maradt nyitott.
  Visszatérhet a nyitó jelenethez, ha ez segít érzékeltetni a változást.
- Az alcímek a történet fordulópontjait kövessék. Annyit használj,
  amennyi a gondolatmenet áttekintéséhez szükséges.

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
- Felsorolást párhuzamos elemekre használj, ha így könnyebb áttekinteni
  őket. Az összefüggő történetet bekezdésekben vidd tovább.
- A nagyobb következtetéseknél is legyen világos, milyen adat vagy
  tapasztalat támasztja alá őket, és mire nem ad választ a példa.

## Üres fordulatok helyett konkrét állítás

Az olyan bevezetők, mint „a mai rohanó világban”, „Merüljünk el” vagy
„Ebben a cikkben megvizsgáljuk”, rendszerint késleltetik az érdemi mondatot.
Kezdj a helyzettel vagy a megállapítással.

A „forradalmasítja”, „kulcsfontosságú” és hasonló nyomatékosítás helyett
mondd el, mi változik és kinek jelent ez segítséget. A „valóban” vagy az
„egyre inkább” maradhat, ha pontosítja az állítást; puszta hangsúlyozásként
húzd ki. A felkiáltójel illeszkedjen a mondat hangjához, például egy idézett
megszólaláshoz. A szöveg lendületét a tartalom és a mondatok ritmusa adja.

## Hossz

A hosszt a téma és az olvasó kérdése határozza meg. A teljes gondolatmenet,
a szükséges magyarázatok és a források férjenek el benne; szószám miatt ne
ismételjünk, és ne hagyjunk ki fontos feltételt.

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
