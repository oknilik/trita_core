# 2026-08-24 — Blog-szerkesztő: néma felülírás helyett ütközés-jelzés

## Hiba

`github` tárolómódban (éles) a szerkesztő két különböző forrásból dolgozott:

- **olvasás**: a `BlogTab` a futó példány fájlrendszeréből (`getAllPosts`/
  `getPostBySlug`) — ez a legutóbbi **deploy** állapota;
- **írás**: `saveBlogSource` a GitHub Contents API-val, a pillanatnyi sha-t
  lekérve, összefésülés és ellenőrzés nélkül.

Mentés után a build 2–5 percig fut. Ha ebben az ablakban valaki megnyitotta a
cikket, a szerkesztő a deploy előtti szöveget töltötte be, és a mentés ezt
commitolta vissza: az imént mentett módosítás nyomtalanul, hibaüzenet nélkül
eltűnt.

## Javítás

- `blog-store.ts`: új `readBlogRevision()` (tartalom + tároló-sha), a
  `saveBlogSource` opcionális `baseSha`-t fogad; eltérés esetén
  `BLOG_CONFLICT`-ot dob commit helyett. A mentés visszaadja az új sha-t,
  így ugyanabban a munkamenetben többször is lehet menteni.
- `/api/admin/blog`: új `GET ?slug=` a tárolóból tölt (frontmatter + törzs +
  sha); a `POST` `baseSha`-t fogad, ütközésre `409 CONFLICT`; a `PATCH`
  (publikálás/visszavonás) is a sha-val írja vissza a státuszt.
- `AdminBlogSection`: a „Szerkesztés" a tárolóból tölt (a listából csak
  akkor nyílik meg, ha ez sikerült), a mentés viszi a `baseSha`-t, és
  ütközésre elmondja, mi történt. Új cikknél `baseSha: null` — így egy
  meglévő slug véletlen felülírása is 409.

A `PUT` (kész .mdx feltöltés) nem ad `baseSha`-t: ott a meglévő `overwrite`
kapu dönt, a viselkedés változatlan.

## Teszt

`tests/unit/blog/blog-store-conflict.test.ts` — a sha visszaadása, elavult
sha elutasítása írás nélkül, új cikk nem írhat felül létező slugot, egyező
sha commitol, `baseSha` nélkül nincs ellenőrzés.

## Ami NEM változott

A publikálási lánc marad: commit → Vercel build → ~2–5 perc. A DB-alapú,
deploy nélküli publikálás (`docs/architecture/blog-content-pipeline.md`)
továbbra is javaslat — a mai kadenciánál nem éri meg, a benne felsorolt
kiváltó feltételekre várunk.
