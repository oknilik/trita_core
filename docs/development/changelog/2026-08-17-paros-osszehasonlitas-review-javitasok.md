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
