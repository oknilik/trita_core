# „Együttműködésben" fejezet — tervezési doksi (P4.2)

> Cél: az egyéni riport ne csak azt mondja el, KI vagy, hanem azt is, HOGYAN
> működsz másokkal — kivel kattansz természetesen, hol keletkezik súrlódás,
> és mire van szükséged, hogy a legjobbadat hozd. Ez a Trita fő
> differenciátora a leíró tesztekkel szemben (külső verdikt, 2026-07).

## 1. Alapelvek

1. **Dimenzió-szintű, nem archetípus-szintű párosítás.** 30 archetípus
   páronkénti mátrixa 870 cellát jelentene — fenntarthatatlan tartalom.
   Ehelyett a MÁR BEVÁLT P2-architektúrát követjük: 12 kulcsos
   content-készletek (6 dimenzió × high/low), az olvasó markáns
   dimenzióiból komponálva. Így a szöveg mindig a saját profilról szól
   („mivel nálad magas a tervezettség, …"), és bármely kombinációra összeáll.
2. **A meglévő súrlódás-modellre épül.** A team-stats `FRICTION_WEIGHTS`
   already kimondja: munkahelyi súrlódást legerősebben a Tervezettség-,
   Alkalmazkodás- és Integritás-távolság jósol. Az egyéni fejezet ugyanennek
   a modellnek az egyszemélyes vetülete → a csapat-felület és a riport
   nem mondhat ellent egymásnak.
3. **Hipotézis-keretezés** (P1-elv): „jellemzően", „könnyen előfordulhat" —
   plusz explicit jelzés, hogy ez profil-alapú becslés, a valós
   csapat-dinamikát a Trita csapat-felülete méri.
4. **HU+EN párban**, i18n-konvenció szerint; user-facing szövegben nincs
   HEXACO/Belbin említés.

## 2. A fejezet blokkjai (v1)

Új PDF-oldal: **„Együttműködésben"** (plus riport 5. oldala, a
munkastílus-oldal után; observer-riportnál a Reflect elé).

| Blokk | Forrás-logika | Tartalom-készlet |
|---|---|---|
| **Természetes partnerek** | top-2 markáns dimenzió | `COLLAB_CLICK` (12 kulcs): milyen működésű kollégák mellett erősödsz — hasonlóság VAGY komplementaritás, dimenziónként eldöntve |
| **Lehetséges súrlódások** | a magas súrlódás-súlyú dimenziók (THOR, ADAP, INTE) közül azok, ahol az olvasó pólusos | `COLLAB_FRICTION` (12 kulcs): kivel és miben éleződhet — mindig kétirányúan megfogalmazva („neked ők lassúnak tűnhetnek, nekik te kapkodónak") |
| **Ami kihozza belőled a legjobbat** | top-1 markáns dimenzió + legalacsonyabb dimenzió | `COLLAB_NEEDS` (12 kulcs): pszichológiai biztonság + ideális vezetői működés egy blokkban, 2–3 konkrét feltétel |

Szerkezet-döntések:

- A „kivel működsz" NEM nevez meg archetípusokat („a Módszeres újítókkal
  jól kijössz") — működésmódot nevez meg („a strukturáltan dolgozó,
  határidő-tartó kollégák…"). Ez pontosabb és nem címkéz másokat.
- A súrlódás-blokk mindig tartalmaz egy „mit tehetsz" fél mondatot —
  súrlódás-leírás akcióajánlás nélkül csak szorongást ad.
- Az oldal alján forrás-jegyzet: „profil-alapú becslés; a valós
  csapat-dinamikát a csapat-nézet méri" — híd a team-termék felé
  (upsell-értéke is van).

## 3. Példa-szövegek (hangnem-referencia)

`COLLAB_CLICK.THOR_high` (hu):
> „Jól működsz azok mellett, akik tartják, amit vállalnak: a strukturált,
> határidő-tartó kollégákkal gyorsan kialakul a kölcsönös bizalom. Jót tesz
> melléd egy-egy improvizatívabb társ is — ő hozza a fordulatot, te hozod
> a végigvitelt; ez a párosítás akkor működik, ha a szerepek kimondottak."

`COLLAB_FRICTION.ADAP_low` (hu):
> „A leggyakoribb súrlódási pont nálad a stílus: az egyenes, gyors
> visszajelzéseidet a harmónia-orientált kollégák élesnek érezhetik, te
> pedig az ő kerülgetésüket időhúzásnak. Segít, ha a vita elején kimondod:
> a kritika a munkának szól, nem a személynek."

`COLLAB_NEEDS.RESO_high` (hu):
> „Akkor hozod a legjobb formád, ha a hibázás nem megszégyenítéssel jár:
> a kiszámítható visszajelzés és az őszinte, de biztonságos légkör nálad
> nem komfort, hanem teljesítmény-feltétel. Vezetőtől ezt kérd explicit:
> rendszeres 1:1, és nyomás alatt is kiszámítható kommunikáció."

## 4. Technikai terv

1. `profile-content.ts`: `COLLAB_CLICK`, `COLLAB_FRICTION`, `COLLAB_NEEDS`
   (12–12 kulcs, HU+EN) + `COLLAB_SOURCE_NOTE`.
2. `workstyle-content.ts`: `collaboration` mező a `WorkstyleContent`-ben:
   `{ click: string[]; friction: string[]; needs: string[] }` —
   determinisztikus kiválasztás:
   - click: top-2 solo dim (max 2 szöveg);
   - friction: pólusos dimenziók a {THOR, ADAP, INTE} halmazból,
     súrlódás-súly szerint rendezve (max 2); ha egy sincs pólusos →
     kiegyensúlyozott-szöveg („nálad ritkán a személyiség a súrlódás
     forrása — inkább a szerep-tisztázatlanság");
   - needs: top-1 markáns dim + legalacsonyabb dim (max 2).
3. PDF: új `CollabPage` (PdfCard-okból, a meglévi design-nyelven);
   `TritaPdf` + generátor-script oldalsorrend és lapszám frissítés
   (plus: 5 oldal, observerrel: 6).
4. Plumbing: PdfData.plusContent.collaboration; results/page.tsx,
   ProfileTabs glue (a webes megjelenítés későbbi kör — előbb PDF).
5. Ellenőrzés: felhő-render harness két fixture-rel (archetípus + pár),
   overflow-teszt; tsc; szakasz-végi commit.

## 5. Későbbi fázisok (nem v1)

- **Valós pár-adat**: ha a user csapat-tag, a fejezet a team-stats
  éleiből (aligned/complementary/friction) személyre szabott, név nélküli
  összesítést kaphat („csapatodban 2 kollégával komplementer a működésed…").
- Archetípus-név említése a click-blokkban, ha a content-minőség indokolja.
- Webes megjelenítés a results-oldalon (új szekció a munkastílus-tab alatt).
- Normacsoport-alapú kalibráció a pólus-küszöbökre.

## 6. Nyitott kérdések (döntést igényel)

1. A „needs" blokk vezetői ajánlása mehet-e ilyen direkten („Vezetőtől ezt
   kérd explicit…"), vagy puhább framing kell?
2. Az oldal neve: „Együttműködésben" vs. „Együttműködés és súrlódás" vs.
   „Csapatban működve".
3. A forrás-jegyzet említse-e a Trita csapat-nézetet (upsell-híd), vagy
   maradjon semleges módszertani jegyzet?
