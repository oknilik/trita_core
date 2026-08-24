# 2026-08-24 — Blog: szerkesztői borítók és fókuszált képkivágás

## Vizuális irány

A feltöltött, tudatosan szerkesztett kép lett a blog elsődleges borítóútja.
A négycsaládos generatív rendszer nem tűnt el: stabil fallback a régi és a
kép nélküli cikkekhez.

A hét HU–EN cikkpár hét közös, témaspecifikus szerkesztői illusztrációt kapott.
A képcsalád közös nyelve a kivágott papírra és gouache-ra emlékeztető geometria,
a finom szitanyomat-textúra, a meleg irányfény és a Trita erdőzöld–olíva–bordó–
krém–sárgaréz palettája. A fordításpárok ugyanazt a képet használják, így a
nyelvváltás nem változtatja meg a cikk vizuális identitását.

A belső mobilitás borítóján négy külön ember négy külön, folytonos
kéz–csukló–ruhaujj kapcsolattal épít közös útvonalat; egyetlen végtagon belül
sincs kevert bőrtónus. A többi jelenet kéz nélkül, tárgyi metaforával dolgozik.

## Feltöltési folyamat

- A kép kiválasztáskor nem commitolódik: helyi előnézet marad a cikk
  mentéséig.
- Az admin egyszerre mutatja a 16:10-es kiemelt, a 16:9-es kártya/cikk és a
  négyzetes mini kivágást.
- `coverFocalX` és `coverFocalY` viszi a fontos képrész helyét minden
  felületre, az OG/hírlevél-vászonra is.
- A szerver valódi képként dekódolja, legalább 1200×630-as méretet és
  1,4–2,15 közötti képarányt kér, majd 1600 px széles WebP-vé optimalizálja.
- A fájlnév tartalom-hashes. Előbb a kép készül el, utána a cikk hivatkozik
  rá; hibánál rollback, siker után a korábbi borító takarítása fut.
- Cikk törlése a slughoz tartozó borítót is eltávolítja.
- A korábbi, külön azonnal feltöltő `/api/admin/blog/cover` végpont megszűnt;
  így az adminból nem maradhat cikkhez nem kapcsolt, optimalizálatlan kép.

## Megjelenés

A kiemelt kártya 16:10, a normál kártya és a cikkfejléc 16:9 lett. A mini
négyzetes marad, de a közös fókuszpont miatt nem véletlenül vágja le a
motívumot.

## Javítás

A tárolóból szerkesztésre betöltött cikk most már a legfrissebb `artFamily`,
`artConcept`, `artLineMode`, `artMotif` és fókuszmezőket kapja, nem a futó
deploy esetleg elavult listapéldányát.
