# 2026-08-24 — Blog-szerkesztő: a commit a futó deploy ágára megy

## Miért

A tároló fixen a `main`-re commitolt (`GITHUB_BRANCH ?? "main"`). Egy preview
deployment adminjából mentett cikk tehát azonnal az **éles** tartalmat
változtatta, és elindította a production buildet — miközben a felhasználó egy
ág-előnézetben ült. Meglepetés, nem szándék.

## Változás

- `blogStoreBranch()`: `GITHUB_BRANCH` → `VERCEL_GIT_COMMIT_REF` (a futó
  deploy saját ága) → `main`. A production deploy továbbra is a production
  ágra ír, a preview a sajátjára; az explicit env felülbírál.
- Az admin store-sávja kiírja a cél-ágat, és `main`-től eltérő ágnál
  figyelmeztet, hogy a cikk csak a beolvasztás után jelenik meg élesben.
- `.env.example`: a `GITHUB_BRANCH` mostantól opcionális felülbírálás, nem
  kötelező beállítás.

Ezzel az ág-előnézet valódi staging lett: az ágon szerkesztesz, az ág preview
URL-jén (`<projekt>-git-<ág>-<scope>.vercel.app`) nézed meg, a merge viszi
élesbe.

## Vigyázat

A preview deployment alapból ugyanazt az adatbázist és ugyanazt a
`GITHUB_TOKEN`-t használja, mint a production. A blog-szerkesztés így már
elkülönül, a **hírlevél-küldés nem**: preview-ból is éles címzettekre menne.

## Teszt

`tests/unit/blog/blog-store-conflict.test.ts` — a cél-ág feloldási sorrendje
és hogy a commit (és az olvasás `ref`-je) tényleg a cél-ágra megy.
