# 2026-08-24 — Blog-mentés: a hiba mostantól megmondja, mi a baj

## Miért

Minden tároló-hiba `SAVE_FAILED`-ként ért ki a felületre: lejárt token,
hiányzó repo-jog, nem létező cél-ág és csak olvasható fájlrendszer
megkülönböztethetetlen volt. A hibakeresés csak a Vercel-logokból indulhatott.

Külön csapda: hiányzó `GITHUB_TOKEN`/`GITHUB_REPO` mellett a `blogStoreMode()`
`fs`-t ad, ezért az API `github`-kapuja NEM lép be — a mentés élesben egy csak
olvasható fájlrendszerbe futott, és ebből is csak `SAVE_FAILED` látszott.

## Változás

- `blog-store.ts`: `BLOG_STORE_READ_ONLY` — `fs` mód + Vercel esetén beszédes
  hibával állunk meg az EROFS helyett (mentés és törlés úton is). Új
  `blogStoreTarget()` a diagnosztikához (repo + ág; a token soha).
- `/api/admin/blog`: a hibaválasz `detail` mezője whitelistelt kódot ad
  (`GITHUB_WRITE_FAILED_401`, `…_403`, `…_404`, `GITHUB_NOT_CONFIGURED`,
  `BLOG_STORE_READ_ONLY`) plusz a cél repót/ágat. Nem whitelistelt hiba
  `UNKNOWN` — belső részlet nem szivárog.
- `AdminBlogSection`: a kódokból cselekvési utasítás lesz (401 → lejárt
  token, 403 → hiányzó Contents write, 404 → rossz repo vagy nem létező ág,
  read-only → hiányzó env + redeploy kell).

## Teszt

`tests/unit/blog/blog-store-conflict.test.ts` — fs mód + Vercel esetén
`BLOG_STORE_READ_ONLY`, nem fájlrendszer-hiba.
