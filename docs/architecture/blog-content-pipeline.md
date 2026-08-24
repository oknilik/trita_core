# Blog-tartalom pipeline — deploy nélküli publikálás, statikus kiszolgálás

> Állapot: **javaslat / döntésre vár** · 2026-08-24
> Kapcsolódó kód: `src/lib/blog.ts`, `src/lib/blog-store.ts`,
> `src/app/api/admin/blog/route.ts`, `src/app/(marketing)/blog/**`

## 1. Hol tartunk ma

A cikkek forrásigazsága a **git**: `content/blog/*.mdx` (frontmatter +
törzs). Két írási mód (`blog-store.ts`):

| Mód | Mit csinál | Mikor |
|---|---|---|
| `fs` | a `content/blog` mappába ír | helyi fejlesztés |
| `github` | GitHub Contents API-val commitol | Vercelen, ha van `GITHUB_TOKEN`+`GITHUB_REPO` |

Olvasás mindig **fájlrendszerből**, szinkron (`fs.readFileSync` +
`gray-matter`), a render `next-mdx-remote/rsc`-vel stringből fordít.
A `/blog/[slug]` van `generateStaticParams`-szal, tehát build-időben
előrenderelt.

Ebből következik a mai fájdalom:

- **Minden mentés = commit = teljes újraépítés.** Egy elgépelés javítása is
  2–5 perces deploy, és a build-sorba áll.
- **Élesben a szerkesztő a múltat mutatja.** A Vercel FS csak olvasható és
  ephemeral, így az admin lista a *legutóbbi deploy* állapotát látja; a
  frissen commitolt cikk addig nincs ott, amíg a deploy le nem futott.
- **A hírlevél ugyanerre épül.** A `newsletter-issue.ts`/`newsletter-digest.ts`
  a `getPostBySlug`-on át olvas: egy még nem deployolt cikk `INVALID_ARTICLES`
  hibát ad a szám mentésekor.
- A GitHub-token a futó appban él — kicsi, de valós támadási felület.

## 2. Cél

Cikket a `/admin?tab=blog`-ból lehessen frissíteni **git és deploy nélkül**,
másodpercek alatt, **de** a `/blog` és `/blog/[slug]` maradjon statikus:
előre renderelt HTML a CDN-ről, kérésenként nulla DB-hívás.

Ez a kettő nem zárja ki egymást: pontosan ez az **on-demand ISR** (Next.js
`revalidatePath` / `revalidateTag`). A statikusságot nem a *forrás* adja
(fájl vs. DB), hanem a *renderelés ideje* — és azt a revalidáció mozgatja
build-időből publikálás-időbe.

## 3. Javasolt architektúra

### 3.1 Forrásigazság: DB

Új Prisma modell, a mai frontmatter 1:1 leképzése (hogy az importer és a
visszaút is triviális legyen):

```prisma
model BlogPost {
  id              String   @id @default(cuid())
  slug            String   @unique
  locale          String              // "hu" | "en"
  title           String
  description     String
  publishedAt     String              // YYYY-MM-DD (ma is így van)
  tags            String[]
  translationSlug String?
  heroQuote       String?
  startHere       Int?
  artSeed         Int?
  artFamily       String?
  artConcept      String?
  artLineMode     String?
  status          String   @default("draft")   // draft | published
  body            String   @db.Text
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  revisions BlogPostRevision[]
  @@index([status, locale, publishedAt])
}

// A git-történelem pótlása: minden mentés egy sor.
model BlogPostRevision {
  id        String   @id @default(cuid())
  postId    String
  post      BlogPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  body      String   @db.Text
  frontmatter Json
  authorEmail String
  createdAt DateTime @default(now())
  @@index([postId, createdAt])
}
```

A `BlogPostRevision` nem opcionális dísz: ma a „visszaállítható" garanciát a
commit adja (`blog-store.ts` a törlést is így indokolja). Ha a git kikerül a
körből, a verziótörténetet nekünk kell vinni — enélkül a DB-re váltás
*visszalépés*.

### 3.2 Olvasás: cache-elt, tag-elt réteg

A `src/lib/blog.ts` publikus felülete (`getAllPosts`, `getPostBySlug`)
megmarad, de aszinkron lesz és DB-ből olvas, `unstable_cache` mögött
`"blog"` taggel. A render nem változik: a `next-mdx-remote/rsc` ma is
**stringből** fordít — mindegy neki, hogy fájlból vagy DB-ből jött.

A fő munka itt van: a ma szinkron hívók await-esítése —
`(marketing)/blog/page.tsx`, `[slug]/page.tsx`, `opengraph-image.tsx`,
`BlogTab.tsx`, `newsletter-digest.ts`, `newsletter-issue.ts`,
`api/admin/newsletter/issues/route.ts`, sitemap, `llms.txt`. Nagy részük már
async környezet.

### 3.3 Statikusság megtartása

```ts
// app/(marketing)/blog/[slug]/page.tsx
export const dynamic = "force-static";
export const revalidate = false;        // csak on-demand revalidál
export const dynamicParams = true;      // build óta született slug is működik
export async function generateStaticParams() { /* DB-ből */ }
```

- Build-időben minden publikált cikk előrenderelődik → változatlan sebesség.
- `revalidate = false`: időalapú lejárat nincs, tehát nincs „random" DB-hívás.
- `dynamicParams = true`: a build óta létrehozott slug az **első** kérésre
  generálódik le, utána ő is cache-elt statikus. Ez a „statikus, mégis
  bővíthető deploy nélkül" kulcsa.

### 3.4 Publikálás = revalidáció

Az `/api/admin/blog` mentés/publikálás/törlés ága a commit helyett:

```ts
revalidateTag("blog");                    // a lib-cache réteg
revalidatePath("/blog");                  // lista
revalidatePath(`/blog/${slug}`);          // cikk (+ opengraph-image)
revalidatePath("/sitemap.xml");
revalidatePath("/llms.txt");
```

Eredmény: a mentés után ~1 kérés alatt él az új HTML, deploy nélkül, és
onnantól újra CDN-ből megy. A `GITHUB_TOKEN` kikerülhet a runtime envből.

### 3.5 Migráció

1. `scripts/import-blog-mdx.mjs` — a meglévő `content/blog/*.mdx` beolvasása
   `gray-matter`-rel, `upsert` slug alapján. Idempotens, többször futtatható.
2. A `content/blog` **marad a repóban** egy körig: rollback-forrás és seed a
   teszt-DB-hez. A runtime viszont már nem olvassa.
3. `blog-store.ts` `github` módja megmarad *export*-ként: opcionális
   „mentsd vissza gitbe is" gomb, ha a szerkesztőségi backup igény felmerül.

### 3.6 Piszkozat-előnézet

A `status = draft` cikk ma nem renderelhető publikusan. Utána: `/blog/[slug]`
kapjon egy `?preview=<rövid életű aláírt token>` ágat, ami `noindex` +
`dynamic` — a statikus ág érintetlen marad.

## 4. Mérlegelt alternatívák

| Opció | Miért nem ez az elsődleges |
|---|---|
| **Marad a git-commit, csak gyorsabb deploy** | A deploy-idő nem a szűk keresztmetszet, hanem hogy *minden* szerkesztés deploy. Az admin-lista késése sem szűnik meg. |
| **GitHub Contents API olvasás runtime-ban, cache-elve** | Külső függés kerül a kérésútra (rate limit, kimaradás), a token bent marad, és két igazság lesz (repo + cache). |
| **Külső headless CMS (Sanity/Contentful)** | Új szolgáltatói függés és költség egy ~15 cikkes blogra; a szerkesztő már megvan és a design-tokenekhez illeszkedik. |
| **DB + teljesen dinamikus `/blog`** | Feladná a statikusságot (kérésenkénti DB-hívás, lassabb LCP) — a feladat épp az, hogy ne. |

## 5. Kockázatok

- **Sync → async láncreakció** a `blog.ts` hívóin: mechanikus, de sok fájl.
  Ez a migráció legnagyobb tétele.
- **Revalidáció elmaradása** = néma állagromlás (a mentés sikerül, az oldal
  régi marad). Ellenszer: a mentés válasza jelezze vissza a revalidált
  útvonalakat, és az admin írja ki.
- **Neon cold start** csak revalidációkor és build-kor számít, a kérésúton nem.
- **Verziótörténet**: a `BlogPostRevision` nélkül a DB-re váltás gyengébb,
  mint a mai állapot. Kötelező elem, nem 2. fázis.

## 6. Javasolt lépések

1. Prisma modellek + migráció, `import-blog-mdx.mjs` importer.
2. `blog.ts` átállítása DB-re, `unstable_cache` + `"blog"` tag; hívók
   await-esítése.
3. `force-static` + `dynamicParams` + `generateStaticParams` DB-ből.
4. `/api/admin/blog` → DB-írás + revizió + `revalidateTag`/`revalidatePath`;
   a github mód opcionális exporttá degradálva.
5. Piszkozat-előnézet aláírt tokennel.
6. `GITHUB_TOKEN` kivezetése a futó app envjéből; `.env.example` és
   `docs/development/launch-checklist.md` frissítése.
