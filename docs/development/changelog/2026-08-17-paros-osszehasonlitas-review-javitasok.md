# 2026-08-17 — Páros összehasonlítás (PR #29) review-javítások

> A `/interaction` újratervezése (`codex/refine-character-comparison`) a mobil
> fájdalompontot valóban megoldotta — közös hero-vászon, névvel irányított
> kapcsolat-választó, láthatóbb módszertani keret. Product/UX review során hat
> pont maradt nyitva: a legvékonyabb tartalmi payload körül a legtöbb keret, a
> leggyakoribb (nulla kapcsolatos) user rosszabb helyzetbe került, és egy
> consent-elv apró megsértése. Ez a kör azokat javítja.

## 1. A „Közös kép" nem ismétli meg a nyitott panelt

A `PairInteractionView` a „Közös kép" blokkban az `easy[0]` és `friction[0]`
mondatot mutatta, majd **ugyanazt** az alapból nyitott 1. panelben újra. A
motor összesen max 3 atomot választ (`interaction-engine.ts`, `maxAtoms = 3`),
tehát ez gyakran nem részleges átfedés volt, hanem szó szerinti duplikáció egy
képernyőn belül.

A panelek most csak azt hozzák, ami a közös képen **túl** van
(`sim.easy.slice(1)` / `sim.friction.slice(1)`); a `discuss` külön szövegblokk,
az egészben marad. Az üres panel kiesik, és a sorszám a **látható** panelekhez
igazodik — nincs lyuk a számozásban. Ha minden erősség- és súrlódásjelzés
beleférne a közös képbe, csak a „Mit beszéljetek meg előre" blokk marad, ami
így is teljes.

Mellékesen: a közös kép eddig csak akkor jelent meg, ha **mindkét** oldal
megvolt (`summaryEasy && summaryFriction`). Egyoldalas esetben az egész blokk
eltűnt, ahelyett hogy a meglévő felét mutatta volna — most a létező oldalt
rendereli, egyhasábosan.

## 2. Nulla kapcsolatnál a meghívás a feladat, nem rejtett másodlagos művelet

A chooser alapból a „Valódi személlyel" úton állt, függetlenül attól, van-e
elfogadott párja a usernek. Akinek nincs — a userek nagy többsége — ezt látta:
„Válassz a kapcsolataid közül" → üres lista → és az egyetlen értelmes akció, a
meghívás, egy toggle mögé rejtve.

- `InteractionComparisonChooser`: a default út az **adatból** dől el. Van
  elfogadott pár → `real`; nincs → `type`, ami azonnal használható. A valódi út
  elvi elsősége a kártyák **sorrendjében** marad meg, nem a default
  kiválasztásban.
- `CompareInviteCard`: nulla kapcsolatnál saját cím és szöveg
  (`compareConnectionsEmptyTitle/Body`, `compareInviteFirstTitle`), a
  meghívó-űrlap **nyitva** indul, és a toggle eltűnik — nincs mire visszacsukni.

## 3. Nem mond üres listát, ha van kiküldött link

A `compareListEmpty` („Még nincs aktív linked vagy elfogadott párod") akkor is
megjelent, ha csak *elfogadott* pár nem volt — miközben közvetlenül alatta ott
volt a „Függő meghívások" lista az aktív linkkel. Új, állapot-helyes szöveg
(`compareListPendingOnly`); nulla kapcsolatnál pedig placeholder helyett a
nyitott meghívó-blokk a tartalom.

## 4. A kapcsolat-választó nem a képernyőn kívül hat

A vezetői jegyzetek az oldal **alján** álltak, a választó a hero alatt: mobilon
a user átállította a kapcsolatot, és semmi visszajelzést nem kapott. Mivel ez
az egyetlen tartalom, ami a választótól függ, most közvetlenül alatta áll (a
„Közös kép" előtt), `aria-live="polite"` régióban — a wrapper üresen is a fában
marad (`sr-only`, nincs layout-hatása), hogy a megjelenés bemondható legyen.

## 5. A visszavont pár glyph-je nem megy ki a kliensre

Az `otherGlyph` (a partner két legerősebb dimenziója + intenzitás) **minden**
invite-ra rákerült a payloadra, ahol volt `otherId` — státusztól függetlenül.
Egy elfogadott, majd **visszavont** párnál is átment a böngészőbe, csak nem
renderelődött. A `compare-invite.ts` viszont kimondja: „bármelyik fél bármikor
visszavonhat".

Most `state === "ACCEPTED"` a feltétel, és a szerver is csak az élő párok
profilját olvassa ki — a visszavont párnál a partner adatai a szerveren sem
kellenek.

## 6. A partner neve olvasható méretben

A név `text-micro` (10px) verzálban, `tracking-widest`-tel jelent meg,
miközben a *típuscímke* alatta 15/18px volt — a hierarchia fordítva állt. A név
`text-caption` (13px), nem verzál: egy személynév verzálban címkeként olvas,
nem névként.

## Ráadás: a review során talált apróságok

- **Visszavonás megerősítéshez kötve.** A művelet a másik félnél is megszünteti
  a közös képet, és közvetlenül a primary CTA mellett állt, egy kattintással.
  Most kétlépéses („Mindkettőtöknél megszűnik. Biztos?").
- **`RelationshipModeSelect` fókusz-csapda.** A `Tab` az opción `setOpen(false)`-t
  hívott `preventDefault` nélkül: a bezárás unmountolta a fókuszált opciót, a
  fókusz a `<body>`-ra eshetett. Most a trigger kapja vissza. Az opciók
  `tabIndex={-1}`-et kaptak — a listbox egy tab-stop, az opciók között nyíllal
  lépünk.
- **44px-es touch target** a select triggeren (32px volt).

## 7. A két összehasonlítási út egy rendszer lett

Bejelentés: „nem ugyanazt látom, ha karakterrel hasonlítok össze, mint amikor
ugyanazzal a stílussal valódi profilon". Utánamérve **nem pontszám-hiba**: a
motor mindkét úton ugyanaz, a karakter-út kimenete a valódi út **részhalmaza**.

Az `archetypePrototype()` a hat dimenzióból négyet fixen `50`-re állít, ami
pont a középvonal — a `polarSides()` azokat nem tekinti pólusosnak. Így a
prototípusnak **pontosan 2** pólusos dimenziója van, egy valódi partnernek
viszont 2–6. Mérés 12 generált valódi partnerrel, akiknek a top-2 dimenziója
azonos az „O-X" karakterrel:

- 22/30 (**73%**) valódi atom megjelent a karakter-úton is,
- **6/12 esetben teljesen azonos** volt a kimenet,
- a többiben a valódi út 1–2 mondattal többet mondott — olyan dimenziókról,
  amikről a prototípus nem tud.

Amit ez a kör javított — a **megjelenítést**, hogy a maradék (valódi) eltérés
ott maradjon, ahol tartozik, a motor bemenetében:

- **Közös prezentáció.** Új `InteractionDynamicPanels`: a „Közös kép" +
  számozott accordion mostantól EGY komponens, amit mindkét felület használ.
  Eddig ugyanaz a mondat a valódi úton „Ami összeköt", a karakter-úton „Ami
  magától megy" címke alatt jelent meg — két név ugyanarra. (Ez a 1. pont
  dedup-javításának mellékhatása volt: az első sor kimozdult a panelből.)
- **Közös vezetői blokk.** Új `InteractionLeaderNotes` — a live-region és a
  választó alatti elhelyezés mindkét úton azonos.
- **Közös kapcsolat-választó, három iránnyal.** A karakter-út 2 állapotú
  pilljét a `RelationshipModeSelect` váltja. Az „Én vezetem vagy mentorálom őt"
  irány ott eddig **egyáltalán nem volt elérhető**: `buildArchetypeSimulations`
  fixen `other-leads`-szel futott. Most `leaderNotesSelf` + `leaderNotesOther`
  jön (mint a valódi páros nézetben), így a kapcsoló ott sem jár hálózattal.
  A kontroll pozicionálása `className`-be került — nem a komponens tudja, hogy
  sötét hero alá lóg-e be.
- **Kimondott tartalmi határ a tartalom ELŐTT.** Az `interactionTypeScopeNote`
  megnevezi a karakter két dimenzióját, és kimondja, hogy egy valódi profil
  ezért többet és mást is mutathat. A módszertani jegyzet
  (`interactionSourceNote`) nem ismétli — az a lap alján marad, most a valódi
  úttal azonos „i"-boxban.
- **Chooser-szöveg.** A „pontosabb közös kép" félrevezetett: azt sugallta,
  hogy ugyanaz a tartalom, csak élesebben. Helyette „mind a hat dimenzió
  számít" vs. „két dimenzióra épülő szimuláció".

Amit **nem** tettünk: a prototípus négy semleges dimenzióját nem töltjük fel.
Az kitalált állítás lenne, és szemben megy a „becsült vs mért" alapelvvel.

## 8. A rövid valódi kép nem látszik hibának — és a chooser már nem ígér többet

Bejelentés: a valódi páros nézet kevesebbet ad, mint a karakter-út. Mérve
**igaz, és rendszerszintű** — de nem hiba, és nem is fordítva van, mint ahogy a
7. pont chooser-szövege sugallta.

A prototípus pontszámai `86` / `74`, a pólus-küszöb `65` / `35`
(`PROFILE_HIGH_THRESHOLD`), vagyis a karakter **maximálisan pólusos**. Egy
valódi ember jellemzően 55–70 között tetőzik, tehát gyakran csak 1–2 dimenziója
lépi át a küszöböt. 30 archetípus vs. 200 valósághű partner egy profilra:

| | átlag atom | ≤1 atom |
|---|---|---|
| Karakter-út | **2,53** | 2/30 |
| Valódi út | **1,93** | **61/200 (30%)** |

Tehát a valódi pároknál minden harmadik eset „rövid". Ehhez két dolgot kellett
javítani:

- **A progresszív feltárás csak ott fut, ahol van mit feltárni.** Egyetlen atom
  esetén a „Közös kép" elviszi az easy és friction első sorát, és csak a
  „Mit beszéljetek meg előre" marad — egy sorszámozott, összecsukható,
  egyelemű accordion. Az apparátus (a „1", a chevron, a csukott állapot)
  kevesebbnek MUTATJA a tartalmat, mint amennyi. Két blokk alatt ezért a
  blokk nyitva, cím szerint, accordion nélkül áll.
- **Kimondjuk, ha a pár egyetlen markáns ponton tér el**
  (`comparePairThinNote`). A `sparse` jelzés a 0 atomos esetet fedte; az
  1 atomosra eddig nem volt szó, és pont az látszik hibának.

A 7. pont chooser-szövegét vissza kell vonni: sem a „pontosabb közös kép", sem
a helyére írt „mind a hat dimenzió számít" nem volt igaz ígéret — **mindkettő
több tartalmat sugallt a valódi úton**, miközben mérve a karakter-út a bővebb.
A kártyák most azt mondják meg, MI az adott út, nem azt, melyik ad többet:
„a ti tényleges dinamikátok" vs. „elméleti karakter · gyors próba".

Amit itt sem tettünk: a pólus-küszöböt nem lazítottuk. Attól több atom lenne,
de a középsáv szándékosan néma — kiegyensúlyozott dimenzióról nem állítunk
dinamikát (`interaction-engine.ts:37-39`).

## Ami tudatosan maradt

- Az `EditorialBackHeader` ikon-only vissza gombja `ProfileTabs`-ben és
  `LinearReport`-ban nem nevezi meg a célt a látó usernek (az `aria-label`
  rendben van). Az `/interaction`-nél az eyebrow megoldja; ott nem. Design-döntés,
  külön körre hagyva.
- A saját listbox vs. natív `<select>` kérdés: a natív mobilon az OS pickerét
  nyitja (nagyobb targetek, ismerősebb). A cserét nem vontuk vissza, csak a
  fókusz-hibáit javítottuk.
- Halott i18n kulcsok (`comparePairTitle`, `comparePairWith`, `compareCardTitle`,
  `compareRelationSelfLeads`, `interactionLeaderToggle`) — a `t()` hívások
  helyenként dinamikus kulcsot építenek, ezért a törlés külön, grep-elt kör.
- A `comparePairBack` („Vissza a típus-választóhoz") a consent-oldalon már
  elavult: az `/interaction` nem típus-választó, hanem chooser.

## Tesztek

`tests/client/results/pair-interaction-view.test.tsx` — a duplikáció-mentesség,
a kiürült panel elhagyása + sorszámozás, a név mérete, a választó melletti
live-region és sorrend, valamint a `Tab` fókusz-visszaadása.

`compare-invite-card.test.tsx` — nulla kapcsolat (nyitott űrlap, nincs toggle),
elfogadott kapcsolat (lista a tartalom, meghívás másodlagos), függő-only
állapot szövege, visszavonás-megerősítés.

`interaction-comparison-chooser.test.tsx` — a default út mindkét adatállapotra.

`interaction-section.integration.test.tsx` — mindhárom kapcsolat-irány a
karakter-úton (az „én vezetem" irányt eddig nem lehetett tesztelni, mert nem
létezett), és a tartalmi határ kimondása. A tesztek továbbra is a VALÓDI
motor-kimeneten futnak, nem fixture-ön.

`tests/unit/platform/interaction-view.test.ts` — mindkét vezető-irány elő van
számolva minden archetípusra, és a self-irány (ami csak a saját profiltól függ)
mind a 30-nál azonos.
