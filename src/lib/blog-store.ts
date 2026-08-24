import "server-only";
import fs from "fs";
import path from "path";
import { createLogger } from "@/lib/logger";

const log = createLogger("blog-store");

// Blog-tároló réteg az admin Blog fülhöz (2026-07-24).
//
// Két mód:
//   · fs      — a content/blog mappába ír (dev workflow: azonnal látszik a
//               dev /blog oldalon, élesítés kézi git push-sal)
//   · github  — GitHub Contents API-val commitol a repóba → a Vercel
//               automatikusan buildel és élesít (~pár perc)
//
// Mód-választás: BLOG_STORE env (fs|github) explicit felülírás; enélkül
// Vercelen github (ha van token), helyben fs. A github módhoz kell:
//   GITHUB_TOKEN — fine-grained PAT, CSAK erre a repóra, Contents: read+write
//   GITHUB_REPO  — "owner/repo" formában
//   GITHUB_BRANCH — opcionális; enélkül a futó deploy saját ága
//                   (VERCEL_GIT_COMMIT_REF), végső fallback: main

const BLOG_DIR = path.join(process.cwd(), "content/blog");
const GITHUB_API = "https://api.github.com";

export type BlogStoreMode = "fs" | "github";

interface GithubConfig {
  token: string;
  repo: string;
  branch: string;
}

/**
 * Melyik ágra commitoljon a szerkesztő.
 *
 * Sorrend: explicit `GITHUB_BRANCH` → a FUTÓ DEPLOY saját ága
 * (`VERCEL_GIT_COMMIT_REF`) → `main`.
 *
 * A középső lépés a lényeg: egy preview deployment adminjából mentett cikk
 * korábban a `main`-re ment, vagyis egy ág-előnézetből szerkesztve azonnal
 * az ÉLES tartalom változott — meglepetés, nem szándék. Így viszont az ág
 * előnézete a saját ágára ír, és a merge viszi élesbe.
 */
export function blogStoreBranch(): string {
  return process.env.GITHUB_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || "main";
}

function githubConfig(): GithubConfig | null {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  if (!token || !repo) return null;
  return { token, repo, branch: blogStoreBranch() };
}

export function blogStoreMode(): BlogStoreMode {
  const forced = process.env.BLOG_STORE;
  if (forced === "fs" || forced === "github") return forced;
  return process.env.VERCEL && githubConfig() ? "github" : "fs";
}

/** Diagnosztika az adminnak — a token SOHA nem kerül bele. */
export function blogStoreTarget(): { repo: string | null; branch: string } {
  return { repo: process.env.GITHUB_REPO ?? null, branch: blogStoreBranch() };
}

/** Igaz, ha a github mód elérhető LENNE (token+repo beállítva). */
export function githubConfigured(): boolean {
  return githubConfig() !== null;
}

function repoPath(slug: string): string {
  return `content/blog/${slug}.mdx`;
}

/** A feltöltött borítók helye — a repóban és a publikus úton is. */
export const BLOG_COVER_DIR = "public/blog-covers";

function githubHeaders(cfg: GithubConfig): Record<string, string> {
  return {
    Authorization: `Bearer ${cfg.token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function githubGetFile(
  cfg: GithubConfig,
  slug: string,
): Promise<{ content: string; sha: string } | null> {
  const res = await fetch(
    `${GITHUB_API}/repos/${cfg.repo}/contents/${repoPath(slug)}?ref=${cfg.branch}`,
    { headers: githubHeaders(cfg), cache: "no-store" },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GITHUB_READ_FAILED_${res.status}`);
  const json = (await res.json()) as { content: string; sha: string };
  return {
    content: Buffer.from(json.content, "base64").toString("utf-8"),
    sha: json.sha,
  };
}

/**
 * Ütközés a mentésnél: a tároló tartalma megváltozott azóta, hogy a
 * szerkesztő betöltötte. `saveBlogSource` dobja, ha a kapott `baseSha` nem
 * egyezik a tároló pillanatnyi állapotával.
 */
export const BLOG_CONFLICT = "BLOG_CONFLICT";

/**
 * `fs` módban futunk Vercelen, ahol a fájlrendszer csak olvasható.
 *
 * Ez a némán rossz állapot: hiányzó `GITHUB_TOKEN`/`GITHUB_REPO` mellett a
 * `blogStoreMode()` `fs`-t ad, az API `github`-kapuja tehát nem lép be, és a
 * mentés egy EROFS-ba futott, amiből a felületre csak `SAVE_FAILED` jutott.
 */
export const BLOG_STORE_READ_ONLY = "BLOG_STORE_READ_ONLY";

export interface BlogRevision {
  content: string;
  /** github módban a blob sha (ütközés-ellenőrzéshez), fs módban null. */
  sha: string | null;
}

/**
 * Csak a sha egy tetszőleges repó-útra (bináris fájlokhoz).
 *
 * A tartalmat szándékosan nem dekódoljuk: egy borítókép base64-ben
 * fölöslegesen nagy, és 1 MB fölött a GitHub amúgy sem adja vissza inline —
 * a sha viszont mindig ott van, és az írásnak csak az kell.
 */
async function githubGetFileMeta(
  cfg: GithubConfig,
  target: string,
): Promise<{ sha: string } | null> {
  const res = await fetch(
    `${GITHUB_API}/repos/${cfg.repo}/contents/${target}?ref=${cfg.branch}`,
    { headers: githubHeaders(cfg), cache: "no-store" },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GITHUB_READ_FAILED_${res.status}`);
  const json = (await res.json()) as { sha?: string };
  return json.sha ? { sha: json.sha } : null;
}

/**
 * A cikk nyers .mdx tartalma a tároló SHA-jával együtt.
 *
 * A szerkesztő ezen az úton töltsön (ne a build-időben becsomagolt
 * `content/blog` fájlrendszerről): github módban a legutóbbi commit
 * számít igazságnak, a futó példány fájlrendszere pedig a legutóbbi
 * DEPLOY állapotát őrzi — a kettő a build ideje alatt eltér.
 */
export async function readBlogRevision(slug: string): Promise<BlogRevision | null> {
  if (blogStoreMode() === "github") {
    const cfg = githubConfig();
    if (!cfg) throw new Error("GITHUB_NOT_CONFIGURED");
    const file = await githubGetFile(cfg, slug);
    return file ? { content: file.content, sha: file.sha } : null;
  }
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  return { content: fs.readFileSync(filePath, "utf-8"), sha: null };
}

/** A cikk nyers .mdx tartalma (frontmatter + törzs) — módnak megfelelő forrásból. */
export async function readBlogSource(slug: string): Promise<string | null> {
  return (await readBlogRevision(slug))?.content ?? null;
}

export interface SaveBlogResult {
  mode: BlogStoreMode;
  /** github módban a commit weblinkje (admin-visszajelzéshez). */
  commitUrl?: string;
  /**
   * A MENTÉS UTÁNI blob sha (github mód). A szerkesztő ezt viszi tovább
   * `baseSha`-ként, így ugyanabban a munkamenetben többször is lehet
   * menteni ütközés-hiba nélkül.
   */
  sha?: string;
}

/**
 * `fs` mód + Vercel = biztos kudarc: a futó példány fájlrendszere csak
 * olvasható. Beszédes hibával állunk meg, mielőtt EROFS-ba futnánk.
 */
function assertWritableFs(): void {
  if (!process.env.VERCEL) return;
  log.error(
    { event: "blog_store.read_only_fs", githubConfigured: githubConfigured() },
    "Blog write attempted in fs mode on Vercel",
  );
  throw new Error(BLOG_STORE_READ_ONLY);
}

/** Cikk mentése — fs módban fájlírás, github módban commit (create vagy update). */
export async function saveBlogSource(params: {
  slug: string;
  content: string;
  message: string;
  /**
   * A betöltéskori sha — ütközés-ellenőrzéshez. `null` = a hívó úgy tudja,
   * a cikk még nem létezik. Ha nincs megadva, nincs ellenőrzés (feltöltés,
   * migrációs utak). fs módban nincs sha, ott az ellenőrzés kimarad.
   */
  baseSha?: string | null;
}): Promise<SaveBlogResult> {
  const mode = blogStoreMode();

  if (mode === "github") {
    const cfg = githubConfig();
    if (!cfg) throw new Error("GITHUB_NOT_CONFIGURED");
    const existing = await githubGetFile(cfg, params.slug);
    if (params.baseSha !== undefined && (existing?.sha ?? null) !== params.baseSha) {
      log.warn(
        { event: "blog_store.conflict", slug: params.slug },
        "Blog save rejected: source changed since load",
      );
      throw new Error(BLOG_CONFLICT);
    }
    const res = await fetch(
      `${GITHUB_API}/repos/${cfg.repo}/contents/${repoPath(params.slug)}`,
      {
        method: "PUT",
        headers: { ...githubHeaders(cfg), "Content-Type": "application/json" },
        body: JSON.stringify({
          message: params.message,
          content: Buffer.from(params.content, "utf-8").toString("base64"),
          branch: cfg.branch,
          ...(existing ? { sha: existing.sha } : {}),
        }),
      },
    );
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      log.error({ event: "blog_store.github_commit_failed", status: res.status, detail: detail.slice(0, 500) }, "GitHub commit failed");
      throw new Error(`GITHUB_WRITE_FAILED_${res.status}`);
    }
    const json = (await res.json()) as {
      commit?: { html_url?: string };
      content?: { sha?: string };
    };
    return { mode, commitUrl: json.commit?.html_url, sha: json.content?.sha };
  }

  assertWritableFs();
  if (!fs.existsSync(BLOG_DIR)) fs.mkdirSync(BLOG_DIR, { recursive: true });
  fs.writeFileSync(path.join(BLOG_DIR, `${params.slug}.mdx`), params.content, "utf-8");
  return { mode };
}

/** Cikk törlése (elvetés) — github módban törlő-commit, a git-történelemből
 * bármikor visszaállítható; fs módban fájltörlés. */
export async function deleteBlogSource(params: {
  slug: string;
  message: string;
}): Promise<SaveBlogResult | null> {
  const mode = blogStoreMode();

  if (mode === "github") {
    const cfg = githubConfig();
    if (!cfg) throw new Error("GITHUB_NOT_CONFIGURED");
    const existing = await githubGetFile(cfg, params.slug);
    if (!existing) return null;
    const res = await fetch(
      `${GITHUB_API}/repos/${cfg.repo}/contents/${repoPath(params.slug)}`,
      {
        method: "DELETE",
        headers: { ...githubHeaders(cfg), "Content-Type": "application/json" },
        body: JSON.stringify({
          message: params.message,
          sha: existing.sha,
          branch: cfg.branch,
        }),
      },
    );
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      log.error({ event: "blog_store.github_delete_failed", status: res.status, detail: detail.slice(0, 500) }, "GitHub delete failed");
      throw new Error(`GITHUB_DELETE_FAILED_${res.status}`);
    }
    const json = (await res.json()) as { commit?: { html_url?: string } };
    return { mode, commitUrl: json.commit?.html_url };
  }

  assertWritableFs();
  const filePath = path.join(BLOG_DIR, `${params.slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  fs.unlinkSync(filePath);
  return { mode };
}

// ── Borítóképek ───────────────────────────────────────────────────────
//
// A kép ugyanazon az úton megy, mint a cikk: `github` módban commit,
// `fs` módban fájlírás. Így a borító a cikkel EGY deployban élesedik, és
// ugyanúgy visszaállítható a git-történelemből — nem kell külön
// objektumtároló egy blogra, aminek pár tucat képe lesz.

/** Feltöltött borító mentése. `fileName` már ellenőrzött alak. */
export async function saveBlogCover(params: {
  fileName: string;
  bytes: Buffer;
  message: string;
}): Promise<SaveBlogResult> {
  const mode = blogStoreMode();
  const target = `${BLOG_COVER_DIR}/${params.fileName}`;

  if (mode === "github") {
    const cfg = githubConfig();
    if (!cfg) throw new Error("GITHUB_NOT_CONFIGURED");
    const existing = await githubGetFileMeta(cfg, target);
    const res = await fetch(`${GITHUB_API}/repos/${cfg.repo}/contents/${target}`, {
      method: "PUT",
      headers: { ...githubHeaders(cfg), "Content-Type": "application/json" },
      body: JSON.stringify({
        message: params.message,
        content: params.bytes.toString("base64"),
        branch: cfg.branch,
        ...(existing ? { sha: existing.sha } : {}),
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      log.error(
        { event: "blog_store.cover_write_failed", status: res.status, detail: detail.slice(0, 500) },
        "GitHub cover upload failed",
      );
      throw new Error(`GITHUB_WRITE_FAILED_${res.status}`);
    }
    const json = (await res.json()) as { commit?: { html_url?: string } };
    return { mode, commitUrl: json.commit?.html_url };
  }

  assertWritableFs();
  const dir = path.join(process.cwd(), BLOG_COVER_DIR);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, params.fileName), params.bytes);
  return { mode };
}

/** Borító eltávolítása. Hiányzó fájl nem hiba: a végállapot a lényeg. */
export async function deleteBlogCover(params: {
  fileName: string;
  message: string;
}): Promise<SaveBlogResult | null> {
  const mode = blogStoreMode();
  const target = `${BLOG_COVER_DIR}/${params.fileName}`;

  if (mode === "github") {
    const cfg = githubConfig();
    if (!cfg) throw new Error("GITHUB_NOT_CONFIGURED");
    const existing = await githubGetFileMeta(cfg, target);
    if (!existing) return null;
    const res = await fetch(`${GITHUB_API}/repos/${cfg.repo}/contents/${target}`, {
      method: "DELETE",
      headers: { ...githubHeaders(cfg), "Content-Type": "application/json" },
      body: JSON.stringify({ message: params.message, sha: existing.sha, branch: cfg.branch }),
    });
    if (!res.ok) throw new Error(`GITHUB_DELETE_FAILED_${res.status}`);
    const json = (await res.json()) as { commit?: { html_url?: string } };
    return { mode, commitUrl: json.commit?.html_url };
  }

  assertWritableFs();
  const filePath = path.join(process.cwd(), BLOG_COVER_DIR, params.fileName);
  if (!fs.existsSync(filePath)) return null;
  fs.unlinkSync(filePath);
  return { mode };
}
