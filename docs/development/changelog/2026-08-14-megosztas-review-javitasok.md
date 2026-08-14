# 2026-08-14 — Megosztási UX (PR #27) review-javítások

> A megosztási flow újratervezése (`codex/results-share-ux-audit`) jó irányba
> vitte a modalt, de a publikus megosztott lapon tartalom veszett el, a
> visszavonás pedig szűkebb feltételre került, mint amit a szerver csinál.
> Ez a kör azokat javítja.

## 1. A megosztott lap visszakapta a személyre szabott tartalmat

A `/share/[token]` a dimenzió-akkordeonban a dimenzió **általános
definícióját** mutatta a pontszámhoz tartozó **személyre szabott értelmezés**
helyett — vagyis két ellentétes profil ugyanazt a bekezdést kapta, csak a szám
és a pólus-címke tért el. A `getInsight()` visszakerült: elöl az értelmezés,
alatta halkabban a definíció (az adja a kontextust annak, aki most találkozik
a dimenzióval).

A „Mélyebb kép" fejezetek sablonszöveg helyett a valódi, közös producerből
(`workstyle-content`) épülő tartalmat kapták:

- **Ahogy működik** → `HowYouWorkSection` (fő mintázat / figyelendő /
  jellemző mintázat / kontextus) a korábbi egymondatos sablon helyett, ami
  minden profilnak ugyanazt a két dimenzió-nevet mondta fel.
- **Ideális környezet** → `IdealEnvironmentSection`. A helyi
  `environmentLevel()` az érték-szöveg `" – "` előtti felét vágta ki, azaz a
  magyarázó fél mondat kiesett, a hedge-sáv („Inkább magas") pedig elveszett.
  Ez ráadásul pont az a prefix-parser minta, amit a motor-audit v3 #11 után
  vezettünk ki (`resolveEnvRowKey` / `resolveEnvLevel`) — a kanonikus feloldó
  most a megosztott nézetben is fut.
- **Szerep-illeszkedés** → `RoleFitSection`, ami teljesen kikerült a lapról.

A három szekció új `hideHeading` propot kapott: ha a befoglaló felület már
kiírja a címet (fejezet-akkordeon), a saját eyebrow nem duplikál. Minden más
hívóhelyen a viselkedés változatlan.

A consent-szöveg (`shareVisibleSummary`) újra azt sorolja fel, ami tényleg
kimegy — a megelőző szöveg „munkastílust" és „ideális környezetet" ígért,
miközben abból már csak töredék látszott.

## 2. A facet-vágás nem néma többé

A dimenzió-leírás definíciós felét egy helyi regex vágta le a lapon
(`" Négy facetje "` / `" Its four facets "`). Ez szövegfüggő: egy
átfogalmazás után a teljes facet-felsorolás némán visszakerült volna a
publikus lapra. Áthelyezve `src/lib/dimension-description.ts`-be, és
`tests/unit/results/dimension-description.test.ts` őrzi, hogy mind a hat
dimenzió leírásában, **mindkét nyelven** felismerhető a marker.

## 3. Visszavonás: a szerver minden tokent töröl, a UI mégis csak egyet nézett

A `DELETE /api/profile/share` **minden** self-eredmény tokenjét visszavonja, és
a `/share/[token]` **bármelyik** eredmény tokenjével nyílik. A visszavonás
gombja viszont csak akkor jelent meg, ha a LEGUTÓBBI eredményhez tartozott
token — újrakitöltés után a régi eredmény linkje kint maradt, és a felületről
nem lehetett visszavonni.

A `/profile/results` page mostantól azt adja át, hogy van-e **bármely** élő
token (`assessmentResult.count`), a modal ezen a jelzésen mutatja az „aktív
link" státuszt és a visszavonást. Regressziós teszt fedi (token nélküli, de
aktív megosztás → visszavonható).

## 4. Analitika: a link-megosztás kétszer számolt

A `ProfileTabs.onShare` már küld `results.export {format:"link"}`-et a modal
**megnyitásakor** (szándék-mérés, ugyanaz a konvenció, mint a PDF-nél). A PR a
másolásra is küldött egyet, így ugyanaz a szándék két eseményt írt, és a
nyitás/tényleges másolás megkülönböztethetetlen lett. A másolás-oldali hívás
kivéve — a katalógusban nincs olyan `format`, amivel szét lehetne választani.

## 5. Apróbb javítások

- **Visszavonás közben a Link gomb** „Link létrehozása…"-t írt (közös `busy`);
  a state művelet-specifikus lett (`pending: "link" | "revoke"`). Teszt fedi.
- **A Link gomb fix `aria-label`-je** felülírta a tartalmat, így a „Másolva"
  visszajelzés képernyőolvasón nem hangzott el. Az aria-label kivéve — a
  hozzáférhető név a látható feliratot követi.
- **NavBar**: a megosztott lap fejlécének CTA-ja beégetett HU/EN literál volt
  → `nav.ctaSharedOwnProfile` kulcs.
- **Halott kulcsok** törölve: `content.shareLinkCompact`,
  `content.shareEmailSent`, `results.shareWorkSummary`.
- **Modal fókusz-stabilitás**: a billentyű-kezelő az `onClose`-tól függött,
  amit a hívók inline arrow-ként adnak át — nyitott modal mellett minden
  szülő-render újrafuttatta a fókusz-effectet, és a fókusz visszaugrott az
  első elemre (gépelés közben elveszett a mező fókusza). Az `onClose` most
  refen keresztül olvasódik, a handler identitása állandó.

Ellenőrzés: type-check 0, lint 0, `check:colors` OK, unit 986/986,
client 173/173 (2 új share-teszt), UI-audit: 0 új hardcoded hex.
