# 2026-08-24 — Blog: feltölthető saját borítókép

> **ELAVULT RÉSZ (ld. `2026-08-24f-blog-szerkesztoi-boritok.md`):** az itt
> leírt külön `POST|DELETE /api/admin/blog/cover` végpont megszűnt. A borító
> ma a cikk mentésével EGY kérésben (`POST /api/admin/blog`) megy fel, és a
> szerver 1600 px széles WebP-vé optimalizálja. A dokumentum többi része áll.

## Miért

A cikkeknek eddig csak generatív vizuáljuk lehetett. Fotós vagy kézzel
tervezett borítóra nem volt út — pedig a lista, a link-előnézet és a hírlevél
mind ezt a képet mutatja.

## Változás

- **Frontmatter**: új `coverImage` mező (`/blog-covers/<slug>.<jpg|png|webp>`).
  Az alak szigorúan ellenőrzött (`isBlogCoverImage`): az érték `<img src>`-be
  és fájlútba is bekerül, tehát külső URL vagy könyvtárból kilépő út nem
  jöhet szóba — érvénytelen értéknél a cikk a rajzolt képet kapja.
- **Tároló**: `saveBlogCover` / `deleteBlogCover` — a kép a cikkel egy helyre,
  a repóba megy (`public/blog-covers/`), `github` módban commitként. Nincs új
  szolgáltatói függés.
- **API**: `POST|DELETE /api/admin/blog/cover`. A formátumot a fájl bájtjai
  döntik el (`sniffCoverExtension`), nem a kiterjesztés — átnevezett SVG-t
  nem fogadunk el. Méretkorlát 3 MB.
- **Megjelenítés**: új `BlogCoverVisual` — EGY belépő, ami feltöltött képnél
  azt, enélkül a `BlogArtVisual`-t rajzolja. Átállítva a bloglista (kiemelt,
  kártya, mini), a cikkfejléc és az OG/hírlevél-vászon.
- **OG-vászon**: a feltöltött kép data URI-ként kerül a rajzba (lemezről, nem
  URL-ről: ez a vászon build-időben is renderelődik). Hiányzó fájlnál
  visszaesik a generatív vizuálra, hogy ne legyen üres lyuk az előnézetben.
- **Admin**: feltöltés, előnézet és eltávolítás a Cikk-vizuál panelben; amíg
  van saját borító, a generatív beállítások el vannak rejtve.
- **next.config**: a borító-mappa file-tracingbe véve a hírlevél-borító és az
  OG-route mellé.

## Menet közbeni szemantika

A feltöltés azonnal külön commit, de a `coverImage` mezőt a cikk következő
mentése írja be. Így egy feltöltés önmagában nem változtat a publikus cikken,
és a cikk állapota egyetlen helyen (a frontmatterben) dől el.

## Teszt

`tests/unit/blog/blog-cover.test.ts` — út-validáció (külső URL, `../`, SVG,
nagybetűs kiterjesztés) és bájt-alapú formátumfelismerés.
`tests/client/blog/blog-cover-visual.test.tsx` — feltöltött kép vs. generatív
vizuál választása.
