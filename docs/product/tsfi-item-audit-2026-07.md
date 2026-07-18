# TSFI kérdésbank — nyelvi audit (2026-07-16)

> **STÁTUSZ: ÁTVEZETVE (2026-07-16).** Mindhárom csoport javítása bekerült a
> `src/lib/questions/tritan.ts`-be, a self- ÉS observer-változatokban
> (27 item átfogalmazva + 11 célzott helyesírási javítás). Kiegészítés
> átvezetéskor: a 45-ös javaslat „még akkor sem" alakja „még akkor is"-re
> pontosítva (nyelvtani egyeztetés). Az EN szövegek változatlanok.
> A táblázatok innentől történeti referenciák — az új HU szöveg a kódban él.
>
> **EN kör (szintén 2026-07-16):** a 100 observer-item „He/she" szerkezete
> singular they-re modernizálva egyenkénti igeegyeztetéssel; 16-os item
> idézőjelei ki; 12-es item pénzneme egységesen euró (EN+HU).
>
> **TARTALMI KÖR — TSFI v2 (szintén 2026-07-16):** user-döntésre a teljes
> bank lecserélve a public domain IPIP–HEXACO poolból válogatott itemekre
> (magyarítva, 4 formában) — a fenti nyelvi audit így a v1 bank történeti
> dokumentuma. Részletek: changelog 2026-07-16, ötödik kör.

Mind a 100 item átnézve HU–EN párban (`src/lib/questions/tritan.ts`).
Az angol itemszövegek nyelvileg rendben vannak — a javaslatok a magyar
változatra vonatkoznak.

**Kockázati keret a döntéshez:** a bank kalibrálva/validálva van, és a
kalibráció a konkrét megfogalmazásokra érvényes. A **helyesírási javítások
kockázatmentesek** (a jelentés nem változik). A **tartalmi javítások
megváltoztatják az itemet** — pilot ELŐTT még beleférnek (az éles
pilot-adat lesz az új baseline), utána már nem ajánlott. Minden elfogadott
javításnál az **observer-változatot** (3. személyű alak) is igazítani kell.

⚠️ Kapcsolódó jogi kérdés (B1 ügyvédi csomagba): az EN itemek szövegszinten
egyeznek a hivatalos HEXACO-PI-R tételeivel — a kereskedelmi használat
licenc-státuszát tisztázni kell.

## 1. Helyesírás / nyelvtan — javasolt: mind javítani (kockázatmentes)

| # | Jelenlegi (HU) | Javítás | Indok |
|---|---|---|---|
| 12 | „egy millió dollárt" | „egymilló → **egymillió** dollárt" | számnév egybeírása |
| 25 | „verses kötet" | „**verseskötet**" | egybeírás |
| 37 | „egy regényt, zeneszámot, vagy festményt" | „…zeneszámot **vagy** festményt" (vessző törlése) | „vagy" előtt nincs vessző felsorolásban |
| 55 | „Egy, a tudomány és technika történetéről szóló könyv, a végletekig untatna." | „Halálosan untatna egy olyan könyv, amely a tudomány és a technika történetéről szól." | hibás vesszőhasználat az alany után; nehézkes szórend |
| 64 | „az olyan munkákat szeretem ahol…" | „…munkákat szeretem**, ahol**…" | hiányzó vessző |
| 65 | „megosztani valakivel a gondom" | „megosztani valakivel a **gondomat**" | tárgyrag hiányzik |
| 68 | „irányítsák a viselkedésem" | „irányítsák a **viselkedésemet**" | tárgyrag hiányzik |
| 72 | „több elismerés jár nekem mint egy átlagembernek" | „…jár nekem**, mint**…" | hiányzó vessző hasonlításnál |
| 77 | „sem veszteném el a fejem" | „sem **veszíteném** el a fejem" | standard alak |

## 2. Tartalmi eltérés az angoltól — itemenkénti döntést igényel

Ezek mérési szempontból lényegesek: kvantor-eltérés (néha↔gyakran) vagy
jelentés-eltolódás a két nyelv között → a HU és EN kitöltők nem pontosan
ugyanazt az állítást pontozzák.

| # | EN (mérce) | Jelenlegi HU | Javaslat | Probléma |
|---|---|---|---|---|
| 2 | I clean my office or home quite frequently. | „…rendszeresen ügyelek a rendre és tisztaságra." | „Elég gyakran takarítok otthon vagy a munkahelyemen." | cselekvés → attitűd eltolódás |
| 3 | I **rarely** hold a grudge… | „Még azokkal szemben **sem vagyok** haragtartó…" | „**Ritkán** vagyok haragtartó, még azokkal szemben is, akik csúnyán megbántottak." | kvantor: rarely → abszolút tagadás |
| 9 | People **sometimes** tell me… | „Az ismerőseim **gyakran** állítják…" | „Az ismerőseim **néha** mondják, hogy túl kritikus vagyok másokkal." | kvantor: sometimes → gyakran (erősít!) |
| 19 | **I think that** paying attention to radical ideas is a waste of time. | „A radikális nézetekkel való foglalkozás **egyszerűen** időpocsékolás." | „**Úgy gondolom**, időpocsékolás radikális nézetekkel foglalkozni." | elhagyott keretezés + betoldott nyomatékosító |
| 24 | …who is **no better** than others. | „…**se jobb, se rosszabb**." | „Átlagos ember vagyok, aki semmivel sem jobb másoknál." | a „se rosszabb" betoldás mást mér (önértékelés) |
| 39 | I am usually quite **flexible in my opinions**… | „**könnyen megváltoztatom** a véleményem…" | „Általában rugalmasan kezelem a véleményemet, ha mások nem értenek egyet velem." | rugalmasság → befolyásolhatóság eltolódás |
| 48 | I wouldn't want people to **treat me** as though I were superior. | „…ha mások jobbnak **tartanának** maguknál." | „Nem szeretném, ha úgy **bánnának** velem, mintha különb lennék náluk." | bánásmód → vélekedés |
| 68 | I don't allow my **impulses** to govern my behavior. | „…a **pillanatnyi érzelmeim** irányítsák…" | „Nem hagyom, hogy a hirtelen **késztetéseim** irányítsák a viselkedésemet." | impulzus ≠ érzelem — ÉS a 20-as item HU-ja majdnem azonos szövegű lett (kitöltőnek duplikátum-érzet) |
| 82 | I tend to feel quite **self-conscious** when speaking in front of a group. | „**Nem szeretek** sok ember előtt felszólalni…" | „Elég feszélyezve érzem magam, ha emberek csoportja előtt kell beszélnem." | szorongás → preferencia eltolódás |
| 88 | **The first thing** I always do in a new place is to make friends. | „…**hamarosan** új barátságokat is kötök." | „Ha új helyre kerülök, az első dolgom, hogy barátokat szerezzek." | prioritás gyengítve |
| 89 | I **rarely** discuss my problems… | „**Szinte sosem** vitatom meg…" | „**Ritkán** beszélem meg a problémáimat másokkal." | kvantor erősítve + „megbeszélem" természetesebb |
| 95 | I remain **unemotional**… | „**Semleges** maradok…" | „Nem hatódom meg olyan helyzetekben sem, amelyekben a legtöbb ember elérzékenyül." | „semleges" mást jelent |
| 98 | I try to give **generously**… | „Megpróbálok adakozni…" | „Igyekszem **bőkezűen** adakozni a rászorulóknak." | kimaradt kvalifikátor |

## 3. Stílus / regiszter — opcionális finomítások

| # | Jelenlegi HU | Javaslat | Megjegyzés |
|---|---|---|---|
| 6 | „Ha valakitől, akit tulajdonképpen nem is kedvelek, szeretnék valamit, a cél érdekében képes vagyok…" | „Ha olyasvalakitől akarok valamit, akit nem kedvelek, képes vagyok nagyon kedvesen viselkedni vele, hogy elérjem." | túl bonyolult beágyazás |
| 11 | „aggodalmaskodjak" | „aggódjak apróságok miatt" | régies alak |
| 14 | „Gyakran ismételten is leellenőrzöm" | „Gyakran többször is átnézem a munkámat, nincs-e benne hiba." | körülményes |
| 16 | „üres társalkodást" | „üres csevegést" | „társalkodás" archaikus |
| 45 | „Nem szoktam felkapni a vizet" | „Ritkán gurulok dühbe, még akkor sem, ha rosszul bánnak velem." | idióma-regiszter + „rarely" visszaadása |
| 49 | „klasszikus koncertre" | „komolyzenei koncertre" | pontosabb (classical music) |
| 57 | „Jobbára jóindulattal ítélkezem mások felett." | „Általában elnézően ítélem meg másokat." | régies + formális |
| 60 | „mindegy mekkora is lenne az az ajánlat" | „bármekkora összegről lenne is szó" | pongyola |
| 62 | „ha ez többletidőmbe kerül" | „ha ez több időt vesz igénybe" | szokatlan alak |
| 66 | „jó drága autóban ülve vezetek" | „egy nagyon drága autót vezetek" | redundáns + informális |
| 79 | „lapozgattam egy lexikonban" | „lapozgattam élvezettel lexikont" | vonzat |
| 84 | „Kísértésbe vinne" | „Kísértést éreznék" | természetesebb |
| 90 | „méregdrága, luxus cuccaim" | „méregdrága luxuscikkeim" | szleng regiszter + egybeírás |

## Nem jelölt itemek

A többi ~65 item nyelvileg és tartalmilag rendben van — több kifejezetten
jó adaptáció (pl. 54: „worst jokes" → „faviccein", 73: „a szél bolyong a
fák között", 97: „kevesebb szerencse jutott az életben").

## Javasolt sorrend

1. **1. csoport (helyesírás)**: azonnal átvezetni — kockázatmentes.
2. **2. csoport (tartalmi)**: itemenként dönteni, MOST, a pilot előtt —
   később már mérési törést okozna.
3. **3. csoport (stílus)**: ízlés szerint; egy körben a 2. csoporttal.
4. Minden átvezetett javításnál az observer-változat (3. személy) is frissül.
5. Átvezetés után: unit tesztkör + egy teljes próbakitöltés dry runban.
