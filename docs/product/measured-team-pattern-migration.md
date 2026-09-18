# Csapatmintanevek: a mért működés az egyetlen publikus típusnév

2026-09-18 · PR #97

| Felület | Új forrás / viselkedés |
| --- | --- |
| Csapat áttekintő, intelligencia és tagi állapotkép | Legutóbbi publikált riport `teamStyle.operating` adata, aktuális T16 katalógusnév |
| Vezetői és tagi riport | Az adott riport befagyasztott működésmérése; nincs személyiségalapú név vagy régi fallback |
| PDF riport | Ugyanaz a közös prezentáció; a személyiség és a négy levezetett tengely név nélkül megmarad |
| Tanácsadói oldal, `/api/team/{id}/pattern` | Publikált működésmérés, kétnyelvű név és mérési időszak; a jogosultsági kapu változatlan |
| Marketing csapatpanel | Semleges „Személyiség-összetétel”, mert a demóhoz nincs működésmérés |
| Régi `/patterns` belépő | 308 átirányítás az `/operating-patterns` oldalra; régi katalógus nem érhető el |

Az `operatingIdentity` feloldó közös a kártyák, API és riportprezentáció számára.
Mérés nélkül „Még nincs mért csapatminta” jelenik meg. Bizonytalan besorolást
külön jelölünk; nem besorolható méréshez nem kapcsolunk típuskódot vagy karaktert.
A mérési besorolás nem függ attól, elkészült-e elegendő személyiségkérdőív.

A régi adatbázisbeli snapshotok neveit/kódjait és a személyiségtengelyeket számoló
motort kompatibilitási okból nem írjuk át. Ezekből nem jelenítünk meg típusnevet,
és nem képezünk automatikus megfeleltetést a T16 működési kódokra.
A kézzel írt riportnarratívákat és a már korábban letöltött PDF-eket nem módosítjuk;
az újonnan megnyitott nézetek és generált PDF-ek használják az új megjelenítést.

Ellenőrzés: 16 kód × 2 nyelv; személyiség-only / hiányzó / bizonytalan /
nem besorolható mérés; régi nevek tiltása weben és PDF-prezentációban;
256 működés–személyiség kombináció négy tengelyes összevetése; PDF render.
