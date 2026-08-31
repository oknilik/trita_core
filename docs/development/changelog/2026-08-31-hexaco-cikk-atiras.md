# 2026-08-31 — Blog: a HEXACO-bemutató cikkpár átírása és slug-csere

## Új felütés: hatfaktoros modell → trita

A `mi-az-a-hexaco` HU-cikk teljes átdolgozása (az EN-párcikk követi):

- A felütés már nem a HEXACO márkanév, hanem a **hatfaktoros
  személyiségmodell** — a HEXACO a történeti szakaszban jelenik meg,
  a modell tudományos neveként (ez a kommunikációs irányelvvel is
  összhangban van: modellnév csak módszertani kontextusban).
- Új cím: „Mi az a hatfaktoros személyiségmodell - és hogyan épít rá
  a trita?”; új bevezető bekezdés vezeti fel a modell → trita ívet.
- A záró „Mit mér ebből a trita?” szakasz „Hogyan épít erre a trita?”
  lett: kimondja, hogy a TSFI saját kérdőív, a tételek alapját az IPIP
  adta, a tételkiválasztás, a magyar adaptáció és a pontozás pedig saját
  kutatómunka.
- Nyelvi javítások végig (tükörfordítás-ízű fordulatok kigyomlálva:
  „hol állsz”, „két működőképes vég”, „máshová teszi a hangsúlyokat” stb.),
  statkártyák átfogalmazva, a kitöltési idő ~9 → ~10 percre igazítva
  (a cikkben; a termékfelületek ideje külön döntés).

## Slug-csere redirect-tel

- Fájlok: `mi-az-a-hexaco.mdx` → `hatfaktoros-szemelyisegmodell.mdx`,
  `what-is-hexaco.mdx` → `six-factor-personality-model.mdx`; a két
  cikk `translationSlug`-ja kölcsönösen frissítve.
- A `next.config.ts` `blogSlugRenames` táblája két új sort kapott
  (cikkoldal + hírlevél-borító route, permanens redirect), a
  `blog-slug-redirects` e2e szerződés-teszt a két párral bővült.
- Az EN-cikk szövege a HU-átírás tükre (six-factor personality model
  felütés, „How does trita build on this?” szakasz, ~10 min).
