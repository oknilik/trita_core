# TSFI kérdésbank v2 — forrás, szerzők, licenc (2026-07-16)

Ez a dokumentum a TSFI kérdésbank (`src/lib/questions/tritan.ts`) teljes
eredet- és jogi dokumentációja. A B1 ügyvédi csomag melléklete.

## Forrás

Mind a 100 item az **International Personality Item Pool (IPIP)**
készletéből származik (https://ipip.ori.org — Oregon Research Institute,
gondozó: Lewis R. Goldberg).

| Itemek | Forrás-skála | URL |
|---|---|---|
| 92 item (23 facet × 4) | IPIP–HEXACO skálák | https://ipip.ori.org/newHEXACO_PI_key.htm |
| 4 item (social_self_esteem) | IPIP önértékelés-itemek (N3/Rosenberg-analóg készletből) | https://ipip.ori.org/newNEOFacetsKey.htm |
| 4 item (altruism) | IPIP A3 Altruism skála | https://ipip.ori.org/newNEOFacetsKey.htm |

Megjegyzés: az IPIP–HEXACO pool a 2004-es HEXACO-PI-re épül, amelyben a
mai `social_self_esteem` facet helyén Expressiveness állt — ezért ott az
IPIP önértékelés-itemeit használjuk (a facet konstruktumához illőt).

## Szerzők / hivatkozások

- Ashton, M. C., Lee, K., & Goldberg, L. R. (2007). *The IPIP–HEXACO
  scales: An alternative, public-domain measure of the personality
  constructs in the HEXACO model.* Personality and Individual
  Differences, 42, 1515–1526.
  (https://www.sciencedirect.com/science/article/abs/pii/S0191886906004338)
- Goldberg, L. R., Johnson, J. A., Eber, H. W., Hogan, R., Ashton, M. C.,
  Cloninger, C. R., & Gough, H. G. (2006). *The international personality
  item pool and the future of public-domain personality measures.*
  Journal of Research in Personality, 40, 84–96.
- IPIP webhely: https://ipip.ori.org

## Licenc-kérdések és válaszok

**Kell-e engedély a kereskedelmi használathoz?** Nem. Az IPIP hivatalos
nyilatkozata: *„Because the IPIP has been placed in the public domain,
permission has already been automatically granted for any person to use
IPIP items, scales, and inventories for any purpose, commercial or
non-commercial."* (https://ipip.ori.org/newPermission.htm) A site
kifejezetten kéri, hogy engedélykéréssel NE keressék őket — a válasz
mindig ez az oldal.

**Módosíthatók az itemek?** Igen — a public domain jogállás miatt az
itemek szabadon módosíthatók, rövidíthetők, adaptálhatók. Saját
adaptációink: E/1 alany hozzáadása (az IPIP alany nélküli frázisokat
használ), 5 itemnél könnyű szövegigazítás (12, 36: „would" betoldás az
E/1 alany mellé; 41: „when I need it" kiegészítés; 50: „in my room" →
általánosítva; 78: mondat egyszerűsítve).

## Szövegszintű ellenőrzés — B1 nyitott szál LEZÁRVA (2026-07-29)

A B1 ügyvédi csomag nyitott kérdése az EN itemek IPIP-eredetének
szövegszintű igazolása volt. Elvégzett ellenőrzés: mind a 100 EN item
gépi összevetése az IPIP hivatalos kulcs-oldalainak szövegével
(https://ipip.ori.org/newHEXACO_PI_key.htm +
https://ipip.ori.org/newNEOFacetsKey.htm, letöltve 2026-07-29,
normalizált szó szerinti egyezés + token-hasonlóság).

Eredmény: **95/100 item szó szerint egyezik** az IPIP-tétellel (egyetlen
eltérés az E/1 „I" alany hozzáadása — az IPIP alany nélküli frázisokat
közöl), a maradék 5 a fent dokumentált könnyű adaptáció:

| # | IPIP-eredeti | TSFI EN | Eltérés |
|---|---|---|---|
| 12 | Admire a really clever scam. | I would admire a really clever scam. | E/1 + „would" |
| 36 | Cheat to get ahead. | I would cheat to get ahead. | E/1 + „would" |
| 41 | Seek support. | I seek support when I need it. | kiegészítés |
| 50 | Leave a mess in my room. | I leave a mess around me. | általánosítás |
| 78 | Tell other people what they want to hear so that they will do what I want them to do. | I tell people what they want to hear so that they will do what I want. | egyszerűsítés |

Egyik item sem egyezik a hexaco.org-on közzétett HEXACO-PI-R védett
tételszövegeivel — a bank kizárólag IPIP public domain szövegekre épül,
a fenti adaptációk a public domain jogállás alatt szabadok. A korábbi
(v1) bankra vonatkozó licenc-aggály (tsfi-item-audit-2026-07.md) a v2
bankra nem áll fenn.

**Fordítható magyarra?** Igen, engedély nélkül. A magyar fordítás saját
munka (Trita, 2026), a fordításra ugyanaz a szabadság vonatkozik. Az IPIP
opcionálisan örül, ha a fordítók megosztják vele a fordítást — ez nem
kötelezettség.

**Az observer-változatok is fedettek?** Igen, jogilag: az observer-formák
(EN: singular they; HU: E/3) a public domain itemek saját nyelvtani
derivátumai — korlátozás nélkül készíthetők. Pszichometriai megjegyzés:
az IPIP–HEXACO skáláknak publikált observer-validálása nincs, ezért az
observer-formák megbízhandóságát a saját pilot-adat igazolja majd.

**Kell-e attribúció?** Jogilag nem. Tudományos jó gyakorlatként a fenti
két publikációt és az ipip.ori.org-ot hivatkozzuk (kódfejlécben és itt).

**Mi NEM fedett?** A hexaco.org-on közzétett HEXACO-PI-R itemek — azokat
a bank 2026-07-16-tól NEM tartalmazza (v1 történeti auditja:
tsfi-item-audit-2026-07.md). A hatfaktoros modell mint konstruktum nem
szerzői jogi tárgy; a TRITAN elnevezés és a magyar szövegek saját IP.

**Validáltság.** Az IPIP–HEXACO skálák publikált megbízhatósága α .69–.88
(Ashton, Lee & Goldberg, 2007), konvergens validitás az eredeti
HEXACO-PI-vel igazolt. A Trita-implementáció (facetenként 4 item,
magyar fordítás, observer-forma) saját mintás ellenőrzést igényel — első
adat: dry run próbakitöltések + pilot.

## TSFI-S rövid forma (60 item)

Hivatalos IPIP rövid forma nincs — a TSFI-S a saját v2 bankból
származtatott részhalmaz (`short: true` flag): facetenként legalább 2
kiegyensúlyozott kulcsirányú item, +10 megerősítő item a termék-kritikus
faceteken, +2 altruizmus. Jogilag azonos a jogállása (public domain
forrás, saját válogatás). A rövid forma megbízhatósága facet-szinten
alacsonyabb (2-3 item/facet) — facet-bontást a felület a rövid formánál
óvatosabban értelmezzen; dimenzió-szinten (9-10 item) a megbízhatóság
megfelelő. A pontozás a teljes konfigból történik, így a rövid és teljes
kitöltések ugyanazon a 0–100 skálán összevethetők.
