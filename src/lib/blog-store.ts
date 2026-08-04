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
//   GITHUB_BRANCH — opcionális, default: main

const BLOG_DIR = path.join(process.cwd(), "content/blog");
const GITHUB_API = "https://api.github.com";

export type BlogStoreMode = "fs" | "github";

interface GithubConfig {
  token: string;
  repo: string;
  branch: string;
}

function githubConfig(): GithubConfig | null {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  if (!token || !repo) return null;
  return { token, repo, branch: process.env.GITHUB_BRANCH ?? "main" };
}

export function blogStoreMode(): BlogStoreMode {
  const forced = process.env.BLOG_STORE;
  if (forced === "fs" || forced === "github") return forced;
  return process.env.VERCEL && githubConfig() ? "github" : "fs";
}

/** Igaz, ha a github mód elérhető LENNE (token+repo beállítva). */
export function githubConfigured(): boolean {
  return githubConfig() !== null;
}

function repoPath(slug: string): string {
  return `content/blog/${slug}.mdx`;
}

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

/** A cikk nyers .mdx tartalma (frontmatter + törzs) — módnak megfelelő forrásból. */
export async function readBlogSource(slug: string): Promise<string | null> {
  if (blogStoreMode() === "github") {
    const cfg = githubConfig();
    if (!cfg) throw new Error("GITHUB_NOT_CONFIGURED");
    const file = await githubGetFile(cfg, slug);
    return file?.content ?? null;
  }
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf-8");
}

export interface SaveBlogResult {
  mode: BlogStoreMode;
  /** github módban a commit weblinkje (admin-visszajelzéshez). */
  commitUrl?: string;
}

/** Cikk mentése — fs módban fájlírás, github módban commit (create vagy update). */
export async function saveBlogSource(params: {
  slug: string;
  content: string;
  message: string;
}): Promise<SaveBlogResult> {
  const mode = blogStoreMode();

  if (mode === "github") {
    const cfg = githubConfig();
    if (!cfg) throw new Error("GITHUB_NOT_CONFIGURED");
    const existing = await githubGetFile(cfg, params.slug);
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
    const json = (await res.json()) as { commit?: { html_url?: string } };
    return { mode, commitUrl: json.commit?.html_url };
  }

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

  const filePath = path.join(BLOG_DIR, `${params.slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  fs.unlinkSync(filePath);
  return { mode };
}
