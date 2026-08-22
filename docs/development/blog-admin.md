# Admin Blog fül — cikk-kezelés és publikálási folyamat

> Készült: 2026-07-24. Felület: `/admin?tab=blog` · API: `/api/admin/blog`
> · tároló-réteg: `src/lib/blog-store.ts`.

## Modell

A cikkek forrásigazsága a git marad (`content/blog/*.mdx`, SSG). Az admin
felület ugyanezeket a fájlokat írja — két módban:

| Mód | Mikor | Mit csinál | Megjelenés |
|---|---|---|---|
| `fs` | helyi dev (default) | fájlt ír a content/blog-ba | dev /blog: azonnal; éles: git push után |
| `github` | Vercel prod (default, ha van token) | commit a GitHub Contents API-val | Vercel auto-build után ~2–4 perc |

Felülírás: `BLOG_STORE=fs|github` env.

## Draft / publish / visszavonás

- A piszkozat a frontmatter `status: "draft"` mezője. A draft cikk a repóba
  kerül, de a publikus listából, sitemapből kimarad, és a cikk-URL élesben
  404 (dev-ben látszik — ott az előnézet).
- **Publikálás** = a status mező törlése (+ első publikáláskor a
  `publishedAt` a publikálás napjára áll) — egy commit.
- **Visszavonás** = `status: "draft"` visszaírása — szintén egy commit; a
  deploy után a cikk eltűnik a blogról és a sitemapből. (A Google a cache-ét
  pár napig még mutathatja — ez normális.)
- Minden státusz-váltásnak git-történelme van.

## Ops-beállítás a prod mentéshez (egyszeri, ~5 perc)

1. GitHub → Settings → Developer settings → **Fine-grained personal access
   token** → Generate new token:
   - Repository access: **Only select repositories** → a trita repo.
   - Permissions → Repository permissions → **Contents: Read and write**.
     Más jog NEM kell.
   - Lejárat: 1 év (járjon le, jegyezd fel a megújítást).
2. Vercel → Project → Settings → Environment Variables (Production):
   - `GITHUB_TOKEN` = a token
   - `GITHUB_REPO` = `owner/repo` (a trita repo teljes neve)
   - (opció) `GITHUB_BRANCH` = `main` (ez a default)
3. Redeploy. Ettől kezdve az éles admin Blog fül mentései commitok.

## Szerkesztői folyamat (ajánlott)

1. Cikk írása dev-en (`/admin?tab=blog`) → **Mentés piszkozatként** →
   ellenőrzés a dev `/blog` oldalon (ott a draft is látszik).
2. HU–EN pár: két külön cikk, a `Fordítás-pár slugja` mezővel összekötve
   (mindkét irányban add meg).
3. Publikálás a listából (vagy „Mentés és publikálás"). Élesben ugyanez a
   felület a GitHub-on át megy — a lista a legutóbbi deploy állapotát
   mutatja, a friss commit a következő build után jelenik meg benne.

## Frontmatter-mezők

`title`, `description`, `publishedAt` (YYYY-MM-DD), `locale` (hu/en),
`tags` (max 6), `translationSlug`, `heroQuote` (featured-idézet),
`startHere` (1–3, „Kezdd itt" sáv), `status` (csak draftnál).

### Cikk-vizuál

A vizuál három külön kézírást támogat: `constellation`, `modular`, `flow`.
Ettől független a jelenet szerkesztői fogalma: `connection`, `balance`,
`tension`, `threshold`, `signal`, `growth`.

| Mező | Jelentés | Ha hiányzik |
|---|---|---|
| `artFamily` | a vizuális család | stabilan következik a slugból |
| `artConcept` | a jelenet jelentése | cím + tag + slug alapján becsült |
| `artSeed` | a családon belüli variáció (1–9999) | stabilan következik a slugból |
| `artMotif` | régi `radar/network/bars/waves` rajzoló | csak kompatibilitási mező; új mentés nem használja |

Az admin egyszerre hat variációt mutat (családonként kettőt), és újabb stabil
hatost kérhet. A kiválasztás ugyanazt a jelenetet adja a bloglistán, a
cikkoldalon, a közösségi OG-képen és a hírlevél borítóján. Ha semmit nem
választunk, a rendszer automatikus, de determinisztikus: egy deploy vagy
újrarenderelés önmagában nem változtatja meg a képet.
